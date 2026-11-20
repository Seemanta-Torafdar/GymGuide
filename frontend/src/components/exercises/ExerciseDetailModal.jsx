import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  Compass,
} from 'lucide-react';
import { ExerciseVisualDemo } from './ExerciseVisualDemo';
import {
  formatDifficultyLabel,
  getDifficultyBadgeClasses,
  getEquipmentDisplayLabel,
  getChestSubRegionLabel,
} from '../../utils/formatters';
import { useGymGuide } from '../../context/GymGuideContext';

export function ExerciseDetailModal({ exercise, onClose }) {
  const { isExerciseSaved, toggleSavedExercise } = useGymGuide();

  if (!exercise) return null;

  const isSaved = isExerciseSaved(exercise.slug);
  const equipmentLabel = getEquipmentDisplayLabel(
    exercise.equipment?.[0]?.slug || exercise.equipment?.[0]?.name || 'bodyweight'
  );
  const primaryLabel =
    exercise.category === 'Chest'
      ? `Chest — ${getChestSubRegionLabel(exercise)} (Pectoralis Major)`
      : (exercise.primaryMuscles || []).map((m) => m.name).join(', ') ||
        exercise.category;
  const secondaryLabel =
    (exercise.secondaryMuscles || []).map((m) => m.name).join(', ') ||
    'Core & Joint Stabilizers';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#173F35]/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[#E5E8CE] border-b border-[#D2D9C5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#789575] text-white text-xs font-bold">
              {equipmentLabel}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDifficultyBadgeClasses(
                exercise.difficulty
              )}`}
            >
              {formatDifficultyLabel(exercise.difficulty)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSavedExercise(exercise.slug)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                isSaved
                  ? 'bg-[#173F35] text-white border-[#173F35]'
                  : 'bg-[#F1F2E8] text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close exercise modal"
              className="p-2 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-[#657565] hover:text-[#263B2D]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold font-display text-[#263B2D]">
              {exercise.name}
            </h2>
            <p className="text-sm text-[#657565] mt-1 leading-relaxed">
              {exercise.description}
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#D2D9C5]">
            <ExerciseVisualDemo exercise={exercise} size="hero" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#E5E8CE]/60 border border-[#D2D9C5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#173F35]">
                Primary Muscle
              </span>
              <p className="text-sm font-bold text-[#263B2D] mt-0.5">{primaryLabel}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#E5E8CE]/60 border border-[#D2D9C5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#657565]">
                Secondary Muscles
              </span>
              <p className="text-sm font-semibold text-[#263B2D] mt-0.5">
                {secondaryLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#D2D9C5] text-center">
              <span className="text-[11px] text-[#657565] block">Sets</span>
              <strong className="text-sm font-bold text-[#263B2D]">
                {exercise.recommendedSets}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#D2D9C5] text-center">
              <span className="text-[11px] text-[#657565] block">Reps</span>
              <strong className="text-sm font-bold text-[#173F35]">
                {exercise.recommendedReps}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#D2D9C5] text-center">
              <span className="text-[11px] text-[#657565] block">Rest</span>
              <strong className="text-sm font-bold text-[#263B2D]">
                {exercise.restDuration}
              </strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#173F35] mb-1">
              <Compass className="w-4 h-4" />
              <span>Starting Position</span>
            </div>
            <p className="text-xs sm:text-sm text-[#263B2D] leading-relaxed">
              {exercise.startingPosition}
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-[#263B2D] mb-2.5">
              Step-by-Step Instructions
            </h3>
            <div className="space-y-2.5">
              {(exercise.instructions || []).map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#D2D9C5]"
                >
                  <span className="w-6 h-6 rounded-full bg-[#173F35] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {step.stepNumber}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#263B2D]">{step.title}</p>
                    <p className="text-xs sm:text-sm text-[#657565] mt-0.5 leading-relaxed">
                      {step.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#D2D9C5]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#263B2D] mb-2">
                <AlertTriangle className="w-4 h-4 text-[#789575]" />
                <span>Common Mistakes</span>
              </div>
              <ul className="space-y-1.5">
                {(exercise.commonMistakes || []).map((m, i) => (
                  <li key={i} className="text-xs text-[#657565] flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#789575] shrink-0 mt-1.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D2D9C5]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#173F35] mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Safety Tips</span>
              </div>
              <ul className="space-y-1.5">
                {(exercise.safetyTips || []).map((t, i) => (
                  <li key={i} className="text-xs text-[#657565] flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#173F35] shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#E5E8CE] border-t border-[#D2D9C5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-xs font-bold text-[#263B2D] hover:bg-white"
          >
            Close Preview
          </button>

          <Link
            to={`/exercises/${exercise.slug}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold transition-colors"
          >
            <span>Open Full Details Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
