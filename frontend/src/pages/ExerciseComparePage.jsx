import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MiniMuscleDiagram } from '../components/anatomy/MiniMuscleDiagram';
import { ExerciseVisualDemo } from '../components/exercises/ExerciseVisualDemo';
import { gymGuideApi } from '../services/api.service';
import {
  formatDifficultyLabel,
  getDifficultyBadgeClasses,
  formatExerciseType,
} from '../utils/formatters';

const POPULAR_COMPARISON_PAIRS = [
  {
    label: 'Barbell vs. Dumbbell Bench Press',
    first: 'barbell-bench-press',
    second: 'dumbbell-bench-press',
  },
  {
    label: 'Back Squat vs. Leg Press',
    first: 'barbell-back-squat',
    second: '45-degree-leg-press',
  },
  {
    label: 'Pull-Up vs. Lat Pulldown',
    first: 'pull-up',
    second: 'lat-pulldown',
  },
  {
    label: 'Deadlift vs. Romanian Deadlift',
    first: 'conventional-deadlift',
    second: 'romanian-deadlift',
  },
];

export default function ExerciseComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allExercises, setAllExercises] = useState([]);
  const [firstSlug, setFirstSlug] = useState(
    searchParams.get('first') || 'barbell-bench-press'
  );
  const [secondSlug, setSecondSlug] = useState(
    searchParams.get('second') || 'dumbbell-bench-press'
  );
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadExerciseCatalog() {
      try {
        const res = await gymGuideApi.getExercises({ limit: 80 });
        if (mounted) setAllExercises(res.exercises || []);
      } catch (err) {
        console.error('Failed to load exercise options for comparison:', err);
      }
    }
    loadExerciseCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const f = searchParams.get('first');
    const s = searchParams.get('second');
    if (f) setFirstSlug(f);
    if (s) setSecondSlug(s);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function runComparison() {
      setLoading(true);
      try {
        const data = await gymGuideApi.compareExercises(firstSlug, secondSlug);
        if (active) setComparison(data);
      } catch (err) {
        console.error('Comparison error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    runComparison();
    return () => {
      active = false;
    };
  }, [firstSlug, secondSlug]);

  const handleSelectPair = (f, s) => {
    setFirstSlug(f);
    setSecondSlug(s);
    setSearchParams({ first: f, second: s });
  };

  const firstEx = comparison?.first;
  const secondEx = comparison?.second;
  const summary = comparison?.comparisonSummary;

  const renderExerciseColumn = (ex, badgeLabel) => {
    if (!ex) return null;
    return (
      <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-5 space-y-4 flex flex-col shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#173F35] font-bold">
              {badgeLabel} • {ex.category}
            </span>
            <h2 className="text-xl font-extrabold font-display text-[#263B2D] mt-0.5">
              {ex.name}
            </h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDifficultyBadgeClasses(
              ex.difficulty
            )}`}
          >
            {formatDifficultyLabel(ex.difficulty)}
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-[#D2D9C5]">
          <ExerciseVisualDemo exercise={ex} size="card" />
        </div>

        <MiniMuscleDiagram
          primaryMuscles={ex.primaryMuscles}
          secondaryMuscles={ex.secondaryMuscles}
          showBothSides={true}
        />

        <div className="space-y-2 text-xs bg-[#E5E8CE] p-3.5 rounded-xl border border-[#D2D9C5]">
          <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-[#D2D9C5]">
            <span className="text-[#657565]">Primary Muscle:</span>
            <strong className="text-[#173F35] text-right">
              {(ex.primaryMuscles || []).map((m) => m.name).join(', ')}
            </strong>
          </div>
          <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-[#D2D9C5]">
            <span className="text-[#657565]">Secondary:</span>
            <strong className="text-[#263B2D] text-right">
              {(ex.secondaryMuscles || []).map((m) => m.name).join(', ') || 'Isolation'}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#D2D9C5]">
            <span className="text-[#657565]">Equipment:</span>
            <strong className="text-[#263B2D] text-right">
              {(ex.equipment || []).map((eq) => eq.name).join(', ')}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#657565]">Mechanics:</span>
            <strong className="text-[#263B2D]">
              {formatExerciseType(ex.exerciseType)} ({ex.recommendedSets} × {ex.recommendedReps})
            </strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#E5E8CE]/60 border border-[#D2D9C5]">
          <h3 className="text-xs font-bold text-[#173F35] mb-1">
            Movement Difference
          </h3>
          <p className="text-xs text-[#657565] leading-relaxed">
            {ex.movementDifferences}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#E5E8CE] border border-[#789575]/40">
          <h3 className="text-xs font-bold text-[#173F35] mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Advantages</span>
          </h3>
          <ul className="space-y-1.5">
            {(ex.advantages || []).map((adv, idx) => (
              <li key={idx} className="text-xs text-[#263B2D] flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#173F35] shrink-0 mt-1.5" />
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300/70">
          <h3 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Limitations</span>
          </h3>
          <ul className="space-y-1.5">
            {(ex.limitations || []).map((lim, idx) => (
              <li key={idx} className="text-xs text-amber-900/80 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-1">
          <Link
            to={`/exercises/${ex.slug}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-xs font-extrabold text-[#F1F2E8] transition-colors"
          >
            <span>Open {ex.name} Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="pb-4 border-b border-[#D2D9C5]">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173F35] mb-1">
          <GitCompare className="w-3.5 h-3.5 text-[#789575]" />
          <span>Side-by-Side Comparison</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#263B2D]">
          Compare Exercises
        </h1>
      </div>

      {/* Compact Selector Bar */}
      <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_COMPARISON_PAIRS.map((pair) => {
            const isCurrent = firstSlug === pair.first && secondSlug === pair.second;
            return (
              <button
                key={pair.label}
                type="button"
                onClick={() => handleSelectPair(pair.first, pair.second)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isCurrent
                    ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]'
                    : 'bg-[#E5E8CE] text-[#657565] hover:text-[#263B2D] border-[#D2D9C5]'
                }`}
              >
                {pair.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#D2D9C5]">
          <select
            aria-label="Exercise A"
            value={firstSlug}
            onChange={(e) => handleSelectPair(e.target.value, secondSlug)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] focus:border-[#789575] text-xs font-medium text-[#263B2D] focus:outline-none"
          >
            {allExercises.map((ex) => (
              <option key={`a-${ex.slug}`} value={ex.slug}>
                Exercise A: {ex.name} ({ex.category})
              </option>
            ))}
          </select>

          <select
            aria-label="Exercise B"
            value={secondSlug}
            onChange={(e) => handleSelectPair(firstSlug, e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] focus:border-[#789575] text-xs font-medium text-[#263B2D] focus:outline-none"
          >
            {allExercises.map((ex) => (
              <option key={`b-${ex.slug}`} value={ex.slug}>
                Exercise B: {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <div className="p-4 rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5] flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-[#263B2D] font-medium">
            <Sparkles className="w-4 h-4 text-[#173F35] shrink-0" />
            <span>
              {summary.mechanicsComparison} {summary.difficultyComparison}
            </span>
          </span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-96 rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5] animate-pulse" />
          <div className="h-96 rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5] animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {renderExerciseColumn(firstEx, 'Exercise A')}
          {renderExerciseColumn(secondEx, 'Exercise B')}
        </div>
      )}
    </div>
  );
}
