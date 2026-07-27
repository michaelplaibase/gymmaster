export const XP_PER_SET = 10
export const XP_PER_WORKOUT = 100
export const XP_PER_FAST = 75

// 10 XP per consecutive completed fast, capped at 100.
export function streakBonusXp(streak: number): number {
  return Math.min(10 * Math.max(0, streak), 100)
}

// Clearing level N costs 100 * N XP.
export function xpToCompleteLevel(level: number): number {
  return 100 * level
}

export function levelFromXp(totalXp: number): {
  level: number
  intoLevel: number
  levelSpan: number
  toNext: number
  progress: number
} {
  let level = 1
  let remaining = Math.max(0, totalXp)
  while (remaining >= xpToCompleteLevel(level)) {
    remaining -= xpToCompleteLevel(level)
    level++
  }
  const levelSpan = xpToCompleteLevel(level)
  return {
    level,
    intoLevel: remaining,
    levelSpan,
    toNext: levelSpan - remaining,
    progress: remaining / levelSpan,
  }
}

export function workoutXp(setCount: number): number {
  return XP_PER_WORKOUT + setCount * XP_PER_SET
}

export function fastXp(streakAfter: number): number {
  return XP_PER_FAST + streakBonusXp(streakAfter)
}
