import { describe, expect, it } from 'vitest'
import {
  BAND_SIZE,
  DIVISION_SIZE,
  PLACEMENT_SESSIONS,
  PLACEMENT_START_MMR,
  applyDelta,
  fastingDelta,
  isPlacement,
  placementsRemaining,
  rankFromMmr,
  rollingBaseline,
  sessionScore,
  trainingDelta,
} from './mmr'

describe('constants', () => {
  it('match the contract', () => {
    expect(BAND_SIZE).toBe(300)
    expect(DIVISION_SIZE).toBe(100)
    expect(PLACEMENT_START_MMR).toBe(500)
    expect(PLACEMENT_SESSIONS).toBe(3)
  })
})

describe('rankFromMmr', () => {
  it('maps the mandatory boundary values', () => {
    expect(rankFromMmr(0).label).toBe('Bronze III')
    expect(rankFromMmr(99).label).toBe('Bronze III')
    expect(rankFromMmr(100).label).toBe('Bronze II')
    expect(rankFromMmr(299).label).toBe('Bronze I')
    expect(rankFromMmr(300).label).toBe('Silver III')
    expect(rankFromMmr(600).label).toBe('Gold III')
    expect(rankFromMmr(900).label).toBe('Platinum III')
    expect(rankFromMmr(1200).label).toBe('Diamond III')
    expect(rankFromMmr(1499).label).toBe('Diamond I')
    expect(rankFromMmr(1500).label).toBe('Emerald III')
    expect(rankFromMmr(1700).label).toBe('Emerald I')
    expect(rankFromMmr(5000).label).toBe('Emerald I')
  })

  it('clamps negative MMR to Bronze III', () => {
    const rank = rankFromMmr(-50)
    expect(rank.label).toBe('Bronze III')
    expect(rank.progress).toBe(0)
  })

  it('never returns a null tier', () => {
    for (const mmr of [-100, 0, 450, 1234, 9999]) {
      expect(rankFromMmr(mmr).tier).not.toBeNull()
    }
  })

  it('reports progress through the current division', () => {
    expect(rankFromMmr(0).progress).toBe(0)
    expect(rankFromMmr(50).progress).toBeCloseTo(0.5, 6)
    expect(rankFromMmr(99).progress).toBeCloseTo(0.99, 6)
    expect(rankFromMmr(150).progress).toBeCloseTo(0.5, 6)
  })

  it('caps emerald progress at 1 from 1800 upward', () => {
    expect(rankFromMmr(1750).progress).toBeCloseTo(0.5, 6)
    expect(rankFromMmr(1800).progress).toBe(1)
    expect(rankFromMmr(5000).progress).toBe(1)
  })
})

describe('rollingBaseline', () => {
  it('returns null for an empty array', () => {
    expect(rollingBaseline([])).toBeNull()
  })

  it('returns the single entry for a length 1 array', () => {
    expect(rollingBaseline([100])).toBe(100)
  })

  it('averages two entries', () => {
    expect(rollingBaseline([100, 110])).toBe(105)
  })

  it('averages only the last three of five entries', () => {
    expect(rollingBaseline([1, 2, 3, 4, 5])).toBe(4)
  })
})

describe('sessionScore', () => {
  it('skips null and zero baselines', () => {
    const score = sessionScore([
      { sessionE1rm: 110, baselineE1rm: 100 },
      { sessionE1rm: 50, baselineE1rm: null },
      { sessionE1rm: 80, baselineE1rm: 0 },
    ])
    expect(score).toBeCloseTo(1.1, 6)
  })

  it('returns exactly 1.0 when every baseline is null', () => {
    const score = sessionScore([
      { sessionE1rm: 100, baselineE1rm: null },
      { sessionE1rm: 90, baselineE1rm: null },
    ])
    expect(score).toBe(1.0)
  })

  it('returns 1.0 for an empty entry list', () => {
    expect(sessionScore([])).toBe(1.0)
  })

  it('averages the qualifying ratios', () => {
    const score = sessionScore([
      { sessionE1rm: 110, baselineE1rm: 100 },
      { sessionE1rm: 90, baselineE1rm: 100 },
    ])
    expect(score).toBeCloseTo(1.0, 6)
  })
})

describe('trainingDelta', () => {
  it('clamps a huge score to +25', () => {
    expect(trainingDelta({ score: 2.0, prCount: 0, isPlacement: false })).toBe(25)
  })

  it('clamps a terrible score to -25', () => {
    expect(trainingDelta({ score: 0.0, prCount: 0, isPlacement: false })).toBe(-25)
  })

  it('a neutral score gives 0', () => {
    expect(trainingDelta({ score: 1.0, prCount: 0, isPlacement: false })).toBe(0)
  })

  it('scales small score changes by 400', () => {
    expect(trainingDelta({ score: 1.01, prCount: 0, isPlacement: false })).toBe(4)
    expect(trainingDelta({ score: 0.99, prCount: 0, isPlacement: false })).toBe(-4)
  })

  it('adds PR bonus after the clamp, capped at 10', () => {
    expect(trainingDelta({ score: 1.0, prCount: 1, isPlacement: false })).toBe(5)
    expect(trainingDelta({ score: 1.0, prCount: 2, isPlacement: false })).toBe(10)
    expect(trainingDelta({ score: 1.0, prCount: 5, isPlacement: false })).toBe(10)
    expect(trainingDelta({ score: 2.0, prCount: 2, isPlacement: false })).toBe(35)
  })

  it('doubles during placements: score 2.0 with 2 PRs gives 70', () => {
    expect(trainingDelta({ score: 2.0, prCount: 2, isPlacement: true })).toBe(70)
  })
})

describe('fastingDelta', () => {
  it('completed gives +15, ended early gives -10', () => {
    expect(fastingDelta('completed', false)).toBe(15)
    expect(fastingDelta('ended_early', false)).toBe(-10)
  })

  it('doubles during placements', () => {
    expect(fastingDelta('completed', true)).toBe(30)
    expect(fastingDelta('ended_early', true)).toBe(-20)
  })
})

describe('applyDelta', () => {
  it('adds the delta', () => {
    expect(applyDelta(500, 25)).toBe(525)
    expect(applyDelta(500, -25)).toBe(475)
  })

  it('floors at 0', () => {
    expect(applyDelta(5, -10)).toBe(0)
    expect(applyDelta(0, -1)).toBe(0)
  })
})

describe('isPlacement / placementsRemaining', () => {
  it('covers 0 through 4 sessions played', () => {
    expect(isPlacement(0)).toBe(true)
    expect(isPlacement(1)).toBe(true)
    expect(isPlacement(2)).toBe(true)
    expect(isPlacement(3)).toBe(false)
    expect(isPlacement(4)).toBe(false)
    expect(placementsRemaining(0)).toBe(3)
    expect(placementsRemaining(1)).toBe(2)
    expect(placementsRemaining(2)).toBe(1)
    expect(placementsRemaining(3)).toBe(0)
    expect(placementsRemaining(4)).toBe(0)
  })
})
