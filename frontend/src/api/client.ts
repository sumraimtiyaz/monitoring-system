/**
 * API Client - Centralized HTTP client with error handling and type safety.
 */
const BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Custom error class for API errors with better error information.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Generic request function with error handling.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  
  try {
    const res = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers 
      },
      ...options,
    })
    
    if (!res.ok) {
      const text = await res.text()
      throw new ApiError(
        res.status,
        `HTTP ${res.status}: ${res.statusText}`,
        text
      )
    }
    
    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T
    }
    
    return res.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    // Network error or other issues
    throw new ApiError(0, 'Network error', error instanceof Error ? error.message : 'Unknown error')
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type ServiceStatus = 'Healthy' | 'Degraded' | 'Critical'
export type AlertStatus = 'FIRING' | 'RESOLVED'

export interface ServiceHealth {
  id: string
  name: string
  status: ServiceStatus
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
  status: AlertStatus
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

export interface AlertRuleCreate {
  service_id: string
  metric_name: string
  operator: string
  threshold: number
  consecutive_required: number
}

// ── API Calls ──────────────────────────────────────────────────────────────

export const api = {
  // Dashboard
  getDashboard: () => request<DashboardOverview>('/services/dashboard'),

  // Services
  getServiceHealth: (id: string) => request<ServiceHealth>(`/services/${id}`),

  // Metrics
  getMetricSeries: (serviceId: string, metric: string, window: string) =>
    request<MetricPoint[]>(`/metrics/${serviceId}/${metric}?window=${window}`),

  getAvailableMetrics: (serviceId: string) =>
    request<string[]>(`/metrics/${serviceId}/available/names`),

  // Alerts
  getActiveAlerts: (serviceId?: string) =>
    request<AlertOut[]>(`/alerts${serviceId ? `?service_id=${serviceId}` : ''}`),

  getAlertHistory: (serviceId: string, limit = 50) =>
    request<AlertOut[]>(`/alerts/${serviceId}/history?limit=${limit}`),

  getAlertRules: (serviceId?: string) =>
    request<AlertRuleOut[]>(`/alerts/rules${serviceId ? `?service_id=${serviceId}` : ''}`),

  createAlertRule: (payload: AlertRuleCreate) =>
    request<AlertRuleOut>('/alerts/rules', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }),

  deleteAlertRule: (ruleId: string) =>
    request<void>(`/alerts/rules/${ruleId}`, { method: 'DELETE' }),
}
