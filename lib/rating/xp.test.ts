import { describe, expect, it } from 'vitest'
import {
  XP_PER_FAST,
  XP_PER_SET,
  XP_PER_WORKOUT,
  fastXp,
  levelFromXp,
  streakBonusXp,
  workoutXp,
  xpToCompleteLevel,
} from './xp'

describe('constants', () => {
  it('match the contract', () => {
    expect(XP_PER_SET).toBe(10)
    expect(XP_PER_WORKOUT).toBe(100)
    expect(XP_PER_FAST).toBe(75)
  })
})

describe('streakBonusXp', () => {
  it('gives 10 per consecutive completed fast', () => {
    expect(streakBonusXp(0)).toBe(0)
    expect(streakBonusXp(1)).toBe(10)
    expect(streakBonusXp(5)).toBe(50)
  })

  it('caps at 100', () => {
    expect(streakBonusXp(10)).toBe(100)
    expect(streakBonusXp(25)).toBe(100)
  })
})

describe('xpToCompleteLevel', () => {
  it('costs 100 per level number', () => {
    expect(xpToCompleteLevel(1)).toBe(100)
    expect(xpToCompleteLevel(2)).toBe(200)
    expect(xpToCompleteLevel(10)).toBe(1000)
  })
})

describe('levelFromXp', () => {
  it('0 XP is level 1 with 0 progress', () => {
    expect(levelFromXp(0)).toEqual({
      level: 1,
      intoLevel: 0,
      levelSpan: 100,
      toNext: 100,
      progress: 0,
    })
  })

  it('99 XP is still level 1', () => {
    const state = levelFromXp(99)
    expect(state.level).toBe(1)
    expect(state.intoLevel).toBe(99)
    expect(state.toNext).toBe(1)
    expect(state.progress).toBeCloseTo(0.99, 6)
  })

  it('100 XP clears level 1: level 2 with intoLevel 0', () => {
    const state = levelFromXp(100)
    expect(state.level).toBe(2)
    expect(state.intoLevel).toBe(0)
    expect(state.levelSpan).toBe(200)
  })

  it('299 XP is level 2 (level 2 clears at 300 total)', () => {
    const state = levelFromXp(299)
    expect(state.level).toBe(2)
    expect(state.intoLevel).toBe(199)
    expect(state.toNext).toBe(1)
  })

  it('300 XP is level 3', () => {
    const state = levelFromXp(300)
    expect(state.level).toBe(3)
    expect(state.intoLevel).toBe(0)
    expect(state.levelSpan).toBe(300)
  })

  it('walks consistently with xpToCompleteLevel across the first 10 levels', () => {
    let cumulative = 0
    for (let level = 1; level <= 10; level++) {
      // At the exact start of a level, intoLevel is 0.
      const atStart = levelFromXp(cumulative)
      expect(atStart.level).toBe(level)
      expect(atStart.intoLevel).toBe(0)
      expect(atStart.levelSpan).toBe(xpToCompleteLevel(level))
      // One XP short of clearing it, we are still on the same level.
      const nearEnd = levelFromXp(cumulative + xpToCompleteLevel(level) - 1)
      expect(nearEnd.level).toBe(level)
      expect(nearEnd.toNext).toBe(1)
      cumulative += xpToCompleteLevel(level)
    }
  })
})

describe('workoutXp', () => {
  it('adds set XP on top of the workout base', () => {
    expect(workoutXp(0)).toBe(100)
    expect(workoutXp(12)).toBe(220)
  })
})

describe('fastXp', () => {
  it('adds the streak bonus on top of the fast base', () => {
    expect(fastXp(1)).toBe(85)
    expect(fastXp(3)).toBe(105)
    expect(fastXp(12)).toBe(175)
  })
})
