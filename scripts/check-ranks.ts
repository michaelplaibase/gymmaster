// Proof harness: verifies the seeded thresholds and the rating engine agree.
// Reads exercises and thresholds straight from the SQLite database, then runs
// the lib/rating engine against them and prints three proof tables.
// Run with: npm run check:ranks

import fs from 'node:fs';
import Database from 'better-sqlite3';
import {
  TIERS,
  rankFromRatio,
  setE1rm,
  strengthRatio,
  tierLabel,
  type LoadType,
  type Rank,
  type Tier,
} from '../lib/rating';

const DB_PATH = process.env.DATABASE_PATH ?? './data/ranked.db';

const LIFTS = [
  'barbell-bench-press',
  'back-squat',
  'deadlift',
  'overhead-press',
  'barbell-row',
  'pull-up',
] as const;

type LiftId = (typeof LIFTS)[number];

type SampleSet = { weightKg: number; reps: number };

// Sample top sets per bodyweight (weight kg x reps). For pull-up the weight is
// ADDED weight on top of bodyweight.
const SAMPLE_SETS: Record<number, Record<LiftId, SampleSet>> = {
  75: {
    'barbell-bench-press': { weightKg: 85, reps: 5 },
    'back-squat': { weightKg: 120, reps: 5 },
    deadlift: { weightKg: 150, reps: 5 },
    'overhead-press': { weightKg: 50, reps: 5 },
    'barbell-row': { weightKg: 70, reps: 8 },
    'pull-up': { weightKg: 0, reps: 12 },
  },
  85: {
    'barbell-bench-press': { weightKg: 100, reps: 5 },
    'back-squat': { weightKg: 140, reps: 5 },
    deadlift: { weightKg: 180, reps: 5 },
    'overhead-press': { weightKg: 60, reps: 5 },
    'barbell-row': { weightKg: 85, reps: 8 },
    'pull-up': { weightKg: 10, reps: 8 },
  },
  95: {
    'barbell-bench-press': { weightKg: 120, reps: 3 },
    'back-squat': { weightKg: 170, reps: 3 },
    deadlift: { weightKg: 220, reps: 3 },
    'overhead-press': { weightKg: 70, reps: 5 },
    'barbell-row': { weightKg: 100, reps: 6 },
    'pull-up': { weightKg: 25, reps: 5 },
  },
};

// Table 2: an 80 kg male, big four, five singles each that should look like a
// beginner, novice, intermediate, advanced and elite lifter respectively.
const LADDER_BW = 80;
const LADDER_LEVELS = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'] as const;
const LADDER_LOADS: Record<string, number[]> = {
  'barbell-bench-press': [45, 65, 85, 110, 145],
  'back-squat': [65, 85, 110, 150, 225],
  deadlift: [85, 105, 130, 170, 245],
  'overhead-press': [30, 42.5, 55, 72.5, 102.5],
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function openDb(): Database.Database {
  if (!fs.existsSync(DB_PATH)) {
    fail(
      `Database not found at ${DB_PATH}.\n` +
        `Run 'npm run setup' (or 'npm run db:reset') first, then re-run 'npm run check:ranks'.`,
    );
  }
  return new Database(DB_PATH, { readonly: true, fileMustExist: true });
}

type ExerciseRow = { id: string; name: string; load_type: string };
type ThresholdRow = { exercise_id: string; tier: string; value: number };

function loadFromDb(sqlite: Database.Database): {
  exercises: Map<string, { name: string; loadType: LoadType }>;
  thresholds: Map<string, number[]>;
} {
  let exerciseRows: ExerciseRow[];
  let thresholdRows: ThresholdRow[];
  try {
    exerciseRows = sqlite
      .prepare('SELECT id, name, load_type FROM exercises')
      .all() as ExerciseRow[];
    thresholdRows = sqlite
      .prepare("SELECT exercise_id, tier, value FROM exercise_thresholds WHERE sex = 'male'")
      .all() as ThresholdRow[];
  } catch (err) {
    fail(
      `Could not read seeded tables from ${DB_PATH} (${(err as Error).message}).\n` +
        `Run 'npm run setup' (or 'npm run db:reset') first, then re-run 'npm run check:ranks'.`,
    );
  }

  const exercises = new Map<string, { name: string; loadType: LoadType }>();
  for (const row of exerciseRows) {
    exercises.set(row.id, { name: row.name, loadType: row.load_type as LoadType });
  }

  const byExercise = new Map<string, Partial<Record<Tier, number>>>();
  for (const row of thresholdRows) {
    const bucket = byExercise.get(row.exercise_id) ?? {};
    bucket[row.tier as Tier] = row.value;
    byExercise.set(row.exercise_id, bucket);
  }

  const thresholds = new Map<string, number[]>();
  for (const [exerciseId, bucket] of byExercise) {
    const ordered: number[] = [];
    for (const tier of TIERS) {
      const value = bucket[tier];
      if (value === undefined) {
        fail(`Seed problem: ${exerciseId} is missing the male '${tier}' threshold. Re-run 'npm run db:reset'.`);
      }
      ordered.push(value);
    }
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i] <= ordered[i - 1]) {
        fail(
          `Seed problem: ${exerciseId} male thresholds are not strictly ascending ` +
            `(${ordered.join(', ')}). Re-run 'npm run db:reset'.`,
        );
      }
    }
    thresholds.set(exerciseId, ordered);
  }

  for (const lift of LIFTS) {
    if (!exercises.has(lift)) fail(`Seed problem: exercise '${lift}' not found in the database.`);
    if (!thresholds.has(lift)) fail(`Seed problem: no male thresholds for '${lift}' in the database.`);
  }

  return { exercises, thresholds };
}

