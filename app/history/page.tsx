import Link from 'next/link'
import { Screen } from '@/components/ui/Screen'
import { formatDuration, formatRelativeDay } from '@/lib/date'
import { listHistory, type HistoryEntry } from '@/lib/data/history'
import { PLAYLIST_LABEL } from '@/lib/ui/tier'

export const dynamic = 'force-dynamic'

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) return null
  return (
    <span
      className={`num shrink-0 rounded px-1.5 py-0.5 text-sm font-bold ${
        delta >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}
    >
      {delta >= 0 ? `+${delta}` : String(delta)}
    </span>
  )
}

function RowBody({ entry }: { entry: HistoryEntry }) {
  const isWorkout = entry.kind === 'workout'
  return (
    <>
      <span className="w-14 shrink-0 rounded border border-border py-1 text-center text-[9px] font-bold uppercase tracking-widest text-muted">
        {isWorkout ? PLAYLIST_LABEL[entry.workoutType] : 'Fast'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="num block text-lg font-bold leading-tight">
          {isWorkout
            ? entry.score === null
              ? '--'
              : `${Math.round(entry.score * 100)}%`
            : formatDuration(entry.elapsedSec)}
        </span>
        <span className="block truncate text-xs text-muted">
          {isWorkout
            ? `${entry.setCount} ${entry.setCount === 1 ? 'set' : 'sets'}`
            : `${entry.preset}${entry.outcome === 'ended_early' ? ', ended early' : ''}`}
        </span>
      </span>
      {isWorkout && entry.prCount > 0 && (
        <span className="shrink-0 rounded bg-tier-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-tier-gold">
          {entry.prCount} PR
        </span>
      )}
      <DeltaChip delta={entry.mmrDelta} />
    </>
  )
}

export default function HistoryPage() {
  const entries = listHistory()

  const groups: { label: string; entries: HistoryEntry[] }[] = []
  for (const entry of entries) {
    const label = formatRelativeDay(entry.at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.entries.push(entry)
    else groups.push({ label, entries: [entry] })
  }

  return (
    <Screen title="Match History" back="/">
      {entries.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="font-display text-lg font-semibold">No matches yet</div>
          <p className="mt-1 text-sm text-muted">
            Finish a training match or a fasting window and it shows up here.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.label} className="mb-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.entries.map((entry) =>
              entry.kind === 'workout' ? (
                <Link
                  key={`w${entry.id}`}
                  href={`/history/${entry.id}`}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface p-3 active:bg-surface-2"
                >
                  <RowBody entry={entry} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M9 5 L16 12 L9 19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted"
                    />
                  </svg>
                </Link>
              ) : (
                <div
                  key={`f${entry.id}`}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <RowBody entry={entry} />
                </div>
              )
            )}
          </div>
        </section>
      ))}
    </Screen>
  )
}
