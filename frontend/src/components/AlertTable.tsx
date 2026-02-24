import { AlertOut } from '../api/client'
import { StatusBadge } from './StatusBadge'
import { ShieldAlert } from 'lucide-react'

interface Props {
  alerts: AlertOut[]
  title?: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function AlertTable({ alerts, title = 'Alerts' }: Props) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-brand-500" />
        {title}
      </h3>
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-6">No alerts</p>
      ) : (
        <div className="divide-y divide-gray-800">
          {alerts.map(a => (
            <div key={a.id} className="py-3 flex items-start gap-3">
              <StatusBadge status={a.status} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 leading-snug">{a.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fired {timeAgo(a.fired_at)}
                  {a.resolved_at && ` · Resolved ${timeAgo(a.resolved_at)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
