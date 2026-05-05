import { contextBridge, ipcRenderer } from 'electron'
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderUpdate,
  TaskHistory,
  DbConfig,
} from '../shared/types'

const api = {
  db: {
    connect: (): Promise<void> => ipcRenderer.invoke('db:connect'),
    getConfig: (): Promise<DbConfig> => ipcRenderer.invoke('db:getConfig'),
    saveConfig: (config: DbConfig): Promise<void> => ipcRenderer.invoke('db:saveConfig', config),
  },
  tasks: {
    getAll: (): Promise<Task[]> => ipcRenderer.invoke('tasks:getAll'),
    create: (data: CreateTaskInput): Promise<Task> => ipcRenderer.invoke('tasks:create', data),
    update: (id: string, data: UpdateTaskInput): Promise<Task> =>
      ipcRenderer.invoke('tasks:update', id, data),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('tasks:delete', id),
    reorder: (updates: ReorderUpdate[]): Promise<void> =>
      ipcRenderer.invoke('tasks:reorder', updates),
  },
  history: {
    getByTask: (taskId: string): Promise<TaskHistory[]> =>
      ipcRenderer.invoke('history:getByTask', taskId),
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },
} as const

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
