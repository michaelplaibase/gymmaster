import { and, asc, count, desc, eq, gte, lte } from 'drizzle-orm'
import { db, sqlite } from '@/db/client'
import {
  dailyQuests,
  exercises,
  questTemplates,
  workoutExercises,
  workouts,
  workoutSets,
  type Exercise,
  type Workout,
  type WorkoutSet,
  type WorkoutType,
} from '@/db/schema'
import {
  PLACEMENT_SESSIONS,
  bestSetE1rm,
  isPlacement,
  levelFromXp,
  rankFromMmr,
  rollingBaseline,
  sessionScore,
  setE1rm,
  trainingDelta,
  workoutXp,
  type Rank,
} from '@/lib/rating'
import { defaultTemplate, exerciseHistory, exerciseRank } from './exercises'
import { addXp, getProfile } from './profile'
import { applyQuestEvent } from './quests'
import { getRating, recordSession, type SessionRatingResult } from './ratings'

export type WorkoutSummary = {
  workout: Workout
  rating: SessionRatingResult
  score: number
  perExercise: {
    exercise: Exercise
    sessionE1rm: number
    baselineE1rm: number | null
    ratio: number | null
    isPr: boolean
    setCount: number
    rank: Rank
    // Extra display field: the set with the highest e1RM this session.
    bestSet: { weightKg: number; reps: number }
  }[]
  mvp: { exerciseId: string; name: string; ratio: number } | null
  prCount: number
  xpEarned: number
  levelUp: { from: number; to: number } | null
  questsCompleted: { title: string; xpReward: number }[]
}

export type WorkoutDetail = {
  workout: Workout
  exercises: Exercise[]
  setsByExercise: Record<string, WorkoutSet[]>
}

// finishWorkout caches its summary so the summary page's first render shows
// the exact level up and completed quests. Kept on globalThis so dev hot
// reloads and separate route bundles share one cache.
const globalForSummaries = globalThis as unknown as {
  rankedWorkoutSummaries?: Map<number, WorkoutSummary>
}
const summaryCache =
  globalForSummaries.rankedWorkoutSummaries ??
  (globalForSummaries.rankedWorkoutSummaries = new Map<number, WorkoutSummary>())

export function getActiveWorkout(): Workout | null {
  return (
    db
      .select()
      .from(workouts)
      .where(eq(workouts.status, 'active'))
      .orderBy(desc(workouts.id))
      .get() ?? null
  )
}

export function getWorkout(id: number): Workout | null {
  return db.select().from(workouts).where(eq(workouts.id, id)).get() ?? null
}

export function startWorkout(type: WorkoutType): number {
  const run = sqlite.transaction((): number => {
    const active = getActiveWorkout()
    if (active) return active.id
    const inserted = db
      .insert(workouts)
      .values({ workoutType: type, status: 'active', startedAt: new Date() })
      .returning({ id: workouts.id })
      .get()
    defaultTemplate(type).forEach((exercise, index) => {
      db.insert(workoutExercises)
        .values({ workoutId: inserted.id, exerciseId: exercise.id, position: index })
        .run()
    })
    return inserted.id
  })
  return run()
}

export function getWorkoutDetail(id: number): WorkoutDetail | null {
  const workout = getWorkout(id)
  if (!workout) return null
  const exerciseRows = db
    .select({ exercise: exercises })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(workoutExercises.workoutId, id))
    .orderBy(asc(workoutExercises.position))
    .all()
  const sets = db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, id))
    .orderBy(asc(workoutSets.id))
    .all()
  const setsByExercise: Record<string, WorkoutSet[]> = {}
  for (const set of sets) {
    ;(setsByExercise[set.exerciseId] ??= []).push(set)
  }
  return { workout, exercises: exerciseRows.map((row) => row.exercise), setsByExercise }
}

export function addExerciseToWorkout(workoutId: number, exerciseId: string): void {
  const positions = db
    .select({ position: workoutExercises.position })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .all()
  const nextPosition = positions.reduce((max, row) => Math.max(max, row.position + 1), 0)
  db.insert(workoutExercises)
    .values({ workoutId, exerciseId, position: nextPosition })
    .onConflictDoNothing()
    .run()
}

export function removeExerciseFromWorkout(workoutId: number, exerciseId: string): void {
  const run = sqlite.transaction(() => {
    db.delete(workoutSets)
      .where(and(eq(workoutSets.workoutId, workoutId), eq(workoutSets.exerciseId, exerciseId)))
      .run()
    db.delete(workoutExercises)
      .where(
        and(eq(workoutExercises.workoutId, workoutId), eq(workoutExercises.exerciseId, exerciseId))
      )
      .run()
  })
  run()
}

