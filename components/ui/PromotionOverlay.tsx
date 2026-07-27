'use client'

import type { Rank } from '@/lib/rating'
import { tierClass } from '@/lib/ui/tier'
import { Button } from './Button'
import { RankBadge } from './RankBadge'

export function PromotionOverlay({
  from,
  to,
  kind,
  onDismiss,
}: {
  from: Rank
  to: Rank
  kind: 'promotion' | 'demotion'
  onDismiss: () => void
}) {
  const demoted = kind === 'demotion'
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
      className={`anim-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-bg/95 ${tierClass(to.tier)} ${demoted ? 'demoted' : ''}`}
    >
      <div
        aria-hidden
        className="anim-promo-burst pointer-events-none absolute inset-0 m-auto aspect-square w-[140vw] max-w-3xl rounded-full opacity-0"
        style={{
          background: 'radial-gradient(closest-side, var(--tier) 0%, transparent 70%)',
        }}
      />
      <div className="anim-promo-badge relative">
        <RankBadge rank={to} size="xl" />
      </div>
      <div
        className={`anim-promo-word relative mt-8 font-display text-4xl font-bold uppercase tracking-[0.25em] ${demoted ? 'text-danger' : 'tier-text'}`}
      >
        {demoted ? 'Demoted' : 'Promoted'}
      </div>
      <div className="anim-promo-rise relative mt-3 text-center">
        <div className="font-display text-xl font-semibold">{to.label}</div>
        <div className="mt-1 text-sm text-muted">from {from.label}</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <Button variant="secondary" size="lg" full onClick={onDismiss}>
          Continue
        </Button>
      </div>
    </div>
  )
}

export default PromotionOverlay
