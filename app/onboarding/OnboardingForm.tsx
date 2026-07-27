'use client'

import { useState, useTransition } from 'react'
import { completeOnboarding } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/Button'
import type { Sex } from '@/lib/rating'

const REST_OPTIONS = [60, 90, 120, 180]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
      {children}
    </div>
  )
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-14 rounded-xl border font-display text-base font-semibold uppercase tracking-wide transition-colors ${
        selected
          ? 'border-text bg-text text-bg'
          : 'border-border bg-surface-2 text-muted active:bg-border/60'
      }`}
    >
      {children}
    </button>
  )
}

export function OnboardingForm() {
  const [weight, setWeight] = useState('80')
  const [sex, setSex] = useState<Sex | null>(null)
  const [rest, setRest] = useState(90)
  const [pending, startTransition] = useTransition()

  const parsed = Number.parseFloat(weight.replace(',', '.'))
  const weightValid = Number.isFinite(parsed) && parsed >= 30 && parsed <= 300
  const canSubmit = weightValid && sex !== null && !pending

  function bump(delta: number) {
    const base = Number.isFinite(parsed) ? parsed : 80
    const next = Math.min(300, Math.max(30, Math.round(base + delta)))
    setWeight(String(next))
  }

  function submit() {
    if (!weightValid || sex === null || pending) return
    startTransition(async () => {
      await completeOnboarding({ bodyweightKg: parsed, sex, defaultRestSec: rest })
    })
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-safe pt-safe">
      <header className="pt-10">
        <div className="font-display text-3xl font-bold tracking-[0.3em]">RANKED</div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Player setup. Bodyweight and sex set your strength standards: the bar
          every lift is ranked against.
        </p>
      </header>

      <div className="mt-8 flex-1 space-y-7">
        <section>
          <FieldLabel>Bodyweight (kg)</FieldLabel>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => bump(-1)}
              aria-label="Decrease bodyweight"
              className="num h-16 w-16 shrink-0 rounded-xl border border-border bg-surface-2 text-3xl font-bold text-text active:bg-border/60"
            >
              &minus;
            </button>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              aria-label="Bodyweight in kilograms"
              aria-invalid={!weightValid}
              className={`num h-16 w-full min-w-0 flex-1 rounded-xl border bg-surface text-center text-4xl font-bold outline-none ${
                weightValid ? 'border-border focus:border-muted' : 'border-danger'
              }`}
            />
            <button
              type="button"
              onClick={() => bump(1)}
              aria-label="Increase bodyweight"
              className="num h-16 w-16 shrink-0 rounded-xl border border-border bg-surface-2 text-3xl font-bold text-text active:bg-border/60"
            >
              +
            </button>
          </div>
        </section>

        <section>
          <FieldLabel>Sex</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Choice selected={sex === 'male'} onClick={() => setSex('male')}>
              Male
            </Choice>
            <Choice selected={sex === 'female'} onClick={() => setSex('female')}>
              Female
            </Choice>
          </div>
        </section>

        <section>
          <FieldLabel>Rest timer</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {REST_OPTIONS.map((seconds) => (
              <Choice
                key={seconds}
                selected={rest === seconds}
                onClick={() => setRest(seconds)}
              >
                {seconds}s
              </Choice>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Default rest between sets.</p>
        </section>
      </div>

      <div className="pb-4 pt-6">
        <Button size="lg" full disabled={!canSubmit} onClick={submit}>
          {pending ? 'Locking in' : 'Lock in'}
        </Button>
      </div>
    </div>
  )
}