export function logSet(
  workoutId: number,
  exerciseId: string,
  weightKg: number,
  reps: number
): void {
  const existing = db
    .select({ n: count() })
    .from(workoutSets)
    .where(and(eq(workoutSets.workoutId, workoutId), eq(workoutSets.exerciseId, exerciseId)))
    .get()
  db.insert(workoutSets)
    .values({
      workoutId,
      exerciseId,
      setIndex: (existing?.n ?? 0) + 1,
      weightKg,
      reps,
      loggedAt: new Date(),
    })
    .run()
}

export function deleteSet(setId: number): void {
  db.delete(workoutSets).where(eq(workoutSets.id, setId)).run()
}

export function abandonWorkout(workoutId: number): void {
  const run = sqlite.transaction(() => {
    const workout = getWorkout(workoutId)
    if (!workout || workout.status !== 'active') throw new Error('Workout is not active')
    const sets = db
      .select({ n: count() })
      .from(workoutSets)
      .where(eq(workoutSets.workoutId, workoutId))
      .get()
    if ((sets?.n ?? 0) > 0) throw new Error('Workout has logged sets')
    db.delete(workouts).where(eq(workouts.id, workoutId)).run()
  })
  run()
}

export function listWorkouts(limit = 50): Workout[] {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .orderBy(desc(workouts.finishedAt), desc(workouts.id))
    .limit(limit)
    .all()
}

type PerExerciseEntry = Omit<WorkoutSummary['perExercise'][number], 'rank'>

function pickBestSet(
  sets: WorkoutSet[],
  loadType: Exercise['loadType'],
  bodyweightKg: number
): { weightKg: number; reps: number } {
  let best = sets[0]
  let bestValue = -Infinity
  for (const set of sets) {
    const value = setE1rm(set, loadType, bodyweightKg)
    if (value > bestValue) {
      bestValue = value
      best = set
    }
  }
  return { weightKg: best.weightKg, reps: best.reps }
}

// Per exercise session numbers. Only completed workouts other than this one
// (and, when beforeMs is set, finished before it) count toward the baseline
// and the PR comparison. A first ever exercise has no previous best, so this
// session's result IS the all time best and counts as a PR.
function computePerExercise(
  detail: WorkoutDetail,
  bodyweightKg: number,
  beforeMs: number | null
): PerExerciseEntry[] {
  const out: PerExerciseEntry[] = []
  for (const exercise of detail.exercises) {
    const sets = detail.setsByExercise[exercise.id] ?? []
    if (sets.length === 0) continue
    const sessionE1rm = bestSetE1rm(sets, exercise.loadType, bodyweightKg)
    if (sessionE1rm === null) continue
    const history = exerciseHistory(exercise.id).filter(
      (entry) =>
        entry.workoutId !== detail.workout.id &&
        (beforeMs === null || entry.finishedAt < beforeMs)
    )
    const baselineE1rm = rollingBaseline(history.map((entry) => entry.e1rm))
    const ratio = baselineE1rm !== null && baselineE1rm !== 0 ? sessionE1rm / baselineE1rm : null
    let allTimeBest: number | null = null
    for (const entry of history) {
      if (allTimeBest === null || entry.e1rm > allTimeBest) allTimeBest = entry.e1rm
    }
    out.push({
      exercise,
      sessionE1rm,
      baselineE1rm,
      ratio,
      isPr: allTimeBest === null || sessionE1rm > allTimeBest,
      setCount: sets.length,
      bestSet: pickBestSet(sets, exercise.loadType, bodyweightKg),
    })
  }
  return out
}

function withRanks(entries: PerExerciseEntry[]): WorkoutSummary['perExercise'] {
  return entries.map((entry) => ({ ...entry, rank: exerciseRank(entry.exercise.id).rank }))
}

function pickMvp(entries: PerExerciseEntry[]): WorkoutSummary['mvp'] {
  let best: WorkoutSummary['mvp'] = null
  for (const entry of entries) {
    if (entry.ratio === null) continue
    if (best === null || entry.ratio > best.ratio) {
      best = { exerciseId: entry.exercise.id, name: entry.exercise.name, ratio: entry.ratio }
    }
  }
  return best
}

