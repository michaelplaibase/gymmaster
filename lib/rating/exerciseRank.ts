import { DIVISION_LABEL, TIERS, tierLabel, type Division, type Rank } from './types'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

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
  const divisionIndex = Math.min(Math.floor(position * 3), 2)
  const division = (3 - divisionIndex) as Division
  return {
    tier,
    division,
    label: `${tierLabel(tier)} ${DIVISION_LABEL[division]}`,
    progress: clamp01(position * 3 - divisionIndex),
  }
}

// Inverse of the bodyweight case at zero added weight: reps such that 1 + reps / 30 === ratio.
export function repsForRatio(ratio: number): number {
  return Math.max(0, Math.round((ratio - 1) * 30))
}
