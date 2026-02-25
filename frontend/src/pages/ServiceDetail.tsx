/**
 * ServiceDetail Page - Detailed view of a single service with metrics and alerts.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Activity } from 'lucide-react'
import { api, ServiceHealth, AlertOut } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { MetricChart } from '../components/MetricChart'
import { AlertTable } from '../components/AlertTable'
import { AlertRuleManager } from '../components/AlertRuleManager'
import { StatusBadge } from '../components/StatusBadge'
import { formatMetricValue } from '../utils/helpers'

/**
 * Service detail page showing metrics, alerts, and alert rules for a service.
 */
export function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([])

  const fetcher = useCallback(() => api.getServiceHealth(id!), [id])
  const alertFetcher = useCallback(() => api.getAlertHistory(id!), [id])

  const { data: service, loading } = usePolling<ServiceHealth>(fetcher, 5000)
  const { data: alertHistory } = usePolling<AlertOut[]>(alertFetcher, 10000)

  // Fetch available metrics on mount
  useEffect(() => {
    if (!id) return
    
    api.getAvailableMetrics(id)
      .then(setAvailableMetrics)
      .catch(() => {
        // Silently handle error - we'll fall back to service.latest_metrics
      })
  }, [id])

  // Derive metrics list
  const metrics = useMemo(
    () => availableMetrics.length > 0
      ? availableMetrics
      : Object.keys(service?.latest_metrics ?? {}),
    [availableMetrics, service?.latest_metrics]
  )

  // Handle loading state
  if (loading && !service) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  // Handle not found
  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" role="alert">
        <p className="text-gray-400">Service not found</p>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/')}
          aria-label="Go back to dashboard"
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="btn-ghost p-2"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{service.name}</h1>
            <StatusBadge status={service.status} />
          </div>
          <p 
            className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5"
            role="status"
            aria-live="polite"
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            Live · refreshes every 5s
          </p>
        </div>

        {/* Latest snapshot */}
        <div 
          className="hidden md:flex gap-4" 
          role="group" 
          aria-label="Latest metric values"
        >
          {Object.entries(service.latest_metrics).map(([name, val]) => {
            const unit = name.toLowerCase().includes('latency') ? 'ms'
                       : ['cpu', 'memory'].some(k => name.toLowerCase().includes(k)) ? '%' : ''
            return (
              <div key={name} className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{name}</p>
                <p className="text-xl font-bold" aria-label={`${name}: ${val}${unit}`}>
                  {formatMetricValue(val, name)}
                </p>
              </div>
            )
          })}
        </div>
      </header>

      {/* Charts */}
      <section aria-label="Metrics charts">
        {metrics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {metrics.map(name => (
              <MetricChart key={name} serviceId={service.id} metricName={name} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 mb-6" role="status">
            <p className="text-gray-500">No metrics received yet for this service.</p>
          </div>
        )}
      </section>

      {/* Bottom row - Alert Rules and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertRuleManager serviceId={service.id} availableMetrics={metrics} />
        <AlertTable alerts={alertHistory ?? []} title="Alert History" />
      </div>
    </div>
  )
}
