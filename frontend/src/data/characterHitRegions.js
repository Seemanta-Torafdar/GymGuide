/**
 * High-Precision Pixel-Verified Sub-Muscle Anatomical Contours aligned natively
 * to the uniform skin-tone 3D cutouts in `/images/character/`:
 *  - character-front-cutout.png      (316 x 675, asymmetric L/R measured directly)
 *  - character-side-cutout.png       (154 x 675)
 *  - character-back-cutout.png       (302 x 675, asymmetric L/R measured directly)
 *  - character-side-left-cutout.png  (154 x 675, horizontally mirrored SIDE)
 *  - character-quad-cutout.png       (950 x 675: Front=0, SideR=318, Back=478, SideL=790)
 */

export const SUB_MUSCLE_CATALOG = {
  // CHEST
  'chest-upper': {
    id: 'chest-upper',
    slug: 'chest',
    parentName: 'Chest',
    name: 'Chest — Upper (Clavicular Head)',
    shortName: 'Upper Chest',
    side: 'FRONT',
    keywords: ['incline dumbbell', 'incline barbell', 'incline chest', 'incline fly', 'decline push-up', 'decline pushup', 'low-to-high', 'landmine', 'clavicular', 'upper chest'],
  },
  'chest-lower': {
    id: 'chest-lower',
    slug: 'chest',
    parentName: 'Chest',
    name: 'Chest — Mid & Lower (Sternal Head)',
    shortName: 'Mid & Lower Chest',
    side: 'FRONT',
    keywords: ['flat', 'barbell bench', 'dumbbell bench', 'chest press', 'decline dumbbell', 'decline barbell', 'high-to-low', 'incline push-up', 'incline pushup', 'dip', 'crossover', 'fly', 'push-up', 'wide push-up', 'pec deck'],
  },

  // SHOULDERS (DELTOIDS)
  'delts-anterior': {
    id: 'delts-anterior',
    slug: 'front-deltoids',
    parentName: 'Shoulders',
    name: 'Deltoids — Front (Anterior Delt)',
    shortName: 'Front Delt',
    side: 'FRONT',
    keywords: ['front raise', 'overhead press', 'shoulder press', 'arnold', 'military'],
  },
  'delts-lateral': {
    id: 'delts-lateral',
    slug: 'front-deltoids',
    parentName: 'Shoulders',
    name: 'Deltoids — Side (Lateral Delt)',
    shortName: 'Side Delt',
    side: 'FRONT',
    keywords: ['lateral raise', 'upright row', 'side raise', 'cable lateral', 'arnold'],
  },
  'delts-posterior': {
    id: 'delts-posterior',
    slug: 'rear-deltoids',
    parentName: 'Shoulders',
    name: 'Deltoids — Rear (Posterior Delt)',
    shortName: 'Rear Delt',
    side: 'BACK',
    keywords: ['face pull', 'reverse', 'rear delt', 'bent-over', 'row'],
  },

  // BICEPS
  'biceps-long-head': {
    id: 'biceps-long-head',
    slug: 'biceps',
    parentName: 'Biceps',
    name: 'Biceps — Long Head (Outer Peak)',
    shortName: 'Long Head',
    side: 'FRONT',
    keywords: ['hammer', 'incline', 'drag', 'narrow', 'rope', 'reverse curl', 'brachialis'],
  },
  'biceps-short-head': {
    id: 'biceps-short-head',
    slug: 'biceps',
    parentName: 'Biceps',
    name: 'Biceps — Short Head (Inner Belly)',
    shortName: 'Short Head',
    side: 'FRONT',
    keywords: ['preacher', 'concentration', 'spider', 'wide', 'barbell curl', 'ez-bar', 'chin'],
  },

  // TRICEPS (3 HEADS)
  'triceps-long-head': {
    id: 'triceps-long-head',
    slug: 'triceps',
    parentName: 'Triceps',
    name: 'Triceps — Long Head',
    shortName: 'Long Head',
    side: 'BACK',
    keywords: ['overhead', 'skull', 'french', 'incline', 'kickback', 'jm press', 'long head'],
  },
  'triceps-lateral-head': {
    id: 'triceps-lateral-head',
    slug: 'triceps',
    parentName: 'Triceps',
    name: 'Triceps — Lateral Head',
    shortName: 'Lateral Head',
    side: 'BACK',
    keywords: ['pushdown', 'rope', 'v-bar', 'close-grip', 'diamond', 'dip', 'lateral head'],
  },
  'triceps-medial-head': {
    id: 'triceps-medial-head',
    slug: 'triceps',
    parentName: 'Triceps',
    name: 'Triceps — Medial Head',
    shortName: 'Medial Head',
    side: 'BACK',
    keywords: ['reverse-grip', 'single-arm', 'pushdown', 'dip', 'kickback', 'medial'],
  },

  // FOREARMS
  'forearms-brachioradialis': {
    id: 'forearms-brachioradialis',
    slug: 'forearms',
    parentName: 'Forearms',
    name: 'Forearms — Brachioradialis (Outer)',
    shortName: 'Brachioradialis',
    side: 'FRONT',
    keywords: ['hammer', 'reverse', 'zottman', 'farmer', 'brachioradialis'],
  },
  'forearms-flexors': {
    id: 'forearms-flexors',
    slug: 'forearms',
    parentName: 'Forearms',
    name: 'Forearms — Wrist Flexors (Inner)',
    shortName: 'Flexors',
    side: 'FRONT',
    keywords: ['wrist curl', 'hang', 'farmer', 'plate pinch', 'flexor'],
  },

  // TRAPEZIUS & BACK
  'traps-upper': {
    id: 'traps-upper',
    slug: 'trapezius',
    parentName: 'Trapezius',
    name: 'Trapezius — Upper Traps',
    shortName: 'Upper Traps',
    side: 'BACK',
    keywords: ['shrug', 'upright row', 'farmer', 'deadlift', 'high pull'],
  },
  'traps-mid-lower': {
    id: 'traps-mid-lower',
    slug: 'trapezius',
    parentName: 'Trapezius',
    name: 'Trapezius — Mid & Lower Traps',
    shortName: 'Mid/Lower Traps',
    side: 'BACK',
    keywords: ['face pull', 't-bar', 'seated row', 'y-raise', 'bent-over', 'kelso'],
  },
  'lats-upper': {
    id: 'lats-upper',
    slug: 'latissimus-dorsi',
    parentName: 'Lats',
    name: 'Lats — Upper Lats & Teres Major',
    shortName: 'Upper Lats',
    side: 'BACK',
    keywords: ['wide-grip', 'pulldown', 'pull-up', 'chin-up', 'lat pulldown', 'teres'],
  },
  'lats-lower': {
    id: 'lats-lower',
    slug: 'latissimus-dorsi',
    parentName: 'Lats',
    name: 'Lats — Lower Lats (Lower Wing)',
    shortName: 'Lower Lats',
    side: 'BACK',
    keywords: ['row', 'close-grip', 'pullover', 'straight-arm', 'single-arm', 'seal row', 'neutral', 'underhand', 'reverse-grip'],
  },
  'lower-back-erectors': {
    id: 'lower-back-erectors',
    slug: 'lower-back',
    parentName: 'Lower Back',
    name: 'Lower Back — Erector Spinae',
    shortName: 'Lower Back',
    side: 'BACK',
    keywords: ['deadlift', 'back extension', 'hyperextension', 'good morning', 'superman', 'romanian'],
  },

  // ABS & CORE
  'abs-upper': {
    id: 'abs-upper',
    slug: 'rectus-abdominis',
    parentName: 'Abs',
    name: 'Abs — Upper Rectus Abdominis',
    shortName: 'Upper Abs',
    side: 'FRONT',
    keywords: ['crunch', 'cable crunch', 'sit-up', 'ab wheel', 'plank', 'hollow'],
  },
  'abs-lower': {
    id: 'abs-lower',
    slug: 'rectus-abdominis',
    parentName: 'Abs',
    name: 'Abs — Lower Rectus Abdominis',
    shortName: 'Lower Abs',
    side: 'FRONT',
    keywords: ['leg raise', 'hanging', 'reverse crunch', 'dragon', 'flutter', 'knee raise'],
  },
  'serratus-anterior': {
    id: 'serratus-anterior',
    slug: 'obliques',
    parentName: 'Obliques & Core',
    name: 'Serratus Anterior (Upper Ribs)',
    shortName: 'Serratus',
    side: 'FRONT',
    keywords: ['push-up', 'ab wheel', 'punch', 'pullover', 'plank', 'overhead'],
  },
  'obliques-external': {
    id: 'obliques-external',
    slug: 'obliques',
    parentName: 'Obliques & Core',
    name: 'Obliques — External Obliques',
    shortName: 'Obliques',
    side: 'FRONT',
    keywords: ['twist', 'woodchop', 'side plank', 'bicycle', 'windshield', 'pallof'],
  },

  // GLUTES
  'glutes-medius': {
    id: 'glutes-medius',
    slug: 'glutes',
    parentName: 'Glutes',
    name: 'Glutes — Gluteus Medius (Upper Shelf)',
    shortName: 'Gluteus Medius',
    side: 'BACK',
    keywords: ['abduction', 'clamshell', 'band walk', 'single-leg', 'step-up', 'bulgarian'],
  },
  'glutes-maximus': {
    id: 'glutes-maximus',
    slug: 'glutes',
    parentName: 'Glutes',
    name: 'Glutes — Gluteus Maximus',
    shortName: 'Gluteus Maximus',
    side: 'BACK',
    keywords: ['hip thrust', 'glute bridge', 'romanian', 'squat', 'kickback', 'pull-through'],
  },

  // QUADRICEPS (3 HEADS)
  'quads-rectus-femoris': {
    id: 'quads-rectus-femoris',
    slug: 'quadriceps',
    parentName: 'Quadriceps',
    name: 'Quads — Rectus Femoris (Center)',
    shortName: 'Rectus Femoris',
    side: 'FRONT',
    keywords: ['leg extension', 'sissy', 'lunge', 'split squat', 'front squat'],
  },
  'quads-vastus-lateralis': {
    id: 'quads-vastus-lateralis',
    slug: 'quadriceps',
    parentName: 'Quadriceps',
    name: 'Quads — Vastus Lateralis (Outer Sweep)',
    shortName: 'Vastus Lateralis',
    side: 'FRONT',
    keywords: ['squat', 'hack squat', 'leg press', 'narrow', 'goblet'],
  },
  'quads-vastus-medialis': {
    id: 'quads-vastus-medialis',
    slug: 'quadriceps',
    parentName: 'Quadriceps',
    name: 'Quads — Vastus Medialis (VMO Teardrop)',
    shortName: 'Vastus Medialis (VMO)',
    side: 'FRONT',
    keywords: ['step-up', 'spanish', 'cyclist', 'heels elevated', 'leg extension', 'bulgarian'],
  },

  // HAMSTRINGS
  'hams-biceps-femoris': {
    id: 'hams-biceps-femoris',
    slug: 'hamstrings',
    parentName: 'Hamstrings',
    name: 'Hamstrings — Biceps Femoris (Outer)',
    shortName: 'Biceps Femoris',
    side: 'BACK',
    keywords: ['lying leg curl', 'rdl', 'romanian', 'stiff-leg', 'nordic', 'deadlift'],
  },
  'hams-semitendinosus': {
    id: 'hams-semitendinosus',
    slug: 'hamstrings',
    parentName: 'Hamstrings',
    name: 'Hamstrings — Semitendinosus (Inner)',
    shortName: 'Inner Hamstring',
    side: 'BACK',
    keywords: ['seated leg curl', 'good morning', 'kettlebell swing', 'glute-ham'],
  },

  // CALVES
  'calves-gastrocnemius-medial': {
    id: 'calves-gastrocnemius-medial',
    slug: 'calves',
    parentName: 'Calves',
    name: 'Calves — Medial Gastrocnemius',
    shortName: 'Medial Calf',
    side: 'BACK',
    keywords: ['standing', 'donkey', 'leg press calf', 'jump', 'raise'],
  },
  'calves-gastrocnemius-lateral': {
    id: 'calves-gastrocnemius-lateral',
    slug: 'calves',
    parentName: 'Calves',
    name: 'Calves — Lateral Gastrocnemius',
    shortName: 'Lateral Calf',
    side: 'BACK',
    keywords: ['standing', 'donkey', 'single-leg calf', 'jump'],
  },
  'calves-soleus': {
    id: 'calves-soleus',
    slug: 'calves',
    parentName: 'Calves',
    name: 'Calves — Soleus (Lower Calf)',
    shortName: 'Soleus',
    side: 'BACK',
    keywords: ['seated calf', 'bent-knee', 'soleus', 'walk'],
  },
};

