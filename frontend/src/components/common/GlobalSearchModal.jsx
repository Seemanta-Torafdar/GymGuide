import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Dumbbell,
  Activity,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { gymGuideApi } from '../../services/api.service';
import { useGymGuide } from '../../context/GymGuideContext';
import { formatDifficultyLabel } from '../../utils/formatters';

const QUICK_SEARCH_PRESETS = [
  'Chest',
  'Dumbbell',
  'Bench Press',
  'Latissimus Dorsi',
  'Barbell',
  'Quadriceps',
  'Glutes',
  'Biceps',
];

export function GlobalSearchModal() {
  const navigate = useNavigate();
  const { isSearchModalOpen, setIsSearchModalOpen, selectMuscle } = useGymGuide();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 220);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  useEffect(() => {
    if (!isSearchModalOpen) return;
    let active = true;
    async function runSearch() {
      setLoading(true);
      try {
        const data = await gymGuideApi.search(debouncedQuery);
        if (active) setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    runSearch();
    return () => {
      active = false;
    };
  }, [debouncedQuery, isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const handleClose = () => {
    setIsSearchModalOpen(false);
  };

  const handleSelectExercise = (slug) => {
    handleClose();
    navigate(`/exercises/${slug}`);
  };

  const handleSelectMuscle = (muscle) => {
    handleClose();
    selectMuscle(muscle.slug, muscle.bodySide);
    navigate('/explorer');
  };

  const handleSelectEquipment = (eqSlug) => {
    handleClose();
    navigate(`/exercises?equipment=${eqSlug}`);
  };

  const handleSelectPlan = (planSlug) => {
    handleClose();
    navigate(`/workout-plans/${planSlug}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#173F35]/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#E5E8CE] border-b border-[#D2D9C5]">
          <Search className="w-5 h-5 text-[#173F35] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search exercises ("Bench Press"), muscles ("Chest"), or equipment ("Dumbbell")...'
            className="w-full bg-transparent text-sm sm:text-base text-[#263B2D] placeholder-[#657565]/70 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-[#657565] hover:text-[#263B2D] px-2 py-1 font-semibold"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-[#F1F2E8] border border-[#D2D9C5] text-[#657565] hover:text-[#263B2D]"
            aria-label="Close search modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search Chips */}
        <div className="px-4 py-2.5 bg-[#F1F2E8] border-b border-[#D2D9C5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#657565] shrink-0">
            Quick Try:
          </span>
          {QUICK_SEARCH_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setQuery(preset)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors border ${
                query.toLowerCase() === preset.toLowerCase()
                  ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]'
                  : 'bg-[#E5E8CE] text-[#657565] hover:text-[#263B2D] border-[#D2D9C5]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Search Results Body */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-5">
          {loading && !results ? (
            <div className="py-10 text-center text-sm text-[#657565]">
              Searching GymGuide database...
            </div>
          ) : results ? (
            <>
              {/* Matched Anatomical Muscles */}
              {results.muscles?.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#173F35] mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Anatomical Muscles ({results.muscles.length})</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.muscles.slice(0, 4).map((muscle) => (
                      <button
                        key={muscle.id}
                        type="button"
                        onClick={() => handleSelectMuscle(muscle)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#E5E8CE]/70 hover:bg-[#E5E8CE] border border-[#D2D9C5] hover:border-[#789575] text-left transition-all"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#263B2D]">{muscle.name}</p>
                          <p className="text-xs text-[#657565] line-clamp-1">
                            {muscle.scientificName}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#173F35] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Exercises */}
              {results.exercises?.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#173F35] mb-2 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Matching Exercises ({results.exercises.length})</span>
                  </h5>
                  <div className="space-y-2">
                    {results.exercises.slice(0, 8).map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleSelectExercise(ex.slug)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#E5E8CE]/70 hover:bg-[#E5E8CE] border border-[#D2D9C5] hover:border-[#789575] text-left transition-all"
                      >
                        <div className="pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#263B2D]">{ex.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-[#173F35] text-[#F1F2E8] font-medium">
                              {ex.category}
                            </span>
                            <span className="text-[11px] text-[#657565]">
                              • {formatDifficultyLabel(ex.difficulty)}
                            </span>
                          </div>
                          <p className="text-xs text-[#657565] mt-0.5 line-clamp-1">
                            Target:{' '}
                            {(ex.primaryMuscles || []).map((m) => m.name).join(', ')} |
                            Equipment:{' '}
                            {(ex.equipment || []).map((eq) => eq.name).join(', ')}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#173F35] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Equipment */}
              {results.equipment?.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#173F35] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Equipment Filter ({results.equipment.length})</span>
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {results.equipment.map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleSelectEquipment(eq.slug)}
                        className="px-3 py-1.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-xs font-semibold text-[#F1F2E8] transition-colors"
                      >
                        Browse {eq.name} Exercises →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Workout Plans */}
              {results.workoutPlans?.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#173F35] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Workout Routines ({results.workoutPlans.length})</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.workoutPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleSelectPlan(plan.slug)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#E5E8CE]/70 hover:bg-[#E5E8CE] border border-[#D2D9C5] text-left"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#263B2D]">{plan.name}</p>
                          <p className="text-xs text-[#657565]">
                            {plan.daysPerWeek} Days/Week • {plan.sessionDurationMins} mins
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#173F35]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.totalMatches === 0 && (
                <div className="py-10 text-center">
                  <p className="text-base font-bold text-[#263B2D]">
                    No matches found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-[#657565] mt-1">
                    Try searching for a muscle group like &ldquo;Chest&rdquo;, equipment like
                    &ldquo;Dumbbell&rdquo;, or an exercise like &ldquo;Squat&rdquo;.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#E5E8CE] border-t border-[#D2D9C5] flex items-center justify-between text-xs text-[#657565]">
          <span>Press ESC to close</span>
          <button
            type="button"
            onClick={() => {
              handleClose();
              navigate(`/exercises?q=${encodeURIComponent(query)}`);
            }}
            className="text-[#173F35] hover:text-[#789575] hover:underline font-bold"
          >
            View all results in Exercise Library →
          </button>
        </div>
      </div>
    </div>
  );
}
