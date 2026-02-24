import { useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { usePolling } from '../hooks/usePolling'
import { api, MetricPoint } from '../api/client'
import clsx from 'clsx'

const WINDOWS = ['5m', '1h', '24h'] as const
type Window = typeof WINDOWS[number]

const COLORS: Record<string, string> = {
  cpu:     '#4f6ef7',
  memory:  '#a78bfa',
  latency: '#34d399',
}

function getColor(name: string) {
  const key = Object.keys(COLORS).find(k => name.toLowerCase().includes(k))
  return key ? COLORS[key] : '#94a3b8'
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

interface Props {
  serviceId: string
  metricName: string
}

export function MetricChart({ serviceId, metricName }: Props) {
  const [window, setWindow] = useState<Window>('1h')
  const color = getColor(metricName)

  const fetcher = useCallback(
    () => api.getMetricSeries(serviceId, metricName, window),
    [serviceId, metricName, window]
  )

  const { data, loading, error } = usePolling<MetricPoint[]>(fetcher, 5000)

  const chartData = (data ?? []).map(p => ({
    time: formatTime(p.timestamp),
    value: Math.round(p.value * 100) / 100,
  }))

  const latest = data && data.length > 0 ? data[data.length - 1].value : null
  const unit = metricName.toLowerCase().includes('latency') ? 'ms'
             : metricName.toLowerCase().includes('cpu') ? '%'
             : metricName.toLowerCase().includes('memory') ? '%' : ''

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{metricName}</p>
          <p className="text-2xl font-bold mt-0.5">
            {latest !== null ? `${Math.round(latest * 10) / 10}${unit}` : '—'}
          </p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                w === window
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-44">
        {loading && !data ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No data in this window
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${metricName}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: color }}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                    fill={`url(#grad-${metricName})`} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
