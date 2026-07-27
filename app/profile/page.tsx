import type { Metadata } from 'next'
import Link from 'next/link'
import { RankCard } from '@/components/ui/RankCard'
import { Screen } from '@/components/ui/Screen'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { currentStreak } from '@/lib/data/fasts'
import { matchCounts } from '@/lib/data/history'
import { redirect } from 'next/navigation'
import { getProfile, isOnboarded } from '@/lib/data/profile'
import { getAllRatings } from '@/lib/data/ratings'
import { levelFromXp, placementsRemaining, rankFromMmr, type Playlist } from '@/lib/rating'
import { PLAYLIST_LABEL } from '@/lib/ui/tier'
import { SettingsSection } from './SettingsSection'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Career overview: level, playlist ranks, streaks and settings.',
}

const PLAYLISTS: Playlist[] = ['push', 'pull', 'legs', 'fasting']

export default function ProfilePage() {
  if (!isOnboarded()) redirect('/onboarding')
  const profile = getProfile()
  const level = levelFromXp(profile.xp)
  const ratings = getAllRatings()
  const streak = currentStreak()
  const counts = matchCounts()

  return (
    <Screen title="Profile" back="/">
      <section className="rounded-2xl border border-border bg-surface p-5 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Level
        </div>
        <div className="num text-7xl font-bold leading-none">{level.level}</div>
        <div className="mx-auto mt-4 max-w-60">
          <ProgressBar value={level.progress} />
        </div>
        <div className="num mt-2 text-xs text-muted">
          {level.intoLevel} / {level.levelSpan} XP to Level {level.level + 1}
        </div>
        <div className="num text-xs text-muted">{profile.xp} XP total</div>
      </section>

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Playlists
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {PLAYLISTS.map((playlist) => {
          const rating = ratings[playlist]
          return (
            <RankCard
              key={playlist}
              playlist={playlist}
              rank={rankFromMmr(rating.mmr)}
              mmr={rating.mmr}
              sessionsPlayed={rating.sessionsPlayed}
              placementsRemaining={placementsRemaining(rating.sessionsPlayed)}
              compact
            />
          )
        })}
      </div>

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Streaks
      </h2>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Fast Streak
        </div>
        <div className="flex items-baseline gap-2">
          <span className="num text-4xl font-bold leading-tight">{streak}</span>
          <span className="text-xs text-muted">consecutive completed fasts</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border pt-3">
          {PLAYLISTS.map((playlist) => (
            <div key={playlist} className="text-center">
              <div className="num text-xl font-bold leading-tight">{counts[playlist]}</div>
              <div className="text-[9px] font-semibold uppercase tracking-widest text-muted">
                {PLAYLIST_LABEL[playlist]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 text-center text-[10px] text-muted">matches completed</div>
      </div>

      <h2 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Settings
      </h2>
      <SettingsSection
        bodyweightKg={profile.bodyweightKg}
        sex={profile.sex}
        defaultRestSec={profile.defaultRestSec}
      />

      <Link
        href="/exercises"
        className="mt-3 flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface px-4 active:bg-surface-2"
      >
        <span className="font-display text-sm font-semibold uppercase tracking-wide">
          Exercise Library
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    </Screen>
  )
}
