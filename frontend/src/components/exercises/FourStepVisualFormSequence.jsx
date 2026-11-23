import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { AnatomicalPerformerCanvas } from './AnatomicalPerformerCanvas';
import { MiniMuscleDiagram } from '../anatomy/MiniMuscleDiagram';
import { SecureInstructionImage } from '../common/SecureMediaComponents';
import { getEquipmentDisplayLabel, getChestSubRegionLabel } from '../../utils/formatters';

const DEFAULT_STAGE_ROLES = {
  1: { role: 'Starting Position', phaseProgress: 0.06, intensity: 0.42, motionDirection: null },
  2: { role: 'Movement / Execution', phaseProgress: 0.52, intensity: 0.74, motionDirection: 'concentric' },
  3: { role: 'Peak Contraction', phaseProgress: 0.98, intensity: 1.0, motionDirection: null },
  4: { role: 'Controlled Return & Muscle Activation', phaseProgress: 0.24, intensity: 0.95, motionDirection: 'eccentric' },
};

const CURATED_EXERCISE_STEP_ASSETS = {
  'incline-dumbbell-bench-press': {
    cards: {
      1: '/images/exercises/incline-dumbbell-bench-press/step-01-card.webp?v=3',
      2: '/images/exercises/incline-dumbbell-bench-press/step-02-card.webp?v=3',
      3: '/images/exercises/incline-dumbbell-bench-press/step-03-card.webp?v=3',
      4: '/images/exercises/incline-dumbbell-bench-press/step-04-card.webp?v=3',
    },
    stages: {
      1: '/images/exercises/incline-dumbbell-bench-press/step-01-starting.webp?v=3',
      2: '/images/exercises/incline-dumbbell-bench-press/step-02-movement.webp?v=3',
      3: '/images/exercises/incline-dumbbell-bench-press/step-03-contraction.webp?v=3',
      4: '/images/exercises/incline-dumbbell-bench-press/step-04-return-muscle.webp?v=3',
    },
  },
};

/**
 * Splits a descriptive step paragraph + coaching cue into 3–4 scannable checklist lines
 * matching GymGuide's signature visual step card format.
 */
