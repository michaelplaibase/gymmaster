import { notFound, redirect } from 'next/navigation'
import { RankBadge } from '@/components/ui/RankBadge'
import { RankCard } from '@/components/ui/RankCard'
import { Screen } from '@/components/ui/Screen'
import { Stat } from '@/components/ui/Stat'
import { getWorkoutDetail, getWorkoutSummary } from '@/lib/data/workouts'
import { SummaryOverlays } from './SummaryOverlays'

export const dynamic = 'force-dynamic'

function fmtKg(weightKg: number): string {
  return weightKg % 1 === 0 ? String(weightKg) : weightKg.toFixed(1)
}

function signedPct(ratio: number): string {
  const pct = Math.round((ratio - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workoutId = Number(id)
  if (!Number.isInteger(workoutId)) notFound()
  const detail = getWorkoutDetail(workoutId)
  if (!detail) notFound()
  if (detail.workout.status !== 'completed') redirect(`/train/${workoutId}`)

  const summary = getWorkoutSummary(workoutId)
  const { rating } = summary
  const delta = rating.delta

  return (
    <Screen title="Match Summary" back="/train">
      <SummaryOverlays
        workoutId={workoutId}
        placedNow={rating.placedNow}
        promoted={rating.promoted}
        demoted={rating.demoted}
        rankBefore={rating.rankBefore}
        rankAfter={rating.rankAfter}
      />

      <RankCard
        playlist={summary.workout.workoutType}
        rank={rating.rankAfter}
        mmr={rating.mmrAfter}
        sessionsPlayed={rating.sessionsPlayedAfter}
        placementsRemaining={rating.placementsRemaining}
      />

      <div className="mt-6 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">MMR</div>
        <div
          className={`num text-7xl font-bold leading-none ${
            delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted'
          }`}
        >
          {delta >= 0 ? `+${delta}` : String(delta)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface p-4">
        <Stat
          label="Score"
          value={`${Math.round(summary.score * 100)}%`}
          sub="of baseline"
          tone={summary.score >= 1 ? 'good' : 'bad'}
        />
        <Stat label="PRs" value={summary.prCount} tone={summary.prCount > 0 ? 'good' : 'default'} />
        <Stat
          label="XP"
          value={`+${summary.xpEarned}`}
          sub={summary.levelUp ? `Level ${summary.levelUp.from} to ${summary.levelUp.to}` : undefined}
        />
      </div>

      {summary.mvp && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              MVP
            </div>
            <div className="truncate font-display text-lg font-semibold">{summary.mvp.name}</div>
          </div>
          <div
            className={`num shrink-0 text-2xl font-bold ${
              summary.mvp.ratio >= 1 ? 'text-success' : 'text-danger'
            }`}
          >
            {signedPct(summary.mvp.ratio)}
          </div>
        </div>
      )}

      {summary.questsCompleted.length > 0 && (
        <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Quests completed
          </div>
          <div className="mt-1">
            {summary.questsCompleted.map((quest, index) => (
              <div key={index} className="flex min-h-9 items-center justify-between gap-3">
                <span className="truncate font-display text-sm font-semibold">{quest.title}</span>
                <span className="num shrink-0 text-sm font-bold text-success">
                  +{quest.xpReward} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Breakdown
      </h2>
      <div className="space-y-2">
        {summary.perExercise.map((entry) => (
          <div
            key={entry.exercise.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <RankBadge rank={entry.rank} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-sm font-semibold">
                  {entry.exercise.name}
                </span>
                {entry.isPr && (
                  <span className="shrink-0 rounded bg-tier-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-tier-gold">
                    PR
                  </span>
                )}
              </div>
              <div className="num text-xs text-muted">
                Best {fmtKg(entry.bestSet.weightKg)} kg &times; {entry.bestSet.reps} · e1RM{' '}
                {Math.round(entry.sessionE1rm)} kg
              </div>
            </div>
            <div
              className={`num shrink-0 text-lg font-bold ${
                entry.ratio === null
                  ? 'text-muted'
                  : entry.ratio >= 1
                    ? 'text-success'
                    : 'text-danger'
              }`}
            >
              {entry.ratio === null ? 'NEW' : signedPct(entry.ratio)}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  )
}
