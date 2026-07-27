import { notFound, redirect } from 'next/navigation'
import { listExercises } from '@/lib/data/exercises'
import { getProfile } from '@/lib/data/profile'
import { getWorkoutDetail } from '@/lib/data/workouts'
import { ActiveWorkout } from './ActiveWorkout'

export const dynamic = 'force-dynamic'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workoutId = Number(id)
  if (!Number.isInteger(workoutId)) notFound()
  const detail = getWorkoutDetail(workoutId)
  if (!detail) notFound()
  if (detail.workout.status === 'completed') redirect(`/train/${workoutId}/summary`)

  const profile = getProfile()
  const sets = Object.values(detail.setsByExercise)
    .flat()
    .sort((a, b) => a.id - b.id)

  return (
    <ActiveWorkout
      workoutId={workoutId}
      workoutType={detail.workout.workoutType}
      startedAtMs={detail.workout.startedAt.getTime()}
      defaultRestSec={profile.defaultRestSec}
      exercises={detail.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        loadType: exercise.loadType,
      }))}
      sets={sets.map((set) => ({
        id: set.id,
        exerciseId: set.exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
      }))}
      pool={listExercises(detail.workout.workoutType).map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
      }))}
    />
  )
}
