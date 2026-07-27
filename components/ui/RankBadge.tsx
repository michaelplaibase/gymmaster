import { DIVISION_LABEL, type Rank } from '@/lib/rating'
import { tierClass } from '@/lib/ui/tier'

type BadgeSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<BadgeSize, number> = { sm: 28, md: 48, lg: 96, xl: 176 }
const LABEL_PX: Record<BadgeSize, number> = { sm: 7, md: 9, lg: 11, xl: 13 }

// Shield geometry, viewBox 0 0 120 132.
const OUTER = 'M60 6 L108 25 V68 L60 126 L12 68 V25 Z'
const INNER = 'M60 17.5 L98 32.5 V64 L60 112 L22 64 V32.5 Z'
const FACETS = 'M60 17.5 L22 64 M60 17.5 L98 64'
const APEX = 'M60 10 L66.5 17.5 L60 25 L53.5 17.5 Z'
const CHEVRON = 'M42 97 L60 107 L78 97'
const LOCK_SHACKLE = 'M49 62 v-9 a11 11 0 0 1 22 0 v9'

export function RankBadge({
  rank,
  size = 'md',
  hidden = false,
}: {
  rank: Rank
  size?: BadgeSize
  hidden?: boolean
}) {
  const px = SIZE_PX[size]
  const tier = hidden ? null : rank.tier
  const detailed = tier === 'gold' || tier === 'platinum' || tier === 'diamond' || tier === 'emerald'
  const faceted = tier === 'diamond' || tier === 'emerald'
  const glow = !hidden && tier !== null && (size === 'lg' || size === 'xl')

  return (
    <span className={`relative inline-flex flex-col items-center ${tierClass(tier)}`}>
      {glow && (
        <span aria-hidden className="tier-glow absolute inset-[16%] rounded-full" />
      )}
      <svg
        width={px}
        height={Math.round(px * 1.1)}
        viewBox="0 0 120 132"
        fill="none"
        aria-label={hidden ? 'Unranked' : rank.label}
        role="img"
        className="relative"
      >
        <path d={OUTER} fill="var(--tier)" fillOpacity={hidden || tier === null ? 0.06 : 0.14} />
        <path
          d={OUTER}
          stroke="var(--tier)"
          strokeWidth={tier === null ? 4 : 6}
          strokeOpacity={tier === null ? 0.7 : 1}
        />
        {detailed && (
          <path d={INNER} stroke="var(--tier)" strokeWidth={2} strokeOpacity={0.45} />
        )}
        {faceted && (
          <>
            <path d={FACETS} stroke="var(--tier)" strokeWidth={2.5} strokeOpacity={0.3} />
            <path d={APEX} fill="var(--tier)" />
          </>
        )}
        {detailed && (
          <path
            d={CHEVRON}
            stroke="var(--tier)"
            strokeWidth={5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        )}
        {hidden ? (
          <g>
            <path d={LOCK_SHACKLE} stroke="var(--tier)" strokeWidth={5} />
            <rect
              x={43}
              y={62}
              width={34}
              height={26}
              rx={4}
              fill="var(--tier)"
              fillOpacity={0.25}
              stroke="var(--tier)"
              strokeWidth={4}
            />
          </g>
        ) : (
          <text
            x={60}
            y={tier === null ? 88 : 84}
            textAnchor="middle"
            className="font-display"
            fontWeight={700}
            fontSize={tier === null ? 46 : 38}
            fill="var(--tier)"
          >
            {tier === null ? '?' : rank.division ? DIVISION_LABEL[rank.division] : ''}
          </text>
        )}
      </svg>
      {hidden && size !== 'sm' && (
        <span
          className="mt-0.5 font-display font-semibold uppercase tracking-widest text-muted"
          style={{ fontSize: LABEL_PX[size] }}
        >
          Unranked
        </span>
      )}
    </span>
  )
}

export default RankBadge
