'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { startFastAction } from '@/app/actions/fasting'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export function StartFast({
  presets,
}: {
  presets: { id: string; label: string; hours: number }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [customOpen, setCustomOpen] = useState(false)
  const [hours, setHours] = useState(16)
  const [minutes, setMinutes] = useState(0)
  const customSec = hours * 3600 + minutes * 60

  function start(preset: string, targetSec: number) {
    startTransition(async () => {
      await startFastAction({ preset, targetSec })
      router.refresh()
    })
  }

  return (
    <div className="mt-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        Start a match
      </div>
      <div className="mt-2 space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            disabled={pending}
            onClick={() => start(preset.id, preset.hours * 3600)}
            className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors active:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <div>
              <div className="num text-2xl font-bold leading-tight">{preset.label}</div>
              <div className="text-xs text-muted">{preset.hours}h fasting window</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 5 L16 12 L9 19"
                stroke="var(--color-muted)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
        <button
          disabled={pending}
          onClick={() => setCustomOpen(true)}
          className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-left transition-colors active:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
        >
          <div>
            <div className="font-display text-lg font-semibold leading-tight">Custom</div>
            <div className="text-xs text-muted">Pick your own window</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5 V19 M5 12 H19"
              stroke="var(--color-muted)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} title="Custom window">
        <div className="flex gap-3">
          <label className="flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Hours
            </span>
            <select
              id="custom-hours"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="num mt-1 h-14 w-full rounded-xl border border-border bg-surface-2 px-3 text-2xl font-bold text-text"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Minutes
            </span>
            <select
              id="custom-minutes"
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="num mt-1 h-14 w-full rounded-xl border border-border bg-surface-2 px-3 text-2xl font-bold text-text"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4">
          <Button
            size="lg"
            full
            disabled={pending || customSec < 60}
            onClick={() => start('Custom', customSec)}
          >
            Start Fast
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
