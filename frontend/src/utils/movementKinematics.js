// ============================================================================
// GYMGUIDE - ANATOMICAL MOVEMENT KINEMATICS & MUSCLE HIT MAPPING
// Maps every seeded exercise + chosen equipment into exact biomechanical postures,
// equipment setups, 3D model overlays, and rep phase labels.
// ============================================================================

export function parseVideoSource(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1`,
    };
  }

  if (url.toLowerCase().endsWith('.gif') || url.toLowerCase().startsWith('data:image/gif')) {
    return {
      type: 'gif',
      src: url,
    };
  }

  return {
    type: 'video',
    src: url,
  };
}

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

  // Calves (check specific leg-press-calf-press & seated before leg_press)
  if (text.includes('calf')) {
    if (text.includes('leg-press') || text.includes('leg press')) return 'calf_press_leg';
    if (text.includes('seated')) return 'calf_raise_seated';
    return 'calf_raise';
  }

  // Chest specific movements & postures
  if (text.includes('pec deck') || text.includes('pec-deck')) {
    if (text.includes('reverse')) return 'reverse_fly';
    return 'pec_deck';
  }
  if (text.includes('reverse') && text.includes('fly')) return 'reverse_fly';
  if (text.includes('standing') && text.includes('chest press')) return 'standing_cable_press';
  if (text.includes('machine') && text.includes('chest press')) return 'seated_chest_press';
  if (text.includes('incline-chest-press-machine') || text.includes('incline chest press machine')) {
    return 'seated_chest_press';
  }
  if (text.includes('crossover') || text.includes('cable-fly') || text.includes('cable fly') || text.includes('cable-chest-fly')) {
    return 'cable_fly';
  }
  if (text.includes('fly')) return 'chest_fly';
  if (text.includes('push-up') || text.includes('pushup')) return 'pushup';
  if (text.includes('dip')) return 'dip';
  if (
    text.includes('bench press') ||
    text.includes('chest press') ||
    text.includes('dumbbell press') ||
    text.includes('decline dumbbell press')
  ) {
    return 'bench_press';
  }

  // Back & Pulls
  if (text.includes('pull-up') || text.includes('chin-up')) return 'pullup';
  if (text.includes('pulldown')) return 'pulldown';
  if (text.includes('face pull')) return 'face_pull';
  if (text.includes('seated') && text.includes('row')) return 'seated_row';
  if (text.includes('single-arm') && text.includes('row')) return 'single_arm_row';
  if (text.includes('row')) return 'row';
  if (text.includes('deadlift') || text.includes('rdl')) return 'deadlift';

  // Shoulders
  if (
    (text.includes('overhead') && text.includes('press')) ||
    text.includes('shoulder press') ||
    text.includes('arnold')
  ) {
    return 'overhead_press';
  }
  if (text.includes('lateral raise')) return 'lateral_raise';
  if (text.includes('front') && text.includes('raise')) return 'front_raise';

  // Arms & Forearms
  if (text.includes('pushdown')) return 'tricep_pushdown';
  if (text.includes('skull crusher')) return 'skull_crusher';
  if (text.includes('overhead') && (text.includes('extension') || text.includes('tricep'))) {
    return 'overhead_tricep';
  }
  if (text.includes('wrist curl')) return 'wrist_curl';
  if (text.includes('farmer')) return 'farmers_walk';
  if (text.includes('preacher')) return 'preacher_curl';
  if (text.includes('curl') && text.includes('leg')) return 'leg_curl';
  if (text.includes('curl')) return 'bicep_curl';

  // Legs & Glutes
  if (text.includes('leg press')) return 'leg_press';
  if (text.includes('leg extension')) return 'leg_extension';
  if (text.includes('leg curl')) return 'leg_curl';
  if (text.includes('bulgarian') || text.includes('split squat')) return 'split_squat';
  if (text.includes('lunge')) return 'lunge';
  if (text.includes('squat')) return 'squat';
  if (text.includes('hip thrust')) return 'hip_thrust';
  if (text.includes('glute bridge')) return 'glute_bridge';
  if (text.includes('kickback')) return 'kickback';

  // Core / Abs
  if (text.includes('plank')) return 'plank';
  if (text.includes('ab wheel') || text.includes('rollout')) return 'ab_wheel';
  if (text.includes('hanging leg raise')) return 'hanging_leg_raise';
  if (text.includes('cable crunch')) return 'cable_crunch';
  if (text.includes('russian twist')) return 'russian_twist';
  if (text.includes('bicycle')) return 'bicycle_crunch';

  return 'bench_press';
}

export function getRepPhaseInfo(phaseProgress = 0, isPerforming = false) {
  if (!isPerforming) {
    if (phaseProgress < 0.25) {
      return {
        label: 'Step 1 • Setup & Starting Position',
        shortLabel: 'Setup',
        stimulusMultiplier: 0.45,
      };
    }
    if (phaseProgress < 0.7) {
      return {
        label: 'Step 2 • Eccentric Load / Full Stretch',
        shortLabel: 'Stretch',
        stimulusMultiplier: 0.76,
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
      label: 'Setup & Starting Tension',
      shortLabel: 'Setup',
      stimulusMultiplier: 0.42 + phaseProgress * 1.4,
    };
  }
  if (phaseProgress < 0.55) {
    return {
      label: 'Controlled Concentric Drive',
      shortLabel: 'Drive',
      stimulusMultiplier: 0.68 + (phaseProgress - 0.2) * 0.8,
    };
  }
  if (phaseProgress < 0.85) {
    return {
      label: 'Peak Muscle Squeeze',
      shortLabel: 'Peak Hit',
      stimulusMultiplier: 0.92 + Math.sin(((phaseProgress - 0.55) / 0.3) * Math.PI) * 0.08,
    };
  }
  return {
    label: 'Slow Eccentric Return',
    shortLabel: 'Lowering',
    stimulusMultiplier: 0.78 - (phaseProgress - 0.85) * 1.8,
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
