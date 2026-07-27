export function ProgressBar({
  value,
  tone = 'accent',
}: {
  value: number
  tone?: 'tier' | 'accent'
}) {
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-border/60">
      <div
        className={`h-full rounded-full ${tone === 'tier' ? 'tier-bg' : 'bg-text'}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}

export default ProgressBar
