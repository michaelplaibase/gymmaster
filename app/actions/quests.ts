'use server'

import { ensureTodayQuests, type ActiveQuest } from '@/lib/data/quests'

// Guarantees today's daily quests exist, then returns them.
export async function ensureTodayQuestsAction(): Promise<ActiveQuest[]> {
  return ensureTodayQuests()
}
