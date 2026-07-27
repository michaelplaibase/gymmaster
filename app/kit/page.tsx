'use client'

import { useState, type ReactNode } from 'react'
import {
  DIVISION_LABEL,
  TIERS,
  tierLabel,
  type Division,
  type Rank,
  type Tier,
} from '@/lib/rating'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PromotionOverlay } from '@/components/ui/PromotionOverlay'
import { RankBadge } from '@/components/ui/RankBadge'
import { RankCard } from '@/components/ui/RankCard'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import { Stat } from '@/components/ui/Stat'

function rank(tier: Tier, division: Division, progress = 0.5): Rank {
  return {
    tier,
    division,
    label: `${tierLabel(tier)} ${DIVISION_LABEL[division]}`,
    progress,
  }
}

const UNRANKED: Rank = { tier: null, division: null, label: 'Unranked', progress: 0 }
const DIVISIONS: Division[] = [1, 2, 3]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-muted">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function KitPage() {
  const [overlay, setOverlay] = useState<'promotion' | 'demotion' | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <Screen title="UI Kit" back="/">
      <Section title="Signature badge">
        <div className="flex justify-center py-2">
          <RankBadge rank={rank('emerald', 1, 0.8)} size="xl" />
        </div>
      </Section>

      <Section title="Rank badges, every tier and division">
        <div className="space-y-5">
          {TIERS.map((tier) => (
            <div key={tier}>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {tierLabel(tier)}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                {DIVISIONS.map((d) => (
                  <RankBadge key={`lg-${d}`} rank={rank(tier, d)} size="lg" />
                ))}
                {DIVISIONS.map((d) => (
                  <RankBadge key={`md-${d}`} rank={rank(tier, d)} size="md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Unranked and hidden">
        <div className="flex flex-wrap items-end gap-4">
          <RankBadge rank={UNRANKED} size="md" />
          <RankBadge rank={UNRANKED} size="lg" />
          <RankBadge rank={UNRANKED} size="md" hidden />
          <RankBadge rank={UNRANKED} size="lg" hidden />
        </div>
      </Section>

      <Section title="Rank cards">
        <div className="space-y-3">
          <RankCard playlist="push" rank={rank('gold', 2, 0.62)} mmr={762} sessionsPlayed={41} />
          <RankCard playlist="pull" rank={rank('platinum', 1, 0.34)} mmr={1134} sessionsPlayed={38} />
          <RankCard playlist="legs" rank={rank('silver', 3, 0.18)} mmr={318} sessionsPlayed={12} />
          <RankCard
            playlist="fasting"
            rank={UNRANKED}
            mmr={500}
            sessionsPlayed={1}
            placementsRemaining={2}
          />
        </div>
      </Section>

      <Section title="Rank cards, compact">
        <div className="grid grid-cols-2 gap-3">
          <RankCard
            playlist="push"
            rank={rank('gold', 2, 0.62)}
            mmr={762}
            sessionsPlayed={41}
            compact
          />
          <RankCard
            playlist="fasting"
            rank={UNRANKED}
            mmr={500}
            sessionsPlayed={0}
            placementsRemaining={3}
            compact
          />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg">
              Primary lg
            </Button>
            <Button variant="secondary" size="lg">
              Secondary lg
            </Button>
          </div>
          <Button variant="primary" size="lg" full>
            Start Match
          </Button>
        </div>
      </Section>

      <Section title="Stats">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Session score" value="1.04" sub="vs baseline" />
          <Stat label="MMR change" value="+18" tone="good" sub="last match" />
          <Stat label="MMR change" value="-12" tone="bad" sub="last match" />
          <span className="tier-gold">
            <Stat label="Best e1RM" value="122.5" tone="tier" sub="kg, bench press" />
          </span>
        </div>
      </Section>

      <Section title="Progress bars">
        <div className="space-y-4">
          <ProgressBar value={0} />
          <ProgressBar value={0.5} />
          <ProgressBar value={1} />
          <div className="tier-platinum">
            <ProgressBar value={0.5} tone="tier" />
          </div>
        </div>
      </Section>

      <Section title="Overlays and sheet">
        <div className="space-y-3">
          <Button variant="secondary" full onClick={() => setOverlay('promotion')}>
            Show promotion
          </Button>
          <Button variant="secondary" full onClick={() => setOverlay('demotion')}>
            Show demotion
          </Button>
          <Button variant="secondary" full onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </div>
      </Section>

      {overlay === 'promotion' && (
        <PromotionOverlay
          from={rank('gold', 3, 0.98)}
          to={rank('gold', 2, 0.02)}
          kind="promotion"
          onDismiss={() => setOverlay(null)}
        />
      )}
      {overlay === 'demotion' && (
        <PromotionOverlay
          from={rank('gold', 3, 0.01)}
          to={rank('silver', 1, 0.95)}
          kind="demotion"
          onDismiss={() => setOverlay(null)}
        />
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Pick a playlist">
        <div className="space-y-2">
          {(['Push', 'Pull', 'Legs', 'Fasting'] as const).map((label) => (
            <button
              key={label}
              onClick={() => setSheetOpen(false)}
              className="flex min-h-12 w-full items-center rounded-xl border border-border bg-surface-2 px-4 font-display text-sm font-semibold uppercase tracking-wide active:bg-border/60"
            >
              {label}
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}
