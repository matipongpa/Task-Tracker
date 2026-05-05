import { create } from 'zustand'
import type { Task, CreateTaskInput, UpdateTaskInput, ReorderUpdate } from '@shared/types'

interface TaskStore {
  tasks: Task[]
  loading: boolean
  error: string | null
  loadTasks: () => Promise<void>
  createTask: (data: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  reorderTasks: (updates: ReorderUpdate[]) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await window.api.tasks.getAll()
      set({ tasks, loading: false })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load tasks',
      })
    }
  },

  createTask: async (data) => {
    const task = await window.api.tasks.create(data)
    set((state) => ({ tasks: [...state.tasks, task] }))
    return task
  },

  updateTask: async (id, data) => {
    const updated = await window.api.tasks.update(id, data)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }))
    return updated
  },

  deleteTask: async (id) => {
    await window.api.tasks.delete(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  },

  reorderTasks: async (updates) => {
    await window.api.tasks.reorder(updates)
    await get().loadTasks()
  },
}))
