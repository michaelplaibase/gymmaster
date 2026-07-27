'use server'

import {
  completeFast,
  endFastEarly,
  startFast,
  type FastResult,
} from '@/lib/data/fasts'

export async function startFastAction(input: {
  preset: string
  targetSec: number
}): Promise<number> {
  return startFast(input)
}

export async function completeFastAction(id: number): Promise<FastResult> {
  return completeFast(id)
}

export async function endFastEarlyAction(id: number): Promise<FastResult> {
  return endFastEarly(id)
}
