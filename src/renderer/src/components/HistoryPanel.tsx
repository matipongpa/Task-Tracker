import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Clock, Loader2 } from 'lucide-react'
import type { TaskHistory } from '@shared/types'

const FIELD_LABELS: Record<string, string> = {
  created: 'Created',
  title: 'Title',
  description: 'Description',
  status: 'Status',
  github_url: 'GitHub Link',
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

function formatValue(field: string, value: string | null): string {
  if (value === null || value === '') return '(empty)'
  if (field === 'status') return STATUS_LABELS[value] ?? value
  if (value.length > 60) return value.slice(0, 60) + '…'
  return value
}

interface Props {
  taskId: string
}

export default function HistoryPanel({ taskId }: Props): JSX.Element {
  const [history, setHistory] = useState<TaskHistory[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    window.api.history
      .getByTask(taskId)
      .then((h) => {
        setHistory(h)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-slate-500" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Clock size={28} className="mb-2 opacity-40" />
        <p className="text-sm">No history yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 py-2">
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3 px-1 py-2 rounded-lg hover:bg-slate-700/40">
          <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            {entry.field === 'created' ? (
              <p className="text-sm text-slate-300">Task created</p>
            ) : (
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">
                  {FIELD_LABELS[entry.field] ?? entry.field}
                </span>{' '}
                changed
                {entry.old_value !== null && (
                  <>
                    {' from '}
                    <span className="font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                      {formatValue(entry.field, entry.old_value)}
                    </span>
                  </>
                )}
                {' to '}
                <span className="font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded text-indigo-300">
                  {formatValue(entry.field, entry.new_value)}
                </span>
              </p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
