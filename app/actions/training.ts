'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { WorkoutType } from '@/db/schema'
import {
  abandonWorkout,
  addExerciseToWorkout,
  deleteSet,
  finishWorkout,
  getWorkout,
  logSet,
  removeExerciseFromWorkout,
  startWorkout,
} from '@/lib/data/workouts'

export async function startMatchAction(type: WorkoutType): Promise<void> {
  const id = startWorkout(type)
  revalidatePath('/train')
  redirect(`/train/${id}`)
}

export async function logSetAction(
  workoutId: number,
  exerciseId: string,
  weightKg: number,
  reps: number
): Promise<void> {
  if (!Number.isFinite(weightKg) || weightKg < 0) throw new Error('Invalid weight')
  if (!Number.isInteger(reps) || reps < 1) throw new Error('Invalid reps')
  logSet(workoutId, exerciseId, weightKg, reps)
  revalidatePath(`/train/${workoutId}`)
}

export async function deleteSetAction(workoutId: number, setId: number): Promise<void> {
  deleteSet(setId)
  revalidatePath(`/train/${workoutId}`)
}

export async function addExerciseAction(workoutId: number, exerciseId: string): Promise<void> {
  addExerciseToWorkout(workoutId, exerciseId)
  revalidatePath(`/train/${workoutId}`)
}

export async function removeExerciseAction(workoutId: number, exerciseId: string): Promise<void> {
  removeExerciseFromWorkout(workoutId, exerciseId)
  revalidatePath(`/train/${workoutId}`)
}

export async function finishMatchAction(workoutId: number): Promise<void> {
  // A double submitted finish re posts after the first call already completed
  // the workout. Redirect to its summary instead of letting finishWorkout
  // throw 'Workout is not active'.
  if (getWorkout(workoutId)?.status !== 'completed') {
    finishWorkout(workoutId)
    revalidatePath('/train')
    revalidatePath(`/train/${workoutId}`)
  }
  redirect(`/train/${workoutId}/summary`)
}

export async function abandonMatchAction(workoutId: number): Promise<void> {
  const workout = getWorkout(workoutId)
  // A double submitted abandon re posts after the row is gone (or a finish
  // landed first and completed it). Redirect instead of throwing.
  if (workout?.status === 'completed') redirect(`/train/${workoutId}/summary`)
  if (workout) {
    abandonWorkout(workoutId)
    revalidatePath('/train')
  }
  redirect('/train')
}
