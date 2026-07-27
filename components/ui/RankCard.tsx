import { PLACEMENT_SESSIONS, type Playlist, type Rank } from '@/lib/rating'
import { PLAYLIST_LABEL, tierClass, tierGradient } from '@/lib/ui/tier'
import { ProgressBar } from './ProgressBar'
import { RankBadge } from './RankBadge'

export function RankCard({
  playlist,
  rank,
  mmr,
  sessionsPlayed,
  placementsRemaining,
  compact = false,
}: {
  playlist: Playlist
  rank: Rank
  mmr: number
  sessionsPlayed: number
  placementsRemaining?: number
  compact?: boolean
}) {
  const placing = sessionsPlayed < PLACEMENT_SESSIONS
  const remaining =
    placementsRemaining ?? Math.max(0, PLACEMENT_SESSIONS - sessionsPlayed)
  const placementNumber = Math.min(
    PLACEMENT_SESSIONS,
    PLACEMENT_SESSIONS - remaining + 1,
  )
  const progress = placing ? sessionsPlayed / PLACEMENT_SESSIONS : rank.progress
  const tier = placing ? null : rank.tier
  const surface = `relative overflow-hidden border border-border bg-surface ${tierGradient(tier)} ${tierClass(tier)}`

  if (compact) {
    return (
      <div className={`${surface} rounded-xl p-3`}>
        <div className="flex items-center gap-2.5">
          <RankBadge rank={rank} size="sm" hidden={placing} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted">
              {PLAYLIST_LABEL[playlist]}
            </div>
            <div className="truncate font-display text-[13px] font-semibold">
              {placing ? `Placement ${placementNumber} of ${PLACEMENT_SESSIONS}` : rank.label}
            </div>
          </div>
          {!placing && <div className="num text-lg font-bold">{mmr}</div>}
        </div>
        <div className="mt-2.5">
          <ProgressBar value={progress} tone="tier" />
        </div>
      </div>
    )
  }

  return (
    <div className={`${surface} rounded-2xl p-4`}>
      <div className="flex items-center gap-4">
        <RankBadge rank={rank} size="lg" hidden={placing} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {PLAYLIST_LABEL[playlist]}
          </div>
          {placing ? (
            <div className="mt-1 font-display text-lg font-semibold">
              Placement {placementNumber} of {PLACEMENT_SESSIONS}
            </div>
          ) : (
            <>
              <div className="mt-0.5 truncate font-display text-lg font-semibold">
                {rank.label}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="num text-4xl font-bold leading-none">{mmr}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  MMR
                </span>
              </div>
            </>
          )}
          <div className="mt-3">
            <ProgressBar value={progress} tone="tier" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RankCard
