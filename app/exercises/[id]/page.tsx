import { notFound } from 'next/navigation'
import { E1rmChart } from '@/components/progression/E1rmChart'
import { RankBadge } from '@/components/ui/RankBadge'
import { Screen } from '@/components/ui/Screen'
import {
  exerciseHistory,
  exerciseRank,
  getExercise,
  getThresholds,
} from '@/lib/data/exercises'
import { getProfile } from '@/lib/data/profile'
import { TIERS, repsForRatio, tierLabel } from '@/lib/rating'
import { tierClass } from '@/lib/ui/tier'

export const dynamic = 'force-dynamic'

function fmtKg(value: number): string {
  const rounded = Math.round(value * 2) / 2
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const exercise = getExercise(id)
  if (!exercise) notFound()

  const profile = getProfile()
  const { rank, e1rm, ratio } = exerciseRank(id)
  const thresholds = getThresholds(id, profile.sex)
  const history = exerciseHistory(id)
  const isBodyweight = exercise.loadType === 'bodyweight'

  // First tier entry the current ratio has not reached, null when maxed out.
  let nextTierIndex: number | null = null
  if (thresholds.length === 6) {
    const current = ratio ?? 0
    for (let i = 0; i < 6; i++) {
      if (current < thresholds[i]) {
        nextTierIndex = i
        break
      }
    }
  }

  return (
    <Screen title={exercise.name} back="/exercises">
      <section
        className={`rounded-2xl border border-border bg-surface p-5 text-center ${tierClass(rank.tier)}`}
      >
        <div className="flex justify-center">
          <RankBadge rank={rank} size="lg" />
        </div>
        <div className="tier-text mt-2 font-display text-xl font-semibold">{rank.label}</div>
        {e1rm !== null && ratio !== null ? (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                e1RM
              </div>
              <div className="num text-2xl font-bold leading-tight">{Math.round(e1rm)} kg</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Ratio
              </div>
              <div className="num text-2xl font-bold leading-tight">{ratio.toFixed(2)}x</div>
              <div className="text-[10px] text-muted">of bodyweight</div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No lifts logged yet. Log a set in a match to get ranked.
          </p>
        )}
        {nextTierIndex !== null && (
          <div className="mt-3 border-t border-border pt-3 text-sm text-muted">
            Next tier ({tierLabel(TIERS[nextTierIndex])}) at{' '}
            <span className="num font-bold text-text">
              {fmtKg(thresholds[nextTierIndex] * profile.bodyweightKg)} kg
            </span>{' '}
            e1RM
            {isBodyweight && (
              <span className="block text-xs">
                about {repsForRatio(thresholds[nextTierIndex])} reps at bodyweight
              </span>
            )}
          </div>
        )}
        {nextTierIndex === null && thresholds.length === 6 && (
          <div className="mt-3 border-t border-border pt-3 text-sm text-muted">
            Top tier reached
          </div>
        )}
      </section>

      <div className="mt-3 rounded-2xl border border-border bg-surface p-4 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {exercise.targetMuscles.map((muscle) => (
            <span
              key={muscle}
              className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted"
            >
              {muscle}
            </span>
          ))}
        </div>
        <div className="mt-2 text-muted">
          <span className="font-semibold text-text">{exercise.equipment}</span>
          {exercise.loadNote && <span className="block text-xs">{exercise.loadNote}</span>}
        </div>
      </div>

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        e1RM Progression
      </h2>
      <E1rmChart
        points={history.map((entry) => ({ at: entry.finishedAt, e1rm: entry.e1rm }))}
        tier={rank.tier}
      />

      {thresholds.length === 6 && (
        <>
          <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
            Tier Thresholds at {fmtKg(profile.bodyweightKg)} kg bodyweight
          </h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {TIERS.map((tier, index) => {
              const achieved = ratio !== null && ratio >= thresholds[index]
              return (
                <div
                  key={tier}
                  className={`flex min-h-11 items-center justify-between px-4 ${tierClass(tier)} ${
                    achieved ? '' : 'opacity-60'
                  }`}
                >
                  <span className="tier-text font-display text-sm font-semibold">
                    {tierLabel(tier)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num text-sm font-bold">
                      {fmtKg(thresholds[index] * profile.bodyweightKg)} kg
                    </span>
                    {achieved && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-label="Achieved"
                        role="img"
                        className="text-success"
                      >
                        <path
                          d="M4 12.5 L10 18.5 L20 6.5"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Execution
      </h2>
      <ol className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        {exercise.execution.map((step, index) => (
          <li key={index} className="flex gap-3 text-sm">
            <span className="num shrink-0 font-bold text-muted">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Form Cues
      </h2>
      <ul className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        {exercise.cues.map((cue, index) => (
          <li key={index} className="flex gap-3 text-sm">
            <span aria-hidden className="shrink-0 font-bold text-success">
              +
            </span>
            <span>{cue}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Common Mistakes
      </h2>
      <ul className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        {exercise.mistakes.map((mistake, index) => (
          <li key={index} className="flex gap-3 text-sm">
            <span aria-hidden className="shrink-0 font-bold text-danger">
              !
            </span>
            <span>{mistake}</span>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
