import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { startMatchAction } from '@/app/actions/training'
import { RankCard } from '@/components/ui/RankCard'
import { Screen } from '@/components/ui/Screen'
import { isOnboarded } from '@/lib/data/profile'
import { getRating } from '@/lib/data/ratings'
import { getActiveWorkout } from '@/lib/data/workouts'
import { rankFromMmr } from '@/lib/rating'
import { PLAYLIST_LABEL } from '@/lib/ui/tier'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Train',
  description: 'Queue a ranked training match: Push, Pull or Legs.',
}

const PLAYLISTS = ['push', 'pull', 'legs'] as const

export default function TrainPage() {
  if (!isOnboarded()) redirect('/onboarding')
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
      {active && (
        <p className="-mt-1 mb-3 text-xs leading-snug text-muted">
          Playlists are locked while your {PLAYLIST_LABEL[active.workoutType]} match is live.
          Resume it above, or finish or abandon it to queue another.
        </p>
      )}
      <div className="space-y-3">
        {PLAYLISTS.map((playlist) => {
          const rating = getRating(playlist)
          const card = (
            <RankCard
              playlist={playlist}
              rank={rankFromMmr(rating.mmr)}
              mmr={rating.mmr}
              sessionsPlayed={rating.sessionsPlayed}
            />
          )
          if (active) {
            return (
              <div key={playlist} aria-disabled="true" className="opacity-45">
                {card}
              </div>
            )
          }
          return (
            <form key={playlist} action={startMatchAction.bind(null, playlist)}>
              <button
                type="submit"
                className="w-full text-left transition-transform active:scale-[0.99]"
              >
                {card}
              </button>
            </form>
          )
        })}
      </div>
    </Screen>
  )
}