function buildStepChecklist(instruction = '', coachingCue = '', maxBullets = 4) {
  const sentences = String(instruction || '')
    .split(/(?<=[.!?])\s+|;\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const items = [];
  for (const s of sentences) {
    if (s.length > 78 && s.includes(', and ')) {
      const [a, b] = s.split(', and ');
      if (a) items.push(a.trim().replace(/\.$/, '') + '.');
      if (b) items.push(b.charAt(0).toUpperCase() + b.slice(1));
    } else if (s.length > 78 && s.includes(', ')) {
      const idx = s.indexOf(', ', 28);
      if (idx > 0 && idx < s.length - 18) {
        items.push(s.slice(0, idx).trim() + '.');
        const rest = s.slice(idx + 2).trim();
        items.push(rest.charAt(0).toUpperCase() + rest.slice(1));
      } else {
        items.push(s);
      }
    } else {
      items.push(s);
    }
  }

  if (coachingCue && items.length < maxBullets) {
    const cleanCue = coachingCue.trim().replace(/[.!?]+$/, '') + '.';
    if (!items.some((i) => i.toLowerCase().includes(coachingCue.slice(0, 12).toLowerCase()))) {
      items.push(cleanCue);
    }
  }

  return items.slice(0, maxBullets);
}

/**
 * Resolves a concise Setup Icon + Angle/Gear caption for Step 1 (e.g. Bench Angle 30°–45°)
 */
function resolveSetupBadge(exercise, equipmentLabel) {
  const name = `${exercise?.name || ''} ${exercise?.slug || ''}`.toLowerCase();
  if (name.includes('incline') && !name.includes('push-up') && !name.includes('pushup')) {
    return { kind: 'incline-bench', label: 'Bench Angle', value: '30° – 45°' };
  }
  if (name.includes('decline') && !name.includes('push-up') && !name.includes('pushup')) {
    return { kind: 'decline-bench', label: 'Decline Angle', value: '-15° to -20°' };
  }
  if (name.includes('bench press') || name.includes('chest fly') || name.includes('skull crusher')) {
    return { kind: 'flat-bench', label: 'Flat Bench Setup', value: 'Scapulae Retracted' };
  }
  if (name.includes('high-to-low')) {
    return { kind: 'cable', label: 'High Pulley', value: 'Overhead Arc' };
  }
  if (name.includes('low-to-high')) {
    return { kind: 'cable', label: 'Low Pulley', value: 'Ankle Height' };
  }
  if (equipmentLabel === 'Cable') {
    return { kind: 'cable', label: 'Cable Setup', value: 'Constant Tension' };
  }
  if (equipmentLabel === 'Machine') {
    return { kind: 'machine', label: 'Seat Alignment', value: 'Joint Aligned' };
  }
  return { kind: 'stance', label: `${equipmentLabel} Setup`, value: 'Neutral Spine Base' };
}

function SetupDiagramIcon({ kind }) {
  if (kind === 'incline-bench') {
    return (
      <svg viewBox="0 0 36 28" className="w-8 h-6 text-[#173F35] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 24h26" />
        <path d="M9 24l4-7h12l3 7" />
        <path d="M8 14l11-8" strokeWidth="3.2" />
        <path d="M19 17h9" strokeWidth="2.8" />
        <path d="M12 19a6 6 0 0 1 5-4" strokeDasharray="2 2" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === 'decline-bench') {
    return (
      <svg viewBox="0 0 36 28" className="w-8 h-6 text-[#173F35] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 24h26" />
        <path d="M9 12l14 6" strokeWidth="3.2" />
        <path d="M23 18h6" strokeWidth="2.8" />
        <path d="M12 24l2-8M24 24l-2-6" />
      </svg>
    );
  }
  if (kind === 'flat-bench') {
    return (
      <svg viewBox="0 0 36 28" className="w-8 h-6 text-[#173F35] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 24h28" />
        <path d="M6 15h24" strokeWidth="3.4" />
        <path d="M10 15v9M26 15v9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 28" className="w-8 h-6 text-[#173F35] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="5" height="8" rx="1.5" />
      <rect x="27" y="10" width="5" height="8" rx="1.5" />
      <path d="M9 14h18" strokeWidth="3" />
    </svg>
  );
}

function normalizeFourStepsClient(exercise) {
  const rawSteps = [...(exercise?.instructions || [])].sort(
    (a, b) => Number(a.stepNumber) - Number(b.stepNumber)
  );
  const primaryNames =
    (exercise?.primaryMuscles || []).map((m) => m.name).join(', ') ||
    exercise?.category ||
    'Target Muscle';
  const secondaryNames = (exercise?.secondaryMuscles || []).map((m) => m.name).join(', ');

  return [1, 2, 3, 4].map((stepNum) => {
    const existing = rawSteps.find((s) => Number(s.stepNumber) === stepNum);
    const meta = DEFAULT_STAGE_ROLES[stepNum];
    const minioImg = exercise?.instructionImages?.[stepNum] || null;
    const baseTitle = existing?.title || meta.role;
    const headerTitle =
      stepNum === 1
        ? 'Starting Position'
        : stepNum === 2
        ? baseTitle.toLowerCase().includes('movement')
          ? baseTitle
          : `${baseTitle.replace(/^Execute Movement:\s*/i, '')} (Movement)`
        : stepNum === 3
        ? 'Peak Contraction'
        : 'Controlled Return & Muscle Activation';

    const fullInstruction =
      existing?.instruction ||
      (stepNum === 4
        ? `Lower slowly back to starting posture while breathing cleanly. Primary tension activates ${primaryNames}${
            secondaryNames ? ` with ${secondaryNames} assisting` : ''
          }.`
        : exercise?.startingPosition || `Perform ${exercise?.name || 'movement'} under strict control.`);

    const cue = existing?.coachingCue || `Keep focus on controlled ${primaryNames} engagement.`;
    const bullets = buildStepChecklist(fullInstruction, cue, stepNum === 4 ? 3 : 4);

    return {
      stepNumber: stepNum,
      headerTitle,
      stepTitle: baseTitle,
      stageRole: existing?.stageRole || meta.role,
      instruction: fullInstruction,
      coachingCue: cue,
      bullets,
      phaseProgress: existing?.phaseProgress ?? meta.phaseProgress,
      intensity: meta.intensity,
      motionDirection: meta.motionDirection,
      minioImg,
    };
  });
}

/**
 * Reusable Hybrid 2x2 Infographic 4-Step Visual Form Sequence
 * Mirrors the exact GymGuide educational panel style:
 *   - Forest-green numbered header badges (1..4)
 *   - Left dark gym character anatomy rig in emerald (#18C978) & mint (#76CBB3) + green motion arrows
 *   - Right floating sage-cream bullet callout card (Step 1 Setup Diagram, Step 4 Front/Back Muscles Worked)
 *   - Click any panel to open enlarged modal lightbox with 4-step progress & Prev/Next controls
 */
export function FourStepVisualFormSequence({
  exercise,
  selectedEquipmentSlug = 'ALL',
  activePhaseProgress = null,
  isPerforming = false,
  onSelectStepPhase = null,
  showOpenGuideLink = true,
  guideHref = null,
  guideLabel = 'Open Full Exercise Guide',
}) {
  const [modalStepNumber, setModalStepNumber] = useState(null);
  const [focusedStep, setFocusedStep] = useState(1);

  const steps = useMemo(() => normalizeFourStepsClient(exercise), [exercise]);

  useEffect(() => {
    setModalStepNumber(null);
    setFocusedStep(1);
  }, [exercise?.slug]);

  useEffect(() => {
    if (modalStepNumber === null) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setModalStepNumber(null);
      if (e.key === 'ArrowRight') setModalStepNumber((s) => (s >= 4 ? 1 : s + 1));
      if (e.key === 'ArrowLeft') setModalStepNumber((s) => (s <= 1 ? 4 : s - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalStepNumber]);

  if (!exercise) return null;

  const activeEquipmentLabel =
    selectedEquipmentSlug && selectedEquipmentSlug !== 'ALL'
      ? getEquipmentDisplayLabel(selectedEquipmentSlug)
      : exercise.equipment?.[0]?.name || 'Equipment';

  const setupBadge = resolveSetupBadge(exercise, activeEquipmentLabel);
  const primaryLabel =
    exercise.category === 'Chest'
      ? `${getChestSubRegionLabel(exercise)} (${(exercise.primaryMuscles || [])[0]?.name || 'Pectoralis Major'})`
      : (exercise.primaryMuscles || []).map((m) => m.name).join(', ') || exercise.category;
  const secondaryLabel = (exercise.secondaryMuscles || []).map((m) => m.name).join(', ');

  const modalStep =
    modalStepNumber !== null
      ? steps.find((s) => s.stepNumber === modalStepNumber) || steps[0]
      : null;

  const resolvedGuideLink = guideHref || `/exercises/${exercise.slug}`;
  const isAnchorLink = resolvedGuideLink.startsWith('#');

  const handleCardClick = (step) => {
    setFocusedStep(step.stepNumber);
    if (typeof onSelectStepPhase === 'function') {
      onSelectStepPhase(step.phaseProgress, step.stepNumber);
    }
    setModalStepNumber(step.stepNumber);
  };

  return (
    <section
      aria-label="Step-by-Step Visual Form Sequence"
      className="space-y-4"
    >
      {/* Header Row + Progress Indicator + Open Full Exercise Guide Link */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#173F35] block">
            HOW TO PERFORM WITH {activeEquipmentLabel.toUpperCase()}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#263B2D] mt-0.5">
            Step-by-Step Visual Form Sequence
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 4-Step Interactive Progress Indicator */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D2D9C5]"
            aria-label="Four-step progress indicator"
          >
            {steps.map((s, idx) => {
              const isActive =
                modalStepNumber === s.stepNumber ||
                focusedStep === s.stepNumber ||
                (!isPerforming &&
                  activePhaseProgress !== null &&
                  Math.abs(activePhaseProgress - s.phaseProgress) < 0.08);

              return (
                <React.Fragment key={s.stepNumber}>
                  <button
                    type="button"
                    onClick={() => handleCardClick(s)}
                    className={`w-6 h-6 rounded-full font-mono text-[10px] font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#18C978] text-[#173F35] ring-2 ring-[#18C978]/40'
                        : s.stepNumber < focusedStep
                        ? 'bg-[#173F35] text-white'
                        : 'bg-[#E5E8CE] text-[#657565] hover:bg-[#76CBB3]/40 hover:text-[#173F35]'
                    }`}
                    title={`Step 0${s.stepNumber}: ${s.headerTitle}`}
                  >
                    {s.stepNumber}
                  </button>
                  {idx < 3 && (
                    <span
                      className={`w-3 h-0.5 rounded-full ${
                        s.stepNumber < focusedStep ? 'bg-[#18C978]' : 'bg-[#D2D9C5]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {showOpenGuideLink &&
            (isAnchorLink ? (
              <a
                href={resolvedGuideLink}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#173F35] hover:text-[#18C978] transition-colors"
              >
                <span>{guideLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Link
                to={resolvedGuideLink}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#173F35] hover:text-[#18C978] transition-colors"
              >
                <span>{guideLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
        </div>
      </div>

      {/* 2x2 Framed Educational Infographic Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {steps.map((step) => {
          const isSelectedCard =
            focusedStep === step.stepNumber ||
            (!isPerforming &&
              activePhaseProgress !== null &&
              Math.abs(activePhaseProgress - step.phaseProgress) < 0.08);
          const curatedSet = CURATED_EXERCISE_STEP_ASSETS[exercise?.slug] || null;
          const curatedCardUrl = !step.minioImg && curatedSet ? curatedSet.cards[step.stepNumber] : null;

          if (curatedCardUrl) {
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => handleCardClick(step)}
                className={`group relative text-left rounded-2xl bg-[#121820] overflow-hidden block transition-all cursor-pointer min-w-0 ${
                  isSelectedCard
                    ? 'border-2 border-[#18C978] shadow-lg ring-2 ring-[#18C978]/20'
                    : 'border-2 border-[#789575]/75 hover:border-[#18C978] shadow-sm'
                }`}
              >
                <span className="absolute bottom-2.5 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/70 border border-white/20 text-[10px] font-semibold text-[#E5E8CE] opacity-85 group-hover:opacity-100">
                  <Maximize2 className="w-2.5 h-2.5 text-[#18C978]" />
                  <span>Enlarge</span>
                </span>
                <img
                  src={curatedCardUrl}
                  alt={`${exercise.name} — Step ${step.stepNumber}: ${step.headerTitle}`}
                  className="w-full h-auto object-contain block select-none"
                  loading="lazy"
                />
              </button>
            );
          }

          return (
            <button
              key={step.stepNumber}
              type="button"
              onClick={() => handleCardClick(step)}
              className={`group relative text-left rounded-2xl bg-[#121820] overflow-hidden flex flex-col sm:flex-row items-stretch transition-all cursor-pointer min-w-0 ${
                isSelectedCard
                  ? 'border-2 border-[#18C978] shadow-lg ring-2 ring-[#18C978]/20'
                  : 'border-2 border-[#789575]/75 hover:border-[#18C978] shadow-sm'
              }`}
            >
              {/* Top-Left Signature Forest-Green Header Pill (1..4) */}
              <div className="sm:absolute sm:top-0 sm:left-0 z-20 inline-flex items-center gap-2 bg-[#173F35] text-white px-3.5 py-1.5 sm:rounded-br-2xl border-b sm:border-r border-[#789575]/50 shadow-sm">
                <span className="w-6 h-6 rounded-full bg-white text-[#173F35] font-extrabold text-xs flex items-center justify-center shrink-0">
                  {step.stepNumber}
                </span>
                <span className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
                  {step.headerTitle}
                </span>
              </div>

              {/* Left ~56%: Dark Gym Stage Character Pose + Motion Arrows */}
              <div className="relative sm:w-[56%] min-h-[220px] sm:min-h-[272px] bg-[#121820] flex items-center justify-center pt-5 sm:pt-6 overflow-hidden">
                <span className="absolute bottom-2 left-2.5 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 border border-white/20 text-[10px] font-semibold text-[#E5E8CE] opacity-90 group-hover:opacity-100">
                  <Maximize2 className="w-2.5 h-2.5 text-[#18C978]" />
                  <span>Enlarge</span>
                </span>

                {step.minioImg ? (
                  <SecureInstructionImage
                    mediaItem={step.minioImg}
                    exerciseName={exercise.name}
                    stepNumber={step.stepNumber}
                    stepTitle={step.stepTitle}
                    className="w-full h-56 sm:h-full border-0 bg-transparent"
                  />
                ) : (
                  <AnatomicalPerformerCanvas
                    exercise={exercise}
                    equipmentSlug={selectedEquipmentSlug}
                    phaseProgress={step.phaseProgress}
                    activeIntensity={step.intensity}
                    compact={false}
                    accentMode="emerald"
                    isDarkTheme={true}
                    motionDirection={step.motionDirection}
                    showHud={false}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Right ~44%: Floating Soft Sage-Cream Instruction Card */}
              <div className="sm:w-[44%] m-2.5 sm:my-3 sm:mr-3 sm:ml-0 rounded-xl bg-[#EDF1DF] text-[#263B2D] border border-[#D2D9C5] p-3 flex flex-col justify-between gap-2 shadow-sm min-w-0">
                {/* Panel 1 Special Equipment Angle / Setup Header */}
                {step.stepNumber === 1 && (
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#D2D9C5]">
                    <SetupDiagramIcon kind={setupBadge.kind} />
                    <div className="leading-tight min-w-0">
                      <p className="text-[11px] font-extrabold text-[#173F35] truncate">
                        {setupBadge.label}
                      </p>
                      <p className="text-xs font-extrabold text-[#263B2D] truncate">
                        {setupBadge.value}
                      </p>
                    </div>
                  </div>
                )}

                {/* Panel 4 Embedded Front & Back Muscles Worked Box */}
                {step.stepNumber === 4 && (
                  <div className="pb-2 border-b border-[#D2D9C5] space-y-1.5">
                    <p className="text-center text-xs font-extrabold text-[#173F35]">
                      Muscles Worked
                    </p>
                    <MiniMuscleDiagram
                      primaryMuscles={exercise.primaryMuscles}
                      secondaryMuscles={exercise.secondaryMuscles}
                      showBothSides={true}
                      variant="emerald"
                      compact={true}
                      showLegend={false}
                      className="py-0.5"
                    />
                    <div className="space-y-1 text-[10px] leading-tight pt-0.5">
                      <div className="flex items-start gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#18C978] shrink-0 mt-0.5" />
                        <span className="text-[#263B2D]">
                          <strong>Primary:</strong> {primaryLabel}
                        </span>
                      </div>
                      {secondaryLabel && (
                        <div className="flex items-start gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#76CBB3] shrink-0 mt-0.5" />
                          <span className="text-[#657565]">
                            <strong>Secondary:</strong> {secondaryLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Checklist Bullet Points */}
                <ul className="space-y-1.5 my-auto">
                  {step.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-1.5 text-[11px] text-[#263B2D] leading-snug">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#173F35] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span className="font-semibold">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Step Footer Tag / Cue pill for Panels 2 & 3 */}
                {(step.stepNumber === 2 || step.stepNumber === 3) && (
                  <div className="pt-1 border-t border-[#D2D9C5]/80 text-[10px] font-bold text-[#173F35] leading-snug">
                    Cue: &ldquo;{step.coachingCue}&rdquo;
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* LARGE INTERACTIVE STEP PREVIEW MODAL */}
      {modalStep && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${exercise.name} Step 0${modalStep.stepNumber} Preview`}
          onClick={() => setModalStepNumber(null)}
          className="fixed inset-0 z-50 bg-[#0c1319]/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#173F35] text-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-white text-[#173F35] font-extrabold text-xs flex items-center justify-center shrink-0">
                  {modalStep.stepNumber}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E5E8CE]/85">
                    {exercise.name} · STEP 0{modalStep.stepNumber} OF 04
                  </p>
                  <h3 className="text-base sm:text-lg font-extrabold truncate">
                    {modalStep.headerTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalStepNumber(null)}
                aria-label="Close preview"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Visual Canvas (Dark Studio Side + Cream Guidance Side) */}
            <div className="grid grid-cols-1 md:grid-cols-12 bg-[#121820]">
              <div className="md:col-span-7 p-4 flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
                {modalStep.minioImg ? (
                  <SecureInstructionImage
                    mediaItem={modalStep.minioImg}
                    exerciseName={exercise.name}
                    stepNumber={modalStep.stepNumber}
                    stepTitle={modalStep.stepTitle}
                    className="w-full max-h-80 border-[#789575]/40"
                  />
                ) : CURATED_EXERCISE_STEP_ASSETS[exercise?.slug]?.stages?.[modalStep.stepNumber] ? (
                  <img
                    src={CURATED_EXERCISE_STEP_ASSETS[exercise.slug].stages[modalStep.stepNumber]}
                    alt={`${exercise.name} Step 0${modalStep.stepNumber}`}
                    className="w-full max-h-[340px] object-contain rounded-xl select-none"
                  />
                ) : (
                  <AnatomicalPerformerCanvas
                    exercise={exercise}
                    equipmentSlug={selectedEquipmentSlug}
                    phaseProgress={modalStep.phaseProgress}
                    activeIntensity={modalStep.intensity}
                    compact={false}
                    accentMode="emerald"
                    isDarkTheme={true}
                    motionDirection={modalStep.motionDirection}
                    showHud={false}
                  />
                )}
              </div>

              <div className="md:col-span-5 bg-[#EDF1DF] p-5 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-[#D2D9C5]">
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm font-medium text-[#263B2D] leading-relaxed">
                    {modalStep.instruction}
                  </p>

                  <ul className="space-y-1.5">
                    {modalStep.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#263B2D] font-semibold">
                        <span className="w-4 h-4 rounded-full bg-[#173F35] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#D2D9C5] text-xs font-bold text-[#173F35] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#18C978] mt-0.5" />
                    <span>Coaching Cue: &ldquo;{modalStep.coachingCue}&rdquo;</span>
                  </div>
                </div>

                {/* Muscle Legend */}
                <div className="space-y-1.5 pt-2 border-t border-[#D2D9C5] text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#18C978] shrink-0" />
                    <span className="font-bold text-[#173F35]">Primary: {primaryLabel}</span>
                  </div>
                  {secondaryLabel && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-[#76CBB3] shrink-0" />
                      <span className="font-semibold text-[#657565]">
                        Secondary: {secondaryLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer: 4-Step Progress + Previous / Next */}
            <div className="px-5 py-3 bg-white border-t border-[#D2D9C5] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {steps.map((s) => (
                  <button
                    key={s.stepNumber}
                    type="button"
                    onClick={() => setModalStepNumber(s.stepNumber)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      s.stepNumber === modalStep.stepNumber
                        ? 'bg-[#173F35] text-white'
                        : s.stepNumber < modalStep.stepNumber
                        ? 'bg-[#18C978]/20 text-[#173F35] border border-[#18C978]/40'
                        : 'bg-[#F1F2E8] text-[#657565] border border-[#D2D9C5]'
                    }`}
                  >
                    {s.stepNumber < modalStep.stepNumber && (
                      <CheckCircle2 className="w-3 h-3 text-[#18C978]" />
                    )}
                    <span>0{s.stepNumber}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setModalStepNumber((s) => (s <= 1 ? 4 : s - 1))
                  }
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#D2D9C5] bg-[#F1F2E8] hover:bg-[#E5E8CE] text-xs font-bold text-[#263B2D] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setModalStepNumber((s) => (s >= 4 ? 1 : s + 1))
                  }
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-xs font-bold text-white cursor-pointer"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
