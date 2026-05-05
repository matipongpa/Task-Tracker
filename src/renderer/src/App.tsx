import { useState, useEffect } from 'react'
import { LayoutGrid, Table, Plus, Settings, Loader2 } from 'lucide-react'
import KanbanView from './components/KanbanView'
import TableView from './components/TableView'
import TaskModal from './components/TaskModal'
import DbSettings from './components/DbSettings'
import { useTaskStore } from './store/taskStore'

type View = 'kanban' | 'table'
type ConnStatus = 'connecting' | 'connected' | 'error'

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('kanban')
  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting')
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const { loadTasks, tasks } = useTaskStore()

  useEffect(() => {
    window.api.db
      .connect()
      .then(() => {
        setConnStatus('connected')
        return loadTasks()
      })
      .catch(() => {
        setConnStatus('error')
        setShowSettings(true)
      })
  }, [])

  const handleConnected = async (): Promise<void> => {
    setShowSettings(false)
    setConnStatus('connected')
    await loadTasks()
  }

  if (connStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Connecting to database…</span>
        </div>
      </div>
    )
  }

  if (showSettings) {
    return <DbSettings onConnected={handleConnected} />
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Toolbar */}
      <header className="drag-region flex items-center justify-between pl-20 pr-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="no-drag flex items-center gap-3">
          <h1 className="text-base font-bold text-white tracking-tight">Task Tracker</h1>
          <span className="text-xs text-slate-600 bg-slate-700 px-2 py-0.5 rounded-full">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="no-drag flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table size={14} />
              Table
            </button>
          </div>

          {/* New task */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            New Task
          </button>

          {/* DB settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
            title="Database settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'kanban' ? <KanbanView /> : <TableView />}
      </main>

      {isModalOpen && <TaskModal task={null} onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}
