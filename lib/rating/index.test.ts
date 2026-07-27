import { describe, expect, it } from 'vitest'
import * as rating from './index'

describe('barrel', () => {
  it('re-exports every module surface', () => {
    // types
    expect(rating.TIERS).toHaveLength(6)
    expect(rating.DIVISION_LABEL[1]).toBe('I')
    expect(typeof rating.tierLabel).toBe('function')
    // e1rm
    expect(typeof rating.e1rm).toBe('function')
    expect(typeof rating.setLoad).toBe('function')
    expect(typeof rating.setE1rm).toBe('function')
    expect(typeof rating.bestSetE1rm).toBe('function')
    // exerciseRank
    expect(typeof rating.strengthRatio).toBe('function')
    expect(typeof rating.rankFromRatio).toBe('function')
    expect(typeof rating.repsForRatio).toBe('function')
    // mmr
    expect(rating.BAND_SIZE).toBe(300)
    expect(rating.DIVISION_SIZE).toBe(100)
    expect(rating.PLACEMENT_START_MMR).toBe(500)
    expect(rating.PLACEMENT_SESSIONS).toBe(3)
    expect(typeof rating.rankFromMmr).toBe('function')
    expect(typeof rating.rollingBaseline).toBe('function')
    expect(typeof rating.sessionScore).toBe('function')
    expect(typeof rating.trainingDelta).toBe('function')
    expect(typeof rating.fastingDelta).toBe('function')
    expect(typeof rating.applyDelta).toBe('function')
    expect(typeof rating.isPlacement).toBe('function')
    expect(typeof rating.placementsRemaining).toBe('function')
    // xp
    expect(rating.XP_PER_SET).toBe(10)
    expect(rating.XP_PER_WORKOUT).toBe(100)
    expect(rating.XP_PER_FAST).toBe(75)
    expect(typeof rating.streakBonusXp).toBe('function')
    expect(typeof rating.xpToCompleteLevel).toBe('function')
    expect(typeof rating.levelFromXp).toBe('function')
    expect(typeof rating.workoutXp).toBe('function')
    expect(typeof rating.fastXp).toBe('function')
    // quests
    expect(typeof rating.pickDailyQuestIds).toBe('function')
    expect(typeof rating.questProgressDelta).toBe('function')
  })
})
