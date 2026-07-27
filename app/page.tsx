import Link from 'next/link'
import { redirect } from 'next/navigation'
import { QuestList } from '@/components/progression/QuestList'
import { LiveElapsed } from '@/components/shell/LiveElapsed'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { RankBadge } from '@/components/ui/RankBadge'
import { RankCard } from '@/components/ui/RankCard'
import { formatRelativeDay } from '@/lib/date'
import { getActiveFast } from '@/lib/data/fasts'
import { listHistory, type HistoryEntry } from '@/lib/data/history'
import { getProfile, isOnboarded } from '@/lib/data/profile'
import { ensureTodayQuests } from '@/lib/data/quests'
import { getAllRatings } from '@/lib/data/ratings'
import { getActiveWorkout } from '@/lib/data/workouts'
import {
  PLACEMENT_SESSIONS,
  levelFromXp,
  rankFromMmr,
  type Playlist,
  type Rank,
} from '@/lib/rating'
import { PLAYLIST_LABEL } from '@/lib/ui/tier'

export const dynamic = 'force-dynamic'

const PLAYLISTS: Playlist[] = ['push', 'pull', 'legs', 'fasting']

const UNRANKED: Rank = { tier: null, division: null, label: 'Unranked', progress: 0 }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
      {children}
    </h2>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const isWorkout = entry.kind === 'workout'
  const main = isWorkout
    ? `${entry.setCount} ${entry.setCount === 1 ? 'set' : 'sets'}${entry.prCount > 0 ? `, ${entry.prCount} PR` : ''}`
    : `${entry.preset}, ${entry.outcome === 'completed' ? 'completed' : 'ended early'}`
  return (
    <Link
      href="/history"
      className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 active:bg-surface-2"
    >
      <span className="w-12 shrink-0 rounded border border-border py-1 text-center text-[9px] font-bold uppercase tracking-widest text-muted">
        {isWorkout ? PLAYLIST_LABEL[entry.workoutType] : 'Fast'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-semibold">{main}</span>
        <span className="block text-xs text-muted">{formatRelativeDay(entry.at)}</span>
      </span>
      {entry.mmrDelta !== null && (
        <span
          className={`num shrink-0 text-base font-bold ${
            entry.mmrDelta >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          {entry.mmrDelta >= 0 ? `+${entry.mmrDelta}` : String(entry.mmrDelta)}
        </span>
      )}
    </Link>
  )
}

export default function HomePage() {
  if (!isOnboarded()) redirect('/onboarding')

  const profile = getProfile()
  const level = levelFromXp(profile.xp)
  const ratings = getAllRatings()
  const activeWorkout = getActiveWorkout()
  const activeFast = getActiveFast()
  const quests = ensureTodayQuests()
  const history = listHistory(3)

  const heroPlaylist =
    PLAYLISTS.filter((playlist) => ratings[playlist].sessionsPlayed >= PLACEMENT_SESSIONS)
      .sort((a, b) => ratings[b].mmr - ratings[a].mmr)[0] ?? null

  const actionBase =
    'flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-center'
  const resumeClass = `${actionBase} border border-success/50 bg-surface-2 active:bg-border/60`

  return (
    <main className="px-4 pt-safe pb-[calc(var(--nav-h,calc(4rem_+_env(safe-area-inset-bottom)))_+_2.5rem)]">
      <div className="space-y-6 pt-5">
        <header>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-bold tracking-[0.3em]">RANKED</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                LVL
              </span>
              <span className="num text-2xl font-bold leading-none">{level.level}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <ProgressBar value={level.progress} />
            </div>
            <span className="num shrink-0 text-[11px] font-semibold text-muted">
              {level.intoLevel}/{level.levelSpan} XP
            </span>
          </div>
        </header>

        {heroPlaylist ? (
          <RankCard
            playlist={heroPlaylist}
            rank={rankFromMmr(ratings[heroPlaylist].mmr)}
            mmr={ratings[heroPlaylist].mmr}
            sessionsPlayed={ratings[heroPlaylist].sessionsPlayed}
          />
        ) : (
          <Link
            href="/train"
            className="block rounded-2xl border border-border bg-surface p-4 active:bg-surface-2"
          >
            <div className="flex items-center gap-4">
              <RankBadge rank={UNRANKED} size="lg" hidden />
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold">Place your rank</div>
                <div className="mt-1 text-sm leading-snug text-muted">
                  Play 3 placement matches in a playlist to reveal your rank.
                </div>
              </div>
            </div>
          </Link>
        )}

        <section className="grid grid-cols-2 gap-3">
          {activeWorkout ? (
            <Link href={`/train/${activeWorkout.id}`} className={resumeClass}>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-success">
                <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Live match
              </span>
              <span className="num text-2xl font-bold leading-none">
                <LiveElapsed startedAtMs={activeWorkout.startedAt.getTime()} />
              </span>
              <span className="font-display text-sm font-semibold uppercase tracking-wide">
                Resume Training
              </span>
            </Link>
          ) : (
            <Link href="/train" className={`${actionBase} bg-text text-bg active:bg-text/80`}>
              <span className="font-display text-base font-bold uppercase tracking-wide">
                Start Training
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                Ranked match
              </span>
            </Link>
          )}
          {activeFast ? (
            <Link href="/fast" className={resumeClass}>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-success">
                <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Fast live
              </span>
              <span className="num text-2xl font-bold leading-none">
                <LiveElapsed startedAtMs={activeFast.startedAt.getTime()} />
              </span>
              <span className="font-display text-sm font-semibold uppercase tracking-wide">
                Resume Fast
              </span>
            </Link>
          ) : (
            <Link
              href="/fast"
              className={`${actionBase} border border-border bg-surface-2 active:bg-border/60`}
            >
              <span className="font-display text-base font-bold uppercase tracking-wide">
                Start Fast
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Fasting playlist
              </span>
            </Link>
          )}
        </section>

        <section>
          <div className="mb-2">
            <SectionTitle>Daily quests</SectionTitle>
          </div>
          <QuestList quests={quests} />
        </section>

        <section>
          <div className="mb-2">
            <SectionTitle>Playlists</SectionTitle>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PLAYLISTS.map((playlist) => (
              <Link key={playlist} href="/profile" className="block active:opacity-80">
                <RankCard
                  playlist={playlist}
                  rank={rankFromMmr(ratings[playlist].mmr)}
                  mmr={ratings[playlist].mmr}
                  sessionsPlayed={ratings[playlist].sessionsPlayed}
                  compact
                />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Recent matches</SectionTitle>
            <Link
              href="/history"
              className="-my-3 -mr-2 flex min-h-11 min-w-11 items-center justify-center px-2 text-[11px] font-semibold uppercase tracking-widest text-muted active:text-text"
            >
              All
            </Link>
          </div>
          {history.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-3 text-sm text-muted">
              No matches yet. Your results land here.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <HistoryRow key={`${entry.kind}-${entry.id}`} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
