'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  abandonMatchAction,
  addExerciseAction,
  deleteSetAction,
  finishMatchAction,
  logSetAction,
  removeExerciseAction,
} from '@/app/actions/training'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import type { WorkoutType } from '@/db/schema'
import { formatDuration } from '@/lib/date'
import type { Tier } from '@/lib/rating'
import { PLAYLIST_LABEL, tierClass } from '@/lib/ui/tier'

type SessionExercise = { id: string; name: string; loadType: 'external' | 'bodyweight' }
type LoggedSet = { id: number; exerciseId: string; weightKg: number; reps: number }
type PoolExercise = { id: string; name: string }
type Draft = { weightKg: number; reps: number }

const WEIGHT_STEP = 2.5
const REST_PRESETS = [60, 90, 120, 180]

// How long mutating controls stay blocked AFTER a server action settles. On a
// fast server the round trip can beat the gap between two accidental taps, so
// an in flight guard alone lets the second tap through. 350 ms covers the
// classic mobile double tap window (~300 ms, plus margin): an accidental
// double lands well inside it, while a deliberate repeat tap (react to the
// updated list, decide, tap again) takes at least half a second.
const MUTATION_COOLDOWN_MS = 350

function fmtKg(weightKg: number): string {
  return weightKg % 1 === 0 ? String(weightKg) : weightKg.toFixed(1)
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M5 9 L12 16 L19 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Stepper({
  label,
  value,
  display,
  onChange,
  step,
  min,
  integer,
}: {
  label: string
  value: number
  display: string
  onChange: (next: number) => void
  step: number
  min: number
  integer: boolean
}) {
  const [editing, setEditing] = useState(false)

  function commit(raw: string) {
    const parsed = integer ? parseInt(raw, 10) : parseFloat(raw)
    if (Number.isFinite(parsed)) onChange(Math.max(min, parsed))
    setEditing(false)
  }

  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="h-14 w-14 shrink-0 rounded-xl border border-border bg-surface-2 font-display text-2xl font-semibold active:bg-border/60"
        >
          &minus;
        </button>
        {editing ? (
          <input
            type="number"
            inputMode={integer ? 'numeric' : 'decimal'}
            step={integer ? 1 : WEIGHT_STEP}
            min={min}
            defaultValue={value}
            autoFocus
            aria-label={`${label} value`}
            onBlur={(event) => commit(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit(event.currentTarget.value)
            }}
            className="num h-14 w-full min-w-0 flex-1 rounded-xl border border-border bg-surface-2 text-center text-3xl font-bold outline-none"
          />
        ) : (
          <button
            type="button"
            aria-label={`Edit ${label}`}
            onClick={() => setEditing(true)}
            className="num h-14 min-w-0 flex-1 rounded-xl bg-surface-2/50 text-center text-3xl font-bold"
          >
            {display}
          </button>
        )}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + step)}
          className="h-14 w-14 shrink-0 rounded-xl border border-border bg-surface-2 font-display text-2xl font-semibold active:bg-border/60"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function ActiveWorkout({
  workoutId,
  workoutType,
  tier,
  startedAtMs,
  defaultRestSec,
  exercises,
  sets,
  pool,
}: {
  workoutId: number
  workoutType: WorkoutType
  tier: Tier | null
  startedAtMs: number
  defaultRestSec: number
  exercises: SessionExercise[]
  sets: LoggedSet[]
  pool: PoolExercise[]
}) {
  const [now, setNow] = useState(() => Date.now())
  const [expanded, setExpanded] = useState<string | null>(exercises[0]?.id ?? null)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [rest, setRest] = useState<{ endsAt: number; totalSec: number } | null>(null)
  const [sheet, setSheet] = useState<'edit' | 'finish' | null>(null)
  const [isPending, startTransition] = useTransition()
  // Synchronous double submit guard: isPending only flips after a re render,
  // so a rapid double tap runs both handlers before React updates. The ref
  // blocks the second call before the first action settles, and stays set for
  // MUTATION_COOLDOWN_MS afterwards: a fast server can settle in under the
  // gap between two accidental taps, so releasing on settle is not enough.
  const mutationPendingRef = useRef(false)
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  function runMutation(action: () => Promise<void>) {
    if (mutationPendingRef.current) return
    mutationPendingRef.current = true
    startTransition(async () => {
      try {
        await action()
      } finally {
        cooldownTimerRef.current = setTimeout(() => {
          mutationPendingRef.current = false
        }, MUTATION_COOLDOWN_MS)
      }
    })
  }

  const restStorageKey = `ranked-rest-${workoutId}`

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  // Rehydrate a running rest timer after navigating away and back. Remaining
  // time is always computed from the persisted start timestamp, never from a
  // stored counter.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(restStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { startedAtMs?: unknown; totalSec?: unknown }
      if (typeof parsed.startedAtMs !== 'number' || typeof parsed.totalSec !== 'number') {
        sessionStorage.removeItem(restStorageKey)
        return
      }
      const endsAt = parsed.startedAtMs + parsed.totalSec * 1000
      if (endsAt <= Date.now()) {
        sessionStorage.removeItem(restStorageKey)
        return
      }
      setNow(Date.now())
      setRest({ endsAt, totalSec: parsed.totalSec })
    } catch {
      // sessionStorage unavailable or corrupt: skip rehydration.
    }
  }, [restStorageKey])

  const restRemaining = rest
    ? Math.min(rest.totalSec, Math.max(0, Math.ceil((rest.endsAt - now) / 1000)))
    : 0
  useEffect(() => {
    if (rest && now >= rest.endsAt) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(200)
      setRest(null)
      try {
        sessionStorage.removeItem(restStorageKey)
      } catch {
        // sessionStorage unavailable: nothing persisted to clear.
      }
    }
  }, [now, rest, restStorageKey])

  const elapsedSec = Math.max(0, Math.floor((now - startedAtMs) / 1000))

  function setsFor(exerciseId: string): LoggedSet[] {
    return sets.filter((set) => set.exerciseId === exerciseId)
  }

  function draftFor(exercise: SessionExercise): Draft {
    const existing = drafts[exercise.id]
    if (existing) return existing
    const own = setsFor(exercise.id)
    const last = own[own.length - 1]
    if (last) return { weightKg: last.weightKg, reps: last.reps }
    return { weightKg: exercise.loadType === 'bodyweight' ? 0 : 20, reps: 8 }
  }

  function updateDraft(exercise: SessionExercise, patch: Partial<Draft>) {
    const current = draftFor(exercise)
    setDrafts((prev) => ({ ...prev, [exercise.id]: { ...current, ...patch } }))
  }

  function startRest(totalSec: number) {
    const nowMs = Date.now()
    setNow(nowMs)
    setRest({ endsAt: nowMs + totalSec * 1000, totalSec })
    try {
      sessionStorage.setItem(restStorageKey, JSON.stringify({ startedAtMs: nowMs, totalSec }))
    } catch {
      // sessionStorage unavailable: the timer runs, it just cannot survive navigation.
    }
  }

  function skipRest() {
    setRest(null)
    try {
      sessionStorage.removeItem(restStorageKey)
    } catch {
      // sessionStorage unavailable: nothing persisted to clear.
    }
  }

  function submitSet(exerciseId: string, weightKg: number, reps: number) {
    runMutation(async () => {
      await logSetAction(workoutId, exerciseId, weightKg, reps)
      startRest(defaultRestSec)
    })
  }

  const totalSets = sets.length
  const exercisesWithSets = exercises.filter((exercise) => setsFor(exercise.id).length > 0).length

  return (
    // tierClass sets the --tier variable so the accents below (elapsed timer,
    // rest label, rest progress) pick up the playlist's tier color.
    <div className={tierClass(tier)}>
    <Screen
      title={PLAYLIST_LABEL[workoutType]}
      back="/train"
      action={
        <div className="flex items-center gap-2">
          <span suppressHydrationWarning className="num tier-text text-lg font-bold">
            {formatDuration(elapsedSec)}
          </span>
          <Button variant="secondary" onClick={() => setSheet('finish')}>
            Finish
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {exercises.map((exercise) => {
          const own = setsFor(exercise.id)
          const open = expanded === exercise.id
          const draft = draftFor(exercise)
          const last = own[own.length - 1]
          const weightLabel = exercise.loadType === 'bodyweight' ? 'Added kg' : 'Weight'
          return (
            <section
              key={exercise.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <button
                type="button"
                onClick={() => setExpanded(open ? null : exercise.id)}
                className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">{exercise.name}</div>
                  <div className="num text-xs text-muted">
                    {own.length === 0
                      ? 'No sets yet'
                      : `${own.length} ${own.length === 1 ? 'set' : 'sets'}${
                          last ? ` · ${fmtKg(last.weightKg)} kg × ${last.reps}` : ''
                        }`}
                  </div>
                </div>
                <Chevron open={open} />
              </button>
              {open && (
                <div className="border-t border-border/70 px-4 pb-4">
                  {own.length > 0 && (
                    <div className="py-1">
                      {own.map((set, index) => (
                        <div key={set.id} className="flex min-h-11 items-center gap-3">
                          <span className="num w-5 text-sm text-muted">{index + 1}</span>
                          <span className="num flex-1 text-lg font-semibold">
                            {fmtKg(set.weightKg)} kg &times; {set.reps}
                          </span>
                          <button
                            type="button"
                            aria-label={`Delete set ${index + 1}`}
                            disabled={isPending}
                            onClick={() =>
                              runMutation(async () => {
                                await deleteSetAction(workoutId, set.id)
                              })
                            }
                            className="flex h-11 w-11 items-center justify-center text-muted active:text-danger"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path
                                d="M6 6 L18 18 M18 6 L6 18"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 space-y-3">
                    <Stepper
                      label={weightLabel}
                      value={draft.weightKg}
                      display={fmtKg(draft.weightKg)}
                      step={WEIGHT_STEP}
                      min={0}
                      integer={false}
                      onChange={(next) => updateDraft(exercise, { weightKg: next })}
                    />
                    <Stepper
                      label="Reps"
                      value={draft.reps}
                      display={String(draft.reps)}
                      step={1}
                      min={1}
                      integer
                      onChange={(next) => updateDraft(exercise, { reps: Math.round(next) })}
                    />
                    {last ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="lg"
                          disabled={isPending}
                          onClick={() => {
                            updateDraft(exercise, { weightKg: last.weightKg, reps: last.reps })
                            submitSet(exercise.id, last.weightKg, last.reps)
                          }}
                        >
                          Repeat set
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          disabled={isPending}
                          onClick={() => submitSet(exercise.id, draft.weightKg, draft.reps)}
                        >
                          Log set
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        full
                        disabled={isPending}
                        onClick={() => submitSet(exercise.id, draft.weightKg, draft.reps)}
                      >
                        Log set
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>

      <Button variant="secondary" full className="mt-4" onClick={() => setSheet('edit')}>
        Edit exercises
      </Button>

      {/* Extra clearance so content is never hidden behind the rest bar,
          which itself sits directly above the bottom nav. */}
      {rest && <div aria-hidden className="h-28" />}

      {rest && (
        <div
          className="fixed inset-x-0 z-40"
          style={{ bottom: 'var(--nav-h, calc(4rem + env(safe-area-inset-bottom)))' }}
        >
          <div className="mx-auto w-full max-w-md border-t border-border bg-surface/95 px-4 pt-2 pb-3 backdrop-blur">
            <div className="flex items-end justify-between">
              <div>
                <div className="tier-text text-[10px] font-semibold uppercase tracking-widest">
                  Rest
                </div>
                <div className="num text-5xl font-bold leading-none" data-testid="rest-remaining">
                  {formatDuration(restRemaining)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {REST_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => startRest(preset)}
                    className={`num min-h-11 min-w-11 rounded-lg border px-1.5 text-sm font-semibold ${
                      rest.totalSec === preset
                        ? 'border-text bg-text text-bg'
                        : 'border-border bg-surface-2 text-muted'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={skipRest}
                  className="min-h-11 rounded-lg px-2 text-[11px] font-semibold uppercase tracking-widest text-muted active:text-text"
                >
                  Skip
                </button>
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={rest.totalSec > 0 ? restRemaining / rest.totalSec : 0}
                tone="tier"
              />
            </div>
          </div>
        </div>
      )}

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Edit exercises">
        <div className="max-h-[60dvh] space-y-1 overflow-y-auto">
          {pool.map((candidate) => {
            const inSession = exercises.some((exercise) => exercise.id === candidate.id)
            const setCount = setsFor(candidate.id).length
            return (
              <button
                key={candidate.id}
                type="button"
                disabled={isPending}
                onClick={() =>
                  runMutation(async () => {
                    if (inSession) await removeExerciseAction(workoutId, candidate.id)
                    else await addExerciseAction(workoutId, candidate.id)
                  })
                }
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-2 text-left active:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-semibold">
                    {candidate.name}
                  </span>
                  {inSession && setCount > 0 && (
                    <span className="num block text-xs text-danger">
                      Removing deletes {setCount} logged {setCount === 1 ? 'set' : 'sets'}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 text-[11px] font-semibold uppercase tracking-widest ${
                    inSession ? 'text-danger' : 'text-success'
                  }`}
                >
                  {inSession ? 'Remove' : 'Add'}
                </span>
              </button>
            )
          })}
        </div>
        <Button variant="secondary" size="lg" full className="mt-3" onClick={() => setSheet(null)}>
          Done
        </Button>
      </Sheet>

      <Sheet open={sheet === 'finish'} onClose={() => setSheet(null)} title="Finish match">
        {totalSets > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Lock in <span className="num font-semibold text-text">{totalSets}</span>{' '}
              {totalSets === 1 ? 'set' : 'sets'} across{' '}
              <span className="num font-semibold text-text">{exercisesWithSets}</span>{' '}
              {exercisesWithSets === 1 ? 'exercise' : 'exercises'}. Your score and MMR update when
              the match ends.
            </p>
            <Button
              size="lg"
              full
              disabled={isPending}
              onClick={() =>
                runMutation(async () => {
                  await finishMatchAction(workoutId)
                })
              }
            >
              Finish match
            </Button>
            <Button variant="ghost" full onClick={() => setSheet(null)}>
              Keep playing
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              No sets logged yet. Log at least one set to finish, or abandon the match.
            </p>
            <Button
              variant="danger"
              size="lg"
              full
              disabled={isPending}
              onClick={() =>
                runMutation(async () => {
                  await abandonMatchAction(workoutId)
                })
              }
            >
              Abandon match
            </Button>
            <Button variant="ghost" full onClick={() => setSheet(null)}>
              Keep playing
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
    </div>
  )
}

export default ActiveWorkout
