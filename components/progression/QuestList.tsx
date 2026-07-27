import { ProgressBar } from '@/components/ui/ProgressBar'
import type { ActiveQuest } from '@/lib/data/quests'

export function QuestList({ quests }: { quests: ActiveQuest[] }) {
  if (quests.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        No quests today. Check back tomorrow.
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {quests.map((quest) => {
        const done = quest.completed
        return (
          <div
            key={quest.id}
            className={`rounded-xl border bg-surface p-3 ${
              done ? 'border-success/40' : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {done && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-label="Completed"
                      role="img"
                      className="shrink-0 text-success"
                    >
                      <path
                        d="M4 12.5 L10 18.5 L20 6.5"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span className="truncate font-display text-sm font-semibold">
                    {quest.title}
                  </span>
                </div>
                <div className="truncate text-xs text-muted">{quest.description}</div>
              </div>
              <span
                className={`num shrink-0 text-sm font-bold ${
                  done ? 'text-success' : 'text-muted'
                }`}
              >
                +{quest.xpReward} XP
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ProgressBar value={quest.target > 0 ? quest.progress / quest.target : 0} />
              </div>
              <span className="num shrink-0 text-[11px] font-semibold text-muted">
                {quest.progress}/{quest.target}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default QuestList
