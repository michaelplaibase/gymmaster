import { count, desc, eq, ne } from 'drizzle-orm'
import { db } from '@/db/client'
import { fasts, workouts, workoutSets, type Playlist, type WorkoutType } from '@/db/schema'
import { getWorkoutDetail, getWorkoutSummary, type WorkoutSummary } from '@/lib/data/workouts'

export type HistoryEntry =
  | {
      kind: 'workout'
      id: number
      at: number
      workoutType: WorkoutType
      score: number | null
      mmrDelta: number | null
      prCount: number
      setCount: number
      xpEarned: number
    }
  | {
      kind: 'fast'
      id: number
      at: number
      preset: string
      targetSec: number
      elapsedSec: number
      outcome: 'completed' | 'ended_early'
      mmrDelta: number | null
      xpEarned: number
    }

// Completed workouts and finished fasts merged, newest first.
export function listHistory(limit?: number): HistoryEntry[] {
  const workoutRows = db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .orderBy(desc(workouts.finishedAt), desc(workouts.id))
    .all()
  const setCounts = db
    .select({ workoutId: workoutSets.workoutId, n: count() })
    .from(workoutSets)
    .groupBy(workoutSets.workoutId)
    .all()
  const setsByWorkout = new Map(setCounts.map((row) => [row.workoutId, row.n]))

  const entries: HistoryEntry[] = workoutRows.map((workout) => ({
    kind: 'workout' as const,
    id: workout.id,
    at: (workout.finishedAt ?? workout.startedAt).getTime(),
    workoutType: workout.workoutType,
    score: workout.score,
    mmrDelta: workout.mmrDelta,
    prCount: workout.prCount,
    setCount: setsByWorkout.get(workout.id) ?? 0,
    xpEarned: workout.xpEarned,
  }))

  const fastRows = db
    .select()
    .from(fasts)
    .where(ne(fasts.status, 'active'))
    .orderBy(desc(fasts.endedAt), desc(fasts.id))
    .all()
  for (const fast of fastRows) {
    const endedAt = fast.endedAt ?? fast.startedAt
    entries.push({
      kind: 'fast',
      id: fast.id,
      at: endedAt.getTime(),
      preset: fast.preset,
      targetSec: fast.targetSec,
      elapsedSec: Math.max(0, Math.floor((endedAt.getTime() - fast.startedAt.getTime()) / 1000)),
      outcome: fast.status as 'completed' | 'ended_early',
      mmrDelta: fast.mmrDelta,
      xpEarned: fast.xpEarned,
    })
  }

  entries.sort((a, b) => b.at - a.at)
  return limit === undefined ? entries : entries.slice(0, limit)
}

// Summary for a COMPLETED workout, null otherwise (active or unknown id).
export function getWorkoutDetailForHistory(id: number): WorkoutSummary | null {
  const detail = getWorkoutDetail(id)
  if (!detail || detail.workout.status !== 'completed') return null
  return getWorkoutSummary(id)
}

// Completed matches per playlist: completed workouts by type, completed fasts.
export function matchCounts(): Record<Playlist, number> {
  const counts: Record<Playlist, number> = { push: 0, pull: 0, legs: 0, fasting: 0 }
  const workoutRows = db
    .select({ workoutType: workouts.workoutType, n: count() })
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .groupBy(workouts.workoutType)
    .all()
  for (const row of workoutRows) counts[row.workoutType] = row.n
  const fastRow = db
    .select({ n: count() })
    .from(fasts)
    .where(eq(fasts.status, 'completed'))
    .get()
  counts.fasting = fastRow?.n ?? 0
  return counts
}
