// ============================================================================
// GYMGUIDE - ANATOMICAL MOVEMENT KINEMATICS & MUSCLE HIT MAPPING
// Maps any seeded exercise + equipment into biomechanical movement patterns,
// equipment render styles, 3D character hotspot overlays, and rep phase labels.
// ============================================================================

export function resolveEquipmentKind(exercise, selectedEquipmentSlug = 'ALL') {
  if (selectedEquipmentSlug && selectedEquipmentSlug !== 'ALL') {
    const clean = selectedEquipmentSlug.toLowerCase();
    if (clean.includes('dumbbell')) return 'dumbbell';
    if (clean.includes('barbell')) return 'barbell';
    if (clean.includes('ez-curl')) return 'ez-bar';
    if (clean.includes('cable')) return 'cable';
    if (clean.includes('pull-up')) return 'pull-up-bar';
    if (clean.includes('dip')) return 'dip-station';
    if (clean.includes('smith')) return 'machine';
    if (clean.includes('machine')) return 'machine';
    if (clean.includes('kettlebell')) return 'kettlebell';
    if (clean.includes('ab-wheel')) return 'ab-wheel';
    if (clean.includes('bodyweight')) return 'bodyweight';
  }

  const eqSlugs = (exercise?.equipment || []).map((e) => (e.slug || '').toLowerCase());
  if (eqSlugs.some((s) => s.includes('cable'))) return 'cable';
  if (eqSlugs.some((s) => s.includes('dumbbell'))) return 'dumbbell';
  if (eqSlugs.some((s) => s.includes('ez-curl'))) return 'ez-bar';
  if (eqSlugs.some((s) => s.includes('barbell'))) return 'barbell';
  if (eqSlugs.some((s) => s.includes('smith') || s.includes('machine'))) return 'machine';
  if (eqSlugs.some((s) => s.includes('pull-up'))) return 'pull-up-bar';
  if (eqSlugs.some((s) => s.includes('dip'))) return 'dip-station';
  if (eqSlugs.some((s) => s.includes('kettlebell'))) return 'kettlebell';
  if (eqSlugs.some((s) => s.includes('ab-wheel'))) return 'ab-wheel';
  return 'bodyweight';
}

export function resolveMovementPattern(exercise) {
  const slug = (exercise?.slug || '').toLowerCase();
  const name = (exercise?.name || '').toLowerCase();
  const text = `${slug} ${name}`;

  if (text.includes('dip')) return 'dip';
  if (text.includes('push-up') || text.includes('pushup')) return 'pushup';
  if (text.includes('pec deck') || text.includes('fly') || text.includes('crossover')) {
    if (text.includes('reverse')) return 'reverse_fly';
    return 'chest_fly';
  }
  if (text.includes('bench press') || text.includes('chest press') || text.includes('dumbbell press')) {
    return 'bench_press';
  }
  if (text.includes('pull-up')) return 'pullup';
  if (text.includes('pulldown')) return 'pulldown';
  if (text.includes('face pull')) return 'face_pull';
  if (text.includes('row')) return 'row';
  if (text.includes('deadlift') || text.includes('rdl')) return 'deadlift';
  if (text.includes('overhead') && text.includes('press') || text.includes('shoulder press') || text.includes('arnold')) {
    return 'overhead_press';
  }
  if (text.includes('lateral raise')) return 'lateral_raise';
  if (text.includes('front') && text.includes('raise')) return 'front_raise';
  if (text.includes('pushdown')) return 'tricep_pushdown';
  if (text.includes('skull crusher')) return 'skull_crusher';
  if (text.includes('overhead') && text.includes('extension')) return 'overhead_tricep';
  if (text.includes('wrist curl')) return 'wrist_curl';
  if (text.includes('farmer')) return 'farmers_walk';
  if (text.includes('curl')) return 'bicep_curl';
  if (text.includes('leg press')) return 'leg_press';
  if (text.includes('leg extension')) return 'leg_extension';
  if (text.includes('leg curl')) return 'leg_curl';
  if (text.includes('lunge') || text.includes('split squat')) return 'lunge';
  if (text.includes('squat')) return 'squat';
  if (text.includes('hip thrust') || text.includes('glute bridge')) return 'hip_thrust';
  if (text.includes('kickback')) return 'kickback';
  if (text.includes('calf')) return 'calf_raise';
  if (text.includes('plank')) return 'plank';
  if (text.includes('ab wheel') || text.includes('rollout')) return 'ab_wheel';
  if (text.includes('hanging leg raise')) return 'hanging_leg_raise';
  if (text.includes('cable crunch')) return 'cable_crunch';
  if (text.includes('russian twist') || text.includes('bicycle')) return 'core_twist';

  return 'bench_press';
}

