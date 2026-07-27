'use server'

import { revalidatePath } from 'next/cache'
import type { Sex } from '@/db/schema'
import { updateProfile } from '@/lib/data/profile'

export async function updateSettingsAction(input: {
  bodyweightKg?: number
  sex?: Sex
  defaultRestSec?: number
}): Promise<void> {
  const patch: Partial<{ bodyweightKg: number; sex: Sex; defaultRestSec: number }> = {}
  if (input.bodyweightKg !== undefined) {
    if (!Number.isFinite(input.bodyweightKg) || input.bodyweightKg < 30 || input.bodyweightKg > 300) {
      throw new Error('Bodyweight must be between 30 and 300 kg')
    }
    patch.bodyweightKg = input.bodyweightKg
  }
  if (input.sex !== undefined) {
    if (input.sex !== 'male' && input.sex !== 'female') throw new Error('Invalid sex')
    patch.sex = input.sex
  }
  if (input.defaultRestSec !== undefined) {
    if (
      !Number.isInteger(input.defaultRestSec) ||
      input.defaultRestSec < 15 ||
      input.defaultRestSec > 600
    ) {
      throw new Error('Rest timer must be between 15 and 600 seconds')
    }
    patch.defaultRestSec = input.defaultRestSec
  }
  updateProfile(patch)
  revalidatePath('/profile')
  revalidatePath('/exercises')
}
