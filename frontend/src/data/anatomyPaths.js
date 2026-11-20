// ============================================================================
// GYMGUIDE - ANATOMICAL HUMAN MUSCLE SVG PATHS (FRONT & BACK VIEWS)
// Precision multi-path SVG coordinates (viewBox: "0 0 360 680")
// Each muscle group has left & right anatomical muscle belly paths,
// internal striation/tendon detail lines, and label anchor coordinates.
// ============================================================================

export const ANATOMY_SILHOUETTE = {
  // Non-clickable structural reference (Head, Neck, Hands, Joints, Feet)
  headAndNeckFront: [
    // Cranium & Jaw
    'M 180 24 C 161 24 152 38 153 58 C 154 74 162 88 180 90 C 198 88 206 74 207 58 C 208 38 199 24 180 24 Z',
    // Ears
    'M 152 54 C 148 54 147 64 153 67',
    'M 208 54 C 212 54 213 64 207 67',
    // Neck & Sternocleidomastoid V-contour
    'M 164 85 L 161 112 L 180 120 L 199 112 L 196 85',
    'M 167 89 L 178 118 M 193 89 L 182 118',
    // Clavicle line
    'M 122 121 Q 152 115 177 122 M 238 121 Q 208 115 183 122',
  ],
  headAndNeckBack: [
    'M 180 24 C 161 24 152 38 153 58 C 154 74 162 86 180 88 C 198 86 206 74 207 58 C 208 38 199 24 180 24 Z',
    'M 152 54 C 148 54 147 64 153 67',
    'M 208 54 C 212 54 213 64 207 67',
    'M 164 84 L 160 106 L 200 106 L 196 84',
  ],
  extremitiesAndJoints: [
    // Left Hand
    'M 58 318 L 48 345 C 45 356 54 364 62 358 L 72 340 L 73 320 Z',
    // Right Hand
    'M 302 318 L 312 345 C 315 356 306 364 298 358 L 288 340 L 287 320 Z',
    // Left Knee / Patella
    'M 126 456 C 124 470 126 482 138 484 C 150 482 153 470 151 456 Z',
    // Right Knee / Patella
    'M 234 456 C 236 470 234 482 222 484 C 210 482 207 470 209 456 Z',
    // Left Ankle & Foot
    'M 124 606 L 118 634 C 112 644 108 652 122 655 L 144 654 C 148 648 144 634 142 606 Z',
    // Right Ankle & Foot
    'M 236 606 L 242 634 C 248 644 252 652 238 655 L 216 654 C 212 648 216 634 218 606 Z',
  ],
};

