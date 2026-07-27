import { Screen } from '@/components/ui/Screen'
import { listFasts } from '@/lib/data/fasts'
import { formatDuration, formatRelativeDay } from '@/lib/date'

export const dynamic = 'force-dynamic'

export default function FastHistoryPage() {
  const rows = listFasts(50)

  return (
    <Screen title="Match History" back="/fast">
      {rows.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No matches yet. Complete a fast to open your record.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((fast) => {
            const won = fast.status === 'completed'
            const endedMs = (fast.endedAt ?? fast.startedAt).getTime()
            const actualSec = Math.max(
              0,
              Math.floor((endedMs - fast.startedAt.getTime()) / 1000),
            )
            const delta = fast.mmrDelta ?? 0
            return (
              <li key={fast.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{formatRelativeDay(endedMs)}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      won
                        ? 'border-success/40 bg-success/10 text-success'
                        : 'border-danger/40 bg-danger/10 text-danger'
                    }`}
                  >
                    {won ? 'Completed' : 'Ended early'}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="num text-xl font-bold leading-tight">{fast.preset}</div>
                    <div className="text-xs text-muted">
                      Target {formatDuration(fast.targetSec)}, actual {formatDuration(actualSec)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className={`num text-xl font-bold leading-tight ${
                        delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                      MMR
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Streak {fast.streakAfter ?? 0}
                  {fast.wasPlacement ? ', placement match' : ''}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
