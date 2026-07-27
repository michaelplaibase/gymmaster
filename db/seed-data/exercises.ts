import type { WorkoutType } from '../schema';

export interface SeedExercise {
  id: string;
  name: string;
  workoutType: WorkoutType;
  targetMuscles: string[];
  equipment: string;
  loadType: 'external' | 'bodyweight';
  loadNote?: string;
  execution: string[];
  cues: string[];
  mistakes: string[];
  inDefaultTemplate: boolean;
  sortOrder: number;
  // e1RM divided by bodyweight, ascending tier order:
  // bronze, silver, gold, platinum, diamond, emerald.
  thresholds: { male: number[]; female: number[] };
}

export const seedExercises: SeedExercise[] = [
  // PUSH
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    workoutType: 'push',
    targetMuscles: ['chest', 'front delts', 'triceps'],
    equipment: 'Barbell and flat bench',
    loadType: 'external',
    execution: [
      'Lie on the bench with your eyes roughly under the bar and your feet flat on the floor.',
      'Grip the bar slightly wider than shoulder width and pull your shoulder blades back and down.',
      'Unrack the bar and hold it directly over your shoulders with straight arms.',
      'Lower the bar under control until it touches your mid chest.',
      'Press the bar back up and slightly toward your face until your elbows lock out.',
    ],
    cues: [
      'Keep your shoulder blades pinned together against the bench.',
      'Drive your feet into the floor to create leg drive.',
      'Keep your elbows at roughly 45 degrees from your torso, not flared straight out.',
    ],
    mistakes: [
      'Bouncing the bar off the chest instead of controlling the descent.',
      'Letting the hips rise off the bench during the press.',
      'Cutting the range short and never touching the chest.',
    ],
    inDefaultTemplate: true,
    sortOrder: 1,
    thresholds: {
      male: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75],
      female: [0.25, 0.4, 0.55, 0.75, 0.95, 1.15],
    },
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    workoutType: 'push',
    targetMuscles: ['front delts', 'side delts', 'triceps', 'upper chest'],
    equipment: 'Barbell and rack',
    loadType: 'external',
    execution: [
      'Set the bar at upper chest height in the rack and grip it just outside shoulder width.',
      'Unrack the bar so it rests on your front delts with your forearms vertical.',
      'Brace your core and squeeze your glutes to keep your ribs down.',
      'Press the bar straight up, moving your head slightly back to let it pass your face.',
      'Lock out with the bar directly over the back of your head, then lower it under control to your chest.',
    ],
    cues: [
      'Squeeze the bar hard and keep your wrists stacked over your elbows.',
      'Push your head through the window once the bar clears your face.',
      'Keep your glutes and abs tight so your lower back does not arch.',
    ],
    mistakes: [
      'Turning the lift into an incline press by leaning far back.',
      'Pressing the bar forward around the face instead of in a straight line.',
    ],
    inDefaultTemplate: true,
    sortOrder: 2,
    thresholds: {
      male: [0.35, 0.5, 0.65, 0.85, 1.05, 1.25],
      female: [0.18, 0.28, 0.38, 0.5, 0.65, 0.8],
    },
  },
  {
    id: 'incline-barbell-bench-press',
    name: 'Incline Barbell Bench Press',
    workoutType: 'push',
    targetMuscles: ['upper chest', 'front delts', 'triceps'],
    equipment: 'Barbell and incline bench',
    loadType: 'external',
    execution: [
      'Set the bench to an incline of roughly 30 degrees.',
      'Lie back, plant your feet, and grip the bar slightly wider than shoulder width.',
      'Unrack the bar and hold it over your upper chest with straight arms.',
      'Lower the bar under control until it touches just below your collarbones.',
      'Press the bar back up until your elbows are locked out.',
    ],
    cues: [
      'Keep your chest proud and your shoulder blades retracted throughout.',
      'Touch high on the chest, near the collarbones.',
      'Control the bar down for a two second descent.',
    ],
    mistakes: [
      'Setting the incline too steep and turning it into a shoulder press.',
      'Letting the bar drift toward the belly and losing the upper chest emphasis.',
    ],
    inDefaultTemplate: true,
    sortOrder: 3,
    thresholds: {
      male: [0.4, 0.6, 0.85, 1.05, 1.3, 1.5],
      female: [0.2, 0.32, 0.45, 0.6, 0.78, 0.95],
    },
  },
  {
    id: 'dips',
    name: 'Dips',
    workoutType: 'push',
    targetMuscles: ['chest', 'triceps', 'front delts'],
    equipment: 'Dip bars',
    loadType: 'bodyweight',
    loadNote: 'Log any ADDED weight. Leave at 0 for bodyweight reps.',
    execution: [
      'Grip the bars and press up to a full support position with locked elbows.',
      'Lean your torso slightly forward and bend your knees if needed.',
      'Lower yourself under control until your upper arms are about parallel to the floor.',
      'Press back up to a full lockout without swinging.',
    ],
    cues: [
      'Keep your shoulders pulled down away from your ears.',
      'Lean forward to bias the chest, stay upright to bias the triceps.',
      'Control the bottom position instead of dropping into it.',
    ],
    mistakes: [
      'Cutting the depth short and only doing the top half of the rep.',
      'Sinking into the shoulders at the bottom instead of staying tight.',
      'Kipping with the legs to bounce out of the bottom.',
    ],
    inDefaultTemplate: true,
    sortOrder: 4,
    thresholds: {
      male: [1.15, 1.3, 1.5, 1.7, 1.9, 2.1],
      female: [1.05, 1.15, 1.3, 1.48, 1.68, 1.9],
    },
  },
  {
    id: 'cable-triceps-pushdown',
    name: 'Cable Triceps Pushdown',
    workoutType: 'push',
    targetMuscles: ['triceps', 'forearms'],
    equipment: 'Cable stack with straight bar or rope',
    loadType: 'external',
    execution: [
      'Set the cable attachment at the top of the stack and grip it with your palms down.',
      'Stand tall with a slight forward lean and pin your elbows to your sides.',
      'Push the handle down until your elbows are fully extended.',
      'Squeeze the triceps at the bottom for a moment.',
      'Let the handle rise under control until your forearms pass parallel to the floor.',
    ],
    cues: [
      'Keep your elbows glued to your sides for the whole set.',
      'Move only at the elbow, not at the shoulder.',
      'Finish every rep with a full lockout and squeeze.',
    ],
    mistakes: [
      'Letting the elbows drift forward and turning it into a pressing motion.',
      'Using body weight to shove the stack down instead of the triceps.',
    ],
    inDefaultTemplate: true,
    sortOrder: 5,
    thresholds: {
      male: [0.25, 0.4, 0.55, 0.7, 0.9, 1.1],
      female: [0.13, 0.22, 0.32, 0.42, 0.55, 0.68],
    },
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    workoutType: 'push',
    targetMuscles: ['front delts', 'side delts', 'triceps'],
    equipment: 'Dumbbells and bench with back support',
    loadType: 'external',
    loadNote: 'Log the weight of ONE dumbbell.',
    execution: [
      'Sit on the bench with the back pad set close to vertical.',
      'Bring the dumbbells to shoulder height with your palms facing forward.',
      'Brace your core and press both dumbbells up until your elbows lock out.',
      'Keep the dumbbells over your shoulders rather than letting them drift forward.',
      'Lower them under control back to shoulder height.',
    ],
    cues: [
      'Keep your lower back against the pad, not arched away from it.',
      'Press up and slightly in, finishing with the dumbbells close together.',
      'Lower until your hands are near ear height every rep.',
    ],
    mistakes: [
      'Cutting the bottom range short and only pressing the top half.',
      'Arching hard off the pad to turn it into an incline press.',
    ],
    inDefaultTemplate: false,
    sortOrder: 6,
    thresholds: {
      male: [0.15, 0.22, 0.3, 0.4, 0.5, 0.6],
      female: [0.08, 0.12, 0.17, 0.24, 0.32, 0.4],
    },
  },

  // PULL
  {
    id: 'deadlift',
    name: 'Deadlift',
    workoutType: 'pull',
    targetMuscles: ['hamstrings', 'glutes', 'spinal erectors', 'lats'],
    equipment: 'Barbell',
    loadType: 'external',
    execution: [
      'Stand with the bar over your mid foot and your feet about hip width apart.',
      'Hinge down and grip the bar just outside your legs.',
      'Drop your hips, lift your chest, and pull the slack out of the bar.',
      'Drive the floor away and stand up, keeping the bar against your legs.',
      'Finish tall with your hips and knees locked, then lower the bar back down with control.',
    ],
    cues: [
      'Keep your lats tight, as if squeezing oranges in your armpits.',
      'Push the floor away instead of yanking the bar up.',
      'Keep the bar dragging along your shins and thighs.',
    ],
    mistakes: [
      'Rounding the lower back as the bar leaves the floor.',
      'Letting the bar drift away from the body.',
      'Hyperextending the lower back at lockout.',
    ],
    inDefaultTemplate: true,
    sortOrder: 1,
    thresholds: {
      male: [1.0, 1.25, 1.5, 2.0, 2.5, 3.0],
      female: [0.5, 0.75, 1.0, 1.35, 1.75, 2.1],
    },
  },
  {
    id: 'pull-up',
    name: 'Pull-up',
    workoutType: 'pull',
    targetMuscles: ['lats', 'biceps', 'upper back'],
    equipment: 'Pull-up bar',
    loadType: 'bodyweight',
    loadNote: 'Log any ADDED weight. Leave at 0 for bodyweight reps.',
    execution: [
      'Hang from the bar with an overhand grip slightly wider than shoulder width.',
      'Pull your shoulder blades down to start the movement.',
      'Drive your elbows down toward your ribs and pull until your chin clears the bar.',
      'Lower yourself under control to a full hang with straight arms.',
    ],
    cues: [
      'Think about pulling the bar to your chest, not your chin to the bar.',
      'Keep your core braced so your legs do not swing.',
      'Start every rep from a dead hang with straight elbows.',
    ],
    mistakes: [
      'Kipping or swinging to generate momentum.',
      'Stopping short of a full hang at the bottom.',
      'Craning the neck to sneak the chin over the bar.',
    ],
    inDefaultTemplate: true,
    sortOrder: 2,
    thresholds: {
      male: [1.1, 1.27, 1.45, 1.65, 1.9, 2.15],
      female: [1.02, 1.12, 1.27, 1.45, 1.65, 1.9],
    },
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    workoutType: 'pull',
    targetMuscles: ['lats', 'upper back', 'rear delts', 'biceps'],
    equipment: 'Barbell',
    loadType: 'external',
    execution: [
      'Stand over the bar and grip it slightly wider than shoulder width.',
      'Hinge at the hips until your torso is close to parallel with the floor.',
      'Let the bar hang at arm length with a flat back and braced core.',
      'Pull the bar to your lower ribs, driving your elbows behind you.',
      'Lower the bar under control until your arms are straight again.',
    ],
    cues: [
      'Keep your torso angle fixed, the hips should not rise as you pull.',
      'Squeeze your shoulder blades together at the top of every rep.',
      'Pull with your elbows, not your hands.',
    ],
    mistakes: [
      'Heaving the weight up with the hips and lower back.',
      'Standing too upright and turning it into a shrug.',
    ],
    inDefaultTemplate: true,
    sortOrder: 3,
    thresholds: {
      male: [0.5, 0.7, 0.9, 1.15, 1.4, 1.7],
      female: [0.25, 0.38, 0.5, 0.68, 0.85, 1.05],
    },
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    workoutType: 'pull',
    targetMuscles: ['lats', 'biceps', 'upper back'],
    equipment: 'Cable machine with lat pulldown bar',
    loadType: 'external',
    execution: [
      'Sit down and secure your thighs under the pads.',
      'Grip the bar wider than shoulder width with an overhand grip.',
      'Lean back slightly and lift your chest toward the bar.',
      'Pull the bar down to your upper chest, driving your elbows down and back.',
      'Let the bar rise under control until your arms are fully extended.',
    ],
    cues: [
      'Start each rep by pulling your shoulder blades down.',
      'Keep your chest up and pull the bar to it.',
      'Get a full stretch at the top of every rep.',
    ],
    mistakes: [
      'Leaning far back and rowing the weight down with momentum.',
      'Pulling the bar behind the neck.',
    ],
    inDefaultTemplate: true,
    sortOrder: 4,
    thresholds: {
      male: [0.5, 0.7, 0.9, 1.1, 1.35, 1.6],
      female: [0.28, 0.42, 0.55, 0.72, 0.9, 1.1],
    },
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    workoutType: 'pull',
    targetMuscles: ['biceps', 'forearms'],
    equipment: 'Barbell',
    loadType: 'external',
    execution: [
      'Stand tall holding the bar at arm length with an underhand, shoulder width grip.',
      'Pin your elbows to your sides and brace your core.',
      'Curl the bar up in an arc until your forearms are near vertical.',
      'Squeeze the biceps at the top.',
      'Lower the bar under control until your elbows are fully straight.',
    ],
    cues: [
      'Keep your elbows still, they should not drift forward or backward.',
      'Control the lowering phase for at least two seconds.',
      'Keep your wrists neutral instead of curling them toward you.',
    ],
    mistakes: [
      'Swinging the torso to heave the bar up.',
      'Stopping short of full elbow extension at the bottom.',
    ],
    inDefaultTemplate: true,
    sortOrder: 5,
    thresholds: {
      male: [0.25, 0.4, 0.55, 0.7, 0.85, 1.0],
      female: [0.13, 0.2, 0.28, 0.36, 0.45, 0.55],
    },
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    workoutType: 'pull',
    targetMuscles: ['upper back', 'lats', 'rear delts', 'biceps'],
    equipment: 'Cable row machine',
    loadType: 'external',
    execution: [
      'Sit at the machine with your feet on the platform and knees slightly bent.',
      'Grip the handle and sit upright with your arms extended and a flat back.',
      'Pull the handle to your lower ribs, driving your elbows straight back.',
      'Squeeze your shoulder blades together at the end of the pull.',
      'Return the handle under control until your arms are straight and your lats stretch.',
    ],
    cues: [
      'Keep your torso upright, rocking only slightly if at all.',
      'Lead the pull with your elbows, not your hands.',
      'Let your shoulder blades protract at the front for a full stretch.',
    ],
    mistakes: [
      'Leaning far back and pulling with the lower back instead of the arms and lats.',
      'Shrugging the shoulders up toward the ears during the pull.',
    ],
    inDefaultTemplate: false,
    sortOrder: 6,
    thresholds: {
      male: [0.5, 0.7, 0.9, 1.15, 1.4, 1.65],
      female: [0.28, 0.42, 0.55, 0.72, 0.9, 1.1],
    },
  },

  // LEGS
  {
    id: 'back-squat',
    name: 'Back Squat',
    workoutType: 'legs',
    targetMuscles: ['quads', 'glutes', 'adductors', 'spinal erectors'],
    equipment: 'Barbell and squat rack',
    loadType: 'external',
    execution: [
      'Set the bar on your upper back and grip it just outside your shoulders.',
      'Unrack the bar, step back, and set your feet about shoulder width apart.',
      'Brace your core with a big breath into your belly.',
      'Sit down between your legs until your hip crease is below your knee.',
      'Drive back up through your whole foot until your hips are fully locked out.',
    ],
    cues: [
      'Keep your knees tracking over your toes.',
      'Keep your whole foot planted, big toe and heel both pressing down.',
      'Stay braced through the whole rep, exhale only at the top.',
    ],
    mistakes: [
      'Letting the knees cave inward out of the bottom.',
      'Lifting the hips first and folding into a good morning.',
      'Cutting depth short of parallel.',
    ],
    inDefaultTemplate: true,
    sortOrder: 1,
    thresholds: {
      male: [0.75, 1.0, 1.25, 1.75, 2.25, 2.75],
      female: [0.4, 0.6, 0.8, 1.15, 1.5, 1.85],
    },
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    workoutType: 'legs',
    targetMuscles: ['hamstrings', 'glutes', 'spinal erectors'],
    equipment: 'Barbell',
    loadType: 'external',
    execution: [
      'Stand tall holding the bar at arm length against your thighs.',
      'Soften your knees slightly and lock that knee angle in.',
      'Push your hips straight back and let the bar slide down your thighs.',
      'Lower until you feel a deep stretch in your hamstrings, usually just below the knees.',
      'Drive your hips forward to stand back up, squeezing your glutes at the top.',
    ],
    cues: [
      'Keep the bar in contact with your legs the whole way down.',
      'Think of closing a car door behind you with your hips.',
      'Keep your back flat and your chest proud throughout.',
    ],
    mistakes: [
      'Bending the knees more as the bar lowers, turning it into a regular deadlift.',
      'Rounding the lower back to chase extra depth.',
    ],
    inDefaultTemplate: true,
    sortOrder: 2,
    thresholds: {
      male: [0.75, 1.0, 1.25, 1.6, 2.0, 2.4],
      female: [0.4, 0.6, 0.85, 1.1, 1.4, 1.7],
    },
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    workoutType: 'legs',
    targetMuscles: ['quads', 'glutes', 'adductors'],
    equipment: 'Leg press machine',
    loadType: 'external',
    execution: [
      'Sit in the machine with your back and hips flat against the pads.',
      'Place your feet shoulder width apart in the middle of the platform.',
      'Release the safeties and lower the platform under control.',
      'Stop when your knees reach your chest without your lower back rolling off the pad.',
      'Press the platform back up without fully slamming into lockout.',
    ],
    cues: [
      'Keep your hips glued to the seat for the entire set.',
      'Push through your whole foot, not just the toes.',
      'Keep your knees in line with your toes.',
    ],
    mistakes: [
      'Going so deep that the lower back rounds off the pad.',
      'Locking the knees out hard at the top of every rep.',
    ],
    inDefaultTemplate: true,
    sortOrder: 3,
    thresholds: {
      male: [1.0, 1.5, 2.0, 2.75, 3.5, 4.25],
      female: [0.55, 0.85, 1.2, 1.7, 2.25, 2.8],
    },
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    workoutType: 'legs',
    targetMuscles: ['hamstrings', 'calves'],
    equipment: 'Leg curl machine',
    loadType: 'external',
    execution: [
      'Adjust the machine so your knees line up with the pivot point.',
      'Position the pad just above your heels on the back of your ankles.',
      'Curl your heels toward your glutes as far as the machine allows.',
      'Hold the squeeze for a moment at full contraction.',
      'Return the weight under control to a full stretch.',
    ],
    cues: [
      'Keep your hips pressed down against the pad or seat.',
      'Pull with your hamstrings, not by yanking your hips.',
      'Make the lowering phase slower than the lift.',
    ],
    mistakes: [
      'Lifting the hips to cheat the weight up.',
      'Letting the stack slam down between reps instead of controlling the negative.',
    ],
    inDefaultTemplate: true,
    sortOrder: 4,
    thresholds: {
      male: [0.3, 0.45, 0.6, 0.8, 1.0, 1.2],
      female: [0.18, 0.28, 0.38, 0.52, 0.68, 0.85],
    },
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    workoutType: 'legs',
    targetMuscles: ['gastrocnemius', 'soleus'],
    equipment: 'Standing calf raise machine or smith machine with block',
    loadType: 'external',
    execution: [
      'Stand with the balls of your feet on the edge of the platform.',
      'Set your shoulders under the pads and stand tall with straight knees.',
      'Lower your heels as far as they will go for a full stretch.',
      'Pause briefly in the stretched position.',
      'Drive up onto your toes as high as possible and squeeze at the top.',
    ],
    cues: [
      'Use a full range, from deep stretch to full tiptoe.',
      'Pause at the bottom to kill the bounce.',
      'Keep your knees straight but not aggressively locked.',
    ],
    mistakes: [
      'Bouncing out of the bottom using the tendon stretch instead of the muscle.',
      'Using tiny partial reps in the middle of the range.',
    ],
    inDefaultTemplate: true,
    sortOrder: 5,
    thresholds: {
      male: [0.75, 1.1, 1.5, 2.0, 2.5, 3.0],
      female: [0.5, 0.75, 1.05, 1.45, 1.85, 2.25],
    },
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    workoutType: 'legs',
    targetMuscles: ['quads', 'glutes', 'adductors'],
    equipment: 'Dumbbells and bench',
    loadType: 'external',
    loadNote: 'Log the weight of ONE dumbbell.',
    execution: [
      'Stand a couple of feet in front of a bench holding a dumbbell in each hand.',
      'Place the top of your rear foot on the bench behind you.',
      'Lower straight down until your front thigh is about parallel to the floor.',
      'Keep your torso upright with a slight forward lean.',
      'Drive through your front foot to stand back up.',
    ],
    cues: [
      'Put almost all of your weight on the front leg.',
      'Keep your front knee tracking over your toes.',
      'Lower under control instead of dropping into the bottom.',
    ],
    mistakes: [
      'Standing too close to the bench and tipping forward.',
      'Pushing off the back leg instead of working the front leg.',
      'Letting the front knee collapse inward.',
    ],
    inDefaultTemplate: false,
    sortOrder: 6,
    thresholds: {
      male: [0.15, 0.25, 0.35, 0.5, 0.65, 0.8],
      female: [0.08, 0.14, 0.2, 0.3, 0.4, 0.52],
    },
  },
];
