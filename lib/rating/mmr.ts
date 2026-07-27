import { DIVISION_LABEL, TIERS, tierLabel, type Division, type Rank } from './types'

export const BAND_SIZE = 300 // one tier is 300 MMR
export const DIVISION_SIZE = 100 // 100 MMR per division
export const PLACEMENT_START_MMR = 500
export const PLACEMENT_SESSIONS = 3

// Bands: bronze 0-299, silver 300-599, gold 600-899, platinum 900-1199,
// diamond 1200-1499, emerald 1500+. Lowest division first within a band.
export function rankFromMmr(mmr: number): Rank {
  const value = Math.max(0, mmr)
  const bandIndex = Math.min(Math.floor(value / BAND_SIZE), TIERS.length - 1)
  const tier = TIERS[bandIndex]
  const intoBand = value - bandIndex * BAND_SIZE
  const divisionIndex = Math.min(Math.floor(intoBand / DIVISION_SIZE), 2)
  const division = (3 - divisionIndex) as Division
  const intoDivision = intoBand - divisionIndex * DIVISION_SIZE
  return {
    tier,
    division,
    label: `${tierLabel(tier)} ${DIVISION_LABEL[division]}`,
    progress: Math.min(1, intoDivision / DIVISION_SIZE),
  }
}

// Mean of the last up to 3 entries (array is ordered oldest first).
export function rollingBaseline(previousE1rms: number[]): number | null {
  if (previousE1rms.length === 0) return null
  const recent = previousE1rms.slice(-3)
  return recent.reduce((sum, value) => sum + value, 0) / recent.length
}

// Mean of (sessionE1rm / baselineE1rm) across entries with a usable baseline.
// A first ever session has no usable baselines and scores a neutral 1.0.
export function sessionScore(
  entries: { sessionE1rm: number; baselineE1rm: number | null }[]
): number {
  let sum = 0
  let counted = 0
  for (const entry of entries) {
    if (entry.baselineE1rm !== null && entry.baselineE1rm !== 0) {
      sum += entry.sessionE1rm / entry.baselineE1rm
      counted++
    }
  }
  return counted === 0 ? 1.0 : sum / counted
}

export function trainingDelta(args: { score: number; prCount: number; isPlacement: boolean }): number {
  const base = Math.min(25, Math.max(-25, Math.round((args.score - 1.0) * 400)))
  const prBonus = Math.min(5 * args.prCount, 10) // applied after the clamp, deliberately
  const total = base + prBonus
  return args.isPlacement ? total * 2 : total
}

export function fastingDelta(outcome: 'completed' | 'ended_early', isPlacement: boolean): number {
  const delta = outcome === 'completed' ? 15 : -10
  return isPlacement ? delta * 2 : delta
}

export function applyDelta(mmr: number, delta: number): number {
  return Math.max(0, mmr + delta)
}

export function isPlacement(sessionsPlayed: number): boolean {
  return sessionsPlayed < PLACEMENT_SESSIONS
}

export function placementsRemaining(sessionsPlayed: number): number {
  return Math.max(0, PLACEMENT_SESSIONS - sessionsPlayed)
}
