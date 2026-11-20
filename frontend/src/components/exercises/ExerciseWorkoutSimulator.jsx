import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Plus,
  Check,
  Bookmark,
  Flame,
  Clock,
  Repeat,
  Layers,
  Dumbbell,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Columns,
} from 'lucide-react';
import { AnatomicalPerformerCanvas } from './AnatomicalPerformerCanvas';
import { parseVideoSource } from './ExerciseVisualDemo';
import {
  FRONT_CHARACTER_REGIONS,
  BACK_CHARACTER_REGIONS,
  deriveActiveSubMuscleIdsForExercise,
} from '../../data/characterHitRegions';
import {
  getMuscleHitRatingLabel,
  getRepPhaseInfo,
} from '../../utils/movementKinematics';
import {
  formatDifficultyLabel,
  getDifficultyBadgeClasses,
  getEquipmentDisplayLabel,
} from '../../utils/formatters';
import { useGymGuide } from '../../context/GymGuideContext';

const STEP_PHASE_PRESETS = [0.08, 0.55, 0.96, 0.25];

/**
 * Interactive Exercise Performing Studio & Live Muscle Hit Rating Scanner
 * Shown in Muscle Explorer whenever a muscle & equipment / exercise are selected:
 *  - Mode 1: "Perform Workout" -> Animates the 3D character performing the exercise
 *            with the chosen equipment while pulsing & rating hit muscles live.
 *  - Mode 2: "Watch Video" -> Plays attached MP4/YouTube/GIF (Front & Side angles).
 *  - Bottom: Step-by-step form posture images + cues + Common Mistakes / Safety.
 */
