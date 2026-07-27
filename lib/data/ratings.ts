import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { ratings, type Playlist, type Rating } from '@/db/schema'
import {
  PLACEMENT_SESSIONS,
  PLACEMENT_START_MMR,
  applyDelta,
  isPlacement,
  placementsRemaining,
  rankFromMmr,
  type Rank,
} from '@/lib/rating'

const PLAYLISTS: Playlist[] = ['push', 'pull', 'legs', 'fasting']

// Creates the row at mmr 500 if missing.
export function getRating(playlist: Playlist): Rating {
  const existing = db.select().from(ratings).where(eq(ratings.playlist, playlist)).get()
  if (existing) return existing
  db.insert(ratings)
    .values({ playlist, mmr: PLACEMENT_START_MMR, sessionsPlayed: 0 })
    .onConflictDoNothing()
    .run()
  return db.select().from(ratings).where(eq(ratings.playlist, playlist)).get()!
}

export function getAllRatings(): Record<Playlist, Rating> {
  const all = {} as Record<Playlist, Rating>
  for (const playlist of PLAYLISTS) {
    all[playlist] = getRating(playlist)
  }
  return all
}

export type SessionRatingResult = {
  mmrBefore: number
  mmrAfter: number
  delta: number
  wasPlacement: boolean
  sessionsPlayedAfter: number
  placementsRemaining: number
  rankBefore: Rank
  rankAfter: Rank
  promoted: boolean
  demoted: boolean
  placedNow: boolean
}

// rawDelta is ALREADY placement doubled by the caller. This function applies
// it with the 0 floor and never scales it. delta reports the applied change
// (mmrAfter minus mmrBefore), which differs from rawDelta only at the floor.
export function recordSession(playlist: Playlist, rawDelta: number): SessionRatingResult {
  const current = getRating(playlist)
  const wasPlacement = isPlacement(current.sessionsPlayed)
  const mmrBefore = current.mmr
  const mmrAfter = applyDelta(mmrBefore, rawDelta)
  const sessionsPlayedAfter = current.sessionsPlayed + 1

  db.update(ratings)
    .set({ mmr: mmrAfter, sessionsPlayed: sessionsPlayedAfter })
    .where(eq(ratings.playlist, playlist))
    .run()

  const rankBefore = rankFromMmr(mmrBefore)
  const rankAfter = rankFromMmr(mmrAfter)
  const rankChanged =
    rankBefore.tier !== rankAfter.tier || rankBefore.division !== rankAfter.division

  return {
    mmrBefore,
    mmrAfter,
    delta: mmrAfter - mmrBefore,
    wasPlacement,
    sessionsPlayedAfter,
    placementsRemaining: placementsRemaining(sessionsPlayedAfter),
    rankBefore,
    rankAfter,
    promoted: !wasPlacement && rankChanged && mmrAfter > mmrBefore,
    demoted: !wasPlacement && rankChanged && mmrAfter < mmrBefore,
    placedNow: sessionsPlayedAfter === PLACEMENT_SESSIONS,
  }
}
