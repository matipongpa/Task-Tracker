import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { DbConfig } from '../shared/types'

const CONFIG_PATH = join(app.getPath('userData'), 'db-config.json')

const DEFAULT_CONFIG: DbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'task_tracker',
  user: 'postgres',
  password: '',
}

export function getDbConfig(): DbConfig {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<DbConfig>) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveDbConfig(config: DbConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}
