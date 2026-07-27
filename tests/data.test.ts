import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

// The db client reads DATABASE_PATH at import time, so point it at a
// temporary file BEFORE dynamically importing anything that touches the db.
const dbPath = `/tmp/ranked-data-test-${process.pid}.db`
process.env.DATABASE_PATH = dbPath

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const childEnv = { ...process.env, DATABASE_PATH: dbPath }

execSync(`npx drizzle-kit push --dialect=sqlite --schema=./db/schema.ts --url=${dbPath}`, {
  cwd: repoRoot,
  env: childEnv,
  stdio: 'pipe',
})
execSync('npx tsx scripts/seed.ts', { cwd: repoRoot, env: childEnv, stdio: 'pipe' })

const { sqlite } = await import('@/db/client')
const { getProfile, isOnboarded, saveOnboarding, addXp } = await import('@/lib/data/profile')
const { defaultTemplate, getThresholds } = await import('@/lib/data/exercises')
const { getRating, recordSession } = await import('@/lib/data/ratings')
const { ensureTodayQuests, getTodayQuests, applyQuestEvent } = await import('@/lib/data/quests')

afterAll(() => {
  sqlite.close()
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(path.join(`${dbPath}${suffix}`), { force: true })
  }
})

describe('profile', () => {
  it('getProfile creates the id 1 row when missing', () => {
    sqlite.prepare('DELETE FROM profile').run()
    const created = getProfile()
    expect(created.id).toBe(1)
    expect(created.xp).toBe(0)
    expect(created.onboardedAt).toBeNull()
  })

  it('saveOnboarding marks the profile as onboarded', () => {
    expect(isOnboarded()).toBe(false)
    saveOnboarding({ bodyweightKg: 82.5, sex: 'male', defaultRestSec: 120 })
    expect(isOnboarded()).toBe(true)
    const updated = getProfile()
    expect(updated.bodyweightKg).toBe(82.5)
    expect(updated.defaultRestSec).toBe(120)
  })

  it('addXp reports a level up across the level boundary', () => {
    sqlite.prepare('UPDATE profile SET xp = 0 WHERE id = 1').run()
    // Level 1 spans 100 XP, so 150 XP lands inside level 2.
    const up = addXp(150)
    expect(up).toEqual({
      xpBefore: 0,
      xpAfter: 150,
      levelBefore: 1,
      levelAfter: 2,
      leveledUp: true,
    })
    const flat = addXp(10)
    expect(flat.leveledUp).toBe(false)
    expect(flat.xpAfter).toBe(160)
  })
})

describe('exercises', () => {
  it('defaultTemplate returns 5 exercises for each workout type', () => {
    for (const type of ['push', 'pull', 'legs'] as const) {
      const template = defaultTemplate(type)
      expect(template).toHaveLength(5)
      expect(template.every((exercise) => exercise.workoutType === type)).toBe(true)
      expect(template.every((exercise) => exercise.inDefaultTemplate)).toBe(true)
    }
  })

  it('getThresholds returns 6 ascending numbers', () => {
    const thresholds = getThresholds('barbell-bench-press', 'male')
    expect(thresholds).toHaveLength(6)
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1])
    }
  })
})

