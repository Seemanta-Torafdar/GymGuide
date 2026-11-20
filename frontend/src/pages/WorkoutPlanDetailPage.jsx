import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Check,
  ClipboardList,
} from 'lucide-react';
import { gymGuideApi } from '../services/api.service';
import { useGymGuide } from '../context/GymGuideContext';
import {
  formatDifficultyLabel,
  getDifficultyBadgeClasses,
  formatExerciseType,
} from '../utils/formatters';

export default function WorkoutPlanDetailPage() {
  const { id } = useParams();
  const {
    isExerciseInWorkout,
    toggleWorkoutExercise,
    loadPlanDayIntoWorkout,
  } = useGymGuide();

  const [plan, setPlan] = useState(null);
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [showAllDaysExpanded, setShowAllDaysExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadPlan() {
      setLoading(true);
      setError(null);
      try {
        const data = await gymGuideApi.getWorkoutPlanById(id);
        if (mounted) {
          setPlan(data);
          if (data?.days?.length > 0) {
            setActiveDayNumber(data.days[0].dayNumber);
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Workout plan not found.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPlan();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-5 animate-pulse">
        <div className="h-8 w-64 bg-[#F1F2E8] rounded-xl" />
        <div className="h-80 w-full bg-[#F1F2E8] rounded-2xl" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#263B2D] mb-2">Workout Plan Not Found</h2>
          <p className="text-sm text-[#657565] mb-6">{error}</p>
          <Link
            to="/workout-plans"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-extrabold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workout Plans</span>
          </Link>
        </div>
      </div>
    );
  }

  const visibleDays = showAllDaysExpanded
    ? plan.days || []
    : (plan.days || []).filter((d) => d.dayNumber === activeDayNumber);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-2 text-xs text-[#657565]">
        <Link
          to="/workout-plans"
          className="inline-flex items-center gap-1.5 text-[#263B2D] hover:text-[#173F35] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Workout Plans</span>
        </Link>
        <span>/</span>
        <span className="text-[#173F35] font-semibold">{plan.name}</span>
      </div>

      <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span className="px-2.5 py-0.5 rounded-full bg-[#173F35] text-[#F1F2E8] text-xs font-bold">
            {plan.daysPerWeek} Days / Week
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDifficultyBadgeClasses(
              plan.difficulty
            )}`}
          >
            {formatDifficultyLabel(plan.difficulty)}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E5E8CE] text-[#657565] border border-[#D2D9C5] text-xs font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#173F35]" />
            {plan.sessionDurationMins} mins
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#263B2D]">
          {plan.name}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#789575] mt-0.5">
          {plan.subtitle}
        </p>
        <p className="text-xs sm:text-sm text-[#657565] mt-2 max-w-3xl leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowAllDaysExpanded(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            showAllDaysExpanded
              ? 'bg-[#173F35] text-[#F1F2E8]'
              : 'bg-[#F1F2E8] text-[#657565] hover:text-[#263B2D] border border-[#D2D9C5]'
          }`}
        >
          All {plan.days?.length} Days
        </button>
        {(plan.days || []).map((day) => (
          <button
            key={day.dayNumber}
            type="button"
            onClick={() => {
              setShowAllDaysExpanded(false);
              setActiveDayNumber(day.dayNumber);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !showAllDaysExpanded && activeDayNumber === day.dayNumber
                ? 'bg-[#173F35] text-[#F1F2E8]'
                : 'bg-[#F1F2E8] text-[#657565] hover:text-[#263B2D] border border-[#D2D9C5]'
            }`}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Workout Days */}
      <div className="space-y-5">
        {visibleDays.map((day) => (
          <div
            key={day.id || day.dayNumber}
            className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-4 sm:p-5 bg-[#E5E8CE]/60 border-b border-[#D2D9C5] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#173F35] font-bold mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Day {day.dayNumber}</span>
                  <span>•</span>
                  <span>{day.focusArea}</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold font-display text-[#263B2D]">
                  {day.dayLabel}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {(day.targetMuscles || []).map((muscleName) => (
                    <span
                      key={muscleName}
                      className="px-2 py-0.5 rounded bg-[#F1F2E8] border border-[#D2D9C5] text-[11px] font-semibold text-[#173F35]"
                    >
                      {muscleName}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadPlanDayIntoWorkout(day)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-extrabold transition-all shrink-0 self-start md:self-auto"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Load Day {day.dayNumber}</span>
              </button>
            </div>

            <div className="divide-y divide-[#D2D9C5]">
              {(day.exercises || []).map((item) => {
                const ex = item.exercise;
                if (!ex) return null;
                const inWorkout = isExerciseInWorkout(ex.slug);

                return (
                  <div
                    key={item.id || item.orderIndex}
                    className="p-4 hover:bg-[#E5E8CE]/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#E5E8CE] border border-[#D2D9C5] text-[#173F35] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {item.orderIndex}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/exercises/${ex.slug}`}
                            className="text-sm sm:text-base font-bold text-[#263B2D] hover:text-[#173F35] transition-colors"
                          >
                            {ex.name}
                          </Link>
                          <span className="px-2 py-0.5 rounded bg-[#E5E8CE] text-[#173F35] border border-[#D2D9C5] text-[10px] font-bold">
                            {ex.category}
                          </span>
                          <span className="text-[11px] text-[#657565] font-mono">
                            {formatExerciseType(ex.exerciseType)}
                          </span>
                        </div>
                        <p className="text-xs text-[#657565] mt-0.5">
                          {(ex.primaryMuscles || []).map((m) => m.name).join(', ') ||
                            ex.category}{' '}
                          • {(ex.equipment || []).map((eq) => eq.name).join(', ') || 'Bodyweight'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-[#E5E8CE] border border-[#D2D9C5] text-xs font-mono text-[#263B2D]">
                        {item.sets} × <strong className="text-[#173F35]">{item.reps}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#E5E8CE] border border-[#D2D9C5] text-xs font-mono text-[#657565]">
                        Rest {item.restGuidance}
                      </span>

                      <Link
                        to={`/exercises/${ex.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E5E8CE] hover:bg-[#789575] text-[#263B2D] hover:text-white border border-[#D2D9C5] text-xs font-bold transition-colors"
                      >
                        <span>Form</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleWorkoutExercise(ex)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          inWorkout
                            ? 'bg-[#789575] text-white'
                            : 'bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8]'
                        }`}
                      >
                        {inWorkout ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
