import React from 'react';

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
 * Uses the high-resolution 3D character portrait (/images/character/character-hero-upper.png)
 * with a soft sage circular halo behind him.
 */
export function HeroMuscularModel() {
  return (
    <div className="relative w-full h-full flex items-end justify-center select-none pointer-events-none py-1">
      {/* Soft Sage Circular Halo Behind the 3D Character */}
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
 * Dual Front & Back 3D Anatomical Male Character Bodies for the "Muscle Explorer" Card
 * Uses the high-resolution Front & Back cutouts from the user's 3D character.
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
          src="/images/character/character-front-cutout.png?v=7"
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
          src="/images/character/character-back-cutout.png?v=7"
          alt="Back 3D anatomical male character"
          className="w-auto h-44 sm:h-56 object-contain transition-transform duration-200 group-hover:scale-[1.03] drop-shadow-[0_8px_16px_rgba(23,63,53,0.16)]"
        />
      </button>
    </div>
  );
}

const MUSCLE_THUMBNAIL_MAP = {
  chest: '/images/character/muscle-chest.png',
  back: '/images/character/muscle-back.png',
  shoulders: '/images/character/muscle-shoulders.png',
  arms: '/images/character/muscle-arms.png',
  legs: '/images/character/muscle-legs.png',
  abs: '/images/character/muscle-abs.png',
  glutes: '/images/character/muscle-glutes.png',
};

/**
 * High-Resolution 3D Character Muscle Group Thumbnails
 * Used in "Browse by Muscle Group" cards and SelectedMuscleCard.
 */
export function MuscleCategoryThumbnail({ categoryId = 'chest' }) {
  const key = (categoryId || 'chest').toLowerCase();
  const imgSrc = MUSCLE_THUMBNAIL_MAP[key] || MUSCLE_THUMBNAIL_MAP.chest;

  return (
    <div className="w-full h-20 sm:h-24 flex items-center justify-center overflow-hidden select-none pointer-events-none">
      <img
        src={imgSrc}
        alt={`${categoryId} 3D anatomical muscle highlight`}
        className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(23,63,53,0.15)]"
      />
    </div>
  );
}
