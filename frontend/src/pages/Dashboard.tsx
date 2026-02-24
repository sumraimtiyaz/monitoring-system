import { useCallback, useState } from 'react'
import { Activity, AlertTriangle, Server, RefreshCw, Clock } from 'lucide-react'
import { api, DashboardOverview } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { ServiceCard } from '../components/ServiceCard'
import clsx from 'clsx'

const WINDOWS = [
  { label: '5m',  value: '5m',  desc: 'Last 5 minutes' },
  { label: '1h',  value: '1h',  desc: 'Last 1 hour' },
  { label: '24h', value: '24h', desc: 'Last 24 hours' },
] as const
type WindowValue = typeof WINDOWS[number]['value']

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [window, setWindow] = useState<WindowValue>('1h')

  const fetcher = useCallback(() => api.getDashboard(), [])
  const { data, loading, error, refetch } = usePolling<DashboardOverview>(fetcher, 5000)

  const healthyCount = data?.services.filter(s => s.status === 'Healthy').length ?? 0
  const criticalCount = data?.services.filter(s => s.status === 'Critical').length ?? 0
  const currentWindowDesc = WINDOWS.find(w => w.value === window)?.desc ?? ''

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-brand-500" />
            Cloud Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live system health dashboard · refreshes every 5s
          </p>
        </div>

        {/* Global time window selector + refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500 mr-1">Trend window:</span>
            {WINDOWS.map(w => (
              <button
                key={w.value}
                onClick={() => setWindow(w.value)}
                title={w.desc}
                className={clsx(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  w.value === window
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button onClick={refetch} className="btn-ghost">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          ⚠ Failed to fetch dashboard data: {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Server}        label="Total Services" value={data?.total_services ?? '—'}      color="bg-brand-500/10 text-brand-500" />
        <StatCard icon={AlertTriangle} label="Active Alerts"  value={data?.total_active_alerts ?? '—'} color="bg-red-500/10 text-red-400" />
        <StatCard icon={Activity}      label="Healthy"        value={healthyCount}                      color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Critical"       value={criticalCount}                     color="bg-amber-500/10 text-amber-400" />
      </div>

      {/* Window context label */}
      {data && data.services.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          <p className="text-xs text-gray-500">
            Showing sparkline trends for <span className="text-gray-300 font-medium">{currentWindowDesc}</span> · click any service to drill down
          </p>
        </div>
      )}

      {/* Services grid */}
      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading services…</p>
        </div>
      ) : data?.services.length === 0 ? (
        <div className="text-center py-24">
          <Server className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">No services yet</h2>
          <p className="text-gray-600 text-sm mt-2">Start the simulator to begin ingesting metrics.</p>
          <code className="block mt-4 text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 max-w-sm mx-auto">
            python simulator/simulator.py
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.services.map(s => (
            <ServiceCard key={s.id} service={s} window={window} />
          ))}
        </div>
      )}
    </div>
  )
}
