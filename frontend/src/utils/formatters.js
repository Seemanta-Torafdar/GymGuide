// ============================================================================
// GYMGUIDE - UI BADGE & FORMATTING HELPERS
// Color System:
//   Main page background: #E5E8CE
//   Navbar background:    rgba(255,255,255,0.75)
//   Navbar active:        #789575
//   Primary buttons:      #173F35
//   Button hover:         #789575
//   Cards:                #F1F2E8
//   Headings:             #263B2D
//   Body text:            #657565
//   Borders:              #D2D9C5
//   Footer:               #173F35
//   Footer bottom:        #102E27
// ============================================================================

export function formatDifficultyLabel(difficulty = 'BEGINNER') {
  const upper = String(difficulty).toUpperCase();
  if (upper === 'BEGINNER') return 'Beginner';
  if (upper === 'INTERMEDIATE') return 'Intermediate';
  if (upper === 'ADVANCED') return 'Advanced';
  return difficulty;
}

export function getDifficultyBadgeClasses(difficulty = 'BEGINNER') {
  const upper = String(difficulty).toUpperCase();
  if (upper === 'BEGINNER') {
    return 'bg-[#E5E8CE] text-[#173F35] border-[#D2D9C5]';
  }
  if (upper === 'INTERMEDIATE') {
    return 'bg-[#789575]/20 text-[#263B2D] border-[#789575]/40';
  }
  return 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]';
}

export function formatExerciseType(type = 'COMPOUND') {
  const upper = String(type).toUpperCase();
  if (upper === 'COMPOUND') return 'Compound';
  if (upper === 'ISOLATION') return 'Isolation';
  if (upper === 'STABILITY') return 'Stability';
  return type;
}

export function getEquipmentDisplayLabel(slugOrName = '') {
  const clean = String(slugOrName).toLowerCase();
  if (clean.includes('dumbbell')) return 'Dumbbells';
  if (clean.includes('barbell')) return 'Barbell';
  if (clean.includes('cable')) return 'Cable';
  if (clean.includes('machine')) return 'Machine';
  if (clean.includes('bodyweight') || clean.includes('dip')) return 'Bodyweight';
  return slugOrName || 'Bodyweight';
}

export function getChestSubRegionLabel(exercise) {
  if (!exercise) return 'Middle Chest';
  if (exercise.subRegion) return exercise.subRegion;
  const text = `${exercise.name} ${exercise.description}`.toLowerCase();
  if (
    text.includes('incline') ||
    text.includes('low-to-high') ||
    text.includes('decline push-up') ||
    text.includes('clavicular')
  ) {
    return 'Upper Chest';
  }
  if (
    text.includes('decline') ||
    text.includes('dip') ||
    text.includes('high-to-low')
  ) {
    return 'Lower Chest';
  }
  return 'Middle Chest';
}

export const DISCOVERY_EQUIPMENT_FILTERS = [
  { slug: 'dumbbell', label: 'Dumbbells', shortLabel: 'Dumbbells' },
  { slug: 'barbell', label: 'Barbell', shortLabel: 'Barbell' },
  { slug: 'cable-machine', label: 'Cable', shortLabel: 'Cable' },
  { slug: 'machine', label: 'Machine', shortLabel: 'Machine' },
  { slug: 'bodyweight', label: 'Bodyweight', shortLabel: 'Bodyweight' },
];

export const EXERCISE_CATEGORIES = [
  {
    slug: 'chest',
    name: 'Chest',
    anatomicalName: 'Pectoralis Major and Pectoralis Minor',
    subRegions: ['Upper Chest', 'Middle Chest', 'Lower Chest'],
    muscleSlug: 'chest',
    bodySide: 'FRONT',
  },
  {
    slug: 'back',
    name: 'Back',
    anatomicalName: 'Latissimus Dorsi, Trapezius & Rhomboids',
    subRegions: ['Upper Back & Traps', 'Lats (Width)', 'Lower Back'],
    muscleSlug: 'latissimus-dorsi',
    bodySide: 'BACK',
  },
  {
    slug: 'shoulders',
    name: 'Shoulders',
    anatomicalName: 'Anterior, Lateral & Posterior Deltoideus',
    subRegions: ['Front Delts', 'Side (Lateral) Delts', 'Rear Delts'],
    muscleSlug: 'front-deltoids',
    bodySide: 'FRONT',
  },
  {
    slug: 'biceps',
    name: 'Biceps',
    anatomicalName: 'Biceps Brachii (Long & Short Heads) & Brachialis',
    subRegions: ['Long Head (Peak)', 'Short Head (Inner)', 'Brachialis'],
    muscleSlug: 'biceps',
    bodySide: 'FRONT',
  },
  {
    slug: 'triceps',
    name: 'Triceps',
    anatomicalName: 'Triceps Brachii (Long, Lateral & Medial Heads)',
    subRegions: ['Long Head', 'Lateral Head', 'Medial Head'],
    muscleSlug: 'triceps',
    bodySide: 'BACK',
  },
  {
    slug: 'forearms',
    name: 'Forearms',
    anatomicalName: 'Brachioradialis, Wrist Flexors & Extensors',
    subRegions: ['Brachioradialis', 'Wrist Flexors', 'Wrist Extensors'],
    muscleSlug: 'forearms',
    bodySide: 'FRONT',
  },
  {
    slug: 'abs',
    name: 'Abs',
    anatomicalName: 'Rectus Abdominis & External/Internal Obliques',
    subRegions: ['Upper Abs', 'Lower Abs', 'Obliques'],
    muscleSlug: 'rectus-abdominis',
    bodySide: 'FRONT',
  },
  {
    slug: 'legs',
    name: 'Legs',
    anatomicalName: 'Quadriceps Femoris & Hamstring Complex',
    subRegions: ['Quadriceps', 'Hamstrings', 'Adductors'],
    muscleSlug: 'quadriceps',
    bodySide: 'FRONT',
  },
  {
    slug: 'glutes',
    name: 'Glutes',
    anatomicalName: 'Gluteus Maximus, Gluteus Medius & Minimus',
    subRegions: ['Gluteus Maximus', 'Upper Glute Shelf', 'Gluteus Medius'],
    muscleSlug: 'glutes',
    bodySide: 'BACK',
  },
  {
    slug: 'calves',
    name: 'Calves',
    anatomicalName: 'Gastrocnemius & Soleus',
    subRegions: ['Gastrocnemius (Upper)', 'Soleus (Deep)'],
    muscleSlug: 'calves',
    bodySide: 'BOTH',
  },
];
