import type { LoadType } from './types'

// Epley estimated one rep max: weight * (1 + reps / 30).
// A single rep is the lift itself, so reps <= 1 returns the weight exactly.
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg
  return weightKg * (1 + reps / 30)
}

// For bodyweight movements, weightKg is ADDED weight (may be 0).
export function setLoad(weightKg: number, loadType: LoadType, bodyweightKg: number): number {
  return loadType === 'external' ? weightKg : bodyweightKg + weightKg
}

export function setE1rm(
  set: { weightKg: number; reps: number },
  loadType: LoadType,
  bodyweightKg: number
): number {
  return e1rm(setLoad(set.weightKg, loadType, bodyweightKg), set.reps)
}

export function bestSetE1rm(
  sets: { weightKg: number; reps: number }[],
  loadType: LoadType,
  bodyweightKg: number
): number | null {
  if (sets.length === 0) return null
  let best = -Infinity
  for (const set of sets) {
    const value = setE1rm(set, loadType, bodyweightKg)
    if (value > best) best = value
  }
  return best
}
