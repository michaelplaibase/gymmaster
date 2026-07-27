import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  bodyweightKg: real('bodyweight_kg').notNull().default(80),
  sex: text('sex', { enum: ['male', 'female'] }).notNull().default('male'),
  defaultRestSec: integer('default_rest_sec').notNull().default(90),
  xp: integer('xp').notNull().default(0),
  onboardedAt: integer('onboarded_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  workoutType: text('workout_type', { enum: ['push', 'pull', 'legs'] }).notNull(),
  targetMuscles: text('target_muscles', { mode: 'json' }).$type<string[]>().notNull(),
  equipment: text('equipment').notNull(),
  loadType: text('load_type', { enum: ['external', 'bodyweight'] }).notNull(),
  loadNote: text('load_note'),
  execution: text('execution', { mode: 'json' }).$type<string[]>().notNull(),
  cues: text('cues', { mode: 'json' }).$type<string[]>().notNull(),
  mistakes: text('mistakes', { mode: 'json' }).$type<string[]>().notNull(),
  inDefaultTemplate: integer('in_default_template', { mode: 'boolean' }).notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const exerciseThresholds = sqliteTable(
  'exercise_thresholds',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    sex: text('sex', { enum: ['male', 'female'] }).notNull(),
    tier: text('tier', {
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald'],
    }).notNull(),
    value: real('value').notNull(),
  },
  (table) => [
    uniqueIndex('exercise_thresholds_exercise_sex_tier_idx').on(
      table.exerciseId,
      table.sex,
      table.tier,
    ),
  ],
);

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutType: text('workout_type', { enum: ['push', 'pull', 'legs'] }).notNull(),
  status: text('status', { enum: ['active', 'completed'] })
    .notNull()
    .default('active'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  score: real('score'),
  mmrBefore: integer('mmr_before'),
  mmrAfter: integer('mmr_after'),
  mmrDelta: integer('mmr_delta'),
  wasPlacement: integer('was_placement', { mode: 'boolean' })
    .notNull()
    .default(false),
  prCount: integer('pr_count').notNull().default(0),
  xpEarned: integer('xp_earned').notNull().default(0),
});

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
  },
  (table) => [
    uniqueIndex('workout_exercises_workout_exercise_idx').on(
      table.workoutId,
      table.exerciseId,
    ),
  ],
);

export const workoutSets = sqliteTable('workout_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id),
  setIndex: integer('set_index').notNull(),
  // For loadType 'bodyweight' exercises this is the ADDED weight and may be 0.
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  loggedAt: integer('logged_at', { mode: 'timestamp_ms' }).notNull(),
});

export const fasts = sqliteTable('fasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  preset: text('preset').notNull(),
  targetSec: integer('target_sec').notNull(),
  status: text('status', { enum: ['active', 'completed', 'ended_early'] })
    .notNull()
    .default('active'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  mmrBefore: integer('mmr_before'),
  mmrAfter: integer('mmr_after'),
  mmrDelta: integer('mmr_delta'),
  wasPlacement: integer('was_placement', { mode: 'boolean' })
    .notNull()
    .default(false),
  xpEarned: integer('xp_earned').notNull().default(0),
  streakAfter: integer('streak_after'),
});

export const ratings = sqliteTable('ratings', {
  playlist: text('playlist', {
    enum: ['push', 'pull', 'legs', 'fasting'],
  }).primaryKey(),
  mmr: integer('mmr').notNull().default(500),
  sessionsPlayed: integer('sessions_played').notNull().default(0),
});

export const questTemplates = sqliteTable('quest_templates', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  metric: text('metric').notNull(),
  target: integer('target').notNull(),
  xpReward: integer('xp_reward').notNull(),
});

export const dailyQuests = sqliteTable(
  'daily_quests',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    templateId: text('template_id')
      .notNull()
      .references(() => questTemplates.id),
    progress: integer('progress').notNull().default(0),
    target: integer('target').notNull(),
    xpReward: integer('xp_reward').notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('daily_quests_date_template_idx').on(table.date, table.templateId),
  ],
);

export type Profile = typeof profile.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type Fast = typeof fasts.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type QuestTemplate = typeof questTemplates.$inferSelect;
export type DailyQuest = typeof dailyQuests.$inferSelect;

export type Tier = (typeof exerciseThresholds.$inferSelect)['tier'];
export type Playlist = Rating['playlist'];
export type WorkoutType = Workout['workoutType'];
export type Sex = Profile['sex'];
