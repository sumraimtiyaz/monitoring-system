import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, ChevronRight } from 'lucide-react'
import { ServiceHealth } from '../api/client'
import { StatusBadge } from './StatusBadge'
import { MiniSparkline } from './MiniSparkline'
import clsx from 'clsx'

interface Props {
  service: ServiceHealth
  window: string
}

const borderColor = {
  Healthy:  'border-gray-800',
  Degraded: 'border-amber-500/30',
  Critical: 'border-red-500/40',
}

export function ServiceCard({ service, window }: Props) {
  const navigate = useNavigate()
  const metrics = Object.entries(service.latest_metrics)

  return (
    <div
      onClick={() => navigate(`/service/${service.id}`)}
      className={clsx(
        'card border cursor-pointer hover:bg-gray-800/50 transition-all duration-200 hover:scale-[1.01]',
        borderColor[service.status]
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-base">{service.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Since {new Date(service.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={service.status} />
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Sparkline metrics grid */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {metrics.map(([name, value]) => (
            <div key={name} className="bg-gray-800/60 rounded-lg px-2.5 py-2">
              <MiniSparkline
                serviceId={service.id}
                metricName={name}
                window={window}
                currentValue={value}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> Awaiting metrics…
        </p>
      )}

      {/* Alert indicator */}
      {service.active_alerts > 0 && (
        <div className="mt-4 flex items-center gap-1.5 text-red-400 text-xs font-medium">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          {service.active_alerts} active alert{service.active_alerts > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
