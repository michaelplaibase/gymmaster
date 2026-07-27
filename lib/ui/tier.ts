import type { Playlist, Tier } from '@/lib/rating'

export function tierClass(tier: Tier | null): string {
  return tier === null ? 'tier-unranked' : `tier-${tier}`
}

const GRADIENT: Record<Tier, string> = {
  bronze: 'bg-linear-to-br from-tier-bronze-dim via-transparent to-transparent',
  silver: 'bg-linear-to-br from-tier-silver-dim via-transparent to-transparent',
  gold: 'bg-linear-to-br from-tier-gold-dim via-transparent to-transparent',
  platinum: 'bg-linear-to-br from-tier-platinum-dim via-transparent to-transparent',
  diamond: 'bg-linear-to-br from-tier-diamond-dim via-transparent to-transparent',
  emerald: 'bg-linear-to-br from-tier-emerald-dim via-transparent to-transparent',
}

export function tierGradient(tier: Tier | null): string {
  return tier === null
    ? 'bg-linear-to-br from-surface-2 via-transparent to-transparent'
    : GRADIENT[tier]
}

export const PLAYLIST_LABEL: Record<Playlist, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  fasting: 'Fasting',
}