export function ExerciseWorkoutSimulator({
  exercise,
  selectedEquipmentSlug = 'ALL',
  performTrigger = 0,
}) {
  const navigate = useNavigate();
  const {
    isExerciseSaved,
    toggleSavedExercise,
    isExerciseInWorkout,
    toggleWorkoutExercise,
  } = useGymGuide();

  const [studioMode, setStudioMode] = useState('PERFORM'); // 'PERFORM' | 'VIDEO'
  const [isPerforming, setIsPerforming] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0.5);
  const [repCount, setRepCount] = useState(0);
  const [tempoSpeed, setTempoSpeed] = useState(1); // 0.6 | 1 | 1.5
  const [videoAngle, setVideoAngle] = useState('FRONT');
  const [videoError, setVideoError] = useState(false);

  const frontVideo = parseVideoSource(exercise?.videoUrl || exercise?.mediaUrl);
  const sideVideo = parseVideoSource(exercise?.sideVideoUrl);
  const hasCustomVideo = Boolean(frontVideo || sideVideo);

  const prevTriggerRef = React.useRef(performTrigger);

  // Reset animation smoothly whenever a new exercise or equipment is chosen
  useEffect(() => {
    const triggeredFromCard = performTrigger !== prevTriggerRef.current;
    prevTriggerRef.current = performTrigger;

    setPhaseProgress(0.65);
    setRepCount(0);
    setVideoError(false);
    setStudioMode('PERFORM');
    setVideoAngle(frontVideo && sideVideo ? 'DUAL' : frontVideo ? 'FRONT' : 'SIDE');
    setIsPerforming(triggeredFromCard);
  }, [exercise?.slug, selectedEquipmentSlug, performTrigger]);

  // 60fps requestAnimationFrame loop when "Perform Workout" is active
  useEffect(() => {
    if (!isPerforming || studioMode !== 'PERFORM') return undefined;

    let frameId;
    let startTime = performance.now();
    let lastCycleIndex = 0;

    const tick = (now) => {
      const cycleMs = 2600 / tempoSpeed;
      const elapsed = now - startTime;
      const cycleIndex = Math.floor(elapsed / cycleMs);
      if (cycleIndex > lastCycleIndex) {
        lastCycleIndex = cycleIndex;
        setRepCount((prev) => prev + 1);
      }
      const rawPhase = (elapsed % cycleMs) / cycleMs;
      // Smooth sine-eased contraction wave 0 -> 1 -> 0
      const contraction = 0.5 - 0.5 * Math.cos(rawPhase * 2 * Math.PI);
      setPhaseProgress(contraction);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPerforming, studioMode, tempoSpeed]);

  const handlePerformButtonClick = () => {
    setStudioMode('PERFORM');
    setIsPerforming((prev) => !prev);
  };

  // Combine Primary & Secondary muscles with exact activation scores
  const rankedMuscles = useMemo(() => {
    if (!exercise) return [];
    const list = [];

    for (const pm of exercise.primaryMuscles || []) {
      const peakScore = pm.activationPercent || 95;
      list.push({
        ...pm,
        role: 'PRIMARY',
        peakScore,
      });
    }
    for (const sm of exercise.secondaryMuscles || []) {
      if (!list.some((item) => item.slug === sm.slug)) {
        const peakScore = sm.activationPercent || 65;
        list.push({
          ...sm,
          role: 'SECONDARY',
          peakScore,
        });
      }
    }

    return list.sort((a, b) => b.peakScore - a.peakScore);
  }, [exercise]);

  if (!exercise) return null;

  const phaseInfo = getRepPhaseInfo(phaseProgress, isPerforming);
  const currentIntensity = isPerforming
    ? phaseInfo.stimulusMultiplier
    : 0.72 + phaseProgress * 0.28;

  const isSaved = isExerciseSaved(exercise.slug);
  const inWorkout = isExerciseInWorkout(exercise.slug);

  const activeEquipmentLabel =
    selectedEquipmentSlug !== 'ALL'
      ? getEquipmentDisplayLabel(selectedEquipmentSlug)
      : (exercise.equipment || []).map((eq) => eq.name).join(' + ') || 'Bodyweight';

  const hitMuscleMap = useMemo(() => {
    const map = new Map();
    for (const m of rankedMuscles) {
      map.set(m.slug, m);
    }
    return map;
  }, [rankedMuscles]);

  const activeHeadIds = useMemo(
    () => deriveActiveSubMuscleIdsForExercise(exercise),
    [exercise]
  );

  const renderAnatomicalHitFigure = (imgSrc, regions, w, h, keySuffix) => {
    const filterId = `sim-alpha-${keySuffix}`;
    const maskId = `sim-mask-${keySuffix}`;
    const featherId = `sim-feather-${keySuffix}`;
    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-40 sm:h-44 w-auto max-w-full select-none"
        style={{ isolation: 'isolate' }}
        role="img"
        aria-label={`${keySuffix} anatomical muscle hit intensity map`}
      >
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
            />
          </filter>
          <mask id={maskId}>
            <image
              href={imgSrc}
              x="0"
              y="0"
              width={w}
              height={h}
              filter={`url(#${filterId})`}
            />
          </mask>
          <filter id={featherId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <image href={imgSrc} x="0" y="0" width={w} height={h} />

        {/* Feathered HSL Crimson Muscle Stain (Head-Level Precision) */}
        <g mask={`url(#${maskId})`} style={{ mixBlendMode: 'color' }} className="pointer-events-none">
          {regions.map((reg, idx) => {
            const hit = hitMuscleMap.get(reg.slug);
            if (!hit) return null;
            if (!activeHeadIds.has(reg.id)) return null;
            const isPrimary = hit.role === 'PRIMARY';
            const intensity = isPerforming ? 0.55 + 0.43 * phaseProgress : 0.92;
            return (
              <g key={`dye-hit-${reg.id}-${idx}`}>
                {reg.paths.map((d, pIdx) => (
                  <path
                    key={pIdx}
                    d={d}
                    fill={isPrimary ? '#DC1414' : '#F59E0B'}
                    fillOpacity={isPrimary ? intensity : intensity * 0.65}
                    filter={`url(#${featherId})`}
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* Natural Belly Depth via Multiply */}
        <g mask={`url(#${maskId})`} style={{ mixBlendMode: 'multiply' }} className="pointer-events-none">
          {regions.map((reg, idx) => {
            const hit = hitMuscleMap.get(reg.slug);
            if (!hit) return null;
            if (!activeHeadIds.has(reg.id)) return null;
            const isPrimary = hit.role === 'PRIMARY';
            const intensity = isPerforming ? 0.18 + 0.20 * phaseProgress : 0.30;
            return (
              <g key={`mul-hit-${reg.id}-${idx}`}>
                {reg.paths.map((d, pIdx) => (
                  <path
                    key={pIdx}
                    d={d}
                    fill={isPrimary ? '#E11D48' : '#D97706'}
                    fillOpacity={isPrimary ? intensity : intensity * 0.5}
                    filter={`url(#${featherId})`}
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* Illuminates Glutes Cleanly Over Dark Compression Underwear */}
        <g mask={`url(#${maskId})`} className="pointer-events-none">
          {regions.map((reg, idx) => {
            if (reg.slug !== 'glutes') return null;
            const hit = hitMuscleMap.get(reg.slug);
            if (!hit || !activeHeadIds.has(reg.id)) return null;
            const isPrimary = hit.role === 'PRIMARY';
            const alpha = isPrimary
              ? isPerforming
                ? 0.28 + 0.18 * phaseProgress
                : 0.36
              : 0.22;
            return (
              <g key={`glute-hit-${reg.id}-${idx}`}>
                {reg.paths.map((d, pIdx) => (
                  <path
                    key={pIdx}
                    d={d}
                    fill={
                      isPrimary
                        ? `rgba(239, 68, 68, ${alpha})`
                        : `rgba(245, 158, 11, ${alpha})`
                    }
                    filter={`url(#${featherId})`}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  return (
    <section
      aria-label="Interactive Exercise Performer and Form Guide"
      className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm"
    >
      {/* 1. HEADER: Exercise Title, Equipment, Quick Metrics, and Perform / Video Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#D2D9C5]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#173F35] text-white text-xs font-bold">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{activeEquipmentLabel}</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDifficultyBadgeClasses(
                exercise.difficulty
              )}`}
            >
              {formatDifficultyLabel(exercise.difficulty)}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-semibold text-[#657565]">
              {exercise.exerciseType} • {exercise.forceType}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#263B2D]">
            {exercise.name}
          </h3>
          <p className="text-xs sm:text-sm text-[#657565] max-w-2xl leading-relaxed">
            {exercise.description}
          </p>
        </div>

        {/* Action Buttons: Perform Workout (Primary), Watch Video, Save, Add to Workout */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePerformButtonClick}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm active:scale-[0.98] ${
              studioMode === 'PERFORM' && isPerforming
                ? 'bg-[#789575] text-white ring-4 ring-[#789575]/30'
                : 'bg-[#173F35] hover:bg-[#789575] text-white'
            }`}
          >
            {studioMode === 'PERFORM' && isPerforming ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Workout ({repCount} Reps)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Perform Workout</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPerforming(false);
              setStudioMode((prev) => (prev === 'VIDEO' ? 'PERFORM' : 'VIDEO'));
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
              studioMode === 'VIDEO'
                ? 'bg-[#173F35] text-white border-[#173F35]'
                : 'bg-[#E5E8CE] hover:bg-[#789575] text-[#263B2D] hover:text-white border-[#D2D9C5]'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{studioMode === 'VIDEO' ? 'Show 3D Model' : 'Watch Video'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleWorkoutExercise(exercise)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl border text-xs font-bold transition-all ${
              inWorkout
                ? 'bg-[#D3E3CC] text-[#173F35] border-[#789575]'
                : 'bg-white hover:bg-[#E5E8CE] text-[#263B2D] border-[#D2D9C5]'
            }`}
          >
            {inWorkout ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{inWorkout ? 'In Workout' : 'Add'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSavedExercise(exercise.slug)}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark exercise'}
            className={`p-3 rounded-xl border transition-all ${
              isSaved
                ? 'bg-[#173F35] text-white border-[#173F35]'
                : 'bg-white hover:bg-[#E5E8CE] text-[#657565] border-[#D2D9C5]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MAIN PERFORMER STAGE (Left 7 cols) + LIVE MUSCLE HIT RATING PANEL (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 7 COLS: Live Workout Simulator Stage OR Video Stream */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#E5E8CE]/60 border border-[#D2D9C5] rounded-2xl p-4 sm:p-5">
          {studioMode === 'VIDEO' ? (
            <div className="flex flex-col h-full justify-between space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173F35]">
                  <Video className="w-4 h-4" />
                  <span>Video Demonstration • {exercise.name}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {hasCustomVideo && frontVideo && sideVideo && (
                    <button
                      type="button"
                      onClick={() =>
                        setVideoAngle((prev) => (prev === 'DUAL' ? 'FRONT' : 'DUAL'))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F1F2E8] border border-[#D2D9C5] text-[11px] font-bold text-[#263B2D]"
                    >
                      <Columns className="w-3 h-3 text-[#173F35]" />
                      <span>{videoAngle === 'DUAL' ? 'Single View' : 'Dual Angle'}</span>
                    </button>
                  )}
                  <Link
                    to={`/admin?exercise=${exercise.slug}`}
                    className="px-2.5 py-1 rounded-lg bg-[#173F35] hover:bg-[#789575] text-white text-[11px] font-bold transition-colors"
                  >
                    {hasCustomVideo ? 'Edit Video' : '+ Upload Video'}
                  </Link>
                </div>
              </div>

              {hasCustomVideo && !videoError ? (
                <div className="relative h-72 sm:h-80 rounded-xl overflow-hidden bg-[#173F35] border border-[#D2D9C5]">
                  {videoAngle === 'DUAL' && frontVideo && sideVideo ? (
                    <div className="grid grid-cols-2 w-full h-full divide-x divide-[#D2D9C5]">
                      <VideoFrame source={frontVideo} title={`${exercise.name} Front`} onError={() => setVideoError(true)} />
                      <VideoFrame source={sideVideo} title={`${exercise.name} Side`} onError={() => setVideoError(true)} />
                    </div>
                  ) : (
                    <VideoFrame
                      source={frontVideo || sideVideo}
                      title={`${exercise.name} Video`}
                      onError={() => setVideoError(true)}
                    />
                  )}
                </div>
              ) : (
                <div className="h-72 sm:h-80 rounded-xl bg-[#F1F2E8] border border-dashed border-[#789575] flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Video className="w-9 h-9 text-[#789575]" />
                  <div>
                    <p className="text-sm font-bold text-[#263B2D]">
                      No custom MP4/YouTube video attached yet for {exercise.name}
                    </p>
                    <p className="text-xs text-[#657565] mt-1 max-w-sm">
                      Click <strong>Perform Workout</strong> below to watch our 3D model demonstrate every rep and rate the muscles hit, or upload a custom clip in the Admin Studio.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStudioMode('PERFORM');
                        setIsPerforming(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Perform Workout with 3D Model</span>
                    </button>
                    <Link
                      to={`/admin?exercise=${exercise.slug}`}
                      className="px-4 py-2 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] text-[#263B2D] text-xs font-bold hover:bg-[#789575] hover:text-white transition-colors"
                    >
                      Attach Custom Video
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between space-y-3">
              {/* Simulator Top Status Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F2E8] border border-[#D2D9C5] text-xs font-bold text-[#263B2D]">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isPerforming ? 'bg-red-500 animate-ping' : 'bg-[#39B963]'
                    }`}
                  />
                  <span>{phaseInfo.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#173F35] text-white font-mono text-xs font-bold">
                    Reps: {repCount}
                  </span>

                  {/* Tempo Speed Switcher */}
                  <div className="inline-flex items-center bg-[#F1F2E8] p-0.5 rounded-lg border border-[#D2D9C5]">
                    {[
                      { v: 0.6, label: 'Slow' },
                      { v: 1, label: '1x' },
                      { v: 1.5, label: 'Fast' },
                    ].map((sp) => (
                      <button
                        key={sp.label}
                        type="button"
                        onClick={() => setTempoSpeed(sp.v)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          tempoSpeed === sp.v
                            ? 'bg-[#173F35] text-white'
                            : 'text-[#657565] hover:text-[#263B2D]'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Animated 3D Character Performer Canvas */}
              <div className="relative flex-1 min-h-[260px] flex items-center justify-center rounded-2xl bg-[#F1F2E8] bg-anatomy-grid border border-[#D2D9C5] px-4 py-2 overflow-hidden">
                <AnatomicalPerformerCanvas
                  exercise={exercise}
                  equipmentSlug={selectedEquipmentSlug}
                  phaseProgress={phaseProgress}
                  activeIntensity={currentIntensity}
                />

                {/* Peak Squeeze Alert Badge */}
                {phaseProgress > 0.8 && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-extrabold shadow">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Peak Muscle Hit</span>
                  </div>
                )}

                {/* Play Overlay Prompt if Paused Initially */}
                {!isPerforming && (
                  <button
                    type="button"
                    onClick={() => setIsPerforming(true)}
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#173F35]/95 hover:bg-[#789575] text-white text-xs font-bold shadow transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tap to Perform Workout</span>
                  </button>
                )}
              </div>

              {/* Manual Rep Phase Slider + Quick Step Controls */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPerforming((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold transition-colors"
                >
                  {isPerforming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPerforming ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPerforming(false);
                    setPhaseProgress(0.05);
                    setRepCount(0);
                  }}
                  className="p-1.5 rounded-xl bg-[#F1F2E8] hover:bg-[#789575] text-[#657565] hover:text-white border border-[#D2D9C5] transition-colors"
                  title="Reset Rep"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 flex items-center gap-2 min-w-[140px]">
                  <span className="text-[11px] font-bold text-[#657565]">Rep Phase:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={phaseProgress}
                    onChange={(e) => {
                      setIsPerforming(false);
                      setPhaseProgress(parseFloat(e.target.value));
                    }}
                    className="flex-1 accent-[#173F35] cursor-pointer"
                    aria-label="Scrub repetition phase"
                  />
                  <span className="text-[11px] font-mono font-bold text-[#173F35] w-9 text-right">
                    {Math.round(phaseProgress * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sets / Reps / Rest Footer Pills */}
          <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-[#D2D9C5]">
            <div className="px-3 py-2 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-center">
              <span className="text-[10px] font-bold uppercase text-[#657565] flex items-center justify-center gap-1">
                <Layers className="w-3 h-3 text-[#173F35]" /> Sets
              </span>
              <strong className="text-xs sm:text-sm font-extrabold text-[#263B2D]">
                {exercise.recommendedSets}
              </strong>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-center">
              <span className="text-[10px] font-bold uppercase text-[#657565] flex items-center justify-center gap-1">
                <Repeat className="w-3 h-3 text-[#173F35]" /> Reps
              </span>
              <strong className="text-xs sm:text-sm font-extrabold text-[#173F35]">
                {exercise.recommendedReps}
              </strong>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-center">
              <span className="text-[10px] font-bold uppercase text-[#657565] flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-[#173F35]" /> Rest
              </span>
              <strong className="text-xs sm:text-sm font-extrabold text-[#263B2D]">
                {exercise.restDuration}
              </strong>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Live 3D Character Muscle Hit Map + Muscle Hit Rate Breakdown */}
        <div className="lg:col-span-5 bg-white border border-[#D2D9C5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#173F35]">
                Live Biomechanical Analysis
              </span>
              <h4 className="text-base sm:text-lg font-extrabold font-display text-[#263B2D]">
                Muscles Hit & Activation Rate
              </h4>
            </div>
            <Flame
              className={`w-5 h-5 ${
                isPerforming ? 'text-red-500 animate-pulse' : 'text-[#173F35]'
              }`}
            />
          </div>

          {/* 3D Front & Back Character Cutouts with Clean Anatomical Contour Hit Highlights */}
          <div className="grid grid-cols-2 gap-2 bg-[#F1F2E8] border border-[#D2D9C5] rounded-xl p-2.5">
            {/* FRONT CHARACTER HIT VIEW */}
            <div className="relative flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-[#657565] mb-1">
                Anterior Hit
              </span>
              {renderAnatomicalHitFigure(
                '/images/character/character-front-cutout.png?v=7',
                FRONT_CHARACTER_REGIONS,
                316,
                675,
                'front'
              )}
            </div>

            {/* BACK CHARACTER HIT VIEW */}
            <div className="relative flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-[#657565] mb-1">
                Posterior Hit
              </span>
              {renderAnatomicalHitFigure(
                '/images/character/character-back-cutout.png?v=7',
                BACK_CHARACTER_REGIONS,
                302,
                675,
                'back'
              )}
            </div>
          </div>

          {/* Rated Muscle Hit Breakdown List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {rankedMuscles.map((muscle) => {
              const ratingMeta = getMuscleHitRatingLabel(muscle.peakScore);
              const liveScore = isPerforming
                ? Math.round(muscle.peakScore * (0.4 + 0.6 * phaseProgress))
                : muscle.peakScore;

              return (
                <div
                  key={muscle.slug}
                  className="p-2.5 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            muscle.role === 'PRIMARY' ? 'bg-red-500' : 'bg-[#789575]'
                          }`}
                        />
                        <span className="text-xs font-extrabold text-[#263B2D] truncate">
                          {muscle.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${ratingMeta.color}`}
                      >
                        {ratingMeta.grade}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-[#173F35]">
                        {liveScore}%
                      </span>
                    </div>
                  </div>

                  {/* Hit Intensity Meter */}
                  <div className="w-full h-2 rounded-full bg-[#E5E8CE] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-100 ${
                        muscle.role === 'PRIMARY'
                          ? 'bg-gradient-to-r from-[#39B963] to-red-500'
                          : 'bg-[#789575]'
                      }`}
                      style={{ width: `${liveScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. STEP-BY-STEP VISUAL POSTURE IMAGES ("How to Perform It" Sequence) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
              How to Perform With {activeEquipmentLabel}
            </span>
            <h4 className="text-lg font-extrabold font-display text-[#263B2D]">
              Step-by-Step Visual Form Sequence
            </h4>
          </div>
          <Link
            to={`/exercises/${exercise.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#173F35] hover:text-[#789575]"
          >
            <span>Open Full Exercise Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(exercise.instructions || []).map((step, idx) => {
            const stepPhase = STEP_PHASE_PRESETS[idx] ?? 0.5;
            const isSelectedStep =
              !isPerforming && Math.abs(phaseProgress - stepPhase) < 0.08;

            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => {
                  setStudioMode('PERFORM');
                  setIsPerforming(false);
                  setPhaseProgress(stepPhase);
                }}
                className={`text-left flex flex-col rounded-2xl border overflow-hidden transition-all ${
                  isSelectedStep
                    ? 'bg-white border-2 border-[#173F35] shadow-md'
                    : 'bg-white border-[#D2D9C5] hover:border-[#789575]'
                }`}
              >
                {/* Step Posture Visual Image */}
                <div className="relative bg-[#F1F2E8] bg-anatomy-grid border-b border-[#D2D9C5] p-2">
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#173F35] text-white text-[10px] font-extrabold">
                    Step {step.stepNumber}
                  </span>
                  <AnatomicalPerformerCanvas
                    exercise={exercise}
                    equipmentSlug={selectedEquipmentSlug}
                    phaseProgress={stepPhase}
                    activeIntensity={0.45 + stepPhase * 0.5}
                    compact={true}
                  />
                </div>

                {/* Step Instructions */}
                <div className="p-3.5 space-y-1 flex-1">
                  <h5 className="text-xs sm:text-sm font-extrabold text-[#263B2D]">
                    {step.title}
                  </h5>
                  <p className="text-[11px] sm:text-xs text-[#657565] leading-relaxed">
                    {step.instruction}
                  </p>
                  {step.coachingCue && (
                    <p className="text-[11px] font-bold text-[#173F35] pt-1">
                      Cue: &ldquo;{step.coachingCue}&rdquo;
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. STARTING POSITION + SAFETY & COMMON MISTAKES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#D2D9C5]">
        <div className="p-4 rounded-2xl bg-white border border-[#D2D9C5] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#263B2D]">
            <AlertTriangle className="w-4 h-4 text-[#789575]" />
            <span>Common Mistakes to Avoid</span>
          </div>
          <ul className="space-y-1.5">
            {(exercise.commonMistakes || []).map((m, idx) => (
              <li key={idx} className="text-xs text-[#657565] flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#789575] shrink-0 mt-1.5" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D2D9C5] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#173F35]">
            <ShieldCheck className="w-4 h-4" />
            <span>Safety Cues & Starting Position</span>
          </div>
          <p className="text-xs text-[#263B2D] leading-relaxed bg-[#E5E8CE]/60 p-2.5 rounded-xl border border-[#D2D9C5]">
            {exercise.startingPosition}
          </p>
          <ul className="space-y-1">
            {(exercise.safetyTips || []).map((t, idx) => (
              <li key={idx} className="text-xs text-[#657565] flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173F35] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function VideoFrame({ source, title, onError }) {
  if (!source) return null;
  if (source.type === 'video') {
    return (
      <video
        src={source.src}
        autoPlay
        loop
        muted
        playsInline
        controls
        onError={onError}
        className="w-full h-full object-cover"
      />
    );
  }
  if (source.type === 'gif') {
    return (
      <img
        src={source.src}
        alt={title}
        onError={onError}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <iframe
      src={source.src}
      title={title}
      className="w-full h-full border-0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}