export function getSubMusclesForParentSlug(slug) {
  return Object.values(SUB_MUSCLE_CATALOG).filter((item) => item.slug === slug);
}

export function matchesSubMuscleKeywords(exercise, subMuscleId) {
  const meta = SUB_MUSCLE_CATALOG[subMuscleId];
  if (!meta || !exercise) return false;
  const hay = `${exercise.name || ''} ${exercise.slug || ''} ${exercise.subRegion || ''} ${exercise.shortDescription || ''} ${exercise.description || ''}`.toLowerCase();
  return meta.keywords.some((kw) => hay.includes(kw));
}

export function deriveActiveSubMuscleIdsForExercise(exercise) {
  if (!exercise) return new Set();
  const hay = `${exercise.name || ''} ${exercise.slug || ''} ${exercise.subRegion || ''} ${exercise.shortDescription || ''} ${exercise.description || ''}`.toLowerCase();
  const activeIds = new Set();

  const allSlugs = new Set([
    ...(exercise.primaryMuscles || []).map((m) => m.slug),
    ...(exercise.secondaryMuscles || []).map((m) => m.slug),
  ]);

  for (const slug of allSlugs) {
    // Explicit biomechanics overrides where push-up angle flips upper vs lower chest
    if (slug === 'chest') {
      if (hay.includes('decline push-up') || hay.includes('decline pushup') || hay.includes('upper chest') || hay.includes('low-to-high') || (hay.includes('incline') && !hay.includes('incline push-up') && !hay.includes('incline pushup'))) {
        activeIds.add('chest-upper');
        continue;
      }
      if (hay.includes('incline push-up') || hay.includes('incline pushup') || hay.includes('lower chest') || hay.includes('decline dumbbell') || hay.includes('decline barbell') || hay.includes('high-to-low') || hay.includes('dip')) {
        activeIds.add('chest-lower');
        continue;
      }
      // Standard flat presses/flyes/crossovers activate the sternal pecs + upper clavicular fibers together
      activeIds.add('chest-upper');
      activeIds.add('chest-lower');
      continue;
    }

    if (slug === 'front-deltoids') {
      if (hay.includes('lateral raise') || hay.includes('upright row') || hay.includes('side raise')) {
        activeIds.add('delts-lateral');
        continue;
      }
      if (hay.includes('arnold') || hay.includes('overhead') || hay.includes('shoulder press')) {
        activeIds.add('delts-anterior');
        activeIds.add('delts-lateral');
        continue;
      }
      activeIds.add('delts-anterior');
      continue;
    }

    if (slug === 'calves') {
      if (hay.includes('seated calf') || hay.includes('bent-knee') || hay.includes('soleus')) {
        activeIds.add('calves-soleus');
        continue;
      }
      activeIds.add('calves-gastrocnemius-medial');
      activeIds.add('calves-gastrocnemius-lateral');
      continue;
    }

    const heads = getSubMusclesForParentSlug(slug);
    const keywordMatches = heads.filter((h) => h.keywords.some((kw) => hay.includes(kw)));
    if (keywordMatches.length > 0) {
      keywordMatches.forEach((h) => activeIds.add(h.id));
    } else {
      heads.forEach((h) => activeIds.add(h.id));
    }
  }
  return activeIds;
}

