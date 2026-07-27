import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  exercises,
  exerciseThresholds,
  workouts,
  workoutSets,
  type Exercise,
  type Sex,
  type WorkoutType,
} from '@/db/schema'
import { TIERS, bestSetE1rm, rankFromRatio, strengthRatio, type Rank } from '@/lib/rating'
import { getProfile } from './profile'

export function listExercises(type?: WorkoutType): Exercise[] {
  if (type) {
    return db
      .select()
      .from(exercises)
      .where(eq(exercises.workoutType, type))
      .orderBy(asc(exercises.sortOrder))
      .all()
  }
  return db.select().from(exercises).orderBy(asc(exercises.sortOrder)).all()
}

export function defaultTemplate(type: WorkoutType): Exercise[] {
  return db
    .select()
    .from(exercises)
    .where(and(eq(exercises.workoutType, type), eq(exercises.inDefaultTemplate, true)))
    .orderBy(asc(exercises.sortOrder))
    .all()
}

export function getExercise(id: string): Exercise | null {
  return db.select().from(exercises).where(eq(exercises.id, id)).get() ?? null
}

// 6 ascending strength ratios, bronze entry first, emerald entry last.
export function getThresholds(exerciseId: string, sex: Sex): number[] {
  const rows = db
    .select()
    .from(exerciseThresholds)
    .where(and(eq(exerciseThresholds.exerciseId, exerciseId), eq(exerciseThresholds.sex, sex)))
    .all()
  const byTier = new Map(rows.map((row) => [row.tier, row.value]))
  return TIERS.map((tier) => byTier.get(tier)).filter(
    (value): value is number => value !== undefined
  )
}

// Best e1RM per COMPLETED workout containing the exercise, oldest first.
export function exerciseHistory(
  exerciseId: string
): { workoutId: number; finishedAt: number; e1rm: number }[] {
  const exercise = getExercise(exerciseId)
  if (!exercise) return []
  const bodyweightKg = getProfile().bodyweightKg
  const rows = db
    .select({
      workoutId: workoutSets.workoutId,
      finishedAt: workouts.finishedAt,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .where(and(eq(workoutSets.exerciseId, exerciseId), eq(workouts.status, 'completed')))
    .all()

  const byWorkout = new Map<
    number,
    { finishedAt: number; sets: { weightKg: number; reps: number }[] }
  >()
  for (const row of rows) {
    const entry = byWorkout.get(row.workoutId) ?? {
      finishedAt: row.finishedAt ? row.finishedAt.getTime() : 0,
      sets: [],
    }
    entry.sets.push({ weightKg: row.weightKg, reps: row.reps })
    byWorkout.set(row.workoutId, entry)
  }

  const history: { workoutId: number; finishedAt: number; e1rm: number }[] = []
  for (const [workoutId, entry] of byWorkout) {
    const best = bestSetE1rm(entry.sets, exercise.loadType, bodyweightKg)
    if (best !== null) {
      history.push({ workoutId, finishedAt: entry.finishedAt, e1rm: best })
    }
  }
  history.sort((a, b) => a.finishedAt - b.finishedAt)
  return history
}

export function allTimeBestE1rm(exerciseId: string, excludeWorkoutId?: number): number | null {
  let best: number | null = null
  for (const entry of exerciseHistory(exerciseId)) {
    if (excludeWorkoutId !== undefined && entry.workoutId === excludeWorkoutId) continue
    if (best === null || entry.e1rm > best) best = entry.e1rm
  }
  return best
}

// Rank from the BEST all time e1RM for the exercise.
export function exerciseRank(exerciseId: string): {
  rank: Rank
  e1rm: number | null
  ratio: number | null
} {
  const unranked: Rank = { tier: null, division: null, label: 'Unranked', progress: 0 }
  const best = allTimeBestE1rm(exerciseId)
  if (best === null) return { rank: unranked, e1rm: null, ratio: null }
  const currentProfile = getProfile()
  const ratio = strengthRatio(best, currentProfile.bodyweightKg)
  const thresholds = getThresholds(exerciseId, currentProfile.sex)
  if (thresholds.length !== 6) return { rank: unranked, e1rm: best, ratio }
  return { rank: rankFromRatio(ratio, thresholds), e1rm: best, ratio }
}