// ============================================================================
// 1. FRONT BODY MUSCLE GROUPS (8 REQUIRED INTERACTIVE REGIONS)
// ============================================================================
export const FRONT_MUSCLE_REGIONS = [
  {
    id: 'chest',
    slug: 'chest',
    name: 'Chest (Pectoralis Major)',
    shortName: 'Chest',
    scientificName: 'Pectoralis Major & Minor',
    category: 'Chest',
    side: 'FRONT',
    labelPos: { x: 180, y: 158, calloutX: 46, calloutY: 145, anchorX: 145, anchorY: 155 },
    paths: [
      // Left Pectoral (Viewer's Left / Anatomical Right)
      'M 178 126 L 132 122 C 122 132 117 152 121 174 C 126 184 146 189 175 184 C 178 178 179 148 178 126 Z',
      // Right Pectoral (Viewer's Right / Anatomical Left)
      'M 182 126 L 228 122 C 238 132 243 152 239 174 C 234 184 214 189 185 184 C 182 178 181 148 182 126 Z',
    ],
    striations: [
      'M 130 144 Q 154 150 176 146',
      'M 126 162 Q 152 168 175 164',
      'M 230 144 Q 206 150 184 146',
      'M 234 162 Q 208 168 185 164',
    ],
  },
  {
    id: 'front-deltoids',
    slug: 'front-deltoids',
    name: 'Front Deltoids',
    shortName: 'Front Delts',
    scientificName: 'Anterior & Lateral Deltoideus',
    category: 'Shoulders',
    side: 'FRONT',
    labelPos: { x: 104, y: 142, calloutX: 38, calloutY: 108, anchorX: 106, anchorY: 138 },
    paths: [
      // Left Anterior/Lateral Deltoid Cap
      'M 131 120 C 110 118 94 132 91 156 C 90 170 98 179 109 174 C 116 162 122 140 131 120 Z',
      // Right Anterior/Lateral Deltoid Cap
      'M 229 120 C 250 118 266 132 269 156 C 270 170 262 179 251 174 C 244 162 238 140 229 120 Z',
    ],
    striations: [
      'M 114 128 C 104 142 100 156 102 168',
      'M 246 128 C 256 142 260 156 258 168',
    ],
  },
  {
    id: 'biceps',
    slug: 'biceps',
    name: 'Biceps',
    shortName: 'Biceps',
    scientificName: 'Biceps Brachii & Brachialis',
    category: 'Biceps',
    side: 'FRONT',
    labelPos: { x: 95, y: 204, calloutX: 35, calloutY: 196, anchorX: 96, anchorY: 204 },
    paths: [
      // Left Biceps Brachii
      'M 93 174 C 84 188 80 212 83 234 C 89 242 103 240 109 230 C 115 212 116 188 111 172 Z',
      // Right Biceps Brachii
      'M 267 174 C 276 188 280 212 277 234 C 271 242 257 240 251 230 C 245 212 244 188 249 172 Z',
    ],
    striations: [
      'M 97 182 C 94 200 94 216 96 230',
      'M 263 182 C 266 200 266 216 264 230',
    ],
  },
  {
    id: 'forearms',
    slug: 'forearms',
    name: 'Forearms',
    shortName: 'Forearms',
    scientificName: 'Brachioradialis & Wrist Flexors',
    category: 'Forearms',
    side: 'FRONT',
    labelPos: { x: 76, y: 274, calloutX: 34, calloutY: 274, anchorX: 76, anchorY: 274 },
    paths: [
      // Left Forearm
      'M 81 238 C 68 254 60 284 59 314 L 74 317 C 86 294 98 266 105 238 Z',
      // Right Forearm
      'M 279 238 C 292 254 300 284 301 314 L 286 317 C 274 294 262 266 255 238 Z',
    ],
    striations: [
      'M 86 248 L 68 304',
      'M 274 248 L 292 304',
    ],
  },
  {
    id: 'rectus-abdominis',
    slug: 'rectus-abdominis',
    name: 'Rectus Abdominis',
    shortName: 'Abs',
    scientificName: 'Rectus Abdominis (Six-Pack Core)',
    category: 'Abs',
    side: 'FRONT',
    labelPos: { x: 180, y: 238, calloutX: 318, calloutY: 188, anchorX: 194, anchorY: 224 },
    paths: [
      // Upper Left & Right Ab Segments
      'M 154 188 L 177 188 L 177 214 L 152 214 Z',
      'M 183 188 L 206 188 L 208 214 L 183 214 Z',
      // Mid Left & Right Ab Segments
      'M 152 218 L 177 218 L 177 244 L 153 244 Z',
      'M 183 218 L 208 218 L 207 244 L 183 244 Z',
      // Lower Left & Right Ab Segments + Lower Pyramid
      'M 154 248 L 177 248 L 177 302 C 164 298 156 278 154 248 Z',
      'M 183 248 L 206 248 C 204 278 196 298 183 302 L 183 248 Z',
    ],
    striations: [
      'M 180 186 L 180 302',
      'M 153 272 L 177 272 M 183 272 L 207 272',
    ],
  },
  {
    id: 'obliques',
    slug: 'obliques',
    name: 'Obliques',
    shortName: 'Obliques',
    scientificName: 'External & Internal Obliques',
    category: 'Abs',
    side: 'FRONT',
    labelPos: { x: 138, y: 242, calloutX: 320, calloutY: 242, anchorX: 222, anchorY: 242 },
    paths: [
      // Left External Oblique & Serratus Wall
      'M 125 182 L 150 188 L 151 286 C 136 278 127 258 126 232 C 125 212 123 196 125 182 Z',
      // Right External Oblique & Serratus Wall
      'M 235 182 L 210 188 L 209 286 C 224 278 233 258 234 232 C 235 212 237 196 235 182 Z',
    ],
    striations: [
      'M 129 204 L 147 220 M 129 226 L 148 242 M 130 248 L 148 264',
      'M 231 204 L 213 220 M 231 226 L 212 242 M 230 248 L 212 264',
    ],
  },
  {
    id: 'quadriceps',
    slug: 'quadriceps',
    name: 'Quadriceps',
    shortName: 'Quadriceps',
    scientificName: 'Rectus Femoris, Vastus Lateralis & Medialis',
    category: 'Legs',
    side: 'FRONT',
    labelPos: { x: 136, y: 378, calloutX: 38, calloutY: 382, anchorX: 132, anchorY: 382 },
    paths: [
      // Left Thigh Quadriceps Complex
      'M 126 296 L 172 308 C 173 356 168 412 156 452 L 122 452 C 110 404 111 344 126 296 Z',
      // Right Thigh Quadriceps Complex
      'M 234 296 L 188 308 C 187 356 192 412 204 452 L 238 452 C 250 404 249 344 234 296 Z',
    ],
    striations: [
      // Teardrop VMO & Rectus Femoris separation lines
      'M 144 312 C 140 356 138 402 138 446',
      'M 158 394 C 150 412 148 434 153 448',
      'M 216 312 C 220 356 222 402 222 446',
      'M 202 394 C 210 412 212 434 207 448',
    ],
  },
  {
    id: 'calves',
    slug: 'calves',
    name: 'Calves',
    shortName: 'Calves',
    scientificName: 'Gastrocnemius, Soleus & Tibialis Anterior',
    category: 'Calves',
    side: 'FRONT',
    labelPos: { x: 132, y: 540, calloutX: 40, calloutY: 540, anchorX: 130, anchorY: 540 },
    paths: [
      // Left Lower Leg (Gastrocnemius Flare & Tibialis)
      'M 122 488 L 152 488 C 158 524 153 566 142 604 L 124 604 C 113 564 112 522 122 488 Z',
      // Right Lower Leg
      'M 238 488 L 208 488 C 202 524 207 566 218 604 L 236 604 C 247 564 248 522 238 488 Z',
    ],
    striations: [
      'M 136 496 L 134 594',
      'M 224 496 L 226 594',
    ],
  },
];

