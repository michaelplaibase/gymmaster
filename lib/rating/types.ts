export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'emerald'

// 1 renders as 'I' (highest), 3 renders as 'III' (lowest)
export type Division = 1 | 2 | 3

export type Sex = 'male' | 'female'

export type LoadType = 'external' | 'bodyweight'

export type Playlist = 'push' | 'pull' | 'legs' | 'fasting'

// Ascending: bronze .. emerald
export const TIERS: readonly Tier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald']

export const DIVISION_LABEL: Record<Division, string> = { 1: 'I', 2: 'II', 3: 'III' }

export type Rank = {
  tier: Tier | null // null means Unranked (below the bronze threshold)
  division: Division | null
  label: string // e.g. 'Gold II', or 'Unranked'
  progress: number // 0..1 progress through the current division
}

export function tierLabel(tier: Tier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}
