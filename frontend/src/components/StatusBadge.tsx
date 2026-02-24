import clsx from 'clsx'

interface Props {
  status: 'Healthy' | 'Degraded' | 'Critical' | 'FIRING' | 'RESOLVED'
  size?: 'sm' | 'md'
}

const config = {
  Healthy:  { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 ring-1 ring-emerald-400/30' },
  Degraded: { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10 ring-1 ring-amber-400/30' },
  Critical: { dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10 ring-1 ring-red-400/30' },
  FIRING:   { dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10 ring-1 ring-red-400/30' },
  RESOLVED: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 ring-1 ring-emerald-400/30' },
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const c = config[status]
  return (
    <span className={clsx('badge', c.bg, c.text, size === 'sm' && 'text-[11px] px-2 py-0.5')}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', c.dot,
        (status === 'Critical' || status === 'FIRING') && 'animate-pulse'
      )} />
      {status}
    </span>
  )
}
