import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { profile, type Profile, type Sex } from '@/db/schema'
import { levelFromXp } from '@/lib/rating'

// Creates the singleton id 1 row if missing.
export function getProfile(): Profile {
  const existing = db.select().from(profile).where(eq(profile.id, 1)).get()
  if (existing) return existing
  db.insert(profile).values({ id: 1, createdAt: new Date() }).onConflictDoNothing().run()
  return db.select().from(profile).where(eq(profile.id, 1)).get()!
}

export function isOnboarded(): boolean {
  return getProfile().onboardedAt !== null
}

export function saveOnboarding(input: {
  bodyweightKg: number
  sex: Sex
  defaultRestSec: number
}): void {
  getProfile()
  db.update(profile)
    .set({ ...input, onboardedAt: new Date() })
    .where(eq(profile.id, 1))
    .run()
}

export function updateProfile(
  input: Partial<{ bodyweightKg: number; sex: Sex; defaultRestSec: number }>
): void {
  if (Object.keys(input).length === 0) return
  getProfile()
  db.update(profile).set(input).where(eq(profile.id, 1)).run()
}

export function addXp(amount: number): {
  xpBefore: number
  xpAfter: number
  levelBefore: number
  levelAfter: number
  leveledUp: boolean
} {
  const current = getProfile()
  const xpBefore = current.xp
  const xpAfter = Math.max(0, xpBefore + amount)
  db.update(profile).set({ xp: xpAfter }).where(eq(profile.id, 1)).run()
  const levelBefore = levelFromXp(xpBefore).level
  const levelAfter = levelFromXp(xpAfter).level
  return { xpBefore, xpAfter, levelBefore, levelAfter, leveledUp: levelAfter > levelBefore }
}
