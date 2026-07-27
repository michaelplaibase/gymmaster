import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RankCard } from '@/components/ui/RankCard'
import { Screen } from '@/components/ui/Screen'
import { PRESETS, currentStreak, getActiveFast } from '@/lib/data/fasts'
import { isOnboarded } from '@/lib/data/profile'
import { getRating } from '@/lib/data/ratings'
import { isPlacement, placementsRemaining, rankFromMmr } from '@/lib/rating'
import { tierClass } from '@/lib/ui/tier'
import { ActiveFast } from './ActiveFast'
import { StartFast } from './StartFast'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fasting',
  description: 'Start a fasting match, hold the window and defend your streak.',
}

export default function FastPage() {
  if (!isOnboarded()) redirect('/onboarding')
  const active = getActiveFast()
  const rating = getRating('fasting')
  const rank = rankFromMmr(rating.mmr)
  const placing = isPlacement(rating.sessionsPlayed)

  if (active) {
    return (
      <Screen title="Fasting" back="/">
        <ActiveFast
          id={active.id}
          preset={active.preset}
          targetSec={active.targetSec}
          startedAtMs={active.startedAt.getTime()}
          tier={placing ? null : rank.tier}
        />
      </Screen>
    )
  }

  const streak = currentStreak()
  return (
    <Screen
      title="Fasting"
      back="/"
      action={
        <Link
          href="/fast/history"
          className="flex h-11 items-center px-3 text-[11px] font-semibold uppercase tracking-widest text-muted active:text-text"
        >
          History
        </Link>
      }
    >
      <RankCard
        playlist="fasting"
        rank={rank}
        mmr={rating.mmr}
        sessionsPlayed={rating.sessionsPlayed}
        placementsRemaining={placementsRemaining(rating.sessionsPlayed)}
      />

      <div
        className={`mt-3 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 ${tierClass(placing ? null : rank.tier)}`}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={streak > 0 ? 'tier-text' : 'text-muted'}
        >
          <path
            d="M12 2.5c.6 3.2-1.2 4.9-2.8 6.6C7.6 10.8 6 12.6 6 15.2A6 6 0 0 0 18 15c0-2.1-1-3.6-2-5-.4 1-.9 1.6-1.7 2.1.3-2.9-.6-6.9-2.3-9.6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Streak
          </div>
          <div className="num text-5xl font-bold leading-none">{streak}</div>
          <div className="mt-1 text-xs text-muted">consecutive completed fasts</div>
        </div>
      </div>

      <StartFast presets={PRESETS} />
    </Screen>
  )
}
