import Link from 'next/link'
import { startMatchAction } from '@/app/actions/training'
import { RankCard } from '@/components/ui/RankCard'
import { Screen } from '@/components/ui/Screen'
import { getRating } from '@/lib/data/ratings'
import { getActiveWorkout } from '@/lib/data/workouts'
import { rankFromMmr } from '@/lib/rating'
import { PLAYLIST_LABEL } from '@/lib/ui/tier'

export const dynamic = 'force-dynamic'

const PLAYLISTS = ['push', 'pull', 'legs'] as const

export default function TrainPage() {
  const active = getActiveWorkout()
  return (
    <Screen title="Ranked" back="/">
      {active && (
        <Link
          href={`/train/${active.id}`}
          className="mb-4 flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-success/40 bg-surface-2 px-4 py-3 active:bg-border/60"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-success">
              Match in progress
            </div>
            <div className="truncate font-display text-lg font-semibold">
              Resume {PLAYLIST_LABEL[active.workoutType]} Match
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-success">
            <path
              d="M9 5 L16 12 L9 19"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Select Playlist
      </h2>
      <div className="space-y-3">
        {PLAYLISTS.map((playlist) => {
          const rating = getRating(playlist)
          return (
            <form key={playlist} action={startMatchAction.bind(null, playlist)}>
              <button
                type="submit"
                className="w-full text-left transition-transform active:scale-[0.99]"
              >
                <RankCard
                  playlist={playlist}
                  rank={rankFromMmr(rating.mmr)}
                  mmr={rating.mmr}
                  sessionsPlayed={rating.sessionsPlayed}
                />
              </button>
            </form>
          )
        })}
      </div>
    </Screen>
  )
}
