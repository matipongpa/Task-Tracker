import { Pool } from 'pg'
import { getDbConfig } from './config'
import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderUpdate,
  TaskHistory,
  DbConfig,
} from '../shared/types'

let _pool: Pool | null = null

const MIGRATIONS = `
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    github_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status_position ON tasks(status, position);
`

async function ensureDatabase(config: DbConfig): Promise<void> {
  const adminPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  })
  try {
    const result = await adminPool.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      [config.database]
    )
    if (!result.rows[0].exists) {
      await adminPool.query(`CREATE DATABASE "${config.database}"`)
    }
  } finally {
    await adminPool.end()
  }
}

export async function initDb(): Promise<void> {
  const config = getDbConfig()
  await ensureDatabase(config)

  if (_pool) {
    await _pool.end()
    _pool = null
  }

  _pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: 5,
    connectionTimeoutMillis: 5000,
  })

  await _pool.query(MIGRATIONS)
}

function pool(): Pool {
  if (!_pool) throw new Error('Database not initialized')
  return _pool
}

export async function getAllTasks(): Promise<Task[]> {
  const result = await pool().query<Task>(`
    SELECT id, title, description, status, github_url, position,
           created_at::text, updated_at::text
    FROM tasks
    ORDER BY status, position
  `)
  return result.rows
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const status: TaskStatus = data.status ?? 'TODO'
  const posResult = await pool().query<{ max: number | null }>(
    `SELECT MAX(position) AS max FROM tasks WHERE status = $1`,
    [status]
  )
  const position = (posResult.rows[0].max ?? -1) + 1

  const result = await pool().query<Task>(
    `INSERT INTO tasks (title, description, status, github_url, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, description, status, github_url, position,
               created_at::text, updated_at::text`,
    [data.title, data.description ?? null, status, data.github_url ?? null, position]
  )

  const task = result.rows[0]
  await recordHistory(task.id, 'created', null, 'Task created')
  return task
}

export async function updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
  const currentResult = await pool().query<Task>(
    `SELECT id, title, description, status, github_url, position,
            created_at::text, updated_at::text
     FROM tasks WHERE id = $1`,
    [id]
  )
  if (!currentResult.rowCount) throw new Error(`Task ${id} not found`)
  const current = currentResult.rows[0]

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`)
    values.push(data.title)
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`)
    values.push(data.description)
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`)
    values.push(data.status)
  }
  if (data.github_url !== undefined) {
    fields.push(`github_url = $${idx++}`)
    values.push(data.github_url)
  }
  if (data.position !== undefined) {
    fields.push(`position = $${idx++}`)
    values.push(data.position)
  }

  if (fields.length === 0) return current

  fields.push(`updated_at = NOW()`)
  values.push(id)

  const result = await pool().query<Task>(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, title, description, status, github_url, position,
               created_at::text, updated_at::text`,
    values
  )

  const updated = result.rows[0]
  const tracked: Array<keyof UpdateTaskInput> = ['title', 'description', 'status', 'github_url']

  for (const field of tracked) {
    if (data[field] === undefined) continue
    const oldVal = current[field as keyof Task]
    const newVal = data[field]
    if (String(oldVal ?? '') !== String(newVal ?? '')) {
      await recordHistory(
        id,
        field,
        oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
        newVal !== null && newVal !== undefined ? String(newVal) : null
      )
    }
  }

  return updated
}

export async function deleteTask(id: string): Promise<void> {
  await pool().query(`DELETE FROM tasks WHERE id = $1`, [id])
}

export async function reorderTasks(updates: ReorderUpdate[]): Promise<void> {
  const client = await pool().connect()
  try {
    await client.query('BEGIN')
    for (const u of updates) {
      await client.query(
        `UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3`,
        [u.status, u.position, u.id]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getTaskHistory(taskId: string): Promise<TaskHistory[]> {
  const result = await pool().query<TaskHistory>(
    `SELECT id, task_id, field, old_value, new_value, changed_at::text
     FROM task_history WHERE task_id = $1 ORDER BY changed_at DESC`,
    [taskId]
  )
  return result.rows
}

async function recordHistory(
  taskId: string,
  field: string,
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  await pool().query(
    `INSERT INTO task_history (task_id, field, old_value, new_value) VALUES ($1, $2, $3, $4)`,
    [taskId, field, oldValue, newValue]
  )
}
