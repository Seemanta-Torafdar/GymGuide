import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Dumbbell,
  Target,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Repeat,
  Layers,
  GitCompare,
  Compass,
  Plus,
  Check,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { ExerciseVisualDemo } from '../components/exercises/ExerciseVisualDemo';
import { MiniMuscleDiagram } from '../components/anatomy/MiniMuscleDiagram';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { gymGuideApi } from '../services/api.service';
import { useGymGuide } from '../context/GymGuideContext';
import {
  formatDifficultyLabel,
  getDifficultyBadgeClasses,
  formatExerciseType,
  getEquipmentDisplayLabel,
  getChestSubRegionLabel,
} from '../utils/formatters';

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selectMuscle,
    isExerciseInWorkout,
    toggleWorkoutExercise,
    isExerciseSaved,
    toggleSavedExercise,
  } = useGymGuide();

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadExercise() {
      setLoading(true);
      setError(null);
      try {
        const data = await gymGuideApi.getExerciseById(id);
        if (mounted) setExercise(data);
      } catch (err) {
        if (mounted) setError(err.message || 'Exercise not found.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadExercise();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[#F1F2E8] border border-[#D2D9C5] rounded-xl" />
        <div className="h-80 w-full bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl" />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#263B2D] mb-2">
            Exercise Not Found
          </h2>
          <p className="text-sm text-[#657565] mb-6">{error}</p>
          <Link
            to="/exercises"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </Link>
        </div>
      </div>
    );
  }

  const inWorkout = isExerciseInWorkout(exercise.slug);
  const isSaved = isExerciseSaved(exercise.slug);
  const equipmentLabel = getEquipmentDisplayLabel(
    exercise.equipment?.[0]?.slug || exercise.equipment?.[0]?.name || 'bodyweight'
  );
  const subRegionLabel =
    exercise.category === 'Chest' ? getChestSubRegionLabel(exercise) : null;
  const firstSimilarSlug =
    exercise.similarExercises?.[0]?.slug ||
    (exercise.slug === 'barbell-bench-press'
      ? 'dumbbell-bench-press'
      : 'barbell-bench-press');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#657565]">
          <Link
            to="/exercises"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F2E8] hover:bg-[#789575] text-[#263B2D] hover:text-white border border-[#D2D9C5] font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Results</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{exercise.category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#173F35] font-bold">{exercise.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSavedExercise(exercise.slug)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              isSaved
                ? 'bg-[#789575] text-white border-[#789575]'
                : 'bg-[#F1F2E8] text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save Exercise'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleWorkoutExercise(exercise)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              inWorkout
                ? 'bg-[#789575] text-white'
                : 'bg-[#173F35] hover:bg-[#789575] text-white'
            }`}
          >
            {inWorkout ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added to Workout</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add to Workout</span>
              </>
            )}
          </button>

          <Link
            to={`/compare?first=${exercise.slug}&second=${firstSimilarSlug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F2E8] hover:bg-[#789575] text-xs font-bold text-[#263B2D] hover:text-white border border-[#D2D9C5] transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#173F35] text-white text-xs font-bold">
                {equipmentLabel}
              </span>
              {subRegionLabel && (
                <span className="px-3 py-1 rounded-full bg-[#E5E8CE] text-[#263B2D] border border-[#D2D9C5] text-xs font-bold">
                  {subRegionLabel}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyBadgeClasses(
                  exercise.difficulty
                )}`}
              >
                {formatDifficultyLabel(exercise.difficulty)}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#E5E8CE] text-[#657565] border border-[#D2D9C5] text-xs font-mono">
                {formatExerciseType(exercise.exerciseType)} • {exercise.forceType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-[#263B2D]">
              {exercise.name}
            </h1>
            <p className="text-sm sm:text-base text-[#657565] mt-2 leading-relaxed">
              {exercise.description}
            </p>

            <div className="mt-5">
              <ExerciseVisualDemo exercise={exercise} size="hero" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="p-3.5 rounded-xl bg-white border border-[#D2D9C5]">
                <div className="flex items-center gap-1.5 text-xs text-[#657565] mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Recommended Sets</span>
                </div>
                <p className="text-base font-extrabold text-[#263B2D]">
                  {exercise.recommendedSets}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#D2D9C5]">
                <div className="flex items-center gap-1.5 text-xs text-[#657565] mb-1">
                  <Repeat className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Repetitions</span>
                </div>
                <p className="text-base font-extrabold text-[#173F35]">
                  {exercise.recommendedReps}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#D2D9C5]">
                <div className="flex items-center gap-1.5 text-xs text-[#657565] mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Rest Guidance</span>
                </div>
                <p className="text-base font-extrabold text-[#263B2D]">
                  {exercise.restDuration}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#D2D9C5]">
                <div className="flex items-center gap-1.5 text-xs text-[#657565] mb-1">
                  <Dumbbell className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Equipment</span>
                </div>
                <p className="text-sm font-bold text-[#263B2D] line-clamp-1">
                  {(exercise.equipment || []).map((eq) => eq.name).join(', ') ||
                    'Bodyweight'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
                Correct Movement Technique
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#263B2D] mt-0.5">
                Starting Position & Exercise Instructions
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173F35] mb-1">
                <Compass className="w-4 h-4" />
                <span>Starting Position</span>
              </div>
              <p className="text-xs sm:text-sm text-[#263B2D] leading-relaxed">
                {exercise.startingPosition}
              </p>
            </div>

            <div className="space-y-3">
              {(exercise.instructions || []).map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-[#D2D9C5]"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#173F35] text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#263B2D]">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#657565] leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.coachingCue && (
                      <p className="text-xs text-[#173F35] font-bold pt-0.5">
                        Coaching Cue: &ldquo;{step.coachingCue}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#263B2D] font-bold text-base mb-3">
                <AlertTriangle className="w-5 h-5 text-[#789575]" />
                <h2>Common Mistakes</h2>
              </div>
              <ul className="space-y-2.5">
                {(exercise.commonMistakes || []).map((mistake, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-[#657565] leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#789575] shrink-0 mt-2" />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#173F35] font-bold text-base mb-3">
                <ShieldCheck className="w-5 h-5" />
                <h2>Safety Guidance</h2>
              </div>
              <ul className="space-y-2.5">
                {(exercise.safetyTips || []).map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-[#657565] leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#173F35] shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#173F35]">
                  Anatomical Target
                </span>
                <h2 className="text-lg font-bold text-[#263B2D]">
                  Muscles Worked
                </h2>
              </div>
              <Target className="w-5 h-5 text-[#173F35]" />
            </div>

            <MiniMuscleDiagram
              primaryMuscles={exercise.primaryMuscles}
              secondaryMuscles={exercise.secondaryMuscles}
              showBothSides={true}
            />

            <div className="mt-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
                Primary Muscle
              </h3>
              {(exercise.primaryMuscles || []).map((pm) => (
                <button
                  key={pm.slug}
                  type="button"
                  onClick={() => {
                    selectMuscle(pm.slug, pm.bodySide, exercise.category);
                    navigate('/exercises');
                  }}
                  className="w-full p-3 rounded-xl bg-white hover:bg-[#E5E8CE] border border-[#D2D9C5] text-left transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#263B2D]">
                    <span>
                      {pm.name}
                      {subRegionLabel ? ` (${subRegionLabel})` : ''}
                    </span>
                    <span className="text-[#173F35] font-mono">
                      {pm.activationPercent || 95}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#657565] mt-0.5">
                    {pm.scientificName}
                  </p>
                  <div className="mt-2 w-full h-1.5 rounded-full bg-[#E5E8CE] overflow-hidden">
                    <div
                      className="h-full bg-[#173F35]"
                      style={{ width: `${pm.activationPercent || 95}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>

            {exercise.secondaryMuscles?.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-[#D2D9C5] space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#657565]">
                  Secondary Muscles
                </h3>
                {exercise.secondaryMuscles.map((sm) => (
                  <div
                    key={sm.slug}
                    className="p-2.5 rounded-xl bg-white border border-[#D2D9C5]"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#263B2D]">
                      <span>{sm.name}</span>
                      <span className="text-[#657565] font-mono text-[11px]">
                        {sm.activationPercent || 60}%
                      </span>
                    </div>
                    <div className="mt-1.5 w-full h-1 rounded-full bg-[#E5E8CE] overflow-hidden">
                      <div
                        className="h-full bg-[#789575]"
                        style={{ width: `${sm.activationPercent || 60}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {exercise.similarExercises?.length > 0 && (
        <section className="pt-6 border-t border-[#D2D9C5]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
                Related Movements
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#263B2D] mt-0.5">
                Similar {exercise.category} Exercises
              </h2>
            </div>
            <Link
              to="/exercises"
              className="text-xs font-bold text-[#173F35] hover:text-[#789575]"
            >
              Back to All {exercise.category} Results →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {exercise.similarExercises.map((sim) => (
              <ExerciseCard key={sim.id} exercise={sim} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
