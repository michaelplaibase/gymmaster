import { DIVISION_LABEL, TIERS, tierLabel, type Division, type Rank } from './types'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

// Absorbs floating point error at exact division boundaries so a ratio that is
// mathematically on a boundary (e.g. exactly one third into a tier) lands in the
// HIGHER division instead of one division too low.
const BOUNDARY_EPSILON = 1e-9

export function strengthRatio(e1rmValue: number, bodyweightKg: number): number {
  return e1rmValue / bodyweightKg
}

// thresholds is exactly 6 ascending numbers, index 0 = bronze entry .. index 5 = emerald entry.
// thresholds[t] is the entry point of tier t at division III.
export function rankFromRatio(ratio: number, thresholds: number[]): Rank {
  if (ratio < thresholds[0]) {
    return {
      tier: null,
      division: null,
      label: 'Unranked',
      progress: clamp01(ratio / thresholds[0]),
    }
  }
  let t = 0
  for (let i = 1; i < 6; i++) {
    if (ratio >= thresholds[i]) t = i
  }
  const tier = TIERS[t]
  // Emerald has no upper bound: use a synthetic span equal to the diamond span.
  const span = t === 5 ? thresholds[5] - thresholds[4] : thresholds[t + 1] - thresholds[t]
  const position = (ratio - thresholds[t]) / span
  if (position >= 1) {
    // Only reachable in emerald: at or above thresholds[5] + span is Emerald I, maxed.
    return { tier, division: 1, label: `${tierLabel(tier)} I`, progress: 1 }
  }
  // Each tier splits into 3 equal divisions: lower third III, middle II, upper third I.
  const divisionIndex = Math.min(Math.floor(position * 3 + BOUNDARY_EPSILON), 2)
  const division = (3 - divisionIndex) as Division
  return {
    tier,
    division,
    label: `${tierLabel(tier)} ${DIVISION_LABEL[division]}`,
    progress: clamp01(position * 3 - divisionIndex),
  }
}

// Inverse of the bodyweight case at zero added weight: reps such that 1 + reps / 30 === ratio.
// Zero reps cannot produce an e1RM, so any ratio at or above 1.0 needs at least 1 rep.
export function repsForRatio(ratio: number): number {
  if (ratio < 1) return 0
  return Math.max(1, Math.round((ratio - 1) * 30))
}
