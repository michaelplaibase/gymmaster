'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PromotionOverlay } from '@/components/ui/PromotionOverlay'
import { RankBadge } from '@/components/ui/RankBadge'
import type { Rank } from '@/lib/rating'
import { tierClass } from '@/lib/ui/tier'

function PlacedOverlay({ rank, onDismiss }: { rank: Rank; onDismiss: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
      className={`anim-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-bg/95 ${tierClass(rank.tier)}`}
    >
      <div
        aria-hidden
        className="anim-promo-burst pointer-events-none absolute inset-0 m-auto aspect-square w-[140vw] max-w-3xl rounded-full opacity-0"
        style={{
          background: 'radial-gradient(closest-side, var(--tier) 0%, transparent 70%)',
        }}
      />
      <div className="anim-promo-badge relative">
        <RankBadge rank={rank} size="xl" />
      </div>
      <div className="anim-promo-word tier-text relative mt-8 font-display text-4xl font-bold uppercase tracking-[0.25em]">
        Placed
      </div>
      <div className="anim-promo-rise relative mt-3 text-center">
        <div className="font-display text-xl font-semibold">{rank.label}</div>
        <div className="mt-1 text-sm text-muted">Placement matches complete</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <Button variant="secondary" size="lg" full onClick={onDismiss}>
          Continue
        </Button>
      </div>
    </div>
  )
}

// Shows the placement / promotion / demotion celebration exactly once per
// match: the first render marks it seen in sessionStorage, so a refresh or a
// revisit never replays it.
export function SummaryOverlays({
  workoutId,
  placedNow,
  promoted,
  demoted,
  rankBefore,
  rankAfter,
}: {
  workoutId: number
  placedNow: boolean
  promoted: boolean
  demoted: boolean
  rankBefore: Rank
  rankAfter: Rank
}) {
  const [show, setShow] = useState<'placed' | 'promotion' | 'demotion' | null>(null)

  useEffect(() => {
    const kind = placedNow ? 'placed' : promoted ? 'promotion' : demoted ? 'demotion' : null
    if (!kind) return
    const key = `ranked-celebrated-${workoutId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage unavailable: still celebrate, just without the guard.
    }
    setShow(kind)
  }, [workoutId, placedNow, promoted, demoted])

  if (!show) return null
  if (show === 'placed') return <PlacedOverlay rank={rankAfter} onDismiss={() => setShow(null)} />
  return (
    <PromotionOverlay
      from={rankBefore}
      to={rankAfter}
      kind={show}
      onDismiss={() => setShow(null)}
    />
  )
}

export default SummaryOverlays
