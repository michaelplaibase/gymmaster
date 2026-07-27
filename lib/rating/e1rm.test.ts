import { describe, expect, it } from 'vitest'
import { bestSetE1rm, e1rm, setE1rm, setLoad } from './e1rm'

describe('e1rm', () => {
  it('returns the weight exactly for a single rep', () => {
    expect(e1rm(100, 1)).toBe(100)
  })

  it('applies Epley for multiple reps: 100kg x 10 is 133.333...', () => {
    expect(e1rm(100, 10)).toBeCloseTo(133.3333333, 6)
  })

  it('returns the raw float without rounding', () => {
    expect(e1rm(100, 7)).toBe(100 * (1 + 7 / 30))
  })

  it('handles reps below 1 sanely by returning the weight', () => {
    expect(e1rm(100, 0)).toBe(100)
    expect(e1rm(100, -3)).toBe(100)
    expect(e1rm(100, 0.5)).toBe(100)
  })
})

describe('setLoad', () => {
  it('external returns the weight as is', () => {
    expect(setLoad(100, 'external', 80)).toBe(100)
    expect(setLoad(0, 'external', 80)).toBe(0)
  })

  it('bodyweight adds bodyweight to the added weight', () => {
    expect(setLoad(0, 'bodyweight', 80)).toBe(80)
    expect(setLoad(20, 'bodyweight', 80)).toBe(100)
  })
})

describe('setE1rm', () => {
  it('bodyweight 80kg, 0 added, 10 reps gives 106.666...', () => {
    expect(setE1rm({ weightKg: 0, reps: 10 }, 'bodyweight', 80)).toBeCloseTo(106.6666667, 6)
  })

  it('external ignores bodyweight', () => {
    expect(setE1rm({ weightKg: 100, reps: 1 }, 'external', 80)).toBe(100)
  })
})

describe('bestSetE1rm', () => {
  it('returns null for an empty array', () => {
    expect(bestSetE1rm([], 'external', 80)).toBeNull()
  })

  it('picks the true best e1RM even when the heaviest weight is not the best', () => {
    // 100 x 1 gives 100, but 90 x 5 gives 90 * (1 + 5/30) = 105.
    const best = bestSetE1rm(
      [
        { weightKg: 100, reps: 1 },
        { weightKg: 90, reps: 5 },
      ],
      'external',
      80
    )
    expect(best).toBeCloseTo(105, 6)
  })

  it('returns the only entry for a single set', () => {
    expect(bestSetE1rm([{ weightKg: 60, reps: 1 }], 'external', 80)).toBe(60)
  })
})