const buildRegion = (id, paths) => ({
  ...SUB_MUSCLE_CATALOG[id],
  paths,
});

// FRONT (316 x 675) — pixel-verified against exact alpha silhouette & muscle striations
export const FRONT_CHARACTER_REGIONS = [
  buildRegion('traps-upper', [
    'M 136 98 C 128 108, 114 118, 94 126 L 136 123 C 140 114, 140 105, 136 98 Z',
    'M 184 98 C 192 108, 206 118, 226 126 L 184 123 C 180 114, 180 105, 184 98 Z',
  ]),
  buildRegion('chest-upper', [
    'M 102 127 C 118 122, 145 123, 159 132 L 159 149 C 134 149, 110 148, 93 147 C 95 138, 98 131, 102 127 Z',
    'M 218 127 C 202 122, 175 123, 161 132 L 161 149 C 186 149, 210 148, 227 147 C 225 138, 222 131, 218 127 Z',
  ]),
  buildRegion('chest-lower', [
    'M 93 147 C 110 148, 134 149, 159 149 L 159 175 C 145 186, 110 186, 97 169 C 93 161, 92 153, 93 147 Z',
    'M 227 147 C 210 148, 186 149, 161 149 L 161 175 C 175 186, 210 186, 223 169 C 227 161, 228 153, 227 147 Z',
  ]),
  buildRegion('delts-anterior', [
    'M 102 127 L 85 127 C 81 148, 76 168, 70 184 C 81 176, 92 158, 102 127 Z',
    'M 218 127 L 235 127 C 239 148, 244 168, 250 184 C 239 176, 228 158, 218 127 Z',
  ]),
  buildRegion('delts-lateral', [
    'M 85 127 C 71 132, 60 146, 58 168 C 58 176, 62 183, 70 184 C 76 168, 81 148, 85 127 Z',
    'M 235 127 C 249 132, 260 146, 262 168 C 262 176, 258 183, 250 184 C 244 168, 239 148, 235 127 Z',
  ]),
  buildRegion('lats-upper', [
    'M 90 176 L 97 172 C 100 182, 102 192, 104 202 L 94 202 C 91 194, 88 184, 90 176 Z',
    'M 230 176 L 223 172 C 220 182, 218 192, 216 202 L 226 202 C 229 194, 232 184, 230 176 Z',
  ]),
  buildRegion('lats-lower', [
    'M 94 202 L 104 202 L 108 218 L 99 224 C 96 216, 94 208, 94 202 Z',
    'M 226 202 L 216 202 L 212 218 L 221 224 C 224 216, 226 208, 226 202 Z',
  ]),
  buildRegion('biceps-long-head', [
    'M 68 184 L 58 184 C 52 200, 48 216, 44 238 L 54 242 C 58 222, 62 202, 68 184 Z',
    'M 252 184 L 262 184 C 267 200, 272 216, 275 238 L 266 242 C 262 222, 258 202, 252 184 Z',
  ]),
  buildRegion('biceps-short-head', [
    'M 68 184 C 62 202, 58 222, 54 242 L 66 244 C 77 228, 86 206, 90 184 L 70 184 Z',
    'M 252 184 C 258 202, 262 222, 266 242 L 254 244 C 243 228, 234 206, 230 184 L 250 184 Z',
  ]),
  buildRegion('forearms-brachioradialis', [
    'M 42 238 C 31 258, 24 284, 20 314 L 29 315 C 37 288, 45 264, 54 242 Z',
    'M 277 238 C 287 258, 294 284, 298 314 L 291 315 C 283 288, 275 264, 266 242 Z',
  ]),
  buildRegion('forearms-flexors', [
    'M 54 242 C 45 264, 37 288, 29 315 L 40 315 C 53 292, 64 268, 66 244 Z',
    'M 266 242 C 275 264, 283 288, 291 315 L 280 315 C 267 292, 256 268, 254 244 Z',
  ]),
  buildRegion('abs-upper', [
    'M 131 182 C 145 180, 175 180, 189 182 L 190 244 L 130 244 Z',
  ]),
  buildRegion('abs-lower', [
    'M 130 244 L 190 244 C 186 264, 174 284, 160 296 C 146 284, 134 264, 130 244 Z',
  ]),
  buildRegion('serratus-anterior', [
    'M 97 169 C 110 182, 122 184, 130 183 L 130 226 C 122 222, 114 218, 108 216 C 103 200, 99 184, 97 169 Z',
    'M 223 169 C 210 182, 198 184, 190 183 L 190 226 C 198 222, 206 218, 212 216 C 217 200, 221 184, 223 169 Z',
  ]),
  buildRegion('obliques-external', [
    'M 108 216 C 114 218, 122 222, 130 226 L 130 244 C 134 262, 139 276, 145 286 L 111 278 C 110 258, 110 236, 108 216 Z',
    'M 212 216 C 206 218, 198 222, 190 226 L 190 244 C 186 262, 181 276, 175 286 L 209 278 C 210 258, 210 236, 212 216 Z',
  ]),
  buildRegion('quads-vastus-lateralis', [
    'M 96 328 L 105 332 C 99 366, 98 410, 103 440 L 91 440 C 82 418, 79 382, 85 352 Z',
    'M 226 328 L 213 332 C 219 366, 220 410, 215 440 L 227 440 C 237 418, 243 382, 237 352 Z',
  ]),
  buildRegion('quads-rectus-femoris', [
    'M 105 320 C 114 326, 122 338, 127 354 C 122 384, 117 414, 110 436 L 103 440 C 98 410, 99 366, 105 320 Z',
    'M 213 320 C 204 326, 196 338, 191 354 C 196 384, 201 414, 208 436 L 215 440 C 220 410, 219 366, 213 320 Z',
  ]),
  buildRegion('quads-vastus-medialis', [
    'M 127 378 C 139 394, 138 418, 134 436 C 128 446, 118 448, 110 440 C 112 420, 118 398, 127 378 Z',
    'M 191 378 C 179 394, 180 418, 184 436 C 190 446, 200 448, 208 440 C 206 420, 200 398, 191 378 Z',
  ]),
  buildRegion('calves-gastrocnemius-medial', [
    'M 98 494 C 109 490, 122 496, 128 514 C 130 534, 121 554, 108 564 L 96 564 C 95 540, 96 516, 98 494 Z',
    'M 220 494 C 209 490, 196 496, 190 514 C 188 534, 197 554, 210 564 L 222 564 C 223 540, 222 516, 220 494 Z',
  ]),
  buildRegion('calves-soleus', [
    'M 77 492 L 98 494 C 96 516, 95 540, 96 564 L 106 586 L 80 586 C 72 558, 68 522, 77 492 Z',
    'M 241 492 L 220 494 C 222 516, 223 540, 222 564 L 212 586 L 238 586 C 246 558, 250 522, 241 492 Z',
  ]),
];

