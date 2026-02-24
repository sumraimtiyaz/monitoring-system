import { useCallback } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { usePolling } from '../hooks/usePolling'
import { api, MetricPoint } from '../api/client'

const COLORS: Record<string, string> = {
  cpu:     '#4f6ef7',
  memory:  '#a78bfa',
  latency: '#34d399',
}

function getColor(name: string) {
  const key = Object.keys(COLORS).find(k => name.toLowerCase().includes(k))
  return key ? COLORS[key] : '#94a3b8'
}

interface Props {
  serviceId: string
  metricName: string
  window: string
  currentValue: number
}

export function MiniSparkline({ serviceId, metricName, window, currentValue }: Props) {
  const color = getColor(metricName)

  const fetcher = useCallback(
    () => api.getMetricSeries(serviceId, metricName, window),
    [serviceId, metricName, window]
  )

  const { data } = usePolling<MetricPoint[]>(fetcher, 5000)

  const unit = metricName.toLowerCase().includes('latency') ? 'ms'
             : ['cpu', 'memory'].some(k => metricName.toLowerCase().includes(k)) ? '%' : ''

  const chartData = (data ?? []).map(p => ({ value: Math.round(p.value * 100) / 100 }))

  // Calculate trend: compare first half avg vs second half avg
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (chartData.length >= 6) {
    const mid = Math.floor(chartData.length / 2)
    const firstHalf = chartData.slice(0, mid).reduce((s, p) => s + p.value, 0) / mid
    const secondHalf = chartData.slice(mid).reduce((s, p) => s + p.value, 0) / (chartData.length - mid)
    const delta = secondHalf - firstHalf
    if (delta > firstHalf * 0.05) trend = 'up'
    else if (delta < -firstHalf * 0.05) trend = 'down'
  }

  const trendColor = trend === 'up' ? '#f87171' : trend === 'down' ? '#34d399' : '#94a3b8'
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div className="flex flex-col gap-1">
      {/* Label + value + trend */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium truncate">
          {metricName}
        </span>
        <span className="text-[10px] font-bold" style={{ color: trendColor }}>
          {trendSymbol}
        </span>
      </div>

      {/* Value */}
      <div className="px-0.5">
        <span className="text-base font-bold text-white">
          {Math.round(currentValue * 10) / 10}
        </span>
        <span className="text-[10px] text-gray-500 ml-0.5">{unit}</span>
      </div>

      {/* Sparkline */}
      <div className="h-10">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${serviceId}-${metricName}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: 11,
                  padding: '4px 8px',
                }}
                formatter={(v: number) => [`${v}${unit}`, metricName]}
                labelFormatter={() => ''}
                itemStyle={{ color }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#spark-${serviceId}-${metricName})`}
                dot={false}
                activeDot={{ r: 3, fill: color }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="h-px w-full bg-gray-700" />
          </div>
        )}
      </div>
    </div>
  )
}
