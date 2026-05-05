import { useState } from 'react'
import { X, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import HistoryPanel from './HistoryPanel'
import type { Task, TaskStatus } from '@shared/types'

type Tab = 'details' | 'history'

interface Props {
  task: Task | null
  initialStatus?: TaskStatus
  onClose: () => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
]

export default function TaskModal({ task, initialStatus, onClose }: Props): JSX.Element {
  const isEditing = task !== null

  const [tab, setTab] = useState<Tab>('details')
  const [title, setTitle] = useState<string>(task?.title ?? '')
  const [description, setDescription] = useState<string>(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus ?? 'TODO')
  const [githubUrl, setGithubUrl] = useState<string>(task?.github_url ?? '')
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const { createTask, updateTask, deleteTask } = useTaskStore()

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isEditing) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          github_url: githubUrl.trim() || null,
        })
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || null,
          status,
          github_url: githubUrl.trim() || null,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!isEditing) return
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      setDeleting(false)
    }
  }

  const handleOpenGithub = (): void => {
    if (githubUrl.trim()) {
      window.api.shell.openExternal(githubUrl.trim()).catch(() => null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                title="Delete task"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs (only when editing) */}
        {isEditing && (
          <div className="flex px-5 border-b border-slate-700">
            {(['details', 'history'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2.5 px-1 mr-5 text-sm font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'details' ? (
            <div className="p-5 space-y-4">
              {error && (
                <div className="px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                  placeholder="Task title"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description…"
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  GitHub Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/…"
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                  {githubUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleOpenGithub}
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                      title="Open in browser"
                    >
                      <ExternalLink size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5">
              <HistoryPanel taskId={task!.id} />
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'details' && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
