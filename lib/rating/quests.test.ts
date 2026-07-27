import { describe, expect, it } from 'vitest'
import { pickDailyQuestIds, questProgressDelta, type QuestEvent, type QuestMetric } from './quests'

const POOL = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']

describe('pickDailyQuestIds', () => {
  it('is deterministic across repeated calls', () => {
    const first = pickDailyQuestIds('2026-07-27', POOL)
    for (let i = 0; i < 5; i++) {
      expect(pickDailyQuestIds('2026-07-27', POOL)).toEqual(first)
    }
  })

  it('returns 3 distinct ids from the pool by default', () => {
    const picks = pickDailyQuestIds('2026-07-27', POOL)
    expect(picks).toHaveLength(3)
    expect(new Set(picks).size).toBe(3)
    for (const id of picks) {
      expect(POOL).toContain(id)
    }
  })

  it('respects an explicit count', () => {
    const picks = pickDailyQuestIds('2026-07-27', POOL, 5)
    expect(picks).toHaveLength(5)
    expect(new Set(picks).size).toBe(5)
  })

  it('different dates generally give different selections', () => {
    const dates = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31']
    const selections = new Set(dates.map((date) => JSON.stringify(pickDailyQuestIds(date, POOL))))
    expect(selections.size).toBeGreaterThanOrEqual(2)
  })

  it('returns the whole pool when it is not larger than count', () => {
    expect(pickDailyQuestIds('2026-07-27', ['a', 'b'])).toEqual(['a', 'b'])
    expect(pickDailyQuestIds('2026-07-27', ['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('never returns duplicates even if the template list has them', () => {
    const picks = pickDailyQuestIds('2026-07-27', ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd'])
    expect(new Set(picks).size).toBe(picks.length)
  })
})

describe('questProgressDelta', () => {
  const pushWorkout: QuestEvent = {
    kind: 'workout_completed',
    workoutType: 'push',
    setCount: 12,
    totalReps: 140,
    prCount: 1,
  }
  const pullWorkout: QuestEvent = {
    kind: 'workout_completed',
    workoutType: 'pull',
    setCount: 9,
    totalReps: 80,
    prCount: 0,
  }
  const legsWorkout: QuestEvent = {
    kind: 'workout_completed',
    workoutType: 'legs',
    setCount: 15,
    totalReps: 120,
    prCount: 2,
  }
  const fast: QuestEvent = { kind: 'fast_completed' }

  it('advances the right metrics for a push workout', () => {
    expect(questProgressDelta('complete_push', pushWorkout)).toBe(1)
    expect(questProgressDelta('complete_pull', pushWorkout)).toBe(0)
    expect(questProgressDelta('complete_legs', pushWorkout)).toBe(0)
    expect(questProgressDelta('complete_any_session', pushWorkout)).toBe(1)
    expect(questProgressDelta('hit_pr', pushWorkout)).toBe(1)
    expect(questProgressDelta('complete_fast', pushWorkout)).toBe(0)
    expect(questProgressDelta('log_sets', pushWorkout)).toBe(12)
    expect(questProgressDelta('total_reps', pushWorkout)).toBe(140)
  })

  it('advances the right metrics for a pull workout with no PRs', () => {
    expect(questProgressDelta('complete_push', pullWorkout)).toBe(0)
    expect(questProgressDelta('complete_pull', pullWorkout)).toBe(1)
    expect(questProgressDelta('complete_legs', pullWorkout)).toBe(0)
    expect(questProgressDelta('complete_any_session', pullWorkout)).toBe(1)
    expect(questProgressDelta('hit_pr', pullWorkout)).toBe(0)
    expect(questProgressDelta('complete_fast', pullWorkout)).toBe(0)
    expect(questProgressDelta('log_sets', pullWorkout)).toBe(9)
    expect(questProgressDelta('total_reps', pullWorkout)).toBe(80)
  })

  it('advances the right metrics for a legs workout with multiple PRs', () => {
    expect(questProgressDelta('complete_push', legsWorkout)).toBe(0)
    expect(questProgressDelta('complete_pull', legsWorkout)).toBe(0)
    expect(questProgressDelta('complete_legs', legsWorkout)).toBe(1)
    expect(questProgressDelta('complete_any_session', legsWorkout)).toBe(1)
    expect(questProgressDelta('hit_pr', legsWorkout)).toBe(2)
    expect(questProgressDelta('complete_fast', legsWorkout)).toBe(0)
    expect(questProgressDelta('log_sets', legsWorkout)).toBe(15)
    expect(questProgressDelta('total_reps', legsWorkout)).toBe(120)
  })

  it('a completed fast advances only complete_fast and complete_any_session', () => {
    const expected: Record<QuestMetric, number> = {
      complete_push: 0,
      complete_pull: 0,
      complete_legs: 0,
      complete_any_session: 1,
      hit_pr: 0,
      complete_fast: 1,
      log_sets: 0,
      total_reps: 0,
    }
    for (const [metric, value] of Object.entries(expected) as [QuestMetric, number][]) {
      expect(questProgressDelta(metric, fast)).toBe(value)
    }
  })
})
