/**
 * Utility functions for formatting and common operations.
 */

/**
 * Format a timestamp to a human-readable relative time string.
 */
export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Format a timestamp to a locale time string.
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

/**
 * Format a date to a locale date string.
 */
export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Format a number with appropriate units based on metric name.
 */
export function formatMetricValue(value: number, metricName: string): string {
  const rounded = Math.round(value * 10) / 10
  
  const lowerName = metricName.toLowerCase()
  
  if (lowerName.includes('latency')) {
    return `${rounded}ms`
  }
  
  if (lowerName.includes('cpu') || lowerName.includes('memory')) {
    return `${rounded}%`
  }
  
  return String(rounded)
}

/**
 * Get color for a metric based on its name.
 */
export function getMetricColor(metricName: string): string {
  const colors: Record<string, string> = {
    cpu: '#4f6ef7',
    memory: '#a78bfa',
    latency: '#34d399',
  }
  
  const key = Object.keys(colors).find(k => metricName.toLowerCase().includes(k))
  return key ? colors[key] : '#94a3b8'
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Debounce function for search inputs.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), wait)
  }
}
