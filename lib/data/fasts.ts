import { desc, eq, ne } from 'drizzle-orm'
import { db } from '@/db/client'
import { fasts, type Fast } from '@/db/schema'
import { fastingDelta, fastXp, isPlacement, levelFromXp } from '@/lib/rating'
import { addXp, getProfile } from './profile'
import { applyQuestEvent } from './quests'
import { getRating, recordSession, type SessionRatingResult } from './ratings'

export const PRESETS: { id: string; label: string; hours: number }[] = [
  { id: '16:8', label: '16:8', hours: 16 },
  { id: '18:6', label: '18:6', hours: 18 },
  { id: '20:4', label: '20:4', hours: 20 },
]

export type FastResult = {
  fast: Fast
  rating: SessionRatingResult
  outcome: 'completed' | 'ended_early'
  elapsedSec: number
  streakAfter: number
  xpEarned: number
  levelUp: { from: number; to: number } | null
  questsCompleted: { title: string; xpReward: number }[]
}

export function getActiveFast(): Fast | null {
  return (
    db
      .select()
      .from(fasts)
      .where(eq(fasts.status, 'active'))
      .orderBy(desc(fasts.id))
      .limit(1)
      .get() ?? null
  )
}

// Refuses to start a second fast while one is active: returns the existing id.
export function startFast(input: { preset: string; targetSec: number }): number {
  const active = getActiveFast()
  if (active) return active.id
  const row = db
    .insert(fasts)
    .values({ preset: input.preset, targetSec: input.targetSec, startedAt: new Date() })
    .returning({ id: fasts.id })
    .get()
  return row.id
}

// Finished fasts (completed or ended early), newest first.
export function listFasts(limit?: number): Fast[] {
  const query = db
    .select()
    .from(fasts)
    .where(ne(fasts.status, 'active'))
    .orderBy(desc(fasts.endedAt), desc(fasts.id))
  if (limit === undefined) return query.all()
  return query.limit(limit).all()
}

// Consecutive completed fasts counting back from the most recent finished
// fast. The latest finished fast being ended early means 0.
export function currentStreak(): number {
  let streak = 0
  for (const fast of listFasts()) {
    if (fast.status !== 'completed') break
    streak++
  }
  return streak
}

function finishFast(id: number, outcome: 'completed' | 'ended_early'): FastResult {
  const existing = db.select().from(fasts).where(eq(fasts.id, id)).get()
  if (!existing || existing.status !== 'active') {
    throw new Error('Fast is not active')
  }
  const now = new Date()
  const elapsedSec = Math.floor((now.getTime() - existing.startedAt.getTime()) / 1000)
  if (outcome === 'completed' && elapsedSec < existing.targetSec) {
    throw new Error('Fast has not reached its target window yet')
  }

  // Placement status read before the session is recorded.
  const wasPlacement = isPlacement(getRating('fasting').sessionsPlayed)
  const delta = fastingDelta(outcome, wasPlacement)
  const rating = recordSession('fasting', delta)

  const streakAfter = outcome === 'completed' ? currentStreak() + 1 : 0
  const xpEarned = outcome === 'completed' ? fastXp(streakAfter) : 0

  const levelBefore = levelFromXp(getProfile().xp).level
  if (xpEarned > 0) addXp(xpEarned)
  const questsCompleted =
    outcome === 'completed'
      ? applyQuestEvent({ kind: 'fast_completed' }).completed.map((quest) => ({
          title: quest.title,
          xpReward: quest.xpReward,
        }))
      : []
  const levelAfter = levelFromXp(getProfile().xp).level

  const fast = db
    .update(fasts)
    .set({
      status: outcome,
      endedAt: now,
      mmrBefore: rating.mmrBefore,
      mmrAfter: rating.mmrAfter,
      mmrDelta: rating.delta,
      wasPlacement,
      xpEarned,
      streakAfter,
    })
    .where(eq(fasts.id, id))
    .returning()
    .get()!

  return {
    fast,
    rating,
    outcome,
    elapsedSec,
    streakAfter,
    xpEarned,
    levelUp: levelAfter > levelBefore ? { from: levelBefore, to: levelAfter } : null,
    questsCompleted,
  }
}

// Only allowed once elapsed >= targetSec.
export function completeFast(id: number): FastResult {
  return finishFast(id, 'completed')
}

export function endFastEarly(id: number): FastResult {
  return finishFast(id, 'ended_early')
}
