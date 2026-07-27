import Link from 'next/link'
import { RankBadge } from '@/components/ui/RankBadge'
import { Screen } from '@/components/ui/Screen'
import { exerciseRank, listExercises } from '@/lib/data/exercises'
import type { WorkoutType } from '@/db/schema'
import { PLAYLIST_LABEL } from '@/lib/ui/tier'

export const dynamic = 'force-dynamic'

const GROUPS: WorkoutType[] = ['push', 'pull', 'legs']

export default function ExercisesPage() {
  return (
    <Screen title="Exercise Library" back="/profile">
      {GROUPS.map((type) => {
        const rows = listExercises(type)
        if (rows.length === 0) return null
        return (
          <section key={type} className="mb-5">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
              {PLAYLIST_LABEL[type]}
            </h2>
            <div className="space-y-2">
              {rows.map((exercise) => {
                const { rank } = exerciseRank(exercise.id)
                return (
                  <Link
                    key={exercise.id}
                    href={`/exercises/${exercise.id}`}
                    className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface p-3 active:bg-surface-2"
                  >
                    <RankBadge rank={rank} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-semibold">
                        {exercise.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {exercise.equipment}
                      </span>
                    </span>
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
                )
              })}
            </div>
          </section>
        )
      })}
    </Screen>
  )
}
