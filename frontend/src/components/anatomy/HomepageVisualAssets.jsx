import React, { useId } from 'react';
import {
  FRONT_CHARACTER_REGIONS,
  BACK_CHARACTER_REGIONS,
} from '../../data/characterHitRegions';

export function FlexedBicepIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 16.5C5 15 4.5 12.5 5.5 10l2.2-4.8c.4-.9 1.5-1.3 2.4-.9.9.4 1.3 1.5.9 2.4L9.8 9.5c1.6-.6 3.5-.4 4.9.7 1.5 1.2 2 3.1 1.5 4.8.8-.2 1.7 0 2.3.6.8.8.8 2.1 0 2.9-.7.7-1.8.9-2.8.5-2.8 1-6.5.2-9.2-2.5z" />
    </svg>
  );
}

/**
 * 3D Anatomical Male Character Hero Model
 */
export function HeroMuscularModel() {
  return (
    <div className="relative w-full h-full flex items-end justify-center select-none pointer-events-none py-1">
      <div
        className="absolute w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-[#D1DEC0]/80 border border-[#789575]/35 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />
      <img
        src="/images/character/character-hero-upper.png?v=3"
        alt="3D anatomical muscular fitness character"
        className="relative z-10 w-auto h-56 sm:h-80 object-contain drop-shadow-[0_14px_24px_rgba(23,63,53,0.18)]"
      />
    </div>
  );
}

/**
 * Dual Front & Back 3D Anatomical Male Character Bodies
 */
export function DualExplorerAnatomyBodies({ onSelectMuscle }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 items-end justify-items-center select-none">
      <button
        type="button"
        onClick={() => onSelectMuscle && onSelectMuscle('chest', 'FRONT')}
        className="group relative flex flex-col items-center focus:outline-none"
        title="Explore Front Muscles (Chest, Shoulders, Abs, Quads)"
      >
        <img
          src="/images/character/character-front-cutout.png?v=9"
          alt="Front 3D anatomical male character"
          className="w-auto h-44 sm:h-56 object-contain transition-transform duration-200 group-hover:scale-[1.03] drop-shadow-[0_8px_16px_rgba(23,63,53,0.16)]"
        />
      </button>

      <button
        type="button"
        onClick={() => onSelectMuscle && onSelectMuscle('latissimus-dorsi', 'BACK')}
        className="group relative flex flex-col items-center focus:outline-none"
        title="Explore Back Muscles (Back, Rear Delts, Glutes, Hamstrings)"
      >
        <img
          src="/images/character/character-back-cutout.png?v=9"
          alt="Back 3D anatomical male character"
          className="w-auto h-44 sm:h-56 object-contain transition-transform duration-200 group-hover:scale-[1.03] drop-shadow-[0_8px_16px_rgba(23,63,53,0.16)]"
        />
      </button>
    </div>
  );
}

const THUMB_CONFIG = {
  chest: {
    side: 'FRONT',
    viewBox: '55 98 206 165',
    slugs: ['chest'],
  },
  back: {
    side: 'BACK',
    viewBox: '36 80 230 212',
    slugs: ['latissimus-dorsi', 'trapezius', 'lower-back'],
  },
  shoulders: {
    side: 'FRONT',
    viewBox: '36 96 244 170',
    slugs: ['front-deltoids'],
  },
  arms: {
    side: 'FRONT',
    viewBox: '16 118 284 220',
    slugs: ['biceps', 'forearms'],
  },
  legs: {
    side: 'FRONT',
    viewBox: '50 315 216 285',
    slugs: ['quadriceps', 'calves'],
  },
  abs: {
    side: 'FRONT',
    viewBox: '72 142 172 182',
    slugs: ['rectus-abdominis', 'obliques'],
  },
  glutes: {
    side: 'BACK',
    viewBox: '64 238 174 172',
    slugs: ['glutes'],
  },
};

/**
 * High-Resolution 3D Character Muscle Group Thumbnails
 * Uses the user's uniform warm skin-tone ?v=7 character cutout with crimson red muscle highlighting (zero green).
 */
export function MuscleCategoryThumbnail({ categoryId = 'chest' }) {
  const uid = useId().replace(/:/g, '');
  const key = (categoryId || 'chest').toLowerCase();
  const cfg = THUMB_CONFIG[key] || THUMB_CONFIG.chest;
  const isBack = cfg.side === 'BACK';
  const w = isBack ? 302 : 316;
  const h = 675;
  const imgSrc = isBack
    ? '/images/character/character-back-cutout.png?v=9'
    : '/images/character/character-front-cutout.png?v=9';
  const regions = isBack ? BACK_CHARACTER_REGIONS : FRONT_CHARACTER_REGIONS;
  const targetSlugs = new Set(cfg.slugs);

  return (
    <div className="w-full h-20 sm:h-24 flex items-center justify-center overflow-hidden select-none pointer-events-none">
      <svg
        viewBox={cfg.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full drop-shadow-[0_4px_10px_rgba(23,63,53,0.15)]"
        style={{ isolation: 'isolate' }}
        role="img"
        aria-label={`${categoryId} 3D anatomical muscle highlight`}
      >
        <defs>
          <filter id={`thumb-alpha-${uid}`}>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
            />
          </filter>
          <mask id={`thumb-mask-${uid}`}>
            <image
              href={imgSrc}
              x="0"
              y="0"
              width={w}
              height={h}
              filter={`url(#thumb-alpha-${uid})`}
            />
          </mask>
          <filter id={`thumb-feather-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <image href={imgSrc} x="0" y="0" width={w} height={h} />

        <g mask={`url(#thumb-mask-${uid})`} style={{ mixBlendMode: 'color' }}>
          {regions.map((reg, idx) =>
            targetSlugs.has(reg.slug)
              ? reg.paths.map((d, pIdx) => (
                  <path
                    key={`tc-${idx}-${pIdx}`}
                    d={d}
                    fill="#DC1414"
                    fillOpacity="0.95"
                    filter={`url(#thumb-feather-${uid})`}
                  />
                ))
              : null
          )}
        </g>

        <g mask={`url(#thumb-mask-${uid})`} style={{ mixBlendMode: 'multiply' }}>
          {regions.map((reg, idx) =>
            targetSlugs.has(reg.slug)
              ? reg.paths.map((d, pIdx) => (
                  <path
                    key={`tm-${idx}-${pIdx}`}
                    d={d}
                    fill="#E11D48"
                    fillOpacity="0.32"
                    filter={`url(#thumb-feather-${uid})`}
                  />
                ))
              : null
          )}
        </g>

        {key === 'glutes' && (
          <g mask={`url(#thumb-mask-${uid})`}>
            {regions.map((reg, idx) =>
              reg.slug === 'glutes'
                ? reg.paths.map((d, pIdx) => (
                    <path
                      key={`tg-${idx}-${pIdx}`}
                      d={d}
                      fill="rgba(239, 68, 68, 0.38)"
                      filter={`url(#thumb-feather-${uid})`}
                    />
                  ))
                : null
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
