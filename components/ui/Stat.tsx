const TONE: Record<'default' | 'good' | 'bad' | 'tier', string> = {
  default: 'text-text',
  good: 'text-success',
  bad: 'text-danger',
  tier: 'tier-text',
}

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: string | number
  sub?: string
  tone?: 'default' | 'good' | 'bad' | 'tier'
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={`num text-3xl font-bold leading-tight ${TONE[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  )
}

export default Stat
