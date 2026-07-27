import { count } from 'drizzle-orm';
import { db } from '../db/client';
import {
  exercises,
  exerciseThresholds,
  profile,
  questTemplates,
  ratings,
  type Playlist,
  type Sex,
  type Tier,
} from '../db/schema';
import { seedExercises } from '../db/seed-data/exercises';
import { seedQuestTemplates } from '../db/seed-data/quests';

const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald'];
const SEXES: Sex[] = ['male', 'female'];
const PLAYLISTS: Playlist[] = ['push', 'pull', 'legs', 'fasting'];

function seedExercisesAndThresholds(): void {
  for (const ex of seedExercises) {
    const row = {
      name: ex.name,
      workoutType: ex.workoutType,
      targetMuscles: ex.targetMuscles,
      equipment: ex.equipment,
      loadType: ex.loadType,
      loadNote: ex.loadNote ?? null,
      execution: ex.execution,
      cues: ex.cues,
      mistakes: ex.mistakes,
      inDefaultTemplate: ex.inDefaultTemplate,
      sortOrder: ex.sortOrder,
    };
    db.insert(exercises)
      .values({ id: ex.id, ...row })
      .onConflictDoUpdate({ target: exercises.id, set: row })
      .run();

    for (const sex of SEXES) {
      const values = ex.thresholds[sex];
      if (values.length !== TIERS.length) {
        throw new Error(`${ex.id} has ${values.length} ${sex} thresholds, expected ${TIERS.length}`);
      }
      values.forEach((value, i) => {
        db.insert(exerciseThresholds)
          .values({ exerciseId: ex.id, sex, tier: TIERS[i], value })
          .onConflictDoUpdate({
            target: [
              exerciseThresholds.exerciseId,
              exerciseThresholds.sex,
              exerciseThresholds.tier,
            ],
            set: { value },
          })
          .run();
      });
    }
  }
}

function seedQuests(): void {
  for (const quest of seedQuestTemplates) {
    const { id, ...row } = quest;
    db.insert(questTemplates)
      .values(quest)
      .onConflictDoUpdate({ target: questTemplates.id, set: row })
      .run();
  }
}

function ensureRatings(): void {
  for (const playlist of PLAYLISTS) {
    db.insert(ratings)
      .values({ playlist, mmr: 500, sessionsPlayed: 0 })
      .onConflictDoNothing()
      .run();
  }
}

function ensureProfile(): void {
  db.insert(profile)
    .values({ id: 1, createdAt: new Date() })
    .onConflictDoNothing()
    .run();
}

function main(): void {
  seedExercisesAndThresholds();
  seedQuests();
  ensureRatings();
  ensureProfile();

  const summary = [
    ['exercises', db.select({ n: count() }).from(exercises).get()?.n ?? 0],
    ['exercise_thresholds', db.select({ n: count() }).from(exerciseThresholds).get()?.n ?? 0],
    ['quest_templates', db.select({ n: count() }).from(questTemplates).get()?.n ?? 0],
    ['ratings', db.select({ n: count() }).from(ratings).get()?.n ?? 0],
    ['profile', db.select({ n: count() }).from(profile).get()?.n ?? 0],
  ] as const;

  for (const [table, n] of summary) {
    console.log(`${table}: ${n} rows`);
  }
}

try {
  main();
} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
}
