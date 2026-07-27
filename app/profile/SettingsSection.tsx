'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { Sex } from '@/db/schema'
import { formatDuration } from '@/lib/date'
import { updateSettingsAction } from './actions'

type Editing = 'bodyweight' | 'sex' | 'rest' | null

const SEX_LABEL: Record<Sex, string> = { male: 'Male', female: 'Female' }

function SettingRow({
  label,
  value,
  sub,
  onEdit,
}: {
  label: string
  value: string
  sub?: string
  onEdit: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left active:bg-surface-2"
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted">
          {label}
        </span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="num text-lg font-bold">{value}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Edit
        </span>
      </span>
    </button>
  )
}

export function SettingsSection({
  bodyweightKg,
  sex,
  defaultRestSec,
}: {
  bodyweightKg: number
  sex: Sex
  defaultRestSec: number
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<Editing>(null)
  const [pending, startTransition] = useTransition()
  const [weightInput, setWeightInput] = useState(String(bodyweightKg))
  const [restInput, setRestInput] = useState(String(defaultRestSec))

  function save(patch: { bodyweightKg?: number; sex?: Sex; defaultRestSec?: number }) {
    startTransition(async () => {
      await updateSettingsAction(patch)
      setEditing(null)
      router.refresh()
    })
  }

  const weightValue = Number(weightInput)
  const weightValid = Number.isFinite(weightValue) && weightValue >= 30 && weightValue <= 300
  const restValue = Number(restInput)
  const restValid = Number.isInteger(restValue) && restValue >= 15 && restValue <= 600

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
      <SettingRow
        label="Bodyweight"
        value={`${bodyweightKg % 1 === 0 ? bodyweightKg : bodyweightKg.toFixed(1)} kg`}
        sub="Sets your exercise rank thresholds"
        onEdit={() => {
          setWeightInput(String(bodyweightKg))
          setEditing('bodyweight')
        }}
      />
      <SettingRow label="Sex" value={SEX_LABEL[sex]} onEdit={() => setEditing('sex')} />
      <SettingRow
        label="Rest Timer"
        value={formatDuration(defaultRestSec)}
        sub="Default between sets"
        onEdit={() => {
          setRestInput(String(defaultRestSec))
          setEditing('rest')
        }}
      />

      <Sheet open={editing === 'bodyweight'} onClose={() => setEditing(null)} title="Bodyweight">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (weightValid) save({ bodyweightKg: weightValue })
          }}
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={30}
              max={300}
              value={weightInput}
              onChange={(event) => setWeightInput(event.target.value)}
              autoFocus
              className="num h-14 w-full rounded-xl border border-border bg-surface-2 px-4 text-center text-2xl font-bold outline-none focus:border-text/40"
              aria-label="Bodyweight in kilograms"
            />
            <span className="shrink-0 text-sm font-semibold uppercase tracking-widest text-muted">
              kg
            </span>
          </div>
          <p className="mt-3 text-xs text-muted">
            Exercise ranks compare your lifts to bodyweight. Saving a new bodyweight
            recalculates every exercise rank immediately.
          </p>
          <Button type="submit" size="lg" full className="mt-4" disabled={!weightValid || pending}>
            Save
          </Button>
        </form>
      </Sheet>

      <Sheet open={editing === 'sex'} onClose={() => setEditing(null)} title="Sex">
        <p className="mb-3 text-xs text-muted">
          Rank thresholds differ by sex. Changing this recalculates exercise ranks.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['male', 'female'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="lg"
              variant={option === sex ? 'primary' : 'secondary'}
              disabled={pending}
              onClick={() => save({ sex: option })}
            >
              {SEX_LABEL[option]}
            </Button>
          ))}
        </div>
      </Sheet>

      <Sheet open={editing === 'rest'} onClose={() => setEditing(null)} title="Rest Timer">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (restValid) save({ defaultRestSec: restValue })
          }}
        >
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[60, 90, 120, 180].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={restValue === preset ? 'primary' : 'secondary'}
                onClick={() => setRestInput(String(preset))}
              >
                {preset}s
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              step="5"
              min={15}
              max={600}
              value={restInput}
              onChange={(event) => setRestInput(event.target.value)}
              className="num h-14 w-full rounded-xl border border-border bg-surface-2 px-4 text-center text-2xl font-bold outline-none focus:border-text/40"
              aria-label="Rest timer in seconds"
            />
            <span className="shrink-0 text-sm font-semibold uppercase tracking-widest text-muted">
              sec
            </span>
          </div>
          <Button type="submit" size="lg" full className="mt-4" disabled={!restValid || pending}>
            Save
          </Button>
        </form>
      </Sheet>
    </div>
  )
}

export default SettingsSection
