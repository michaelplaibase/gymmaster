import type { Tier } from '@/lib/rating'
import { formatRelativeDay } from '@/lib/date'
import { tierClass } from '@/lib/ui/tier'

const W = 320
const H = 140
const PAD_X = 10
const PAD_TOP = 24
const PAD_BOTTOM = 26

// Inline SVG line chart of e1RM across sessions, colored by the current tier.
export function E1rmChart({
  points,
  tier,
}: {
  points: { at: number; e1rm: number }[]
  tier: Tier | null
}) {
  if (points.length < 2) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-xl border border-border bg-surface px-4 text-center text-sm text-muted">
        {points.length === 0
          ? 'No sessions logged yet. Play a match with this exercise to start the chart.'
          : 'One session logged. Play one more to see progression.'}
      </div>
    )
  }

  const values = points.map((point) => point.e1rm)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const plotW = W - PAD_X * 2
  const plotH = H - PAD_TOP - PAD_BOTTOM
  const coords = points.map((point, index) => ({
    x: PAD_X + (index / (points.length - 1)) * plotW,
    y: PAD_TOP + (1 - (point.e1rm - min) / span) * plotH,
  }))
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area = `${PAD_X},${PAD_TOP + plotH} ${line} ${PAD_X + plotW},${PAD_TOP + plotH}`
  const last = coords[coords.length - 1]

  return (
    <div className={`rounded-xl border border-border bg-surface p-3 ${tierClass(tier)}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="e1RM progression chart">
        <polygon points={area} fill="var(--tier)" fillOpacity={0.08} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--tier)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, index) => (
          <circle key={index} cx={c.x} cy={c.y} r={2.5} fill="var(--tier)" />
        ))}
        <circle cx={last.x} cy={last.y} r={5} fill="none" stroke="var(--tier)" strokeWidth={1.5} />
        <text x={PAD_X} y={11} fontSize={10} className="num" fill="var(--color-muted)">
          max {Math.round(max)} kg
        </text>
        <text x={W - PAD_X} y={11} textAnchor="end" fontSize={10} className="num" fill="var(--tier)">
          last {Math.round(values[values.length - 1])} kg
        </text>
        <text x={PAD_X} y={H - 6} fontSize={10} fill="var(--color-muted)">
          {formatRelativeDay(points[0].at)} (min {Math.round(min)} kg)
        </text>
        <text x={W - PAD_X} y={H - 6} textAnchor="end" fontSize={10} fill="var(--color-muted)">
          {formatRelativeDay(points[points.length - 1].at)}
        </text>
      </svg>
    </div>
  )
}

export default E1rmChart