export function getRepPhaseInfo(phaseProgress = 0, isPerforming = false) {
  if (!isPerforming) {
    if (phaseProgress < 0.25) {
      return {
        label: 'Step 1 • Setup & Starting Position',
        shortLabel: 'Setup',
        stimulusMultiplier: 0.4,
      };
    }
    if (phaseProgress < 0.7) {
      return {
        label: 'Step 2 • Eccentric Load / Stretch',
        shortLabel: 'Stretch',
        stimulusMultiplier: 0.72,
      };
    }
    return {
      label: 'Step 3 • Peak Muscle Contraction',
      shortLabel: 'Peak Squeeze',
      stimulusMultiplier: 1.0,
    };
  }

  if (phaseProgress < 0.2) {
    return {
      label: 'Starting Tension & Bracing',
      shortLabel: 'Setup',
      stimulusMultiplier: 0.35 + phaseProgress * 1.5,
    };
  }
  if (phaseProgress < 0.55) {
    return {
      label: 'Controlled Concentric Drive',
      shortLabel: 'Drive',
      stimulusMultiplier: 0.65 + (phaseProgress - 0.2) * 0.85,
    };
  }
  if (phaseProgress < 0.85) {
    return {
      label: 'Peak Muscle Squeeze 🔥',
      shortLabel: 'Peak Hit',
      stimulusMultiplier: 0.92 + Math.sin(((phaseProgress - 0.55) / 0.3) * Math.PI) * 0.08,
    };
  }
  return {
    label: 'Slow Eccentric Return',
    shortLabel: 'Lowering',
    stimulusMultiplier: 0.75 - (phaseProgress - 0.85) * 2.0,
  };
}

// Coordinate overlay points aligned with /images/character/character-front-cutout.png & character-back-cutout.png
export const CHARACTER_MUSCLE_HIT_COORDS = {
  chest: {
    side: 'FRONT',
    points: [
      { x: '37%', y: '25%' },
      { x: '63%', y: '25%' },
    ],
  },
  'front-deltoids': {
    side: 'FRONT',
    points: [
      { x: '24%', y: '23%' },
      { x: '76%', y: '23%' },
    ],
  },
  biceps: {
    side: 'FRONT',
    points: [
      { x: '19%', y: '33%' },
      { x: '81%', y: '33%' },
    ],
  },
  forearms: {
    side: 'FRONT',
    points: [
      { x: '14%', y: '43%' },
      { x: '86%', y: '43%' },
    ],
  },
  'rectus-abdominis': {
    side: 'FRONT',
    points: [{ x: '50%', y: '37%' }],
  },
  obliques: {
    side: 'FRONT',
    points: [
      { x: '37%', y: '40%' },
      { x: '63%', y: '40%' },
    ],
  },
  quadriceps: {
    side: 'FRONT',
    points: [
      { x: '35%', y: '61%' },
      { x: '65%', y: '61%' },
    ],
  },
  calves: {
    side: 'BACK',
    points: [
      { x: '37%', y: '79%' },
      { x: '63%', y: '79%' },
    ],
  },
  trapezius: {
    side: 'BACK',
    points: [{ x: '50%', y: '21%' }],
  },
  'rear-deltoids': {
    side: 'BACK',
    points: [
      { x: '26%', y: '23%' },
      { x: '74%', y: '23%' },
    ],
  },
  'latissimus-dorsi': {
    side: 'BACK',
    points: [
      { x: '39%', y: '31%' },
      { x: '61%', y: '31%' },
    ],
  },
  triceps: {
    side: 'BACK',
    points: [
      { x: '19%', y: '33%' },
      { x: '81%', y: '33%' },
    ],
  },
  'lower-back': {
    side: 'BACK',
    points: [{ x: '50%', y: '39%' }],
  },
  glutes: {
    side: 'BACK',
    points: [
      { x: '42%', y: '48%' },
      { x: '58%', y: '48%' },
    ],
  },
  hamstrings: {
    side: 'BACK',
    points: [
      { x: '39%', y: '62%' },
      { x: '61%', y: '62%' },
    ],
  },
};

export function getMuscleHitRatingLabel(score) {
  if (score >= 90) return { grade: 'MAX HIT', color: 'text-[#173F35] bg-[#D3E3CC] border-[#789575]' };
  if (score >= 75) return { grade: 'HIGH HIT', color: 'text-[#173F35] bg-[#E5E8CE] border-[#789575]/60' };
  if (score >= 55) return { grade: 'SYNERGIST', color: 'text-[#263B2D] bg-[#F1F2E8] border-[#D2D9C5]' };
  return { grade: 'STABILIZER', color: 'text-[#657565] bg-[#F1F2E8] border-[#D2D9C5]' };
}
