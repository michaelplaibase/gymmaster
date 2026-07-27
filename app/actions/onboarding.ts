'use server'

import { redirect } from 'next/navigation'
import { saveOnboarding } from '@/lib/data/profile'
import type { Sex } from '@/db/schema'

const REST_OPTIONS = [60, 90, 120, 180]

export async function completeOnboarding(input: {
  bodyweightKg: number
  sex: Sex
  defaultRestSec: number
}): Promise<void> {
  const bodyweightKg = Math.round(Number(input.bodyweightKg) * 10) / 10
  if (!Number.isFinite(bodyweightKg) || bodyweightKg < 30 || bodyweightKg > 300) {
    throw new Error('Bodyweight must be between 30 and 300 kg')
  }
  if (input.sex !== 'male' && input.sex !== 'female') {
    throw new Error('Invalid sex')
  }
  if (!REST_OPTIONS.includes(input.defaultRestSec)) {
    throw new Error('Invalid rest timer')
  }
  saveOnboarding({ bodyweightKg, sex: input.sex, defaultRestSec: input.defaultRestSec })
  redirect('/')
}
