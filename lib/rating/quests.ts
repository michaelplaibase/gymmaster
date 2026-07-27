export type QuestMetric =
  | 'complete_push'
  | 'complete_pull'
  | 'complete_legs'
  | 'complete_any_session'
  | 'hit_pr'
  | 'complete_fast'
  | 'log_sets'
  | 'total_reps'

// FNV-1a 32 bit string hash.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

// Small deterministic PRNG (mulberry32) seeded from the date hash.
function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic: the same dateIso and template list always give the same picks.
export function pickDailyQuestIds(dateIso: string, templateIds: string[], count = 3): string[] {
  const pool = [...new Set(templateIds)]
  if (pool.length <= count) return pool
  const next = mulberry32(fnv1a(dateIso))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    const swap = pool[i]
    pool[i] = pool[j]
    pool[j] = swap
  }
  return pool.slice(0, count)
}

export type QuestEvent =
  | {
      kind: 'workout_completed'
      workoutType: 'push' | 'pull' | 'legs'
      setCount: number
      totalReps: number
      prCount: number
    }
  | { kind: 'fast_completed' }

// How much this event advances a quest with the given metric.
export function questProgressDelta(metric: QuestMetric, event: QuestEvent): number {
  if (event.kind === 'fast_completed') {
    return metric === 'complete_fast' || metric === 'complete_any_session' ? 1 : 0
  }
  switch (metric) {
    case 'complete_push':
      return event.workoutType === 'push' ? 1 : 0
    case 'complete_pull':
      return event.workoutType === 'pull' ? 1 : 0
    case 'complete_legs':
      return event.workoutType === 'legs' ? 1 : 0
    case 'complete_any_session':
      return 1
    case 'hit_pr':
      return event.prCount
    case 'complete_fast':
      return 0
    case 'log_sets':
      return event.setCount
    case 'total_reps':
      return event.totalReps
  }
}
