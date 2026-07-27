import { describe, expect, it } from 'vitest'
import { DIVISION_LABEL, TIERS, tierLabel } from './types'

describe('TIERS', () => {
  it('lists all six tiers ascending from bronze to emerald', () => {
    expect(TIERS).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald'])
  })
})

describe('DIVISION_LABEL', () => {
  it('maps 1 to I, 2 to II, 3 to III', () => {
    expect(DIVISION_LABEL[1]).toBe('I')
    expect(DIVISION_LABEL[2]).toBe('II')
    expect(DIVISION_LABEL[3]).toBe('III')
  })
})

describe('tierLabel', () => {
  it('capitalises tier names', () => {
    expect(tierLabel('bronze')).toBe('Bronze')
    expect(tierLabel('gold')).toBe('Gold')
    expect(tierLabel('emerald')).toBe('Emerald')
  })
})
