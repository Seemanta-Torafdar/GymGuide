import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  ZoomIn,
  Crosshair,
  ArrowDown,
} from 'lucide-react';
import {
  FRONT_MUSCLE_REGIONS,
  BACK_MUSCLE_REGIONS,
} from '../../data/anatomyPaths';
import {
  FRONT_CHARACTER_REGIONS,
  BACK_CHARACTER_REGIONS,
  SIDE_CHARACTER_REGIONS,
  SUB_MUSCLE_CATALOG,
  getSubMusclesForParentSlug,
} from '../../data/characterHitRegions';

function MuscleGroupLineIcon({ groupId }) {
  switch (groupId) {
    case 'chest':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8c2-2 5-2 8-1 3-1 6-1 8 1 1 3 1 7-1 10-2 1-5 1-7-1-2 2-5 2-7 1-2-3-2-7-1-10z" />
          <path d="M14 7v10M9 12h3M16 12h3" />
        </svg>
      );
    case 'shoulders':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 7h10l1 3c3 0 5 2 5 6v5h-4v-6H7v6H3v-5c0-4 2-6 5-6l1-3z" />
        </svg>
      );
    case 'back':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 5v18M8 8l6 4 6-4M7 12l7 9 7-9" />
        </svg>
      );
    case 'arms':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 18c-1-3 0-6 2-8l3-4c1-1 2-1 3 0s1 2 0 3l-2 3c2-1 4 0 5 2 1 2 0 5-2 6-3 1-6 0-9-2z" />
        </svg>
      );
    case 'abs':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="8" y="5" width="12" height="18" rx="3" />
          <path d="M14 5v18M8 11h12M8 17h12" />
        </svg>
      );
    case 'legs':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 5h4l-1 18H8L9 5zM15 5h4l1 18h-4L15 5z" />
        </svg>
      );
    case 'glutes':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 12c0-4 3-6 8-5 5-1 8 1 8 5 0 5-3 8-8 6-5 2-8-1-8-6z" />
          <path d="M14 7v11" />
        </svg>
      );
    default:
      return null;
  }
}

const CHARACTER_MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest', slug: 'chest', side: 'FRONT' },
  { id: 'shoulders', label: 'Shoulders', slug: 'front-deltoids', side: 'FRONT' },
  { id: 'back', label: 'Full Lats & Back', slug: 'latissimus-dorsi', side: 'BACK' },
  { id: 'lower-back', label: 'Lower Back', slug: 'lower-back', side: 'BACK', subMuscleId: 'lower-back-erectors' },
  { id: 'arms', label: 'Arms (Biceps / Triceps)', slug: 'triceps', side: 'BACK' },
  { id: 'abs', label: 'Abs & Core', slug: 'rectus-abdominis', side: 'FRONT' },
  { id: 'legs', label: 'Legs', slug: 'quadriceps', side: 'FRONT' },
  { id: 'glutes', label: 'Glutes', slug: 'glutes', side: 'BACK' },
];

/**
 * Uniform Skin-Tone 3D Character Map with Pixel-Verified Sub-Muscle Red Staining
 * - Before clicking/hovering (`!hasActiveSelection && !hoveredRegion`), every muscle stays natural uniform skin tone.
 * - Hovering or clicking any exact muscle/head (e.g. Triceps Long Head, Quadriceps VMO) stains ONLY that exact
 *   3D muscle belly in rich crimson red using feathered SVG `color` + `multiply` blending (no boxed borders).
 */
