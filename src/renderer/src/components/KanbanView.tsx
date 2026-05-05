import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import type { Task, TaskStatus, ReorderUpdate } from '@shared/types'

const COLUMNS: Array<{ id: TaskStatus; label: string; accent: string; dot: string }> = [
  { id: 'TODO', label: 'To Do', accent: 'border-slate-600', dot: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', accent: 'border-yellow-600/50', dot: 'bg-yellow-400' },
  { id: 'DONE', label: 'Done', accent: 'border-green-600/50', dot: 'bg-green-400' },
]

interface SortableCardProps {
  task: Task
  onEdit: (task: Task) => void
}

function SortableCard({ task, onEdit }: SortableCardProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onClick={() => !isDragging && onEdit(task)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

interface ColumnProps {
  id: TaskStatus
  label: string
  accent: string
  dot: string
  tasks: Task[]
  onEdit: (task: Task) => void
  onAddNew: (status: TaskStatus) => void
}

function KanbanColumn({ id, label, accent, dot, tasks, onEdit, onAddNew }: ColumnProps): JSX.Element {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 flex-shrink-0 bg-slate-800/60 rounded-xl border ${accent}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddNew(id)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title={`Add task to ${label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[60px]">
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function KanbanView(): JSX.Element {
  const { tasks, reorderTasks } = useTaskStore()
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null)

  useEffect(() => setLocalTasks(tasks), [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const getByStatus = (status: TaskStatus): Task[] =>
    localTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)

  const handleDragStart = ({ active }: DragStartEvent): void => {
    const found = localTasks.find((t) => t.id === active.id)
    setActiveTask(found ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent): void => {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const activeTask = localTasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Dropped over a column container
    const colTarget = COLUMNS.find((c) => c.id === overId)
    if (colTarget && activeTask.status !== colTarget.id) {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: colTarget.id } : t))
      )
      return
    }

    // Dropped over another task card
    const overTask = localTasks.find((t) => t.id === overId)
    if (overTask && overTask.status !== activeTask.status) {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overTask.status } : t))
      )
    }
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent): Promise<void> => {
    setActiveTask(null)

    if (!over) {
      setLocalTasks(tasks)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const updates: ReorderUpdate[] = []

    for (const col of COLUMNS) {
      const colTasks = localTasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.position - b.position)

      const activeIdx = colTasks.findIndex((t) => t.id === activeId)
      const overIdx = colTasks.findIndex((t) => t.id === overId)

      const finalOrder =
        activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx
          ? arrayMove(colTasks, activeIdx, overIdx)
          : colTasks

      finalOrder.forEach((task, idx) => {
        const original = tasks.find((t) => t.id === task.id)
        if (!original || original.position !== idx || original.status !== col.id) {
          updates.push({ id: task.id, position: idx, status: col.id })
        }
      })
    }

    if (updates.length > 0) {
      await reorderTasks(updates)
    }
  }

  const handleDragCancel = (): void => {
    setActiveTask(null)
    setLocalTasks(tasks)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 h-full p-5 overflow-x-auto">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              {...col}
              tasks={getByStatus(col.id)}
              onEdit={setEditingTask}
              onAddNew={(status) => setNewTaskStatus(status)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      {newTaskStatus && (
        <TaskModal
          task={null}
          initialStatus={newTaskStatus}
          onClose={() => setNewTaskStatus(null)}
        />
      )}
    </>
  )
}
