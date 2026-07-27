import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { dailyQuests, questTemplates } from '@/db/schema'
import { todayIso } from '@/lib/date'
import { pickDailyQuestIds, questProgressDelta, type QuestEvent, type QuestMetric } from '@/lib/rating'
import { addXp } from './profile'

export type ActiveQuest = {
  id: number
  templateId: string
  title: string
  description: string
  metric: QuestMetric
  progress: number
  target: number
  xpReward: number
  completed: boolean
}

export function getTodayQuests(dateIso?: string): ActiveQuest[] {
  const date = dateIso ?? todayIso()
  const rows = db
    .select({
      id: dailyQuests.id,
      templateId: dailyQuests.templateId,
      title: questTemplates.title,
      description: questTemplates.description,
      metric: questTemplates.metric,
      progress: dailyQuests.progress,
      target: dailyQuests.target,
      xpReward: dailyQuests.xpReward,
      completedAt: dailyQuests.completedAt,
    })
    .from(dailyQuests)
    .innerJoin(questTemplates, eq(dailyQuests.templateId, questTemplates.id))
    .where(eq(dailyQuests.date, date))
    .orderBy(asc(dailyQuests.id))
    .all()
  return rows.map((row) => ({
    id: row.id,
    templateId: row.templateId,
    title: row.title,
    description: row.description,
    metric: row.metric as QuestMetric,
    progress: row.progress,
    target: row.target,
    xpReward: row.xpReward,
    completed: row.completedAt !== null,
  }))
}

// Picks 3 quests for the day and inserts them once. Idempotent: repeat calls
// on the same date never create duplicates and never reset progress.
export function ensureTodayQuests(dateIso?: string): ActiveQuest[] {
  const date = dateIso ?? todayIso()
  const existing = getTodayQuests(date)
  if (existing.length > 0) return existing

  const templates = db.select().from(questTemplates).all()
  const pickedIds = pickDailyQuestIds(
    date,
    templates.map((template) => template.id)
  )
  for (const templateId of pickedIds) {
    const template = templates.find((candidate) => candidate.id === templateId)
    if (!template) continue
    db.insert(dailyQuests)
      .values({
        date,
        templateId,
        progress: 0,
        target: template.target,
        xpReward: template.xpReward,
      })
      .onConflictDoNothing()
      .run()
  }
  return getTodayQuests(date)
}

// Advances every matching incomplete quest for today. A quest that reaches its
// target is marked completed and awards its XP exactly once.
export function applyQuestEvent(
  event: QuestEvent,
  dateIso?: string
): { completed: ActiveQuest[]; xpAwarded: number } {
  const date = dateIso ?? todayIso()
  const quests = ensureTodayQuests(date)
  const completed: ActiveQuest[] = []
  let xpAwarded = 0

  for (const quest of quests) {
    if (quest.completed) continue
    const delta = questProgressDelta(quest.metric, event)
    if (delta <= 0) continue
    const progress = Math.min(quest.target, quest.progress + delta)
    const done = progress >= quest.target
    db.update(dailyQuests)
      .set(done ? { progress, completedAt: new Date() } : { progress })
      .where(eq(dailyQuests.id, quest.id))
      .run()
    if (done) {
      addXp(quest.xpReward)
      xpAwarded += quest.xpReward
      completed.push({ ...quest, progress, completed: true })
    }
  }

  return { completed, xpAwarded }
}
