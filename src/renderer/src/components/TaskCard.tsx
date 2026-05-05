import { ExternalLink, GripVertical } from 'lucide-react'
import type { Task } from '@shared/types'

interface Props {
  task: Task
  isDragging?: boolean
  onClick?: () => void
  dragHandleProps?: Record<string, unknown>
}

export default function TaskCard({ task, isDragging, onClick, dragHandleProps }: Props): JSX.Element {
  const handleLinkClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (task.github_url) {
      window.api.shell.openExternal(task.github_url).catch(() => null)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group bg-slate-700 border rounded-lg p-3 cursor-pointer transition-all select-none ${
        isDragging
          ? 'border-indigo-500 shadow-xl rotate-1 opacity-90'
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-650'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <span
          {...dragHandleProps}
          className="mt-0.5 text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 leading-snug break-words">
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {task.github_url && (
            <button
              onClick={handleLinkClick}
              className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={11} />
              <span className="truncate max-w-[180px]">
                {task.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
