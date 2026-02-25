/**
 * StatusBadge Component - Displays service/alert status with accessibility support.
 */
import clsx from 'clsx'

type StatusType = 'Healthy' | 'Degraded' | 'Critical' | 'FIRING' | 'RESOLVED'

interface StatusBadgeProps {
  status: StatusType
  size?: 'sm' | 'md'
  /** Show descriptive text instead of just status */
  showLabel?: boolean
}

const STATUS_CONFIG: Record<StatusType, { 
  dot: string
  text: string
  bg: string
  label: string
  ariaLabel: string
}> = {
  Healthy: { 
    dot: 'bg-emerald-400', 
    text: 'text-emerald-400', 
    bg: 'bg-emerald-400/10 ring-1 ring-emerald-400/30',
    label: 'Healthy',
    ariaLabel: 'Status: Healthy'
  },
  Degraded: { 
    dot: 'bg-amber-400',   
    text: 'text-amber-400',   
    bg: 'bg-amber-400/10 ring-1 ring-amber-400/30',
    label: 'Degraded',
    ariaLabel: 'Status: Degraded'
  },
  Critical: { 
    dot: 'bg-red-400',     
    text: 'text-red-400',     
    bg: 'bg-red-400/10 ring-1 ring-red-400/30',
    label: 'Critical',
    ariaLabel: 'Status: Critical'
  },
  FIRING: { 
    dot: 'bg-red-400',     
    text: 'text-red-400',     
    bg: 'bg-red-400/10 ring-1 ring-red-400/30',
    label: 'Firing',
    ariaLabel: 'Alert Status: Firing'
  },
  RESOLVED: { 
    dot: 'bg-emerald-400', 
    text: 'text-emerald-400', 
    bg: 'bg-emerald-400/10 ring-1 ring-emerald-400/30',
    label: 'Resolved',
    ariaLabel: 'Alert Status: Resolved'
  },
}

/**
 * StatusBadge displays a colored badge indicating the current status.
 * Includes ARIA labels for screen reader accessibility.
 */
export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const isCritical = status === 'Critical' || status === 'FIRING'
  
  return (
    <span 
      className={clsx(
        'badge inline-flex items-center gap-1.5',
        config.bg, 
        config.text, 
        size === 'sm' && 'text-[11px] px-2 py-0.5'
      )}
      role="status"
      aria-label={config.ariaLabel}
      aria-live={isCritical ? 'assertive' : 'polite'}
    >
      <span 
        className={clsx(
          'w-1.5 h-1.5 rounded-full', 
          config.dot,
          isCritical && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