export function InteractiveMuscleMap({
  selectedMuscleSlug = 'chest',
  selectedSubMuscleId = null,
  hasActiveSelection = false,
  onClearSelection,
  onSelectMuscle,
  viewMode = 'FRONT',
  onChangeViewMode,
  muscleStatsMap = {},
  onMuscleChosenJump,
}) {
  const [gender, setGender] = useState('MALE');
  const [characterPose, setCharacterPose] = useState(
    viewMode === 'BACK' ? 'BACK' : 'ALL'
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  const handleSelectMuscle = (slug, side = 'FRONT', subMuscleId = null) => {
    if (onSelectMuscle) {
      onSelectMuscle(slug, side, null, subMuscleId);
    }
    if (onChangeViewMode) {
      onChangeViewMode(side);
    }
  };

  const handleRotatePose = () => {
    const order = ['ALL', 'FRONT', 'SIDE_RIGHT', 'BACK', 'SIDE_LEFT'];
    const nextIdx = (order.indexOf(characterPose) + 1) % order.length;
    setCharacterPose(order[nextIdx]);
  };

  const handleZoomCycle = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.16 : prev === 1.16 ? 1.32 : 1));
  };

  const handleResetView = () => {
    setCharacterPose('ALL');
    setZoomLevel(1);
    setHoveredRegion(null);
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const handleStageMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    setPointerPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const selectedSubMuscleMeta = selectedSubMuscleId
    ? SUB_MUSCLE_CATALOG[selectedSubMuscleId]
    : null;

  const activeRegionDetails = useMemo(() => {
    if (hoveredRegion) {
      return hoveredRegion;
    }
    if (hasActiveSelection && selectedSubMuscleMeta) {
      return selectedSubMuscleMeta;
    }
    return (
      [...FRONT_MUSCLE_REGIONS, ...BACK_MUSCLE_REGIONS].find(
        (r) => r.slug === selectedMuscleSlug
      ) || FRONT_MUSCLE_REGIONS[0]
    );
  }, [hoveredRegion, hasActiveSelection, selectedSubMuscleMeta, selectedMuscleSlug]);

  const activeStats = muscleStatsMap[activeRegionDetails.slug];
  const selectedRegionDetails = useMemo(() => {
    if (selectedSubMuscleMeta) return selectedSubMuscleMeta;
    return (
      [...FRONT_MUSCLE_REGIONS, ...BACK_MUSCLE_REGIONS].find(
        (r) => r.slug === selectedMuscleSlug
      ) || FRONT_MUSCLE_REGIONS[0]
    );
  }, [selectedSubMuscleMeta, selectedMuscleSlug]);

  const subMusclesForActiveParent = useMemo(() => {
    if (!hasActiveSelection) return [];
    if (selectedMuscleSlug === 'triceps' || selectedMuscleSlug === 'biceps') {
      return [
        ...getSubMusclesForParentSlug('triceps'),
        ...getSubMusclesForParentSlug('biceps'),
      ];
    }
    if (selectedMuscleSlug === 'front-deltoids' || selectedMuscleSlug === 'rear-deltoids') {
      return [
        ...getSubMusclesForParentSlug('front-deltoids'),
        ...getSubMusclesForParentSlug('rear-deltoids'),
      ];
    }
    if (['latissimus-dorsi', 'trapezius', 'lower-back'].includes(selectedMuscleSlug)) {
      return [
        ...getSubMusclesForParentSlug('latissimus-dorsi'),
        ...getSubMusclesForParentSlug('trapezius'),
        ...getSubMusclesForParentSlug('lower-back'),
      ];
    }
    return getSubMusclesForParentSlug(selectedMuscleSlug);
  }, [hasActiveSelection, selectedMuscleSlug]);

  const activeGroupId = useMemo(() => {
    if (!hasActiveSelection) return null;
    if (selectedMuscleSlug === 'chest') return 'chest';
    if (['front-deltoids', 'rear-deltoids'].includes(selectedMuscleSlug)) return 'shoulders';
    if (['latissimus-dorsi', 'trapezius'].includes(selectedMuscleSlug)) return 'back';
    if (selectedMuscleSlug === 'lower-back') return 'lower-back';
    if (['biceps', 'triceps', 'forearms'].includes(selectedMuscleSlug)) return 'arms';
    if (['rectus-abdominis', 'obliques'].includes(selectedMuscleSlug)) return 'abs';
    if (['quadriceps', 'hamstrings', 'calves'].includes(selectedMuscleSlug)) return 'legs';
    if (selectedMuscleSlug === 'glutes') return 'glutes';
    return null;
  }, [hasActiveSelection, selectedMuscleSlug]);

  const poseMeta =
    characterPose === 'FRONT'
      ? { src: '/images/character/character-front-cutout.png?v=9', w: 316, h: 675 }
      : characterPose === 'BACK'
      ? { src: '/images/character/character-back-cutout.png?v=9', w: 302, h: 675 }
      : characterPose === 'SIDE_RIGHT'
      ? { src: '/images/character/character-side-cutout.png?v=9', w: 154, h: 675 }
      : characterPose === 'SIDE_LEFT'
      ? { src: '/images/character/character-side-left-cutout.png?v=9', w: 154, h: 675 }
      : { src: '/images/character/character-quad-cutout.png?v=9', w: 950, h: 675 };

  const isBackGroupSelected = ['latissimus-dorsi', 'trapezius', 'lower-back'].includes(
    selectedMuscleSlug
  );

  // Clean icon switch inside CHARACTER_MUSCLE_GROUPS list
  const getGroupIconId = (id) => (id === 'lower-back' ? 'back' : id);

  const isRegionActive = (reg) => {
    if (hoveredRegion) {
      return reg.id === hoveredRegion.id;
    }
    if (!hasActiveSelection) {
      return false;
    }
    if (selectedSubMuscleId) {
      return reg.id === selectedSubMuscleId;
    }
    return reg.slug === selectedMuscleSlug;
  };

  // Layer B1: Pure Anatomical Hue-Shift Dye
  const renderColorDyeLayer = (regions, transform = '') => (
    <g transform={transform}>
      {regions.map((reg, idx) => {
        if (!isRegionActive(reg)) return null;
        const isHovered = hoveredRegion?.id === reg.id;
        return (
          <g key={`dye-${reg.side}-${reg.id}-${idx}`}>
            {reg.paths.map((d, pIdx) => (
              <path
                key={pIdx}
                d={d}
                fill="#DC1414"
                fillOpacity={isHovered ? 0.96 : 0.92}
                filter={`url(#muscle-feather-${characterPose})`}
              />
            ))}
          </g>
        );
      })}
    </g>
  );

  // Layer B2: Rich Anatomical Multiply Belly Depth
  const renderMultiplyDepthLayer = (regions, transform = '') => (
    <g transform={transform}>
      {regions.map((reg, idx) => {
        if (!isRegionActive(reg)) return null;
        const isHovered = hoveredRegion?.id === reg.id;
        return (
          <g key={`mul-${reg.side}-${reg.id}-${idx}`}>
            {reg.paths.map((d, pIdx) => (
              <path
                key={pIdx}
                d={d}
                fill="#E11D48"
                fillOpacity={isHovered ? 0.36 : 0.28}
                filter={`url(#muscle-feather-${characterPose})`}
              />
            ))}
          </g>
        );
      })}
    </g>
  );

  // Layer B3: Masked Crimson Illumination Over Dark Compression Trunks When Glutes Selected
  const renderGluteTintLayer = (regions, transform = '') => (
    <g transform={transform}>
      {regions.map((reg, idx) => {
        if (reg.slug !== 'glutes' || !isRegionActive(reg)) return null;
        return (
          <g key={`glute-glow-${reg.side}-${reg.id}-${idx}`}>
            {reg.paths.map((d, pIdx) => (
              <path
                key={pIdx}
                d={d}
                fill="rgba(239, 68, 68, 0.36)"
                filter={`url(#muscle-feather-${characterPose})`}
              />
            ))}
          </g>
        );
      })}
    </g>
  );

  // Layer C: Pure Unmasked Transparent Hit Surface (instant crisp hover/click with zero box outline)
  const renderInteractiveLayer = (regions, transform = '') => (
    <g transform={transform}>
      {regions.map((reg, idx) => (
        <g
          key={`hit-${reg.side}-${reg.id}-${idx}`}
          onClick={() => handleSelectMuscle(reg.slug, reg.side, reg.id)}
          onMouseEnter={() => setHoveredRegion(reg)}
          onMouseLeave={() => setHoveredRegion(null)}
          role="button"
          tabIndex={0}
          aria-label={`Select ${reg.name}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectMuscle(reg.slug, reg.side, reg.id);
            }
          }}
          className="cursor-pointer focus:outline-none"
        >
          {reg.paths.map((d, pIdx) => (
            <path key={pIdx} d={d} fill="transparent" stroke="none" />
          ))}
        </g>
      ))}
    </g>
  );

  return (
    <div className="relative flex flex-col w-full bg-[#F1F2E8] border border-[#D2D9C5] rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
      {/* Top Bar: Male | Female Pill Toggle + Precision Muscle Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D2D9C5]">
        <div className="inline-flex items-center bg-[#E5E8CE] p-1 rounded-full border border-[#D2D9C5]">
          <button
            type="button"
            onClick={() => setGender('MALE')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              gender === 'MALE'
                ? 'bg-[#173F35] text-white shadow-sm'
                : 'text-[#657565] hover:text-[#263B2D]'
            }`}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => setGender('FEMALE')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              gender === 'FEMALE'
                ? 'bg-[#173F35] text-white shadow-sm'
                : 'text-[#657565] hover:text-[#263B2D]'
            }`}
          >
            Female
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hoveredRegion || hasActiveSelection ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DC2626]">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span>{hoveredRegion ? 'Inspecting:' : 'Selected:'}</span>
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#263B2D]">
                {activeRegionDetails.name}
              </span>
              {activeStats && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#173F35] text-white text-[11px] font-bold">
                  {activeStats.primaryExerciseCount} Exercises
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-semibold text-[#657565]">
              Hover or click any specific muscle head (e.g. Triceps Long Head, VMO Quad) to isolate it
            </span>
          )}
        </div>
      </div>

      {/* Main 3D Character Stage */}
      <div className="relative my-3 rounded-2xl bg-gradient-to-b from-[#E5E8CE]/60 via-[#F1F2E8] to-[#E5E8CE]/80 border border-[#D2D9C5] p-3 sm:p-4">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Left Floating Vertical Controls Pill (Rotate, Zoom, Reset) */}
          <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center z-20">
            <div className="flex flex-col items-center gap-2.5 py-3 px-1.5 rounded-full bg-[#F1F2E8]/95 border border-[#D2D9C5] shadow-sm">
              <button
                type="button"
                onClick={handleRotatePose}
                className="flex flex-col items-center gap-0.5 text-[#263B2D] hover:text-[#173F35] transition-colors"
                title="Rotate 3D Character Angle"
              >
                <div className="w-7 h-7 rounded-full bg-[#E5E8CE] hover:bg-[#789575] hover:text-white flex items-center justify-center transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-[#657565]">Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleZoomCycle}
                className="flex flex-col items-center gap-0.5 text-[#263B2D] hover:text-[#173F35] transition-colors"
                title="Zoom Character"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    zoomLevel > 1
                      ? 'bg-[#173F35] text-white'
                      : 'bg-[#E5E8CE] hover:bg-[#789575] hover:text-white'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-[#657565]">Zoom</span>
              </button>

              <button
                type="button"
                onClick={handleResetView}
                className="flex flex-col items-center gap-0.5 text-[#263B2D] hover:text-[#173F35] transition-colors"
                title="Reset View & Clear Selection"
              >
                <div className="w-7 h-7 rounded-full bg-[#E5E8CE] hover:bg-[#789575] hover:text-white flex items-center justify-center transition-colors">
                  <Crosshair className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-[#657565]">Reset</span>
              </button>
            </div>
          </div>

          {/* Center 3D Character Image + Direct Anatomical Surface Staining */}
          <div
            ref={stageRef}
            onMouseMove={handleStageMouseMove}
            className="col-span-10 sm:col-span-8 relative flex flex-col items-center justify-center min-h-[340px] sm:min-h-[420px] overflow-hidden"
          >
            {/* Floating Mouse-Tracking Specific Muscle Callout Card */}
            {hoveredRegion && (
              <div
                style={{
                  left: Math.max(12, Math.min(pointerPos.x + 14, 480)),
                  top: Math.max(8, pointerPos.y - 44),
                }}
                className="hidden sm:flex pointer-events-none absolute z-30 items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-[#EF4444]/40 shadow-lg backdrop-blur-sm transition-transform duration-75"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#657565]">
                    {hoveredRegion.parentName || 'Target Muscle'}
                  </span>
                  <span className="block text-xs font-extrabold text-[#263B2D] whitespace-nowrap">
                    {hoveredRegion.name}
                  </span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${characterPose}-${gender}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: zoomLevel }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center justify-center w-full"
              >
                <svg
                  viewBox={`0 0 ${poseMeta.w} ${poseMeta.h}`}
                  preserveAspectRatio="xMidYMid meet"
                  className={`block select-none overflow-visible drop-shadow-[0_12px_22px_rgba(23,63,53,0.18)] ${
                    characterPose === 'ALL'
                      ? 'w-full max-w-[560px] h-auto'
                      : 'h-[350px] sm:h-[430px] w-auto max-w-full'
                  }`}
                  style={{ isolation: 'isolate' }}
                  role="img"
                  aria-label={`Interactive 3D anatomical character (${characterPose} View) - click or hover any muscle`}
                >
                  <defs>
                    <filter id={`alpha-mask-filter-${characterPose}`}>
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
                      />
                    </filter>
                    <mask id={`body-silhouette-mask-${characterPose}`}>
                      <image
                        href={poseMeta.src}
                        x="0"
                        y="0"
                        width={poseMeta.w}
                        height={poseMeta.h}
                        filter={`url(#alpha-mask-filter-${characterPose})`}
                      />
                    </mask>
                    <filter
                      id={`muscle-feather-${characterPose}`}
                      x="-30%"
                      y="-30%"
                      width="160%"
                      height="160%"
                    >
                      <feGaussianBlur stdDeviation="1.1" />
                    </filter>
                  </defs>

                  <image
                    href={poseMeta.src}
                    x="0"
                    y="0"
                    width={poseMeta.w}
                    height={poseMeta.h}
                    className="pointer-events-none"
                    style={
                      gender === 'FEMALE'
                        ? { filter: 'hue-rotate(8deg) brightness(1.05)' }
                        : undefined
                    }
                  />

                  {/* Layer 1: Anatomical Hue Shift into Crimson Red */}
                  <g
                    mask={`url(#body-silhouette-mask-${characterPose})`}
                    style={{ mixBlendMode: 'color' }}
                    className="pointer-events-none"
                    aria-hidden="true"
                  >
                    {characterPose === 'ALL' && (
                      <>
                        {renderColorDyeLayer(FRONT_CHARACTER_REGIONS, 'translate(0, 0)')}
                        {renderColorDyeLayer(SIDE_CHARACTER_REGIONS, 'translate(318, 0)')}
                        {renderColorDyeLayer(BACK_CHARACTER_REGIONS, 'translate(478, 0)')}
                        {renderColorDyeLayer(
                          SIDE_CHARACTER_REGIONS,
                          'translate(790, 0) translate(154, 0) scale(-1, 1)'
                        )}
                      </>
                    )}
                    {characterPose === 'FRONT' && renderColorDyeLayer(FRONT_CHARACTER_REGIONS)}
                    {characterPose === 'BACK' && renderColorDyeLayer(BACK_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_RIGHT' && renderColorDyeLayer(SIDE_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_LEFT' &&
                      renderColorDyeLayer(
                        SIDE_CHARACTER_REGIONS,
                        'translate(154, 0) scale(-1, 1)'
                      )}
                  </g>

                  {/* Layer 2: Muscle Fiber Richness via Soft Feathered Multiply */}
                  <g
                    mask={`url(#body-silhouette-mask-${characterPose})`}
                    style={{ mixBlendMode: 'multiply' }}
                    className="pointer-events-none"
                    aria-hidden="true"
                  >
                    {characterPose === 'ALL' && (
                      <>
                        {renderMultiplyDepthLayer(FRONT_CHARACTER_REGIONS, 'translate(0, 0)')}
                        {renderMultiplyDepthLayer(SIDE_CHARACTER_REGIONS, 'translate(318, 0)')}
                        {renderMultiplyDepthLayer(BACK_CHARACTER_REGIONS, 'translate(478, 0)')}
                        {renderMultiplyDepthLayer(
                          SIDE_CHARACTER_REGIONS,
                          'translate(790, 0) translate(154, 0) scale(-1, 1)'
                        )}
                      </>
                    )}
                    {characterPose === 'FRONT' &&
                      renderMultiplyDepthLayer(FRONT_CHARACTER_REGIONS)}
                    {characterPose === 'BACK' && renderMultiplyDepthLayer(BACK_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_RIGHT' &&
                      renderMultiplyDepthLayer(SIDE_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_LEFT' &&
                      renderMultiplyDepthLayer(
                        SIDE_CHARACTER_REGIONS,
                        'translate(154, 0) scale(-1, 1)'
                      )}
                  </g>

                  {/* Masked Glutes Fabric Glow Over Compression Trunks */}
                  <g
                    mask={`url(#body-silhouette-mask-${characterPose})`}
                    className="pointer-events-none"
                    aria-hidden="true"
                  >
                    {characterPose === 'ALL' && (
                      <>
                        {renderGluteTintLayer(FRONT_CHARACTER_REGIONS, 'translate(0, 0)')}
                        {renderGluteTintLayer(SIDE_CHARACTER_REGIONS, 'translate(318, 0)')}
                        {renderGluteTintLayer(BACK_CHARACTER_REGIONS, 'translate(478, 0)')}
                        {renderGluteTintLayer(
                          SIDE_CHARACTER_REGIONS,
                          'translate(790, 0) translate(154, 0) scale(-1, 1)'
                        )}
                      </>
                    )}
                    {characterPose === 'BACK' && renderGluteTintLayer(BACK_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_RIGHT' && renderGluteTintLayer(SIDE_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_LEFT' &&
                      renderGluteTintLayer(
                        SIDE_CHARACTER_REGIONS,
                        'translate(154, 0) scale(-1, 1)'
                      )}
                  </g>

                  {/* Layer 3: Precision Hit Regions (Unmasked Transparent Target for Instant Hover/Click) */}
                  <g>
                    {characterPose === 'ALL' && (
                      <>
                        {renderInteractiveLayer(FRONT_CHARACTER_REGIONS, 'translate(0, 0)')}
                        {renderInteractiveLayer(SIDE_CHARACTER_REGIONS, 'translate(318, 0)')}
                        {renderInteractiveLayer(BACK_CHARACTER_REGIONS, 'translate(478, 0)')}
                        {renderInteractiveLayer(
                          SIDE_CHARACTER_REGIONS,
                          'translate(790, 0) translate(154, 0) scale(-1, 1)'
                        )}
                      </>
                    )}
                    {characterPose === 'FRONT' &&
                      renderInteractiveLayer(FRONT_CHARACTER_REGIONS)}
                    {characterPose === 'BACK' && renderInteractiveLayer(BACK_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_RIGHT' &&
                      renderInteractiveLayer(SIDE_CHARACTER_REGIONS)}
                    {characterPose === 'SIDE_LEFT' &&
                      renderInteractiveLayer(
                        SIDE_CHARACTER_REGIONS,
                        'translate(154, 0) scale(-1, 1)'
                      )}
                  </g>
                </svg>
              </motion.div>
            </AnimatePresence>

            {/* Precision Sub-Muscle Head Selector Chips & Action Bar */}
            <div className="mt-3 flex flex-col items-center gap-2 w-full">
              {hasActiveSelection ? (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D2D9C5] font-bold text-[#263B2D] shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                      <span>{selectedRegionDetails.name}</span>
                      {muscleStatsMap[selectedMuscleSlug] && (
                        <span className="text-[#173F35]">
                          ({muscleStatsMap[selectedMuscleSlug].primaryExerciseCount} workouts)
                        </span>
                      )}
                    </span>

                    {onMuscleChosenJump && (
                      <button
                        type="button"
                        onClick={onMuscleChosenJump}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold transition-colors"
                      >
                        <span>View Workouts &amp; Equipment</span>
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}

                    {onClearSelection && (
                      <button
                        type="button"
                        onClick={onClearSelection}
                        className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-bold text-[#657565] transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {isBackGroupSelected ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
                      <button
                        type="button"
                        onClick={() => handleSelectMuscle('latissimus-dorsi', 'BACK', null)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          selectedMuscleSlug === 'latissimus-dorsi' && !selectedSubMuscleId
                            ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                            : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:border-[#DC2626] hover:text-[#DC2626]'
                        }`}
                      >
                        Full Lats
                      </button>
                      {subMusclesForActiveParent.map((head) => {
                        const isHeadActive = selectedSubMuscleId === head.id;
                        return (
                          <button
                            key={head.id}
                            type="button"
                            onClick={() =>
                              handleSelectMuscle(head.slug, head.side, head.id)
                            }
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              isHeadActive
                                ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                                : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:border-[#DC2626] hover:text-[#DC2626]'
                            }`}
                          >
                            {head.shortName}
                          </button>
                        );
                      })}
                      {selectedMuscleSlug === 'trapezius' && (
                        <button
                          type="button"
                          onClick={() => handleSelectMuscle('trapezius', 'BACK', null)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            !selectedSubMuscleId
                              ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                              : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:border-[#DC2626]'
                          }`}
                        >
                          All Traps
                        </button>
                      )}
                    </div>
                  ) : (
                    subMusclesForActiveParent.length > 1 && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
                        <button
                          type="button"
                          onClick={() => handleSelectMuscle(selectedMuscleSlug, viewMode, null)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            !selectedSubMuscleId
                              ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                              : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:border-[#DC2626]'
                          }`}
                        >
                          All Parts
                        </button>
                        {subMusclesForActiveParent.map((head) => {
                          const isHeadActive = selectedSubMuscleId === head.id;
                          return (
                            <button
                              key={head.id}
                              type="button"
                              onClick={() =>
                                handleSelectMuscle(head.slug, head.side, head.id)
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                                isHeadActive
                                  ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                                  : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:border-[#DC2626] hover:text-[#DC2626]'
                              }`}
                            >
                              {head.shortName}
                            </button>
                          );
                        })}
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 border border-[#D2D9C5] text-xs font-semibold text-[#263B2D] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#D99B82]" />
                    <span>
                      Click any muscle directly on the body (e.g. Upper Lats, Lower Lats, Lower Back, Triceps Long Head)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectMuscle('latissimus-dorsi', 'BACK', null)}
                      className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#DC2626] border border-[#D2D9C5] hover:border-[#DC2626] text-[11px] font-bold text-[#263B2D] hover:text-white transition-colors"
                    >
                      Full Lats
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMuscle('latissimus-dorsi', 'BACK', 'lats-upper')}
                      className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#DC2626] border border-[#D2D9C5] hover:border-[#DC2626] text-[11px] font-bold text-[#263B2D] hover:text-white transition-colors"
                    >
                      Upper Lats
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMuscle('latissimus-dorsi', 'BACK', 'lats-lower')}
                      className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#DC2626] border border-[#D2D9C5] hover:border-[#DC2626] text-[11px] font-bold text-[#263B2D] hover:text-white transition-colors"
                    >
                      Lower Lats
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMuscle('lower-back', 'BACK', 'lower-back-erectors')}
                      className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#DC2626] border border-[#D2D9C5] hover:border-[#DC2626] text-[11px] font-bold text-[#263B2D] hover:text-white transition-colors"
                    >
                      Lower Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Muscle Groups Selector */}
          <div className="col-span-12 sm:col-span-3 flex flex-col gap-1.5 z-20 pt-2 sm:pt-0">
            <span className="text-xs font-extrabold text-[#263B2D] px-1 mb-0.5">
              Muscle Groups
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
              {CHARACTER_MUSCLE_GROUPS.map((group) => {
                const isActive = activeGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() =>
                      handleSelectMuscle(group.slug, group.side, group.subMuscleId || null)
                    }
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-[#173F35] text-white border-2 border-[#DC2626] shadow-sm'
                        : 'bg-[#F1F2E8]/95 hover:bg-[#789575] text-[#263B2D] hover:text-white border-[#D2D9C5]'
                    }`}
                  >
                    <span className={isActive ? 'text-[#FCA5A5]' : 'text-[#173F35]'}>
                      <MuscleGroupLineIcon groupId={getGroupIconId(group.id)} />
                    </span>
                    <span className="truncate">{group.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Center View Switcher Pill: Front · Side Right · Back · Side Left */}
        <div className="mt-3 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1 bg-[#F1F2E8] p-1 rounded-full border border-[#D2D9C5] shadow-sm">
            {[
              { id: 'ALL', label: 'All 4 Views' },
              { id: 'FRONT', label: 'Front' },
              { id: 'SIDE_RIGHT', label: 'Side Right' },
              { id: 'BACK', label: 'Back' },
              { id: 'SIDE_LEFT', label: 'Side Left' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCharacterPose(tab.id)}
                className={`px-3 sm:px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                  characterPose === tab.id
                    ? 'bg-[#173F35] text-white shadow-sm'
                    : 'text-[#657565] hover:text-[#263B2D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
