export interface SeedQuestTemplate {
  id: string;
  title: string;
  description: string;
  metric:
    | 'complete_push'
    | 'complete_pull'
    | 'complete_legs'
    | 'complete_any_session'
    | 'hit_pr'
    | 'complete_fast'
    | 'log_sets'
    | 'total_reps';
  target: number;
  xpReward: number;
}

export const seedQuestTemplates: SeedQuestTemplate[] = [
  {
    id: 'push-day',
    title: 'Push Day',
    description: 'Complete a Push session.',
    metric: 'complete_push',
    target: 1,
    xpReward: 150,
  },
  {
    id: 'pull-day',
    title: 'Pull Day',
    description: 'Complete a Pull session.',
    metric: 'complete_pull',
    target: 1,
    xpReward: 150,
  },
  {
    id: 'leg-day',
    title: 'Leg Day',
    description: 'Complete a Legs session.',
    metric: 'complete_legs',
    target: 1,
    xpReward: 150,
  },
  {
    id: 'new-record',
    title: 'New Record',
    description: 'Hit one all time PR.',
    metric: 'hit_pr',
    target: 1,
    xpReward: 200,
  },
  {
    id: 'close-window',
    title: 'Close The Window',
    description: 'Complete a fasting window.',
    metric: 'complete_fast',
    target: 1,
    xpReward: 175,
  },
  {
    id: 'volume-check',
    title: 'Volume Check',
    description: 'Log 15 sets today.',
    metric: 'log_sets',
    target: 15,
    xpReward: 175,
  },
  {
    id: 'clock-in',
    title: 'Clock In',
    description: 'Finish any ranked session.',
    metric: 'complete_any_session',
    target: 1,
    xpReward: 100,
  },
  {
    id: 'rep-machine',
    title: 'Rep Machine',
    description: 'Log 120 total reps today.',
    metric: 'total_reps',
    target: 120,
    xpReward: 150,
  },
];
