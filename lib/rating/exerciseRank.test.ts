import { describe, expect, it } from 'vitest'
import { rankFromRatio, repsForRatio, strengthRatio } from './exerciseRank'

// Bench male ladder used throughout these tests.
const BENCH_MALE = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75]

describe('strengthRatio', () => {
  it('divides e1RM by bodyweight', () => {
    expect(strengthRatio(106.6666667, 80)).toBeCloseTo(1.3333, 4)
    expect(strengthRatio(100, 80)).toBe(1.25)
  })
})

describe('rankFromRatio', () => {
  it('0.49 is Unranked with progress toward bronze', () => {
    const rank = rankFromRatio(0.49, BENCH_MALE)
    expect(rank.tier).toBeNull()
    expect(rank.division).toBeNull()
    expect(rank.label).toBe('Unranked')
    expect(rank.progress).toBeCloseTo(0.98, 6)
  })

  it('0 ratio is Unranked with 0 progress', () => {
    const rank = rankFromRatio(0, BENCH_MALE)
    expect(rank.label).toBe('Unranked')
    expect(rank.progress).toBe(0)
  })

  it('exact thresholds land on division III with progress 0', () => {
    for (const [ratio, label] of [
      [0.5, 'Bronze III'],
      [0.75, 'Silver III'],
      [1.0, 'Gold III'],
      [1.25, 'Platinum III'],
      [1.5, 'Diamond III'],
      [1.75, 'Emerald III'],
    ] as const) {
      const rank = rankFromRatio(ratio, BENCH_MALE)
      expect(rank.label).toBe(label)
      expect(rank.division).toBe(3)
      expect(rank.progress).toBeCloseTo(0, 6)
    }
  })

  it('splits a tier into three equal divisions, III lowest', () => {
    // Bronze spans [0.50, 0.75): III [0.50, 0.5833), II [0.5833, 0.6667), I [0.6667, 0.75).
    expect(rankFromRatio(0.55, BENCH_MALE).label).toBe('Bronze III')
    expect(rankFromRatio(0.6, BENCH_MALE).label).toBe('Bronze II')
    expect(rankFromRatio(0.7, BENCH_MALE).label).toBe('Bronze I')
  })

  it('0.6667 sits at the Bronze II boundary: just below is II, at 0.6667 it tips to I', () => {
    const below = rankFromRatio(0.6666, BENCH_MALE)
    expect(below.label).toBe('Bronze II')
    expect(below.progress).toBeGreaterThan(0.99)
    const at = rankFromRatio(0.6667, BENCH_MALE)
    expect(at.label).toBe('Bronze I')
    expect(at.progress).toBeLessThan(0.01)
  })

  it('reports progress through the current division', () => {
    // 0.625 is halfway through Bronze II ([0.5833, 0.6667)).
    const rank = rankFromRatio(0.625, BENCH_MALE)
    expect(rank.label).toBe('Bronze II')
    expect(rank.progress).toBeCloseTo(0.5, 6)
  })

  it('emerald uses a synthetic span equal to the diamond span', () => {
    // Span is 0.25, so Emerald III at 1.75, II at 1.8333, I at 1.9167.
    expect(rankFromRatio(1.8, BENCH_MALE).label).toBe('Emerald III')
    expect(rankFromRatio(1.84, BENCH_MALE).label).toBe('Emerald II')
    expect(rankFromRatio(1.92, BENCH_MALE).label).toBe('Emerald I')
  })

  it('exact division boundaries land in the higher division despite float error', () => {
    // QA case 1: 80 kg e1RM at 60 kg bodyweight is ratio 1.3333..., exactly one
    // third into Platinum [1.25, 1.5), so Platinum II (was Platinum III).
    const platinum = rankFromRatio(strengthRatio(80, 60), BENCH_MALE)
    expect(platinum.label).toBe('Platinum II')
    expect(platinum.division).toBe(2)
    expect(platinum.progress).toBeCloseTo(0, 6)
    // QA case 2: 80 kg e1RM at 120 kg bodyweight is ratio 0.6666..., exactly two
    // thirds into Bronze [0.5, 0.75), so Bronze I (was Bronze II).
    const bronze = rankFromRatio(strengthRatio(80, 120), BENCH_MALE)
    expect(bronze.label).toBe('Bronze I')
    expect(bronze.division).toBe(1)
    expect(bronze.progress).toBeCloseTo(0, 6)
  })

  it('general rule: one third and two thirds of a tier are II and I entry points', () => {
    // Gold spans [1.0, 1.25): thirds at 1.0 + 0.25 / 3 and 1.0 + 0.5 / 3.
    const oneThird = rankFromRatio(1.0 + 0.25 / 3, BENCH_MALE)
    expect(oneThird.label).toBe('Gold II')
    expect(oneThird.progress).toBeCloseTo(0, 6)
    const twoThirds = rankFromRatio(1.0 + 0.5 / 3, BENCH_MALE)
    expect(twoThirds.label).toBe('Gold I')
    expect(twoThirds.progress).toBeCloseTo(0, 6)
  })

  it('2.00 (entry plus one full span) is Emerald I with progress 1', () => {
    const rank = rankFromRatio(2.0, BENCH_MALE)
    expect(rank.label).toBe('Emerald I')
    expect(rank.division).toBe(1)
    expect(rank.progress).toBe(1)
  })

  it('5.0 is still Emerald I with progress 1', () => {
    const rank = rankFromRatio(5.0, BENCH_MALE)
    expect(rank.label).toBe('Emerald I')
    expect(rank.progress).toBe(1)
  })
})

describe('repsForRatio', () => {
  it('inverts the bodyweight e1RM at zero added weight', () => {
    // ratio 1.3333 corresponds to about 10 bodyweight reps.
    expect(repsForRatio(1.3333)).toBe(10)
    expect(repsForRatio(2)).toBe(30)
  })

  it('rounds to the nearest whole rep', () => {
    expect(repsForRatio(1.5)).toBe(15)
    expect(repsForRatio(1.51)).toBe(15)
    expect(repsForRatio(1.55)).toBe(17)
  })

  it('floors at 1 rep for any ratio at or above 1.0 (0 reps cannot produce an e1RM)', () => {
    expect(repsForRatio(1)).toBe(1)
    expect(repsForRatio(1.01)).toBe(1)
    expect(repsForRatio(1.0167)).toBe(1)
  })

  it('returns 0 reps only below ratio 1.0', () => {
    expect(repsForRatio(0.5)).toBe(0)
    expect(repsForRatio(0.99)).toBe(0)
  })
})