export function finishWorkout(workoutId: number): WorkoutSummary {
  const run = sqlite.transaction((): WorkoutSummary => {
    const detail = getWorkoutDetail(workoutId)
    if (!detail || detail.workout.status !== 'active') throw new Error('Workout is not active')
    const allSets = Object.values(detail.setsByExercise).flat()
    if (allSets.length === 0) throw new Error('Cannot finish a workout with no sets')

    const bodyweightKg = getProfile().bodyweightKg
    const entries = computePerExercise(detail, bodyweightKg, null)
    const score = sessionScore(entries)
    const prCount = entries.filter((entry) => entry.isPr).length
    const playlist = detail.workout.workoutType

    const wasPlacement = isPlacement(getRating(playlist).sessionsPlayed)
    const delta = trainingDelta({ score, prCount, isPlacement: wasPlacement })
    const rating = recordSession(playlist, delta)

    const setCount = allSets.length
    const totalReps = allSets.reduce((sum, set) => sum + set.reps, 0)
    const xpEarned = workoutXp(setCount)
    const xpResult = addXp(xpEarned)

    const questResult = applyQuestEvent({
      kind: 'workout_completed',
      workoutType: playlist,
      setCount,
      totalReps,
      prCount,
    })
    const questsCompleted = questResult.completed.map((quest) => ({
      title: quest.title,
      xpReward: quest.xpReward,
    }))

    // Level transition spans EVERY award from this match (workout XP plus
    // quest rewards), so the label matches the level the player ends at.
    const levelBefore = levelFromXp(xpResult.xpBefore).level
    const levelAfter = levelFromXp(xpResult.xpAfter + questResult.xpAwarded).level
    const levelUp = levelAfter > levelBefore ? { from: levelBefore, to: levelAfter } : null

    db.update(workouts)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        score,
        mmrBefore: rating.mmrBefore,
        mmrAfter: rating.mmrAfter,
        mmrDelta: rating.delta,
        wasPlacement,
        prCount,
        xpEarned,
      })
      .where(eq(workouts.id, workoutId))
      .run()

    const summary: WorkoutSummary = {
      workout: getWorkout(workoutId)!,
      rating,
      score,
      perExercise: withRanks(entries),
      mvp: pickMvp(entries),
      prCount,
      xpEarned,
      levelUp,
      questsCompleted,
    }
    summaryCache.set(workoutId, summary)
    return summary
  })
  return run()
}

// Rebuilds the rating result for a completed workout from its stored row.
// sessionsPlayedAfter is exact: every completed workout of this type records
// exactly one rating session, so counting those finished up to this one
// reproduces the counter as it stood after this workout.
function reconstructRating(workout: Workout): SessionRatingResult {
  const mmrBefore = workout.mmrBefore ?? 0
  const mmrAfter = workout.mmrAfter ?? mmrBefore
  const played =
    db
      .select({ n: count() })
      .from(workouts)
      .where(
        and(
          eq(workouts.workoutType, workout.workoutType),
          eq(workouts.status, 'completed'),
          lte(workouts.finishedAt, workout.finishedAt!)
        )
      )
      .get()?.n ?? 0
  const rankBefore = rankFromMmr(mmrBefore)
  const rankAfter = rankFromMmr(mmrAfter)
  const rankChanged =
    rankBefore.tier !== rankAfter.tier || rankBefore.division !== rankAfter.division
  return {
    mmrBefore,
    mmrAfter,
    delta: workout.mmrDelta ?? mmrAfter - mmrBefore,
    wasPlacement: workout.wasPlacement,
    sessionsPlayedAfter: played,
    placementsRemaining: Math.max(0, PLACEMENT_SESSIONS - played),
    rankBefore,
    rankAfter,
    promoted: !workout.wasPlacement && rankChanged && mmrAfter > mmrBefore,
    demoted: !workout.wasPlacement && rankChanged && mmrAfter < mmrBefore,
    placedNow: workout.wasPlacement && played === PLACEMENT_SESSIONS,
  }
}

// Quests completed by this workout: their completedAt was written moments
// before finishedAt inside the finishWorkout transaction.
function questsCompletedNear(workout: Workout): { title: string; xpReward: number }[] {
  if (!workout.finishedAt) return []
  const windowStart = new Date(workout.finishedAt.getTime() - 10_000)
  return db
    .select({ title: questTemplates.title, xpReward: dailyQuests.xpReward })
    .from(dailyQuests)
    .innerJoin(questTemplates, eq(dailyQuests.templateId, questTemplates.id))
    .where(
      and(gte(dailyQuests.completedAt, windowStart), lte(dailyQuests.completedAt, workout.finishedAt))
    )
    .all()
}

export function getWorkoutSummary(workoutId: number): WorkoutSummary {
  const cached = summaryCache.get(workoutId)
  if (cached) return cached
  const detail = getWorkoutDetail(workoutId)
  const finishedAt = detail?.workout.finishedAt
  if (!detail || detail.workout.status !== 'completed' || !finishedAt) {
    throw new Error('Workout is not completed')
  }
  const workout = detail.workout
  const bodyweightKg = getProfile().bodyweightKg
  const entries = computePerExercise(detail, bodyweightKg, finishedAt.getTime())
  return {
    workout,
    rating: reconstructRating(workout),
    score: workout.score ?? sessionScore(entries),
    perExercise: withRanks(entries),
    mvp: pickMvp(entries),
    prCount: workout.prCount,
    xpEarned: workout.xpEarned,
    levelUp: null,
    questsCompleted: questsCompletedNear(workout),
  }
}