describe('ratings', () => {
  it('getRating creates a missing row at mmr 500', () => {
    sqlite.prepare("DELETE FROM ratings WHERE playlist = 'legs'").run()
    const rating = getRating('legs')
    expect(rating.mmr).toBe(500)
    expect(rating.sessionsPlayed).toBe(0)
  })

  it('applies rawDelta as given, without doubling', () => {
    const result = recordSession('pull', 10)
    expect(result.mmrBefore).toBe(500)
    expect(result.mmrAfter).toBe(510)
    expect(result.delta).toBe(10)
  })

  it('suppresses promoted and demoted during placements and floors at 0', () => {
    // Placement 1 of 3: 500 to 620 crosses silver into gold, still no promotion.
    const first = recordSession('push', 120)
    expect(first.wasPlacement).toBe(true)
    expect(first.mmrAfter).toBe(620)
    expect(first.promoted).toBe(false)
    expect(first.demoted).toBe(false)
    expect(first.sessionsPlayedAfter).toBe(1)
    expect(first.placementsRemaining).toBe(2)
    expect(first.placedNow).toBe(false)

    // Placement 2 of 3: floors at 0 and reports the applied delta.
    const second = recordSession('push', -700)
    expect(second.mmrAfter).toBe(0)
    expect(second.delta).toBe(-620)
    expect(second.demoted).toBe(false)

    // Placement 3 of 3: placedNow fires exactly on the third session.
    const third = recordSession('push', 50)
    expect(third.wasPlacement).toBe(true)
    expect(third.placedNow).toBe(true)
    expect(third.sessionsPlayedAfter).toBe(3)
    expect(third.placementsRemaining).toBe(0)
    expect(third.promoted).toBe(false)
  })

  it('reports promoted and demoted across rank boundaries after placements', () => {
    // 50 to 350: Bronze III into Silver III.
    const promo = recordSession('push', 300)
    expect(promo.wasPlacement).toBe(false)
    expect(promo.rankBefore.tier).toBe('bronze')
    expect(promo.rankAfter.tier).toBe('silver')
    expect(promo.promoted).toBe(true)
    expect(promo.demoted).toBe(false)
    expect(promo.placedNow).toBe(false)

    // 350 to 290: back down into bronze.
    const demo = recordSession('push', -60)
    expect(demo.rankAfter.tier).toBe('bronze')
    expect(demo.promoted).toBe(false)
    expect(demo.demoted).toBe(true)
  })
})

describe('quests', () => {
  it('ensureTodayQuests is idempotent and preserves progress', () => {
    const date = '2026-02-02' // picks volume-check, leg-day, new-record
    const first = ensureTodayQuests(date)
    expect(first).toHaveLength(3)
    const ids = first.map((quest) => quest.templateId).sort()
    expect(ids).toEqual(['leg-day', 'new-record', 'volume-check'])

    // Advance volume-check (log 5 of 15 sets) without completing anything.
    const progressed = applyQuestEvent(
      { kind: 'workout_completed', workoutType: 'push', setCount: 5, totalReps: 0, prCount: 0 },
      date
    )
    expect(progressed.completed).toHaveLength(0)

    const again = ensureTodayQuests(date)
    expect(again).toHaveLength(3)
    expect(again.map((quest) => quest.id).sort()).toEqual(
      first.map((quest) => quest.id).sort()
    )
    const volumeCheck = again.find((quest) => quest.templateId === 'volume-check')
    expect(volumeCheck?.progress).toBe(5)
    expect(getTodayQuests(date)).toHaveLength(3)
  })

  it('applyQuestEvent awards XP exactly once per quest', () => {
    const date = '2026-01-15' // picks close-window, new-record, clock-in
    ensureTodayQuests(date)
    const event = {
      kind: 'workout_completed',
      workoutType: 'push',
      setCount: 3,
      totalReps: 24,
      prCount: 1,
    } as const

    const xpBefore = getProfile().xp
    const first = applyQuestEvent(event, date)
    const completedIds = first.completed.map((quest) => quest.templateId).sort()
    expect(completedIds).toEqual(['clock-in', 'new-record'])
    expect(first.xpAwarded).toBe(300) // new-record 200 + clock-in 100
    expect(getProfile().xp).toBe(xpBefore + 300)

    const second = applyQuestEvent(event, date)
    expect(second.completed).toHaveLength(0)
    expect(second.xpAwarded).toBe(0)
    expect(getProfile().xp).toBe(xpBefore + 300)

    // The remaining quest still completes normally afterwards.
    const fast = applyQuestEvent({ kind: 'fast_completed' }, date)
    expect(fast.completed.map((quest) => quest.templateId)).toEqual(['close-window'])
    expect(fast.xpAwarded).toBe(175)
  })
})
