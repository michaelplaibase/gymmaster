'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { completeFastAction, endFastEarlyAction } from '@/app/actions/fasting'
import { Button } from '@/components/ui/Button'
import { PromotionOverlay } from '@/components/ui/PromotionOverlay'
import { Sheet } from '@/components/ui/Sheet'
import type { FastResult } from '@/lib/data/fasts'
import { formatDuration } from '@/lib/date'
import type { Tier } from '@/lib/rating'
import { tierClass } from '@/lib/ui/tier'

const RADIUS = 84
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// How long the freshly revealed result screen ignores taps on Continue. The
// two taps of a double tap land within ~300ms of each other (the classic
// browser double tap threshold), and the result can only appear between them,
// so 400ms covers the stray second tap plus render jitter. A deliberate
// Continue tap comes after the user has read the result, far beyond 400ms, so
// the button never feels unresponsive.
const RESULT_TAP_GUARD_MS = 400

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function ActiveFast({
  id,
  preset,
  targetSec,
  startedAtMs,
  tier,
}: {
  id: number
  preset: string
  targetSec: number
  startedAtMs: number
  tier: Tier | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // Initialised from a real timestamp so the first painted frame already
  // shows the true remaining time instead of the full target.
  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<FastResult | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Synchronous double submit guard: pending only flips after a re render,
  // so a rapid double tap runs both handlers before React updates. The ref
  // blocks the second call before the first action settles, mirroring the
  // active workout screen.
  const mutationPendingRef = useRef(false)
  // When the result screen was revealed, so a stray second tap from a double
  // tap cannot immediately dismiss it. See RESULT_TAP_GUARD_MS.
  const resultShownAtRef = useRef(0)

  function runMutation(action: () => Promise<void>) {
    if (mutationPendingRef.current) return
    mutationPendingRef.current = true
    startTransition(async () => {
      try {
        await action()
      } finally {
        mutationPendingRef.current = false
      }
    })
  }

  // Recompute from startedAt on every tick so the timer survives backgrounding
  // and refreshes, and reaches the completable state on its own.
  useEffect(() => {
    setNowMs(Date.now())
    const interval = setInterval(() => setNowMs(Date.now()), 500)
    return () => clearInterval(interval)
  }, [])

  const elapsedSec = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
  const remainingSec = Math.max(0, targetSec - elapsedSec)
  const done = elapsedSec >= targetSec
  const progress = Math.min(1, targetSec === 0 ? 1 : elapsedSec / targetSec)

  function complete() {
    setError(null)
    runMutation(async () => {
      try {
        const res = await completeFastAction(id)
        resultShownAtRef.current = Date.now()
        setResult(res)
        setShowOverlay(res.rating.promoted || res.rating.demoted)
      } catch {
        // The server refuses a completion before the window is truly over,
        // which happens when the device clock runs a few seconds fast. Stay
        // on the screen: the next attempt a moment later succeeds.
        setError('Not quite yet, hold on a few more seconds and try again.')
      }
    })
  }

  function endEarly() {
    setError(null)
    runMutation(async () => {
      try {
        const res = await endFastEarlyAction(id)
        setConfirmOpen(false)
        resultShownAtRef.current = Date.now()
        setResult(res)
        setShowOverlay(res.rating.promoted || res.rating.demoted)
      } catch {
        setConfirmOpen(false)
        setError('Could not end the fast, try again in a moment.')
      }
    })
  }

  if (result) {
    const won = result.outcome === 'completed'
    const delta = result.rating.delta
    // Rank stays hidden until placements are done.
    const revealed = !result.rating.wasPlacement || result.rating.placedNow
    return (
      <div
        className={`anim-fade-in pb-24 ${tierClass(revealed ? result.rating.rankAfter.tier : null)}`}
      >
        {showOverlay && (
          <PromotionOverlay
            from={result.rating.rankBefore}
            to={result.rating.rankAfter}
            kind={result.rating.promoted ? 'promotion' : 'demotion'}
            onDismiss={() => setShowOverlay(false)}
          />
        )}
        <div className="mt-8 text-center">
          <div
            className={`font-display text-3xl font-bold uppercase tracking-[0.2em] ${won ? (revealed ? 'tier-text' : 'text-text') : 'text-danger'}`}
          >
            {won ? 'Match won' : 'Match forfeited'}
          </div>
          <div className="mt-1 text-sm text-muted">
            {won ? 'Fast completed' : 'Fast ended early'}, {formatDuration(result.elapsedSec)}{' '}
            elapsed
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              MMR
            </span>
            <span className={`num text-lg font-bold ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
              {delta >= 0 ? `+${delta}` : delta}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-2xl font-bold text-muted">{result.rating.mmrBefore}</span>
            <span className="text-muted" aria-hidden>
              &rarr;
            </span>
            <span className="num text-4xl font-bold">{result.rating.mmrAfter}</span>
          </div>
          {result.rating.wasPlacement && (
            <div className="mt-1 text-xs text-muted">
              Placement match: {result.rating.placementsRemaining} remaining
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Streak
            </div>
            <div className="num text-3xl font-bold">{result.streakAfter}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              XP earned
            </div>
            <div className="num text-3xl font-bold">{result.xpEarned > 0 ? `+${result.xpEarned}` : 0}</div>
          </div>
        </div>

        {result.levelUp && (
          <div className="mt-3 rounded-2xl border border-border bg-surface p-4 text-sm">
            Level up: <span className="num font-bold">{result.levelUp.from}</span>{' '}
            <span aria-hidden>&rarr;</span>{' '}
            <span className="num font-bold">{result.levelUp.to}</span>
          </div>
        )}

        {result.questsCompleted.length > 0 && (
          <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Quests completed
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {result.questsCompleted.map((quest) => (
                <li key={quest.title} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{quest.title}</span>
                  <span className="num shrink-0 font-bold text-success">+{quest.xpReward} XP</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className="fixed inset-x-0 z-40 mx-auto w-full max-w-md px-4 pb-3"
          style={{ bottom: 'var(--nav-h, calc(4rem + env(safe-area-inset-bottom)))' }}
        >
          <Button
            size="lg"
            full
            onClick={() => {
              // Ignore the stray second tap of a double tap on Complete Fast,
              // which would otherwise dismiss the result the instant it
              // appears. See RESULT_TAP_GUARD_MS.
              if (Date.now() - resultShownAtRef.current < RESULT_TAP_GUARD_MS) return
              router.refresh()
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`pb-24 ${tierClass(tier)}`}>
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-72">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="var(--tier)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            {done ? 'Window reached' : 'Remaining'}
          </div>
          <div className="num mt-1 text-5xl font-bold leading-none" suppressHydrationWarning>
            {formatDuration(done ? elapsedSec : remainingSec)}
          </div>
          <div className="mt-2 text-xs text-muted" suppressHydrationWarning>
            {done ? `Target ${formatDuration(targetSec)}` : `Elapsed ${formatDuration(elapsedSec)}`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Window
          </div>
          <div className="num text-lg font-bold">{preset}</div>
          <div className="text-[11px] text-muted">{formatDuration(targetSec)}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Started
          </div>
          <div className="num text-lg font-bold">{clockTime(startedAtMs)}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Ends
          </div>
          <div className="num text-lg font-bold">{clockTime(startedAtMs + targetSec * 1000)}</div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 z-40 mx-auto w-full max-w-md px-4 pb-3"
        style={{ bottom: 'var(--nav-h, calc(4rem + env(safe-area-inset-bottom)))' }}
      >
        {error && (
          <p
            role="status"
            className="mb-2 rounded-lg border border-border bg-surface/95 px-3 py-2 text-center text-sm text-muted backdrop-blur"
          >
            {error}
          </p>
        )}
        {done ? (
          <Button size="lg" full disabled={pending} onClick={complete}>
            Complete Fast
          </Button>
        ) : (
          <Button
            variant="danger"
            size="lg"
            full
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
          >
            End Early
          </Button>
        )}
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="End fast early?">
        <p className="text-sm text-muted">
          This counts as a forfeit: you lose MMR, your streak resets to 0 and you earn no XP.
        </p>
        <div className="mt-4 space-y-2">
          <Button variant="danger" size="lg" full disabled={pending} onClick={endEarly}>
            End Early
          </Button>
          <Button variant="secondary" size="lg" full onClick={() => setConfirmOpen(false)}>
            Keep Fasting
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