// BACK (302 x 675) — pixel-verified L/R asymmetric with zero silhouette leak and Full Lats
export const BACK_CHARACTER_REGIONS = [
  buildRegion('traps-upper', [
    'M 127 86 C 142 89, 160 89, 175 86 L 178 104 C 188 112, 200 118, 214 124 C 200 127, 193 128, 186 128 C 172 130, 160 130, 151 130 C 142 130, 130 130, 116 128 C 109 128, 102 127, 88 124 C 102 118, 114 112, 124 104 Z',
  ]),
  buildRegion('traps-mid-lower', [
    'M 114 128 C 132 130, 170 130, 188 128 C 184 150, 178 172, 166 190 L 151 210 L 136 190 C 124 172, 118 150, 114 128 Z',
  ]),
  buildRegion('delts-lateral', [
    'M 76 125 C 58 130, 47 146, 46 168 C 46 174, 50 179, 56 180 L 66 174 C 66 156, 70 138, 76 125 Z',
    'M 226 125 C 244 130, 256 146, 258 168 C 258 174, 254 179, 248 180 L 238 174 C 236 156, 232 138, 226 125 Z',
  ]),
  buildRegion('delts-posterior', [
    'M 76 125 C 94 126, 104 127, 114 128 C 118 142, 122 152, 124 156 C 112 162, 98 166, 76 168 L 66 174 C 66 156, 70 138, 76 125 Z',
    'M 226 125 C 208 126, 198 127, 188 128 C 184 142, 180 152, 178 156 C 190 162, 204 166, 226 168 L 238 174 C 236 156, 232 138, 226 125 Z',
  ]),
  buildRegion('lats-upper', [
    'M 76 168 C 98 166, 112 162, 124 156 L 136 190 L 148 208 C 128 212, 108 214, 88 214 C 82 200, 77 186, 74 174 Z',
    'M 226 168 C 204 166, 190 162, 178 156 L 166 190 L 154 208 C 174 212, 194 214, 214 214 C 220 200, 224 186, 228 174 Z',
  ]),
  buildRegion('lats-lower', [
    'M 88 214 C 108 214, 128 212, 148 208 C 142 228, 134 250, 124 272 L 100 272 L 102 248 L 99 232 Z',
    'M 214 214 C 194 214, 174 212, 154 208 C 160 228, 168 250, 178 272 L 204 272 L 203 248 L 205 232 Z',
  ]),
  buildRegion('triceps-lateral-head', [
    'M 56 180 C 46 190, 41 206, 38 224 L 49 226 C 52 208, 56 194, 62 178 Z',
    'M 248 180 C 258 190, 263 206, 266 224 L 253 226 C 250 208, 246 194, 240 178 Z',
  ]),
  buildRegion('triceps-long-head', [
    'M 62 178 L 75 176 C 82 194, 80 214, 68 232 L 49 226 C 52 208, 56 194, 62 178 Z',
    'M 240 178 L 227 176 C 220 194, 222 214, 234 232 L 253 226 C 250 208, 246 194, 240 178 Z',
  ]),
  buildRegion('triceps-medial-head', [
    'M 38 224 L 49 226 L 68 232 L 66 244 L 27 244 C 31 236, 35 230, 38 224 Z',
    'M 266 224 C 269 230, 272 236, 275 244 L 236 244 L 234 232 L 253 226 Z',
  ]),
  buildRegion('forearms-brachioradialis', [
    'M 27 244 L 46 244 C 42 268, 36 296, 27 320 L 17 320 C 19 294, 23 268, 27 244 Z',
    'M 256 244 L 275 244 C 280 268, 285 294, 287 320 L 277 320 C 269 296, 262 268, 256 244 Z',
  ]),
  buildRegion('forearms-flexors', [
    'M 46 244 L 66 244 C 66 268, 58 286, 48 300 L 37 320 L 27 320 C 36 296, 42 268, 46 244 Z',
    'M 236 244 L 256 244 C 262 268, 269 296, 277 320 L 268 320 L 257 300 C 246 286, 240 268, 236 244 Z',
  ]),
  buildRegion('lower-back-erectors', [
    'M 148 208 L 154 208 C 160 228, 168 250, 178 272 L 124 272 C 134 250, 142 228, 148 208 Z',
  ]),
  buildRegion('glutes-medius', [
    'M 101 272 L 204 272 C 208 280, 211 288, 212 296 L 94 296 C 95 288, 98 280, 101 272 Z',
  ]),
  buildRegion('glutes-maximus', [
    'M 94 296 L 151 296 L 151 346 C 128 352, 98 344, 87 326 C 89 312, 91 304, 94 296 Z',
    'M 212 296 L 153 296 L 153 346 C 176 352, 206 344, 219 326 C 217 312, 215 304, 212 296 Z',
  ]),
  buildRegion('hams-biceps-femoris', [
    'M 83 344 L 110 350 C 106 388, 98 422, 93 446 L 81 446 C 72 414, 70 376, 83 344 Z',
    'M 223 344 L 196 350 C 200 388, 208 422, 214 446 L 225 446 C 235 414, 237 376, 223 344 Z',
  ]),
  buildRegion('hams-semitendinosus', [
    'M 110 350 C 128 352, 142 350, 150 346 C 149 388, 139 424, 128 448 L 93 446 C 98 422, 106 388, 110 350 Z',
    'M 196 350 C 178 352, 164 350, 156 346 C 157 388, 167 424, 178 448 L 214 446 C 208 422, 200 388, 196 350 Z',
  ]),
  buildRegion('calves-gastrocnemius-lateral', [
    'M 80 468 C 85 466, 89 465, 93 466 L 93 546 C 78 548, 66 538, 63 518 C 63 502, 72 484, 80 468 Z',
    'M 225 468 C 221 466, 217 465, 212 466 L 212 546 C 227 548, 240 538, 243 518 C 243 502, 234 484, 225 468 Z',
  ]),
  buildRegion('calves-gastrocnemius-medial', [
    'M 93 466 C 103 466, 115 474, 120 492 C 124 516, 122 544, 108 556 C 100 558, 95 552, 93 546 Z',
    'M 212 466 C 202 466, 191 474, 185 492 C 181 516, 183 544, 198 556 C 206 558, 210 552, 212 546 Z',
  ]),
  buildRegion('calves-soleus', [
    'M 65 540 C 73 548, 86 552, 93 546 C 98 556, 108 556, 114 550 C 110 564, 107 576, 106 584 L 73 584 C 70 570, 67 554, 65 540 Z',
    'M 240 540 C 232 548, 220 552, 212 546 C 207 556, 198 556, 192 550 C 196 564, 199 576, 200 584 L 233 584 C 236 570, 238 554, 240 540 Z',
  ]),
];

