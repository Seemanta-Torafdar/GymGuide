/**
 * Granular Sub-Muscle Anatomical Contours aligned natively to the uniform skin-tone
 * 3D character PNG cutouts in `/images/character/`:
 *  - character-front-cutout.png      (316 x 675)
 *  - character-back-cutout.png       (302 x 675)
 *  - character-side-cutout.png       (154 x 675)
 *  - character-side-left-cutout.png  (154 x 675, horizontally mirrored SIDE)
 *  - character-quad-cutout.png       (946 x 675, composed at x offsets 0, 278, 582, 794)
 *
 * Every clickable/hoverable target maps to a SPECIFIC anatomical muscle or head
 * (e.g. Triceps Long Head vs Lateral Head vs Medial Head; Quads Rectus Femoris vs
 * Vastus Lateralis vs Vastus Medialis; Upper vs Lower Chest; Front vs Side vs Rear Delt)
 * so hovering or selecting highlights ONLY that specific muscle belly in crimson red.
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
    keywords: ['incline', 'reverse', 'low-to-high', 'landmine', 'clavicular', 'upper chest'],
  },
  'chest-lower': {
    id: 'chest-lower',
    slug: 'chest',
    parentName: 'Chest',
    name: 'Chest — Mid & Lower (Sternal Head)',
    shortName: 'Mid & Lower Chest',
    side: 'FRONT',
    keywords: ['flat', 'decline', 'dip', 'crossover', 'fly', 'bench', 'push-up', 'pec deck'],
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
  'lats-teres-major': {
    id: 'lats-teres-major',
    slug: 'latissimus-dorsi',
    parentName: 'Lats',
    name: 'Teres Major & Upper Lats',
    shortName: 'Upper Lats / Teres',
    side: 'BACK',
    keywords: ['wide-grip', 'pulldown', 'pull-up', 'chin-up', 'straight-arm'],
  },
  'lats-broad': {
    id: 'lats-broad',
    slug: 'latissimus-dorsi',
    parentName: 'Lats',
    name: 'Latissimus Dorsi (Lower Wing)',
    shortName: 'Lats',
    side: 'BACK',
    keywords: ['row', 'close-grip', 'pullover', 'single-arm', 'seal row', 'neutral'],
  },
  'lower-back-erectors': {
    id: 'lower-back-erectors',
    slug: 'lower-back',
    parentName: 'Lower Back',
    name: 'Lower Back — Erector Spinae',
    shortName: 'Erector Spinae',
    side: 'BACK',
    keywords: ['deadlift', 'back extension', 'hyperextension', 'good morning', 'superman'],
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

/**
 * Computes emphasis score for ranking exercises when a specific sub-muscle head is chosen
 */
export function matchesSubMuscleKeywords(exercise, subMuscleId) {
  const meta = SUB_MUSCLE_CATALOG[subMuscleId];
  if (!meta || !exercise) return false;
  const hay = `${exercise.name || ''} ${exercise.slug || ''} ${exercise.shortDescription || ''} ${exercise.targetCues || ''}`.toLowerCase();
  return meta.keywords.some((kw) => hay.includes(kw));
}

/**
 * Given an exercise, derives granular sub-muscle head IDs emphasized during its movement
 */
