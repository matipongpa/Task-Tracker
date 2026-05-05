import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import TaskModal from './TaskModal'
import type { Task, TaskStatus } from '@shared/types'

type SortField = 'title' | 'status' | 'created_at' | 'updated_at'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}
const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: 'bg-slate-700 text-slate-300',
  IN_PROGRESS: 'bg-yellow-900/50 text-yellow-300',
  DONE: 'bg-green-900/50 text-green-300',
}

export default function TableView(): JSX.Element {
  const { tasks } = useTaskStore()
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0
    if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title)
    } else if (sortField === 'status') {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    } else if (sortField === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortField === 'updated_at') {
      cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: SortField }): JSX.Element => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-slate-600" />
    return sortDir === 'asc' ? (
      <ChevronUp size={13} className="text-indigo-400" />
    ) : (
      <ChevronDown size={13} className="text-indigo-400" />
    )
  }

  const handleLinkClick = (e: React.MouseEvent, url: string): void => {
    e.stopPropagation()
    window.api.shell.openExternal(url).catch(() => null)
  }

  return (
    <>
      <div className="h-full overflow-auto p-5">
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                {(
                  [
                    { field: 'title' as SortField, label: 'Title', width: '' },
                    { field: 'status' as SortField, label: 'Status', width: 'w-32' },
                    { field: null, label: 'GitHub', width: 'w-48' },
                    { field: 'created_at' as SortField, label: 'Created', width: 'w-36' },
                    { field: 'updated_at' as SortField, label: 'Updated', width: 'w-36' },
                  ] as Array<{ field: SortField | null; label: string; width: string }>
                ).map(({ field, label, width }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${width} ${field ? 'cursor-pointer hover:text-slate-200 select-none' : ''}`}
                    onClick={() => field && handleSort(field)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No tasks yet — create one with the button above.
                  </td>
                </tr>
              )}
              {sorted.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setEditingTask(task)}
                  className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-100">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {task.github_url ? (
                      <button
                        onClick={(e) => handleLinkClick(e, task.github_url!)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors max-w-[160px]"
                      >
                        <ExternalLink size={11} className="flex-shrink-0" />
                        <span className="truncate">
                          {task.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </>
  )
}
