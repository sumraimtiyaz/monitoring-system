import { useParams, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Activity } from 'lucide-react'
import { api, ServiceHealth, AlertOut } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { MetricChart } from '../components/MetricChart'
import { AlertTable } from '../components/AlertTable'
import { AlertRuleManager } from '../components/AlertRuleManager'
import { StatusBadge } from '../components/StatusBadge'

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([])

  const fetcher = useCallback(() => api.getServiceHealth(id!), [id])
  const alertFetcher = useCallback(() => api.getAlertHistory(id!), [id])

  const { data: service, loading } = usePolling<ServiceHealth>(fetcher, 5000)
  const { data: alertHistory } = usePolling<AlertOut[]>(alertFetcher, 10000)

  useEffect(() => {
    if (!id) return
    api.getAvailableMetrics(id).then(setAvailableMetrics).catch(() => {})
  }, [id])

  if (loading && !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Service not found</p>
        <button className="btn-primary" onClick={() => navigate('/')}>← Back</button>
      </div>
    )
  }

  const metrics = availableMetrics.length > 0
    ? availableMetrics
    : Object.keys(service.latest_metrics)

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{service.name}</h1>
            <StatusBadge status={service.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Live · refreshes every 5s
          </p>
        </div>

        {/* Latest snapshot */}
        <div className="hidden md:flex gap-4">
          {Object.entries(service.latest_metrics).map(([name, val]) => {
            const unit = name.toLowerCase().includes('latency') ? 'ms'
                       : ['cpu', 'memory'].some(k => name.toLowerCase().includes(k)) ? '%' : ''
            return (
              <div key={name} className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{name}</p>
                <p className="text-xl font-bold">{Math.round(val * 10) / 10}{unit}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map(name => (
            <MetricChart key={name} serviceId={service.id} metricName={name} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 mb-6">
          <p className="text-gray-500">No metrics received yet for this service.</p>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertRuleManager serviceId={service.id} availableMetrics={metrics} />
        <AlertTable alerts={alertHistory ?? []} title="Alert History" />
      </div>
    </div>
  )
}
