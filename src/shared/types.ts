export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  github_url: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  github_url?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  github_url?: string | null
  position?: number
}

export interface ReorderUpdate {
  id: string
  position: number
  status: TaskStatus
}

export interface TaskHistory {
  id: string
  task_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

export interface DbConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}
