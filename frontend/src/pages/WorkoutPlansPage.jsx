import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
} from 'lucide-react';
import { gymGuideApi } from '../services/api.service';
import { formatDifficultyLabel, getDifficultyBadgeClasses } from '../utils/formatters';
import { WorkoutExerciseDirectory } from '../components/workout/WorkoutExerciseDirectory';

export default function WorkoutPlansPage() {
  const [plans, setPlans] = useState([]);
  const [selectedDaysFilter, setSelectedDaysFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadPlans() {
      setLoading(true);
      try {
        const data = await gymGuideApi.getWorkoutPlans();
        if (mounted) setPlans(data || []);
      } catch (err) {
        console.error('Failed to load workout plans:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPlans();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlans =
    selectedDaysFilter === 'ALL'
      ? plans
      : plans.filter((p) => String(p.daysPerWeek) === String(selectedDaysFilter));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Compact Header & Frequency Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D9C5]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
            Structured Weekly Splits
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#263B2D] mt-0.5">
            Beginner Workout Plans
          </h1>
          <p className="text-xs sm:text-sm text-[#657565] mt-0.5">
            Choose a routine that fits your weekly schedule and click any exercise to learn the form.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F1F2E8] p-1 rounded-xl border border-[#D2D9C5] self-start sm:self-auto">
          {[
            { id: 'ALL', label: 'All (6)' },
            { id: '3', label: '3 Days' },
            { id: '4', label: '4 Days' },
            { id: '6', label: '6 Days' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDaysFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDaysFilter === tab.id
                  ? 'bg-[#173F35] text-[#F1F2E8]'
                  : 'text-[#657565] hover:text-[#263B2D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minimalist Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-52 rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => (
            <Link
              key={plan.id}
              to={`/workout-plans/${plan.slug}`}
              className="group flex flex-col justify-between bg-[#F1F2E8] hover:border-[#789575] border border-[#D2D9C5] rounded-2xl p-5 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#173F35] text-[#F1F2E8] text-xs font-bold">
                      {plan.daysPerWeek} Days / Week
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyBadgeClasses(
                        plan.difficulty
                      )}`}
                    >
                      {formatDifficultyLabel(plan.difficulty)}
                    </span>
                  </div>
                  <span className="text-xs text-[#657565] flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#173F35]" />
                    {plan.sessionDurationMins}m
                  </span>
                </div>

                <h2 className="text-xl font-extrabold font-display text-[#263B2D] group-hover:text-[#173F35] transition-colors">
                  {plan.name}
                </h2>
                <p className="text-xs font-semibold text-[#789575] mt-0.5">
                  {plan.subtitle}
                </p>
                <p className="text-xs text-[#657565] mt-2 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[#D2D9C5] flex items-center justify-between text-xs">
                <span className="text-[#657565]">
                  {plan.days?.length || plan.daysPerWeek} Workout Days • {plan.goal}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#173F35] group-hover:text-[#789575]">
                  <span>Open Routine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Filterable 69-Exercise Directory by Body Part & Equipment */}
      <WorkoutExerciseDirectory />
    </div>
  );
}
