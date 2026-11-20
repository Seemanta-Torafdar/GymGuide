import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Dumbbell,
  Trash2,
  Plus,
  Minus,
  Activity,
} from 'lucide-react';
import { useGymGuide } from '../../context/GymGuideContext';

export function MyWorkoutDrawer() {
  const navigate = useNavigate();
  const {
    isWorkoutDrawerOpen,
    setIsWorkoutDrawerOpen,
    workoutItems,
    updateWorkoutItemSets,
    toggleCompletedSet,
    removeWorkoutExercise,
    clearWorkout,
  } = useGymGuide();

  if (!isWorkoutDrawerOpen) return null;

  const totalSets = workoutItems.reduce((sum, item) => sum + (item.sets || 3), 0);
  const completedSets = workoutItems.reduce(
    (sum, item) => sum + Math.min(item.completedSets || 0, item.sets || 3),
    0
  );

  const handleClose = () => setIsWorkoutDrawerOpen(false);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#173F35]/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-[#F1F2E8] border-l border-[#D2D9C5] h-full flex flex-col justify-between shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 bg-[#E5E8CE] border-b border-[#D2D9C5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#173F35] flex items-center justify-center text-[#F1F2E8]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display text-[#263B2D]">
                My Active Workout
              </h3>
              <p className="text-xs text-[#657565]">
                {workoutItems.length} Exercises • {completedSets}/{totalSets} Sets Completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-[#657565] hover:text-[#263B2D]"
            aria-label="Close workout drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {totalSets > 0 && (
          <div className="px-5 py-2.5 bg-[#F1F2E8] border-b border-[#D2D9C5]">
            <div className="flex items-center justify-between text-[11px] text-[#657565] mb-1">
              <span className="font-semibold">Session Progress</span>
              <span className="font-mono font-bold text-[#173F35]">
                {Math.round((completedSets / totalSets) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5E8CE] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#173F35] to-[#789575] transition-all duration-300"
                style={{ width: `${Math.round((completedSets / totalSets) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Drawer Body: Added Exercises */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {workoutItems.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E5E8CE] border border-[#D2D9C5] flex items-center justify-center mx-auto text-[#173F35]">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#263B2D]">Your Workout List is Empty</h4>
                <p className="text-xs text-[#657565] leading-relaxed max-w-xs mx-auto">
                  Select a muscle on the human anatomy map, learn the technique, and tap{' '}
                  <strong className="text-[#173F35]">&ldquo;+ Add to Workout&rdquo;</strong> on
                  any exercise to build your session.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/explorer');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-bold transition-colors"
                >
                  1. Select Body Part on Muscle Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/workout-plans');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] text-[#657565] hover:text-[#263B2D] text-xs font-semibold transition-colors"
                >
                  Or Load a Beginner Workout Plan
                </button>
              </div>
            </div>
          ) : (
            workoutItems.map((item, idx) => (
              <div
                key={item.slug}
                className="p-4 rounded-2xl bg-[#E5E8CE]/70 border border-[#D2D9C5] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#789575] font-bold">
                        #{idx + 1}
                      </span>
                      <Link
                        to={`/exercises/${item.slug}`}
                        onClick={handleClose}
                        className="text-sm font-bold text-[#263B2D] hover:text-[#173F35] transition-colors"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <p className="text-[11px] text-[#657565] mt-0.5">
                      {item.primaryMuscle} • {item.equipment} • Target: {item.reps}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeWorkoutExercise(item.slug)}
                    className="p-1.5 rounded-lg text-[#657565] hover:text-rose-700 hover:bg-[#F1F2E8]"
                    title="Remove from workout"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sets Adjuster & Interactive Set Checkboxes */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D2D9C5]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateWorkoutItemSets(item.slug, -1)}
                      className="w-6 h-6 rounded-md bg-[#F1F2E8] border border-[#D2D9C5] flex items-center justify-center text-xs text-[#657565] hover:text-[#263B2D]"
                      aria-label="Decrease sets"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold text-[#263B2D] px-1">
                      {item.sets} Sets
                    </span>
                    <button
                      type="button"
                      onClick={() => updateWorkoutItemSets(item.slug, 1)}
                      className="w-6 h-6 rounded-md bg-[#F1F2E8] border border-[#D2D9C5] flex items-center justify-center text-xs text-[#657565] hover:text-[#263B2D]"
                      aria-label="Increase sets"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Tap Set Bubbles to Track Live Progress */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: item.sets || 3 }).map((_, sIdx) => {
                      const setNum = sIdx + 1;
                      const isDone = (item.completedSets || 0) >= setNum;
                      return (
                        <button
                          key={setNum}
                          type="button"
                          onClick={() => toggleCompletedSet(item.slug, setNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all border ${
                            isDone
                              ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]'
                              : 'bg-[#F1F2E8] text-[#657565] border-[#D2D9C5] hover:border-[#789575]'
                          }`}
                          title={`Mark set ${setNum} completed`}
                        >
                          {isDone ? '✓' : setNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {workoutItems.length > 0 && (
          <div className="p-4 bg-[#E5E8CE] border-t border-[#D2D9C5] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearWorkout}
                className="px-3.5 py-2.5 rounded-xl bg-[#F1F2E8] hover:bg-rose-100 text-xs font-semibold text-[#657565] hover:text-rose-800 border border-[#D2D9C5] transition-colors"
              >
                Clear Session
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate('/exercises');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Exercises</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
