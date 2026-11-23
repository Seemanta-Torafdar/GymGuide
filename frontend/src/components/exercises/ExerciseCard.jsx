import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  Dumbbell,
} from 'lucide-react';
import { ExerciseVisualDemo } from './ExerciseVisualDemo';
import {
  formatDifficultyLabel,
  getEquipmentDisplayLabel,
} from '../../utils/formatters';
import { useGymGuide } from '../../context/GymGuideContext';

/**
 * Minimalist Cream Exercise Card (#F1F2E8) matching the reference UI:
 * - Clean light cream surface (#F1F2E8) with #D2D9C5 border
 * - Top-right Heart favorite icon
 * - Clean exercise illustration on light cream background
 * - Exercise title in #263B2D
 * - Equipment pill chips in #E5E8CE
 * - Soft sage difficulty badge on bottom-left + arrow on bottom-right
 */
export function ExerciseCard({ exercise, onQuickPreview, onPerformInStudio }) {
  const { isExerciseSaved, toggleSavedExercise } = useGymGuide();

  if (!exercise) return null;

  const isSaved = isExerciseSaved(exercise.slug);

  const equipmentList =
    exercise.equipment && exercise.equipment.length > 0
      ? Array.from(
          new Set(
            exercise.equipment.map((eq) =>
              getEquipmentDisplayLabel(eq.slug || eq.name || 'bodyweight')
            )
          )
        )
      : ['Bodyweight'];

  return (
    <article className="group relative flex flex-col bg-[#F1F2E8] border border-[#D2D9C5] hover:border-[#789575] rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md">
      {/* Top Right Favorite Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSavedExercise(exercise.slug);
        }}
        aria-label={
          isSaved
            ? `Remove ${exercise.name} from saved exercises`
            : `Save ${exercise.name}`
        }
        title={isSaved ? 'Saved in Favorites' : 'Save exercise'}
        className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isSaved
            ? 'bg-[#173F35] text-white'
            : 'bg-[#F1F2E8]/90 text-[#263B2D] hover:bg-[#789575] hover:text-white'
        }`}
      >
        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>

      {/* Clean Light-Cream Illustration Area */}
      <Link to={`/exercises/${exercise.slug}`} className="block">
        <ExerciseVisualDemo exercise={exercise} size="card" />
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 px-4 pb-4 pt-2">
        <Link
          to={`/exercises/${exercise.slug}`}
          className="text-base font-extrabold font-display text-[#263B2D] group-hover:text-[#173F35] transition-colors line-clamp-1"
        >
          {exercise.name}
        </Link>

        {/* Equipment Pills Row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-3">
          {equipmentList.slice(0, 3).map((eqName) => (
            <span
              key={eqName}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-semibold text-[#263B2D]"
            >
              <Dumbbell className="w-2.5 h-2.5 text-[#657565]" />
              <span>{eqName}</span>
            </span>
          ))}
        </div>

        {/* Bottom Row: Difficulty Pill (Left) + Arrow Action (Right) */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="px-3 py-1 rounded-full bg-[#D3E3CC] text-[#173F35] text-xs font-bold">
            {formatDifficultyLabel(exercise.difficulty)}
          </span>

          <div className="flex items-center gap-2">
            {onPerformInStudio && (
              <button
                type="button"
                onClick={() => onPerformInStudio(exercise)}
                className="px-2.5 py-1 rounded-full bg-[#173F35] hover:bg-[#789575] text-white text-[11px] font-bold transition-colors"
              >
                Perform
              </button>
            )}
            {onQuickPreview && (
              <button
                type="button"
                onClick={() => onQuickPreview(exercise)}
                className="text-[11px] font-semibold text-[#657565] hover:text-[#173F35] transition-colors"
              >
                Preview
              </button>
            )}
            <Link
              to={`/exercises/${exercise.slug}`}
              aria-label={`View ${exercise.name} details`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#263B2D] group-hover:bg-[#173F35] group-hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