export function deriveActiveSubMuscleIdsForExercise(exercise) {
  if (!exercise) return new Set();
  const hay = `${exercise.name || ''} ${exercise.slug || ''} ${exercise.shortDescription || ''} ${exercise.targetCues || ''}`.toLowerCase();
  const activeIds = new Set();

  const allSlugs = new Set([
    ...(exercise.primaryMuscles || []).map((m) => m.slug),
    ...(exercise.secondaryMuscles || []).map((m) => m.slug),
  ]);

  for (const slug of allSlugs) {
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

export const FRONT_CHARACTER_REGIONS = [
  buildRegion('traps-upper', [
    'M 134 102 C 122 110, 112 117, 102 122 L 138 122 C 144 116, 146 108, 142 102 Z',
    'M 182 102 C 194 110, 204 117, 214 122 L 178 122 C 172 116, 170 108, 174 102 Z',
  ]),
  buildRegion('chest-upper', [
    'M 96 130 C 114 120, 144 122, 156 134 L 156 151 C 134 150, 112 148, 94 146 C 93 140, 94 134, 96 130 Z',
    'M 220 130 C 202 120, 172 122, 160 134 L 160 151 C 182 150, 204 148, 222 146 C 223 140, 222 134, 220 130 Z',
  ]),
  buildRegion('chest-lower', [
    'M 94 148 C 112 150, 134 152, 156 152 L 156 176 C 142 188, 108 188, 96 168 C 92 160, 92 154, 94 148 Z',
    'M 222 148 C 204 150, 182 152, 160 152 L 160 176 C 174 188, 208 188, 220 168 C 224 160, 224 154, 222 148 Z',
  ]),
  buildRegion('delts-anterior', [
    'M 95 126 L 82 126 C 78 148, 74 170, 68 192 C 78 180, 88 164, 96 142 Z',
    'M 221 126 L 234 126 C 238 148, 242 170, 248 192 C 238 180, 228 164, 220 142 Z',
  ]),
  buildRegion('delts-lateral', [
    'M 82 126 C 64 126, 56 144, 57 170 C 57 180, 62 190, 68 192 C 74 170, 78 148, 82 126 Z',
    'M 234 126 C 252 126, 260 144, 259 170 C 259 180, 254 190, 248 192 C 242 170, 238 148, 234 126 Z',
  ]),
  buildRegion('biceps-long-head', [
    'M 62 190 C 48 202, 42 224, 44 246 L 56 246 C 58 226, 62 206, 68 188 Z',
    'M 254 190 C 268 202, 274 224, 272 246 L 260 246 C 258 226, 254 206, 248 188 Z',
  ]),
  buildRegion('biceps-short-head', [
    'M 68 188 C 62 206, 58 226, 56 246 L 68 248 C 79 230, 88 206, 90 184 C 82 184, 74 186, 68 188 Z',
    'M 248 188 C 254 206, 258 226, 260 246 L 248 248 C 237 230, 228 206, 226 184 C 234 184, 242 186, 248 188 Z',
  ]),
  buildRegion('forearms-brachioradialis', [
    'M 42 248 C 24 268, 16 296, 18 326 L 28 326 C 32 300, 42 274, 52 248 Z',
    'M 274 248 C 292 268, 300 296, 298 326 L 288 326 C 284 300, 274 274, 264 248 Z',
  ]),
  buildRegion('forearms-flexors', [
    'M 52 248 C 42 274, 32 300, 28 326 L 38 328 C 52 302, 64 274, 67 248 Z',
    'M 264 248 C 274 274, 284 300, 288 326 L 278 328 C 264 302, 252 274, 249 248 Z',
  ]),
  buildRegion('abs-upper', [
    'M 124 186 C 142 188, 174 188, 192 186 L 190 244 L 126 244 Z',
  ]),
  buildRegion('abs-lower', [
    'M 126 244 L 190 244 L 188 286 C 176 296, 166 302, 158 302 C 150 302, 140 296, 128 286 Z',
  ]),
  buildRegion('serratus-anterior', [
    'M 96 178 L 124 188 L 125 220 L 106 218 C 102 204, 98 192, 96 178 Z',
    'M 220 178 L 192 188 L 191 220 L 210 218 C 214 204, 218 192, 220 178 Z',
  ]),
  buildRegion('obliques-external', [
    'M 106 218 L 125 220 L 126 286 L 110 280 C 108 256, 108 236, 106 218 Z',
    'M 210 218 L 191 220 L 190 286 L 206 280 C 208 256, 208 236, 210 218 Z',
  ]),
  buildRegion('quads-vastus-lateralis', [
    'M 92 324 L 110 318 C 104 356, 102 396, 104 434 L 94 438 C 72 418, 72 372, 92 324 Z',
    'M 224 324 L 206 318 C 212 356, 214 396, 212 434 L 222 438 C 244 418, 244 372, 224 324 Z',
  ]),
  buildRegion('quads-rectus-femoris', [
    'M 110 318 C 120 324, 128 334, 130 344 L 122 390 C 118 416, 115 430, 112 436 L 104 434 C 102 396, 104 356, 110 318 Z',
    'M 206 318 C 196 324, 188 334, 186 344 L 194 390 C 198 416, 201 430, 204 436 L 212 434 C 214 396, 212 356, 206 318 Z',
  ]),
  buildRegion('quads-vastus-medialis', [
    'M 130 344 C 142 362, 148 394, 144 424 C 138 440, 128 446, 114 442 C 114 426, 118 408, 122 390 Z',
    'M 186 344 C 174 362, 168 394, 172 424 C 178 440, 188 446, 202 442 C 202 426, 198 408, 194 390 Z',
  ]),
  buildRegion('calves-gastrocnemius-medial', [
    'M 104 476 C 114 476, 122 480, 128 486 C 132 516, 124 544, 114 568 L 104 568 C 102 536, 102 504, 104 476 Z',
    'M 212 476 C 202 476, 194 480, 188 486 C 184 516, 192 544, 202 568 L 212 568 C 214 536, 214 504, 212 476 Z',
  ]),
  buildRegion('calves-soleus', [
    'M 86 476 L 104 476 C 102 504, 102 536, 104 568 L 112 584 L 96 584 C 78 552, 74 512, 86 476 Z',
    'M 230 476 L 212 476 C 214 504, 214 536, 212 568 L 204 584 L 220 584 C 238 552, 242 512, 230 476 Z',
  ]),
];

export const BACK_CHARACTER_REGIONS = [
  buildRegion('traps-upper', [
    'M 134 86 C 144 93, 158 93, 168 86 L 204 118 C 188 124, 174 128, 151 128 C 128 128, 114 124, 98 118 Z',
  ]),
  buildRegion('traps-mid-lower', [
    'M 118 128 C 134 128, 168 128, 184 128 C 174 142, 164 158, 151 224 C 138 158, 128 142, 118 128 Z',
  ]),
  buildRegion('delts-lateral', [
    'M 78 122 C 58 126, 46 146, 48 176 L 64 180 C 66 158, 72 138, 78 122 Z',
    'M 224 122 C 244 126, 256 146, 254 176 L 238 180 C 236 158, 230 138, 224 122 Z',
  ]),
  buildRegion('delts-posterior', [
    'M 78 122 C 72 138, 66 158, 64 180 L 76 178 C 94 170, 112 160, 124 148 L 122 136 C 106 128, 92 122, 78 122 Z',
    'M 224 122 C 230 138, 236 158, 238 180 L 226 178 C 208 170, 190 160, 178 148 L 180 136 C 196 128, 210 122, 224 122 Z',
  ]),
  buildRegion('lats-teres-major', [
    'M 80 174 C 98 164, 114 156, 128 154 L 138 186 C 118 186, 98 186, 86 184 Z',
    'M 222 174 C 204 164, 188 156, 174 154 L 164 186 C 184 186, 204 186, 216 184 Z',
  ]),
  buildRegion('lats-broad', [
    'M 86 184 C 104 186, 122 186, 138 186 L 148 224 L 116 226 C 104 232, 92 208, 86 184 Z',
    'M 216 184 C 198 186, 180 186, 164 186 L 154 224 L 186 226 C 198 232, 210 208, 216 184 Z',
  ]),
  buildRegion('triceps-long-head', [
    'M 58 178 L 69 180 C 71 198, 68 220, 60 236 L 50 234 C 50 214, 54 196, 58 178 Z',
    'M 244 178 L 233 180 C 231 198, 234 220, 242 236 L 252 234 C 252 214, 248 196, 244 178 Z',
  ]),
  buildRegion('triceps-lateral-head', [
    'M 46 178 L 58 178 C 54 196, 50 214, 50 234 L 34 232 C 28 214, 34 194, 46 178 Z',
    'M 256 178 L 244 178 C 248 196, 252 214, 252 234 L 268 232 C 274 214, 268 194, 256 178 Z',
  ]),
  buildRegion('triceps-medial-head', [
    'M 34 232 L 50 234 L 62 238 L 58 248 L 32 248 Z',
    'M 268 232 L 252 234 L 240 238 L 244 248 L 270 248 Z',
  ]),
  buildRegion('forearms-brachioradialis', [
    'M 30 250 C 16 272, 10 302, 12 332 L 24 332 C 28 304, 36 274, 46 250 Z',
    'M 272 250 C 286 272, 292 302, 290 332 L 278 332 C 274 304, 266 274, 256 250 Z',
  ]),
  buildRegion('forearms-flexors', [
    'M 46 250 C 36 274, 28 304, 24 332 L 36 332 C 48 304, 58 274, 60 250 Z',
    'M 256 250 C 266 274, 274 304, 278 332 L 266 332 C 254 304, 244 274, 242 250 Z',
  ]),
  buildRegion('lower-back-erectors', [
    'M 116 226 L 151 232 L 186 226 L 194 272 C 176 266, 160 268, 151 274 C 142 268, 126 266, 108 272 Z',
  ]),
  buildRegion('glutes-medius', [
    'M 106 276 C 122 268, 140 272, 148 286 C 134 288, 118 292, 100 296 C 100 286, 102 280, 106 276 Z',
    'M 196 276 C 180 268, 162 272, 154 286 C 168 288, 184 292, 202 296 C 202 286, 200 280, 196 276 Z',
  ]),
  buildRegion('glutes-maximus', [
    'M 100 296 C 118 292, 134 288, 148 286 L 150 302 L 150 344 C 132 354, 102 346, 96 322 C 94 310, 96 302, 100 296 Z',
    'M 202 296 C 184 292, 168 288, 154 286 L 152 302 L 152 344 C 170 354, 200 346, 206 322 C 208 310, 206 302, 202 296 Z',
  ]),
  buildRegion('hams-biceps-femoris', [
    'M 90 342 L 114 348 C 112 392, 106 426, 98 450 L 80 452 C 66 418, 68 378, 90 342 Z',
    'M 212 342 L 188 348 C 190 392, 196 426, 204 450 L 222 452 C 236 418, 234 378, 212 342 Z',
  ]),
  buildRegion('hams-semitendinosus', [
    'M 114 348 C 128 350, 138 350, 146 346 C 144 396, 136 432, 126 452 C 116 448, 106 448, 98 450 C 106 426, 112 392, 114 348 Z',
    'M 188 348 C 174 350, 164 350, 156 346 C 158 396, 166 432, 176 452 C 186 448, 196 448, 204 450 C 196 426, 190 392, 188 348 Z',
  ]),
  buildRegion('calves-gastrocnemius-lateral', [
    'M 76 476 C 82 474, 88 474, 95 474 C 95 498, 95 524, 92 544 L 74 544 C 66 520, 68 496, 76 476 Z',
    'M 226 476 C 220 474, 214 474, 207 474 C 207 498, 207 524, 210 544 L 228 544 C 236 520, 234 496, 226 476 Z',
  ]),
  buildRegion('calves-gastrocnemius-medial', [
    'M 95 474 C 104 474, 114 478, 120 486 C 124 508, 120 528, 114 544 L 92 544 C 95 524, 95 498, 95 474 Z',
    'M 207 474 C 198 474, 188 478, 182 486 C 178 508, 182 528, 188 544 L 210 544 C 207 524, 207 498, 207 474 Z',
  ]),
  buildRegion('calves-soleus', [
    'M 74 544 L 114 544 L 104 584 L 84 584 Z',
    'M 228 544 L 188 544 L 198 584 L 218 584 Z',
  ]),
];

export const SIDE_CHARACTER_REGIONS = [
  buildRegion('delts-lateral', [
    'M 38 128 C 48 114, 72 114, 82 128 C 82 156, 76 178, 70 188 C 56 176, 44 158, 38 128 Z',
  ]),
  buildRegion('delts-anterior', [
    'M 82 128 C 90 130, 96 136, 96 144 C 94 166, 82 184, 72 190 L 70 188 C 76 178, 82 156, 82 128 Z',
  ]),
  buildRegion('delts-posterior', [
    'M 36 132 L 42 162 C 42 176, 34 184, 22 182 C 18 166, 22 146, 36 132 Z',
  ]),
  buildRegion('chest-upper', [
    'M 96 136 C 110 140, 124 148, 128 162 L 94 162 Z',
  ]),
  buildRegion('chest-lower', [
    'M 94 162 L 128 162 C 134 170, 134 180, 130 188 C 120 194, 102 192, 94 174 Z',
  ]),
  buildRegion('lats-broad', [
    'M 20 176 L 30 182 C 28 198, 28 212, 30 224 L 22 222 C 18 206, 18 190, 20 176 Z',
  ]),
  buildRegion('triceps-long-head', [
    'M 32 184 L 46 184 C 44 202, 44 220, 48 236 L 34 234 C 28 218, 28 198, 32 184 Z',
  ]),
  buildRegion('triceps-lateral-head', [
    'M 46 184 C 56 186, 62 198, 62 232 L 48 236 C 44 220, 44 202, 46 184 Z',
  ]),
  buildRegion('triceps-medial-head', [
    'M 34 234 L 48 236 L 62 232 L 60 248 L 44 248 Z',
  ]),
  buildRegion('biceps-long-head', [
    'M 62 188 C 74 190, 82 208, 80 242 L 62 248 Z',
  ]),
  buildRegion('forearms-brachioradialis', [
    'M 52 252 C 66 244, 88 264, 104 314 L 86 324 C 66 298, 52 274, 52 252 Z',
  ]),
  buildRegion('obliques-external', [
    'M 96 192 L 114 196 C 116 226, 114 256, 110 282 L 96 272 C 92 246, 92 218, 96 192 Z',
  ]),
  buildRegion('abs-upper', [
    'M 114 196 L 132 198 L 133 242 L 115 242 Z',
  ]),
  buildRegion('abs-lower', [
    'M 115 242 L 133 242 C 132 260, 130 276, 126 286 L 110 282 C 112 264, 114 252, 115 242 Z',
  ]),
  buildRegion('glutes-medius', [
    'M 54 268 C 40 272, 28 282, 24 294 L 62 294 L 54 268 Z',
  ]),
  buildRegion('glutes-maximus', [
    'M 24 294 C 22 314, 24 338, 44 348 L 54 344 L 68 308 L 62 294 Z',
  ]),
  buildRegion('hams-biceps-femoris', [
    'M 42 344 L 74 344 L 76 446 L 52 444 C 38 412, 36 376, 42 344 Z',
  ]),
  buildRegion('quads-vastus-lateralis', [
    'M 76 344 L 102 348 C 102 382, 102 416, 100 446 L 76 446 Z',
  ]),
  buildRegion('quads-rectus-femoris', [
    'M 102 348 C 115 364, 120 390, 115 420 C 112 434, 106 444, 100 446 C 102 416, 102 382, 102 348 Z',
  ]),
  buildRegion('calves-gastrocnemius-lateral', [
    'M 14 474 C 30 468, 48 470, 62 478 C 60 506, 58 526, 54 544 L 14 544 C 8 522, 8 496, 14 474 Z',
  ]),
  buildRegion('calves-soleus', [
    'M 14 544 L 54 544 L 48 584 L 22 584 Z',
  ]),
];