// SIDE RIGHT (154 x 675, mirrored cleanly to SIDE LEFT) — 0px leak & full Lats sweep
export const SIDE_CHARACTER_REGIONS = [
  buildRegion('traps-upper', [
    'M 52 98 C 42 110, 31 120, 24 130 L 42 126 C 52 118, 64 114, 72 116 C 64 108, 57 102, 52 98 Z',
  ]),
  buildRegion('delts-posterior', [
    'M 36 128 L 46 150 L 45 176 C 37 180, 31 180, 28 170 C 26 154, 29 138, 36 128 Z',
  ]),
  buildRegion('delts-lateral', [
    'M 36 128 C 48 114, 68 114, 80 124 L 84 156 L 71 184 C 60 176, 51 164, 46 150 Z',
  ]),
  buildRegion('delts-anterior', [
    'M 80 124 C 92 128, 98 138, 98 150 C 94 166, 82 180, 71 184 L 84 156 Z',
  ]),
  buildRegion('chest-upper', [
    'M 94 128 C 107 136, 119 146, 126 158 L 94 158 Z',
  ]),
  buildRegion('chest-lower', [
    'M 94 158 L 126 158 C 134 168, 134 182, 125 188 C 110 190, 98 184, 92 172 Z',
  ]),
  buildRegion('lats-upper', [
    'M 24 130 L 35 129 C 28 144, 27 160, 32 180 L 29 200 L 31 214 L 26 214 C 19 198, 14 180, 12 166 C 12 150, 15 140, 24 130 Z',
  ]),
  buildRegion('lats-lower', [
    'M 26 214 L 31 214 L 38 232 L 46 246 L 52 258 L 54 270 L 46 270 L 47 254 C 41 240, 33 226, 26 214 Z',
  ]),
  buildRegion('triceps-long-head', [
    'M 31 180 L 45 180 C 46 202, 48 218, 52 228 L 38 232 C 30 214, 28 196, 31 180 Z',
  ]),
  buildRegion('triceps-lateral-head', [
    'M 45 180 C 57 182, 64 196, 65 224 L 52 228 C 48 218, 46 202, 45 180 Z',
  ]),
  buildRegion('triceps-medial-head', [
    'M 38 232 L 52 228 L 65 224 L 62 246 L 44 246 Z',
  ]),
  buildRegion('biceps-long-head', [
    'M 65 184 C 78 186, 92 204, 89 234 L 66 242 Z',
  ]),
  buildRegion('forearms-brachioradialis', [
    'M 54 246 C 72 246, 92 268, 114 308 L 102 320 C 84 302, 68 278, 54 246 Z',
  ]),
  buildRegion('forearms-flexors', [
    'M 45 248 L 54 246 C 68 278, 84 302, 102 320 L 90 318 C 70 294, 52 270, 45 248 Z',
  ]),
  buildRegion('serratus-anterior', [
    'M 88 186 L 114 192 L 114 222 L 88 216 C 85 204, 86 194, 88 186 Z',
  ]),
  buildRegion('obliques-external', [
    'M 88 216 L 114 222 C 115 246, 115 268, 114 282 L 96 276 C 89 254, 86 234, 88 216 Z',
  ]),
  buildRegion('abs-upper', [
    'M 114 194 L 131 196 L 134 242 L 114 242 Z',
  ]),
  buildRegion('abs-lower', [
    'M 114 242 L 134 242 L 126 290 L 114 282 Z',
  ]),
  buildRegion('glutes-medius', [
    'M 45 272 L 80 282 L 84 298 L 30 298 L 35 286 Z',
  ]),
  buildRegion('glutes-maximus', [
    'M 30 298 L 84 298 C 84 314, 80 330, 74 344 L 38 348 C 24 334, 22 312, 30 298 Z',
  ]),
  buildRegion('hams-biceps-femoris', [
    'M 40 350 L 60 346 C 56 384, 52 414, 49 438 L 40 434 L 34 404 L 36 372 Z',
  ]),
  buildRegion('quads-vastus-lateralis', [
    'M 60 346 L 94 346 C 98 378, 100 408, 94 438 L 49 438 C 52 414, 56 384, 60 346 Z',
  ]),
  buildRegion('quads-rectus-femoris', [
    'M 94 364 C 110 376, 117 396, 112 420 C 107 432, 100 436, 94 438 C 99 412, 99 386, 94 364 Z',
  ]),
  buildRegion('calves-gastrocnemius-lateral', [
    'M 33 466 L 54 470 L 60 490 L 48 526 L 36 548 L 16 544 C 7 522, 10 496, 33 466 Z',
  ]),
  buildRegion('calves-soleus', [
    'M 16 544 L 36 548 C 44 544, 50 544, 54 546 L 54 584 L 26 584 Z',
  ]),
];