// ============================================================================
// 2. BACK BODY MUSCLE GROUPS (8 REQUIRED INTERACTIVE REGIONS)
// ============================================================================
export const BACK_MUSCLE_REGIONS = [
  {
    id: 'trapezius',
    slug: 'trapezius',
    name: 'Trapezius',
    shortName: 'Trapezius',
    scientificName: 'Upper, Middle & Lower Trapezius & Rhomboids',
    category: 'Back',
    side: 'BACK',
    labelPos: { x: 180, y: 142, calloutX: 42, calloutY: 115, anchorX: 162, anchorY: 128 },
    paths: [
      // Kite-shaped Trapezius spanning upper neck, shoulders, and mid-thoracic spine
      'M 162 96 L 198 96 L 232 118 L 204 166 L 180 212 L 156 166 L 128 118 Z',
    ],
    striations: [
      'M 180 96 L 180 208',
      'M 142 122 L 176 142 M 218 122 L 184 142',
      'M 156 154 L 178 168 M 204 154 L 182 168',
    ],
  },
  {
    id: 'rear-deltoids',
    slug: 'rear-deltoids',
    name: 'Rear Deltoids',
    shortName: 'Rear Delts',
    scientificName: 'Posterior Deltoideus & Infraspinatus',
    category: 'Shoulders',
    side: 'BACK',
    labelPos: { x: 106, y: 144, calloutX: 320, calloutY: 124, anchorX: 252, anchorY: 142 },
    paths: [
      // Left Posterior Deltoid
      'M 127 119 C 106 122 92 136 90 158 C 96 170 112 168 126 156 L 138 136 Z',
      // Right Posterior Deltoid
      'M 233 119 C 254 122 268 136 270 158 C 264 170 248 168 234 156 L 222 136 Z',
    ],
    striations: [
      'M 122 134 L 98 154',
      'M 238 134 L 262 154',
    ],
  },
  {
    id: 'latissimus-dorsi',
    slug: 'latissimus-dorsi',
    name: 'Latissimus Dorsi',
    shortName: 'Lats',
    scientificName: 'Latissimus Dorsi & Teres Major',
    category: 'Back',
    side: 'BACK',
    labelPos: { x: 142, y: 204, calloutX: 38, calloutY: 196, anchorX: 138, anchorY: 196 },
    paths: [
      // Left Wing / Lat Sweep
      'M 126 158 L 155 168 L 166 244 L 136 254 C 122 226 116 190 126 158 Z',
      // Right Wing / Lat Sweep
      'M 234 158 L 205 168 L 194 244 L 224 254 C 238 226 244 190 234 158 Z',
    ],
    striations: [
      'M 126 184 L 158 206 M 128 212 L 160 232',
      'M 234 184 L 202 206 M 232 212 L 200 232',
    ],
  },
  {
    id: 'triceps',
    slug: 'triceps',
    name: 'Triceps',
    shortName: 'Triceps',
    scientificName: 'Triceps Brachii (Long, Lateral & Medial Heads)',
    category: 'Triceps',
    side: 'BACK',
    labelPos: { x: 94, y: 202, calloutX: 320, calloutY: 196, anchorX: 266, anchorY: 202 },
    paths: [
      // Left Triceps Horseshoe
      'M 90 162 C 81 182 78 212 82 236 L 106 236 C 114 214 116 184 112 164 Z',
      // Right Triceps Horseshoe
      'M 270 162 C 279 182 282 212 278 236 L 254 236 C 246 214 244 184 248 164 Z',
    ],
    striations: [
      // Horseshoe tendon contour
      'M 88 212 Q 96 190 104 212',
      'M 272 212 Q 264 190 256 212',
    ],
  },
  {
    id: 'lower-back',
    slug: 'lower-back',
    name: 'Lower Back (Erector Spinae)',
    shortName: 'Lower Back',
    scientificName: 'Erector Spinae & Thoracolumbar Fascia',
    category: 'Back',
    side: 'BACK',
    labelPos: { x: 180, y: 256, calloutX: 318, calloutY: 258, anchorX: 196, anchorY: 258 },
    paths: [
      // Left & Right Erector Spinae Columns
      'M 164 214 L 178 214 L 178 292 L 142 286 L 154 244 Z',
      'M 196 214 L 182 214 L 182 292 L 218 286 L 206 244 Z',
    ],
    striations: [
      'M 180 212 L 180 294',
      'M 165 232 L 162 282 M 195 232 L 198 282',
    ],
  },
  {
    id: 'glutes',
    slug: 'glutes',
    name: 'Glutes',
    shortName: 'Glutes',
    scientificName: 'Gluteus Maximus, Medius & Minimus',
    category: 'Glutes',
    side: 'BACK',
    labelPos: { x: 152, y: 324, calloutX: 40, calloutY: 324, anchorX: 142, anchorY: 324 },
    paths: [
      // Left Gluteus Maximus & Medius
      'M 134 288 L 178 294 L 178 356 C 154 366 124 356 120 330 C 118 310 124 296 134 288 Z',
      // Right Gluteus Maximus & Medius
      'M 226 288 L 182 294 L 182 356 C 206 366 236 356 240 330 C 242 310 236 296 226 288 Z',
    ],
    striations: [
      'M 132 308 Q 152 324 174 322',
      'M 228 308 Q 208 324 186 322',
    ],
  },
  {
    id: 'hamstrings',
    slug: 'hamstrings',
    name: 'Hamstrings',
    shortName: 'Hamstrings',
    scientificName: 'Biceps Femoris, Semitendinosus & Semimembranosus',
    category: 'Legs',
    side: 'BACK',
    labelPos: { x: 142, y: 406, calloutX: 38, calloutY: 412, anchorX: 140, anchorY: 412 },
    paths: [
      // Left Posterior Thigh (Hamstrings)
      'M 122 358 L 173 360 C 171 398 164 432 154 456 L 124 456 C 116 424 116 388 122 358 Z',
      // Right Posterior Thigh (Hamstrings)
      'M 238 358 L 187 360 C 189 398 196 432 206 456 L 236 456 C 244 424 244 388 238 358 Z',
    ],
    striations: [
      // Biceps femoris / semitendinosus division
      'M 146 364 L 140 450',
      'M 214 364 L 220 450',
    ],
  },
  {
    id: 'calves',
    slug: 'calves',
    name: 'Calves',
    shortName: 'Calves',
    scientificName: 'Gastrocnemius (Medial & Lateral Heads) & Soleus',
    category: 'Calves',
    side: 'BACK',
    labelPos: { x: 136, y: 534, calloutX: 40, calloutY: 534, anchorX: 134, anchorY: 534 },
    paths: [
      // Left Posterior Calf Diamond & Soleus
      'M 123 486 L 153 486 C 161 518 156 558 142 604 L 124 604 C 111 558 111 518 123 486 Z',
      // Right Posterior Calf Diamond & Soleus
      'M 237 486 L 207 486 C 199 518 204 558 218 604 L 236 604 C 249 558 249 518 237 486 Z',
    ],
    striations: [
      // Medial & Lateral Gastrocnemius Diamond Split
      'M 137 492 L 137 544 M 120 546 Q 137 560 152 546',
      'M 223 492 L 223 544 M 208 546 Q 223 560 240 546',
    ],
  },
];

// Secondary Back Forearms (also clickable on back view and mapped to 'forearms')
export const BACK_EXTRA_REGIONS = [
  {
    id: 'forearms',
    slug: 'forearms',
    name: 'Forearms',
    shortName: 'Forearms',
    scientificName: 'Extensor Digitorum & Brachioradialis',
    category: 'Forearms',
    side: 'BACK',
    paths: [
      'M 81 240 C 68 256 60 284 59 314 L 74 317 C 86 294 98 266 105 240 Z',
      'M 279 240 C 292 256 300 284 301 314 L 286 317 C 274 294 262 266 255 240 Z',
    ],
    striations: ['M 84 248 L 68 304', 'M 276 248 L 292 304'],
  },
];

export const ALL_ANATOMY_REGIONS = [...FRONT_MUSCLE_REGIONS, ...BACK_MUSCLE_REGIONS];
