import { useState, useEffect } from 'react'
import { Database, Loader2 } from 'lucide-react'
import type { DbConfig } from '@shared/types'

interface Props {
  onConnected: () => void
}

export default function DbSettings({ onConnected }: Props): JSX.Element {
  const [config, setConfig] = useState<DbConfig>({
    host: '127.0.0.1',
    port: 5432,
    database: 'task_tracker',
    user: 'postgres',
    password: '',
  })
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.db.getConfig().then((saved) => setConfig(saved)).catch(() => null)
  }, [])

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      await window.api.db.saveConfig(config)
      onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Database Connection</h1>
            <p className="text-sm text-slate-400">Connect to your local PostgreSQL</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Host</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig((c) => ({ ...c, host: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Port</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig((c) => ({ ...c, port: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Database</label>
            <input
              type="text"
              value={config.database}
              onChange={(e) => setConfig((c) => ({ ...c, database: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">User</label>
            <input
              type="text"
              value={config.user}
              onChange={(e) => setConfig((c) => ({ ...c, user: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={config.password}
              onChange={(e) => setConfig((c) => ({ ...c, password: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Enter PostgreSQL password"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Connecting…
            </>
          ) : (
            'Connect'
          )}
        </button>
      </div>
    </div>
  )
}
