/**
 * Complete 69-exercise catalog grouped serially by the 10 GymGuide body parts.
 * Every slug matches an existing record in the backend /exercises database.
 */
export const EXERCISE_DIRECTORY_GROUPS = [
  {
    number: 1,
    id: 'chest',
    bodyPart: 'Chest',
    exercises: [
      { equipment: 'Cable', targetPortion: 'Lower Chest', name: 'High-to-Low Cable Fly', slug: 'high-to-low-cable-fly' },
      { equipment: 'Cable', targetPortion: 'Upper Chest', name: 'Low-to-High Cable Fly', slug: 'low-to-high-cable-fly' },
      { equipment: 'Cable', targetPortion: 'Middle Chest', name: 'Cable Chest Fly', slug: 'cable-chest-fly' },
      { equipment: 'Cable', targetPortion: 'Middle & Inner Chest', name: 'Cable Crossover', slug: 'cable-crossover' },
      { equipment: 'Cable', targetPortion: 'Middle Chest', name: 'Standing Cable Chest Press', slug: 'standing-cable-chest-press' },
      { equipment: 'Machine', targetPortion: 'Upper Chest', name: 'Incline Chest Press Machine', slug: 'incline-chest-press-machine' },
      { equipment: 'Machine', targetPortion: 'Middle Chest', name: 'Machine Chest Press', slug: 'machine-chest-press' },
      { equipment: 'Machine', targetPortion: 'Middle & Inner Chest', name: 'Pec Deck Machine Fly', slug: 'pec-deck-machine-fly' },
      { equipment: 'Dumbbells', targetPortion: 'Lower Chest', name: 'Decline Dumbbell Press', slug: 'decline-dumbbell-press' },
      { equipment: 'Dumbbells', targetPortion: 'Upper Chest', name: 'Incline Dumbbell Bench Press', slug: 'incline-dumbbell-bench-press' },
      { equipment: 'Dumbbells', targetPortion: 'Upper Chest', name: 'Incline Dumbbell Fly', slug: 'incline-dumbbell-fly' },
      { equipment: 'Dumbbells', targetPortion: 'Middle Chest', name: 'Dumbbell Bench Press', slug: 'dumbbell-bench-press' },
      { equipment: 'Dumbbells', targetPortion: 'Middle Chest', name: 'Dumbbell Chest Fly', slug: 'dumbbell-chest-fly' },
      { equipment: 'Barbell', targetPortion: 'Lower Chest', name: 'Decline Barbell Bench Press', slug: 'decline-barbell-bench-press' },
      { equipment: 'Barbell', targetPortion: 'Upper Chest', name: 'Incline Barbell Bench Press', slug: 'incline-barbell-bench-press' },
      { equipment: 'Barbell', targetPortion: 'Middle Chest', name: 'Barbell Bench Press', slug: 'barbell-bench-press' },
      { equipment: 'Bodyweight (Dip Station)', targetPortion: 'Lower Chest', name: 'Chest Dip', slug: 'chest-dip' },
      { equipment: 'Bodyweight (Bench)', targetPortion: 'Lower Chest', name: 'Incline Push-Up', slug: 'incline-push-up' },
      { equipment: 'Bodyweight (Bench)', targetPortion: 'Upper Chest', name: 'Decline Push-Up', slug: 'decline-push-up' },
      { equipment: 'Bodyweight', targetPortion: 'Middle Chest', name: 'Push-Up', slug: 'push-up' },
      { equipment: 'Bodyweight', targetPortion: 'Middle & Outer Chest', name: 'Wide Push-Up', slug: 'wide-push-up' },
    ],
  },
  {
    number: 2,
    id: 'shoulders',
    bodyPart: 'Shoulders',
    exercises: [
      { equipment: 'Machine', targetPortion: 'Rear Delt', name: 'Reverse Pec Deck Rear Delt Fly', slug: 'reverse-pec-deck-rear-delt-fly' },
      { equipment: 'Dumbbells', targetPortion: 'Front Delt', name: 'Front Dumbbell Raise', slug: 'front-dumbbell-raise' },
      { equipment: 'Dumbbells', targetPortion: 'Side (Lateral) Delt', name: 'Dumbbell Lateral Raise', slug: 'dumbbell-lateral-raise' },
      { equipment: 'Dumbbells', targetPortion: 'Front & Side Delts', name: 'Arnold Press', slug: 'arnold-press' },
      { equipment: 'Dumbbells', targetPortion: 'Front & Side Delts', name: 'Seated Dumbbell Shoulder Press', slug: 'seated-dumbbell-shoulder-press' },
      { equipment: 'Barbell', targetPortion: 'Front & Side Delts', name: 'Overhead Barbell Press', slug: 'overhead-barbell-press' },
    ],
  },
  {
    number: 3,
    id: 'back',
    bodyPart: 'Back',
    exercises: [
      { equipment: 'Cable', targetPortion: 'Upper Lats', name: 'Lat Pulldown', slug: 'lat-pulldown' },
      { equipment: 'Cable', targetPortion: 'Rear Delt & Mid/Lower Traps', name: 'Face Pull', slug: 'face-pull' },
      { equipment: 'Cable', targetPortion: 'Upper/Mid/Lower Traps & Lower Lats', name: 'Seated Cable Row', slug: 'seated-cable-row' },
      { equipment: 'Dumbbells', targetPortion: 'Lower Lats', name: 'Single-Arm Dumbbell Row', slug: 'single-arm-dumbbell-row' },
      { equipment: 'Barbell', targetPortion: 'Lower Lats & Mid/Lower Traps', name: 'Barbell Bent-Over Row', slug: 'barbell-bent-over-row' },
      { equipment: 'Barbell', targetPortion: 'Lower Back, Glutes & Hamstrings', name: 'Conventional Deadlift', slug: 'conventional-deadlift' },
      { equipment: 'Bodyweight (Pull-Up Bar)', targetPortion: 'Upper Lats', name: 'Pull-Up', slug: 'pull-up' },
    ],
  },
  {
    number: 4,
    id: 'legs',
    bodyPart: 'Legs — Quads & Hamstrings',
    exercises: [
      { equipment: 'Machine', targetPortion: 'Quads (Vastus Lateralis / Outer Sweep)', name: '45-Degree Leg Press', slug: '45-degree-leg-press' },
      { equipment: 'Machine', targetPortion: 'Quads (Rectus Femoris & VMO Teardrop)', name: 'Seated Leg Extension', slug: 'seated-leg-extension' },
      { equipment: 'Machine', targetPortion: 'Hamstrings (Biceps Femoris & Inner Hamstrings)', name: 'Lying Hamstring Leg Curl', slug: 'lying-hamstring-leg-curl' },
      { equipment: 'Dumbbells / Bodyweight', targetPortion: 'Quads & Glutes', name: 'Bulgarian Split Squat', slug: 'bulgarian-split-squat' },
      { equipment: 'Dumbbells / Bodyweight', targetPortion: 'Quads & Glutes', name: 'Walking Dumbbell Lunge', slug: 'walking-dumbbell-lunge' },
      { equipment: 'Barbell / Dumbbells', targetPortion: 'Hamstrings & Gluteus Maximus', name: 'Romanian Deadlift', slug: 'romanian-deadlift' },
      { equipment: 'Barbell', targetPortion: 'Quads & Gluteus Maximus', name: 'Barbell Back Squat', slug: 'barbell-back-squat' },
    ],
  },
  {
    number: 5,
    id: 'glutes',
    bodyPart: 'Glutes',
    exercises: [
      { equipment: 'Cable', targetPortion: 'Gluteus Maximus (+ Medius)', name: 'Cable Glute Kickback', slug: 'cable-glute-kickback' },
      { equipment: 'Barbell', targetPortion: 'Gluteus Maximus', name: 'Barbell Hip Thrust', slug: 'barbell-hip-thrust' },
      { equipment: 'Barbell', targetPortion: 'Gluteus Maximus, Medius & Quads', name: 'Sumo Barbell Deadlift', slug: 'sumo-barbell-deadlift' },
      { equipment: 'Bodyweight / Dumbbells', targetPortion: 'Gluteus Maximus', name: 'Bodyweight Glute Bridge', slug: 'bodyweight-glute-bridge' },
    ],
  },
  {
    number: 6,
    id: 'calves',
    bodyPart: 'Calves',
    exercises: [
      { equipment: 'Machine (Machine / Smith)', targetPortion: 'Upper Calf (Medial & Lateral Gastrocnemius)', name: 'Standing Machine Calf Raise', slug: 'standing-machine-calf-raise' },
      { equipment: 'Machine', targetPortion: 'Upper Calf (Medial & Lateral Gastrocnemius)', name: 'Leg Press Calf Press', slug: 'leg-press-calf-press' },
      { equipment: 'Machine', targetPortion: 'Lower Calf (Soleus)', name: 'Seated Calf Raise', slug: 'seated-calf-raise' },
      { equipment: 'Dumbbells / Bodyweight', targetPortion: 'Upper Calf (Medial & Lateral Gastrocnemius)', name: 'Single-Leg Dumbbell Calf Raise', slug: 'single-leg-dumbbell-calf-raise' },
    ],
  },
  {
    number: 7,
    id: 'biceps',
    bodyPart: 'Biceps',
    exercises: [
      { equipment: 'Cable', targetPortion: 'Long Head & Short Head', name: 'Cable Bicep Curl', slug: 'cable-bicep-curl' },
      { equipment: 'Dumbbells', targetPortion: 'Long Head', name: 'Incline Dumbbell Curl', slug: 'incline-dumbbell-curl' },
      { equipment: 'Dumbbells', targetPortion: 'Long Head & Forearm Brachioradialis', name: 'Dumbbell Hammer Curl', slug: 'dumbbell-hammer-curl' },
      { equipment: 'Barbell', targetPortion: 'Long Head & Short Head', name: 'Barbell Bicep Curl', slug: 'barbell-bicep-curl' },
      { equipment: 'Barbell (EZ-Curl Bar)', targetPortion: 'Long Head & Short Head', name: 'EZ-Bar Preacher Curl', slug: 'ez-bar-preacher-curl' },
    ],
  },
  {
    number: 8,
    id: 'triceps',
    bodyPart: 'Triceps',
    exercises: [
      { equipment: 'Cable', targetPortion: 'Lateral & Medial Heads', name: 'Tricep Rope Pushdown', slug: 'tricep-rope-pushdown' },
      { equipment: 'Dumbbells', targetPortion: 'Long Head', name: 'Overhead Dumbbell Tricep Extension', slug: 'overhead-dumbbell-tricep-extension' },
      { equipment: 'Barbell', targetPortion: 'Lateral Head', name: 'Close-Grip Barbell Bench Press', slug: 'close-grip-barbell-bench-press' },
      { equipment: 'Barbell (EZ-Curl Bar)', targetPortion: 'Long Head', name: 'EZ-Bar Skull Crusher', slug: 'ez-bar-skull-crusher' },
      { equipment: 'Bodyweight (Dip Station)', targetPortion: 'Lateral & Medial Heads', name: 'Parallel Bar Tricep Dip', slug: 'parallel-bar-tricep-dip' },
    ],
  },
  {
    number: 9,
    id: 'forearms',
    bodyPart: 'Forearms',
    exercises: [
      { equipment: 'Dumbbells / Kettlebell', targetPortion: 'Brachioradialis & Wrist Flexors', name: "Heavy Farmer's Walk", slug: 'heavy-farmers-walk' },
      { equipment: 'Barbell', targetPortion: 'Brachioradialis & Wrist Extensors', name: 'Reverse Barbell Wrist Curl', slug: 'reverse-barbell-wrist-curl' },
      { equipment: 'Barbell (EZ-Curl Bar)', targetPortion: 'Brachioradialis', name: 'Reverse EZ-Bar Curl', slug: 'reverse-ez-bar-curl' },
      { equipment: 'Barbell', targetPortion: 'Wrist Flexors', name: 'Seated Barbell Wrist Curl', slug: 'seated-barbell-wrist-curl' },
    ],
  },
  {
    number: 10,
    id: 'abs',
    bodyPart: 'Abs & Core',
    exercises: [
      { equipment: 'Cable', targetPortion: 'Upper Abs (Rectus Abdominis)', name: 'Kneeling Cable Crunch', slug: 'kneeling-cable-crunch' },
      { equipment: 'Dumbbells / Bodyweight', targetPortion: 'Obliques', name: 'Weighted Russian Twist', slug: 'weighted-russian-twist' },
      { equipment: 'Bodyweight', targetPortion: 'Upper Abs (Core Bracing)', name: 'Forearm Plank', slug: 'forearm-plank' },
      { equipment: 'Bodyweight', targetPortion: 'Upper Abs & Obliques', name: 'Bicycle Crunch', slug: 'bicycle-crunch' },
      { equipment: 'Bodyweight (Pull-Up Bar)', targetPortion: 'Lower Abs', name: 'Hanging Leg Raise', slug: 'hanging-leg-raise' },
      { equipment: 'Ab Wheel', targetPortion: 'Upper Abs (+ Serratus & Lats)', name: 'Ab Wheel Rollout', slug: 'ab-wheel-rollout' },
    ],
  },
];

export const DIRECTORY_EQUIPMENT_FILTERS = [
  { id: 'ALL', label: 'All Equipment' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'ez-curl', label: 'EZ-Curl Bar' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'ab wheel', label: 'Ab Wheel' },
];

export function matchesDirectoryEquipment(equipmentLabel = '', filterId = 'ALL') {
  if (!filterId || filterId === 'ALL') return true;
  const normalized = equipmentLabel.toLowerCase();
  if (filterId === 'ez-curl') return normalized.includes('ez-curl');
  if (filterId === 'dumbbells') return normalized.includes('dumbbell');
  return normalized.includes(filterId);
}
