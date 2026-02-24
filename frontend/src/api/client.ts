const BASE = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface ServiceHealth {
  id: string
  name: string
  status: 'Healthy' | 'Degraded' | 'Critical'
  active_alerts: number
  latest_metrics: Record<string, number>
  created_at: string
}

export interface DashboardOverview {
  total_services: number
  total_active_alerts: number
  services: ServiceHealth[]
}

export interface MetricPoint {
  timestamp: string
  value: number
}

export interface AlertOut {
  id: string
  rule_id: string
  service_id: string
  status: 'FIRING' | 'RESOLVED'
  message: string
  fired_at: string
  resolved_at?: string
}

export interface AlertRuleOut {
  id: string
  service_id: string
  metric_name: string
  operator: string
  threshold: number
  consecutive_required: number
  consecutive_count: number
  enabled: boolean
  created_at: string
}

// ── API calls ──────────────────────────────────────────────────────────────
export const api = {
  getDashboard: () => request<DashboardOverview>('/services/dashboard'),

  getServiceHealth: (id: string) => request<ServiceHealth>(`/services/${id}`),

  getMetricSeries: (serviceId: string, metric: string, window: string) =>
    request<MetricPoint[]>(`/metrics/${serviceId}/${metric}?window=${window}`),

  getAvailableMetrics: (serviceId: string) =>
    request<string[]>(`/metrics/${serviceId}/available/names`),

  getActiveAlerts: (serviceId?: string) =>
    request<AlertOut[]>(`/alerts${serviceId ? `?service_id=${serviceId}` : ''}`),

  getAlertHistory: (serviceId: string) =>
    request<AlertOut[]>(`/alerts/${serviceId}/history`),

  getAlertRules: (serviceId?: string) =>
    request<AlertRuleOut[]>(`/alerts/rules${serviceId ? `?service_id=${serviceId}` : ''}`),

  createAlertRule: (payload: {
    service_id: string
    metric_name: string
    operator: string
    threshold: number
    consecutive_required: number
  }) => request<AlertRuleOut>('/alerts/rules', { method: 'POST', body: JSON.stringify(payload) }),

  deleteAlertRule: (ruleId: string) =>
    fetch(`${BASE}/alerts/rules/${ruleId}`, { method: 'DELETE' }),
}