function kg(value: number): string {
  return value.toFixed(1);
}

function ratioStr(value: number): string {
  return value.toFixed(3);
}

function renderTable(headers: string[], rows: string[][], rightAligned: boolean[]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => row[i].length)),
  );
  const pad = (cell: string, i: number): string =>
    rightAligned[i] ? cell.padStart(widths[i]) : cell.padEnd(widths[i]);
  const line = (cells: string[]): string => cells.map(pad).join('  ');
  const rule = widths.map((w) => '-'.repeat(w)).join('  ');
  return [line(headers), rule, ...rows.map(line)].join('\n');
}

function main(): void {
  const sqlite = openDb();
  const { exercises, thresholds } = loadFromDb(sqlite);
  sqlite.close();

  const rankFor = (exerciseId: string, set: SampleSet, bodyweightKg: number) => {
    const loadType = exercises.get(exerciseId)!.loadType;
    const e1rmValue = setE1rm(set, loadType, bodyweightKg);
    const ratio = strengthRatio(e1rmValue, bodyweightKg);
    const rank = rankFromRatio(ratio, thresholds.get(exerciseId)!);
    return { e1rmValue, ratio, rank, loadType };
  };

  const setLabel = (set: SampleSet, loadType: LoadType): string =>
    loadType === 'bodyweight'
      ? `+${kg(set.weightKg)} x ${set.reps}`
      : `${kg(set.weightKg)} x ${set.reps}`;

  // Table 1: realistic top sets for a male lifter at three bodyweights.
  console.log('TABLE 1: male lifter, sample top sets at bodyweight 75 / 85 / 95 kg');
  console.log('(pull-up weight is ADDED load on top of bodyweight)');
  let benchAt85: Rank | null = null;
  for (const bw of [75, 85, 95]) {
    console.log(`\nBodyweight ${kg(bw)} kg:`);
    const rows: string[][] = [];
    for (const lift of LIFTS) {
      const set = SAMPLE_SETS[bw][lift];
      const { e1rmValue, ratio, rank, loadType } = rankFor(lift, set, bw);
      if (bw === 85 && lift === 'barbell-bench-press') benchAt85 = rank;
      rows.push([
        exercises.get(lift)!.name,
        setLabel(set, loadType),
        kg(e1rmValue),
        ratioStr(ratio),
        rank.label,
      ]);
    }
    console.log(
      renderTable(
        ['Exercise', 'Set (kg x reps)', 'e1RM (kg)', 'Ratio', 'Rank'],
        rows,
        [false, true, true, true, false],
      ),
    );
  }

  // Table 2: sanity ladder for an 80 kg male across the big four, singles.
  console.log(`\nTABLE 2: ${kg(LADDER_BW)} kg male, big four, five singles from beginner to elite`);
  const ladderRows: string[][] = [];
  for (const [lift, loads] of Object.entries(LADDER_LOADS)) {
    loads.forEach((weightKg, i) => {
      const set = { weightKg, reps: 1 };
      const { e1rmValue, ratio, rank } = rankFor(lift, set, LADDER_BW);
      ladderRows.push([
        exercises.get(lift)!.name,
        LADDER_LEVELS[i],
        `${kg(weightKg)} x 1`,
        kg(e1rmValue),
        ratioStr(ratio),
        rank.label,
      ]);
    });
  }
  console.log(
    renderTable(
      ['Exercise', 'Level', 'Single', 'e1RM (kg)', 'Ratio', 'Rank'],
      ladderRows,
      [false, false, true, true, true, false],
    ),
  );

  // Table 3: exact tier entry points for an 80 kg male (division III of each tier).
  console.log(`\nTABLE 3: tier entry points (division III) for an ${kg(LADDER_BW)} kg male`);
  const entryRows: string[][] = [];
  for (const lift of ['barbell-bench-press', 'back-squat', 'deadlift']) {
    const entries = thresholds.get(lift)!;
    TIERS.forEach((tier, i) => {
      entryRows.push([
        exercises.get(lift)!.name,
        `${tierLabel(tier)} III`,
        ratioStr(entries[i]),
        kg(entries[i] * LADDER_BW),
      ]);
    });
  }
  console.log(
    renderTable(
      ['Exercise', 'Enters at', 'Ratio', 'e1RM (kg)'],
      entryRows,
      [false, false, true, true],
    ),
  );

  // Wiring assertion: the 85 kg lifter's bench 100x5 must land in Gold..Diamond.
  const okTiers: (Tier | null)[] = ['gold', 'platinum', 'diamond'];
  if (!benchAt85 || !okTiers.includes(benchAt85.tier)) {
    fail(
      `\nWIRING CHECK FAILED: 85 kg bench 100x5 came out as '${benchAt85?.label ?? 'missing'}', ` +
        `expected a rank in the Gold to Diamond range. The thresholds and the rating engine disagree.`,
    );
  }
  console.log(
    `\nWiring check passed: 85 kg bench 100x5 ranks as ${benchAt85.label} (within Gold to Diamond).`,
  );
}

main();
