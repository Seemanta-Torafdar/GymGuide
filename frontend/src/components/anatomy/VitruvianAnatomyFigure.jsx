import React from 'react';

/**
 * High-Precision Vitruvian Open-Arm Anatomical Muscular SVG Figure
 * Matches the reference aesthetic:
 * - Mint-sage muscle bellies (#82C7B0) with deep forest-teal (#2D5E50) anatomical contours
 * - Deep teal head silhouette (#336657) & soft off-white tendon/joint zones (#E6F3ED)
 * - Vibrant Coral-Orange (#FF5C39) active muscle highlight
 * - Supports Front (Anterior) and Back (Posterior) views + Male / Female proportions
 */
export function VitruvianAnatomyFigure({
  view = 'FRONT', // 'FRONT' | 'BACK'
  gender = 'MALE', // 'MALE' | 'FEMALE'
  selectedMuscleId = 'chest',
  hoveredMuscleId = null,
  onSelectMuscle,
  onHoverMuscle,
}) {
  const isFront = view === 'FRONT';
  const isFemale = gender === 'FEMALE';

  const getFill = (muscleId) => {
    const active = selectedMuscleId === muscleId;
    const hovered = hoveredMuscleId === muscleId;
    if (active) return '#FF5C39';
    if (hovered) return '#FF856B';
    return '#82C7B0';
  };

  const getStroke = (muscleId) => {
    const active = selectedMuscleId === muscleId;
    return active ? '#C83B1B' : '#2D5E50';
  };

  const bindMuscleProps = (muscleId, label) => ({
    onClick: () => onSelectMuscle && onSelectMuscle(muscleId),
    onMouseEnter: () => onHoverMuscle && onHoverMuscle(muscleId),
    onMouseLeave: () => onHoverMuscle && onHoverMuscle(null),
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectMuscle && onSelectMuscle(muscleId);
      }
    },
    className: 'cursor-pointer transition-colors duration-200 focus:outline-none',
  });

  return (
    <svg
      viewBox="0 0 560 660"
      className="w-full h-full max-h-[540px] select-none overflow-visible"
      role="img"
      aria-label={`Interactive ${isFront ? 'Anterior' : 'Posterior'} Human Anatomy Map`}
    >
      {/* Background Vitruvian Architectural Circle & Crosshairs */}
      <g className="pointer-events-none">
        <circle
          cx="280"
          cy="345"
          r="215"
          fill="none"
          stroke="#E5E3DC"
          strokeWidth="1.2"
        />
        <line
          x1="40"
          y1="345"
          x2="520"
          y2="345"
          stroke="#EAE8E1"
          strokeWidth="1"
        />
        <line
          x1="280"
          y1="35"
          x2="280"
          y2="635"
          stroke="#EAE8E1"
          strokeWidth="1"
        />
      </g>

      {/* Proportional Transform for Male vs Female Silhouette */}
      <g
        transform={
          isFemale
            ? 'translate(280, 340) scale(0.94, 0.98) translate(-280, -340)'
            : undefined
        }
      >
        {/* =================================================================
            STRUCTURAL BASE: HEAD, NECK TENDONS, HANDS, KNEES & FEET
        ================================================================= */}
        <g className="pointer-events-none">
          {/* Head & Ears Silhouette */}
          <path
            d="M 280 56 C 261 56 251 70 252 91 C 252 96 248 98 249 105 C 250 112 254 112 256 117 C 260 129 268 137 280 138 C 292 137 300 129 304 117 C 306 112 310 112 311 105 C 312 98 308 96 308 91 C 309 70 299 56 280 56 Z"
            fill="#326456"
            stroke="#2D5E50"
            strokeWidth="2"
          />

          {/* Neck Sternocleidomastoid & Tendon V */}
          <path
            d="M 263 132 L 256 160 L 280 174 L 304 160 L 297 132 Z"
            fill="#E5F2EC"
            stroke="#2D5E50"
            strokeWidth="2"
          />
          <path
            d="M 264 136 L 245 162 L 262 165 Z M 296 136 L 315 162 L 298 165 Z"
            fill="#82C7B0"
            stroke="#2D5E50"
            strokeWidth="1.8"
          />
          <path
            d="M 271 137 L 280 168 L 289 137"
            fill="none"
            stroke="#2D5E50"
            strokeWidth="1.8"
          />

          {/* Open Anatomical Hands (Left & Right) */}
          <g fill="#E5F2EC" stroke="#2D5E50" strokeWidth="1.8" strokeLinejoin="round">
            {/* Left Hand & Fingers */}
            <path d="M 129 332 L 104 342 C 99 344 99 349 105 348 L 118 345 L 98 362 C 95 366 99 370 103 367 L 120 352 L 103 372 C 100 376 105 379 109 375 L 125 357 L 112 375 C 110 379 115 381 118 377 L 134 358 L 125 373 C 123 376 128 378 131 374 L 144 352 L 142 340 Z" />
            {/* Right Hand & Fingers */}
            <path d="M 431 332 L 456 342 C 461 344 461 349 455 348 L 442 345 L 462 362 C 465 366 461 370 457 367 L 440 352 L 457 372 C 460 376 455 379 451 375 L 435 357 L 448 375 C 450 379 445 381 442 377 L 426 358 L 435 373 C 437 376 432 378 429 374 L 416 352 L 418 340 Z" />
          </g>

          {/* Pelvis / Inguinal Tendon Sheaths */}
          <path
            d="M 244 316 L 280 354 L 316 316 L 306 312 L 280 338 L 254 312 Z"
            fill="#326456"
          />
          <path
            d="M 233 320 L 264 366 L 256 385 L 231 338 Z M 327 320 L 296 366 L 304 385 L 329 338 Z"
            fill="#E5F2EC"
            stroke="#2D5E50"
            strokeWidth="1.6"
          />

          {/* Knee Patella & Tendon Zones */}
          <path
            d="M 234 452 C 232 465 236 478 247 480 C 257 478 260 465 258 452 Z"
            fill="#E5F2EC"
            stroke="#2D5E50"
            strokeWidth="1.8"
          />
          <path
            d="M 326 452 C 328 465 324 478 313 480 C 303 478 300 465 302 452 Z"
            fill="#E5F2EC"
            stroke="#2D5E50"
            strokeWidth="1.8"
          />

          {/* Ankles & Feet */}
          <g fill="#E5F2EC" stroke="#2D5E50" strokeWidth="2" strokeLinejoin="round">
            <path d="M 239 586 L 233 616 C 226 626 223 634 236 636 L 257 636 C 261 630 257 614 254 586 Z" />
            <path d="M 321 586 L 327 616 C 334 626 337 634 324 636 L 303 636 C 299 630 303 614 306 586 Z" />
          </g>
        </g>

        {isFront ? (
          /* ===============================================================
             ANTERIOR (FRONT) MUSCLE GROUPS
          =============================================================== */
          <g>
            {/* 03. BACK (Upper Traps & Lat Wing Flare visible from Front) */}
            <g {...bindMuscleProps('back', 'Back (Trapezius & Lats)')}>
              <path
                d="M 244 156 L 218 166 L 238 172 Z M 316 156 L 342 166 L 322 172 Z"
                fill={getFill('back')}
                stroke={getStroke('back')}
                strokeWidth="2"
              />
              {/* Lat Flare under armpits */}
              <path
                d="M 225 222 C 222 244 226 268 234 284 L 238 228 Z M 335 222 C 338 244 334 268 326 284 L 322 228 Z"
                fill={getFill('back')}
                stroke={getStroke('back')}
                strokeWidth="2"
              />
            </g>

            {/* 02. SHOULDERS (Anterior & Lateral Deltoids) */}
            <g {...bindMuscleProps('shoulders', 'Shoulders (Deltoids)')}>
              <path
                d="M 235 166 C 214 166 198 180 193 204 C 191 217 199 227 211 220 C 221 206 227 186 235 166 Z"
                fill={getFill('shoulders')}
                stroke={getStroke('shoulders')}
                strokeWidth="2.2"
              />
              <path
                d="M 325 166 C 346 166 362 180 367 204 C 369 217 361 227 349 220 C 339 206 333 186 325 166 Z"
                fill={getFill('shoulders')}
                stroke={getStroke('shoulders')}
                strokeWidth="2.2"
              />
              <path
                d="M 218 176 C 208 188 202 202 202 215 M 342 176 C 352 188 358 202 358 215"
                fill="none"
                stroke={getStroke('shoulders')}
                strokeWidth="1.5"
              />
            </g>

            {/* 01. CHEST (Pectoralis Major - Left & Right Fans) */}
            <g {...bindMuscleProps('chest', 'Chest (Pectorals)')}>
              <path
                d="M 278 174 L 236 168 C 224 182 217 205 221 222 C 232 235 256 238 277 228 Z"
                fill={getFill('chest')}
                stroke={getStroke('chest')}
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M 282 174 L 324 168 C 336 182 343 205 339 222 C 328 235 304 238 283 228 Z"
                fill={getFill('chest')}
                stroke={getStroke('chest')}
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              {/* Subtle Clavicular / Sternocostal Fiber Lines */}
              <path
                d="M 232 194 Q 254 200 276 196 M 228 212 Q 252 218 276 213 M 328 194 Q 306 200 284 196 M 332 212 Q 308 218 284 213"
                fill="none"
                stroke={selectedMuscleId === 'chest' ? 'rgba(255,255,255,0.45)' : '#2D5E50'}
                strokeWidth="1.3"
                opacity="0.7"
              />
            </g>

            {/* 04. BICEPS (Angled Outward Upper Arms) */}
            <g {...bindMuscleProps('biceps', 'Biceps Brachii')}>
              <path
                d="M 195 215 C 181 228 168 250 163 268 C 169 278 184 277 195 266 C 206 250 216 230 218 214 Z"
                fill={getFill('biceps')}
                stroke={getStroke('biceps')}
                strokeWidth="2.2"
              />
              <path
                d="M 365 215 C 379 228 392 250 397 268 C 391 278 376 277 365 266 C 354 250 344 230 342 214 Z"
                fill={getFill('biceps')}
                stroke={getStroke('biceps')}
                strokeWidth="2.2"
              />
              <path
                d="M 199 222 L 176 264 M 361 222 L 384 264"
                fill="none"
                stroke={getStroke('biceps')}
                strokeWidth="1.4"
              />
            </g>

            {/* 06. FOREARMS (Angled Outward Forearms) */}
            <g {...bindMuscleProps('forearms', 'Forearms')}>
              <path
                d="M 162 270 C 146 286 134 310 128 332 L 143 340 C 159 322 179 296 193 270 Z"
                fill={getFill('forearms')}
                stroke={getStroke('forearms')}
                strokeWidth="2.2"
              />
              <path
                d="M 398 270 C 414 286 426 310 432 332 L 417 340 C 401 322 381 296 367 270 Z"
                fill={getFill('forearms')}
                stroke={getStroke('forearms')}
                strokeWidth="2.2"
              />
              <path
                d="M 174 276 L 138 330 M 386 276 L 422 330"
                fill="none"
                stroke={getStroke('forearms')}
                strokeWidth="1.4"
              />
            </g>

            {/* 07. ABS & CORE (Rectus Abdominis 6-Pack + Obliques) */}
            <g {...bindMuscleProps('abs', 'Abs & Core')}>
              {/* Left & Right Oblique Walls */}
              <path
                d="M 236 232 L 254 236 L 254 312 L 233 316 C 228 292 229 258 236 232 Z"
                fill={getFill('abs')}
                stroke={getStroke('abs')}
                strokeWidth="2"
              />
              <path
                d="M 324 232 L 306 236 L 306 312 L 327 316 C 332 292 331 258 324 232 Z"
                fill={getFill('abs')}
                stroke={getStroke('abs')}
                strokeWidth="2"
              />
              {/* 6-Pack Segments */}
              <rect x="257" y="233" width="20" height="23" rx="4" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="2" />
              <rect x="283" y="233" width="20" height="23" rx="4" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="2" />
              <rect x="256" y="260" width="21" height="23" rx="4" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="2" />
              <rect x="283" y="260" width="21" height="23" rx="4" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="2" />
              <path d="M 257 287 L 277 287 L 277 328 L 257 314 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="2" />
              <path d="M 283 287 L 303 287 L 303 314 L 283 328 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="2" />
            </g>

            {/* 08. QUADS (Quadriceps Femoris - Left & Right Thighs) */}
            <g {...bindMuscleProps('quads', 'Quads (Quadriceps)')}>
              {/* Left Thigh Heads (Vastus Lateralis, Rectus Femoris, Vastus Medialis) */}
              <path
                d="M 230 338 C 218 374 218 416 231 452 L 260 452 C 268 418 271 382 268 354 L 256 382 Z"
                fill={getFill('quads')}
                stroke={getStroke('quads')}
                strokeWidth="2.2"
              />
              {/* Right Thigh Heads */}
              <path
                d="M 330 338 C 342 374 342 416 329 452 L 300 452 C 292 418 289 382 292 354 L 304 382 Z"
                fill={getFill('quads')}
                stroke={getStroke('quads')}
                strokeWidth="2.2"
              />
              {/* Quad Head Separation Lines */}
              <path
                d="M 244 358 C 241 390 241 424 244 450 M 258 404 C 251 420 250 436 256 448"
                fill="none"
                stroke={getStroke('quads')}
                strokeWidth="1.8"
              />
              <path
                d="M 316 358 C 319 390 319 424 316 450 M 302 404 C 309 420 310 436 304 448"
                fill="none"
                stroke={getStroke('quads')}
                strokeWidth="1.8"
              />
            </g>

            {/* 11. CALVES (Anterior Gastrocnemius & Tibialis) */}
            <g {...bindMuscleProps('calves', 'Calves')}>
              <path
                d="M 233 482 L 258 482 C 266 516 261 554 253 586 L 239 586 C 228 552 225 516 233 482 Z"
                fill={getFill('calves')}
                stroke={getStroke('calves')}
                strokeWidth="2.2"
              />
              <path
                d="M 327 482 L 302 482 C 294 516 299 554 307 586 L 321 586 C 332 552 335 516 327 482 Z"
                fill={getFill('calves')}
                stroke={getStroke('calves')}
                strokeWidth="2.2"
              />
              <path
                d="M 246 486 L 245 582 M 314 486 L 315 582"
                fill="none"
                stroke={getStroke('calves')}
                strokeWidth="1.6"
              />
            </g>
          </g>
        ) : (
          /* ===============================================================
             POSTERIOR (BACK) MUSCLE GROUPS
          =============================================================== */
          <g>
            {/* 02. SHOULDERS (Rear Deltoids) */}
            <g {...bindMuscleProps('shoulders', 'Shoulders (Rear Deltoids)')}>
              <path
                d="M 232 166 C 212 168 197 182 193 204 C 201 216 218 214 231 198 Z"
                fill={getFill('shoulders')}
                stroke={getStroke('shoulders')}
                strokeWidth="2.2"
              />
              <path
                d="M 328 166 C 348 168 363 182 367 204 C 359 216 342 214 329 198 Z"
                fill={getFill('shoulders')}
                stroke={getStroke('shoulders')}
                strokeWidth="2.2"
              />
            </g>

            {/* 03. BACK (Trapezius, Latissimus Dorsi & Erector Spinae) */}
            <g {...bindMuscleProps('back', 'Back (Trapezius, Lats & Lower Back)')}>
              {/* Kite-shaped Trapezius */}
              <path
                d="M 258 142 L 302 142 L 328 168 L 304 218 L 280 256 L 256 218 L 232 168 Z"
                fill={getFill('back')}
                stroke={getStroke('back')}
                strokeWidth="2.2"
              />
              {/* Left & Right Latissimus Dorsi Wings */}
              <path
                d="M 231 198 L 256 218 L 266 298 L 236 302 C 224 270 222 232 231 198 Z"
                fill={getFill('back')}
                stroke={getStroke('back')}
                strokeWidth="2.2"
              />
              <path
                d="M 329 198 L 304 218 L 294 298 L 324 302 C 336 270 338 232 329 198 Z"
                fill={getFill('back')}
                stroke={getStroke('back')}
                strokeWidth="2.2"
              />
              {/* Lower Back Erector Columns */}
              <path
                d="M 266 254 L 294 254 L 298 312 L 262 312 Z"
                fill={getFill('back')}
                stroke={getStroke('back')}
                strokeWidth="2"
              />
              <line x1="280" y1="142" x2="280" y2="312" stroke={getStroke('back')} strokeWidth="1.8" />
            </g>

            {/* 05. TRICEPS (Posterior Upper Arms) */}
            <g {...bindMuscleProps('triceps', 'Triceps Brachii')}>
              <path
                d="M 194 208 C 180 224 168 248 163 268 L 192 270 C 204 252 215 230 220 210 Z"
                fill={getFill('triceps')}
                stroke={getStroke('triceps')}
                strokeWidth="2.2"
              />
              <path
                d="M 366 208 C 380 224 392 248 397 268 L 368 270 C 356 252 345 230 340 210 Z"
                fill={getFill('triceps')}
                stroke={getStroke('triceps')}
                strokeWidth="2.2"
              />
              <path
                d="M 176 250 Q 190 232 198 252 M 384 250 Q 370 232 362 252"
                fill="none"
                stroke={getStroke('triceps')}
                strokeWidth="1.5"
              />
            </g>

            {/* 06. FOREARMS (Posterior Extensors) */}
            <g {...bindMuscleProps('forearms', 'Forearms')}>
              <path
                d="M 162 270 C 146 286 134 310 128 332 L 143 340 C 159 322 179 296 193 270 Z"
                fill={getFill('forearms')}
                stroke={getStroke('forearms')}
                strokeWidth="2.2"
              />
              <path
                d="M 398 270 C 414 286 426 310 432 332 L 417 340 C 401 322 381 296 367 270 Z"
                fill={getFill('forearms')}
                stroke={getStroke('forearms')}
                strokeWidth="2.2"
              />
            </g>

            {/* 10. GLUTES (Gluteus Maximus & Medius) */}
            <g {...bindMuscleProps('glutes', 'Glutes')}>
              <path
                d="M 235 304 L 278 312 L 278 374 C 252 384 226 372 224 344 C 222 326 227 312 235 304 Z"
                fill={getFill('glutes')}
                stroke={getStroke('glutes')}
                strokeWidth="2.2"
              />
              <path
                d="M 325 304 L 282 312 L 282 374 C 308 384 334 372 336 344 C 338 326 333 312 325 304 Z"
                fill={getFill('glutes')}
                stroke={getStroke('glutes')}
                strokeWidth="2.2"
              />
            </g>

            {/* 09. HAMSTRINGS (Biceps Femoris & Semitendinosus) */}
            <g {...bindMuscleProps('hamstrings', 'Hamstrings')}>
              <path
                d="M 227 372 L 272 376 C 270 408 264 434 257 454 L 233 454 C 223 426 222 396 227 372 Z"
                fill={getFill('hamstrings')}
                stroke={getStroke('hamstrings')}
                strokeWidth="2.2"
              />
              <path
                d="M 333 372 L 288 376 C 290 408 296 434 303 454 L 327 454 C 337 426 338 396 333 372 Z"
                fill={getFill('hamstrings')}
                stroke={getStroke('hamstrings')}
                strokeWidth="2.2"
              />
              <path
                d="M 248 376 L 245 452 M 312 376 L 315 452"
                fill="none"
                stroke={getStroke('hamstrings')}
                strokeWidth="1.7"
              />
            </g>

            {/* 11. CALVES (Posterior Gastrocnemius Diamond & Soleus) */}
            <g {...bindMuscleProps('calves', 'Calves')}>
              <path
                d="M 233 482 L 258 482 C 267 514 261 552 253 586 L 239 586 C 226 552 224 514 233 482 Z"
                fill={getFill('calves')}
                stroke={getStroke('calves')}
                strokeWidth="2.2"
              />
              <path
                d="M 327 482 L 302 482 C 293 514 299 552 307 586 L 321 586 C 334 552 336 514 327 482 Z"
                fill={getFill('calves')}
                stroke={getStroke('calves')}
                strokeWidth="2.2"
              />
              <path
                d="M 246 484 L 246 536 M 231 538 Q 246 550 260 538 M 314 484 L 314 536 M 299 538 Q 314 550 329 538"
                fill="none"
                stroke={getStroke('calves')}
                strokeWidth="1.6"
              />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
