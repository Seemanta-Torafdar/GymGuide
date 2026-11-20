import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Check,
  X,
  RotateCcw,
  Dumbbell,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { SelectedMuscleCard } from '../components/anatomy/SelectedMuscleCard';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { ExerciseDetailModal } from '../components/exercises/ExerciseDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { gymGuideApi } from '../services/api.service';
import {
  useGymGuide,
  DEFAULT_PRESELECTED_EQUIPMENT,
} from '../context/GymGuideContext';
import { DISCOVERY_EQUIPMENT_FILTERS } from '../utils/formatters';

export default function ExerciseLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    discoveryFilters,
    setDiscoveryFilters,
    savedExerciseSlugs,
  } = useGymGuide();

  const [quickPreviewExercise, setQuickPreviewExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlCat = searchParams.get('category');
    const urlMuscle = searchParams.get('muscle');
    const urlEq = searchParams.get('equipment');
    const urlQ = searchParams.get('q');
    const urlSaved = searchParams.get('saved');

    if (urlCat || urlMuscle || urlEq || urlQ || urlSaved) {
      setDiscoveryFilters((prev) => ({
        ...prev,
        category: urlCat
          ? urlCat.charAt(0).toUpperCase() + urlCat.slice(1)
          : urlMuscle
          ? urlMuscle.charAt(0).toUpperCase() + urlMuscle.slice(1)
          : prev.category,
        equipment: urlEq
          ? urlEq.split(',').filter(Boolean)
          : prev.equipment.length > 0
          ? prev.equipment
          : DEFAULT_PRESELECTED_EQUIPMENT,
        searchQuery: urlQ !== null ? urlQ : prev.searchQuery,
        savedOnly: urlSaved === 'true' ? true : prev.savedOnly,
      }));
    }
  }, [searchParams, setDiscoveryFilters]);

  const debouncedSearch = useDebounce(discoveryFilters.searchQuery, 200);

  useEffect(() => {
    let active = true;
    async function fetchDiscoveryExercises() {
      setLoading(true);
      setError(null);
      try {
        const eqParam =
          discoveryFilters.equipment.length > 0
            ? discoveryFilters.equipment.join(',')
            : 'none';

        const params = {
          limit: 80,
          category: discoveryFilters.category || 'Chest',
          equipment: eqParam,
          sort: discoveryFilters.sortBy || 'popular',
        };

        if (discoveryFilters.subRegion && discoveryFilters.subRegion !== 'ALL') {
          params.subRegion = discoveryFilters.subRegion;
        }
        if (discoveryFilters.difficulty && discoveryFilters.difficulty !== 'ALL') {
          params.difficulty = discoveryFilters.difficulty;
        }
        if (debouncedSearch.trim()) {
          params.q = debouncedSearch.trim();
        }

        const res = await gymGuideApi.getExercises(params);
        if (active) {
          setExercises(res.exercises || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load exercises.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDiscoveryExercises();
    return () => {
      active = false;
    };
  }, [
    discoveryFilters.category,
    discoveryFilters.equipment,
    discoveryFilters.subRegion,
    discoveryFilters.difficulty,
    discoveryFilters.sortBy,
    debouncedSearch,
  ]);

  const visibleExercises = useMemo(() => {
    if (!discoveryFilters.savedOnly) return exercises;
    return exercises.filter((ex) => savedExerciseSlugs.includes(ex.slug));
  }, [exercises, discoveryFilters.savedOnly, savedExerciseSlugs]);

  const handleToggleEquipment = (eqSlug) => {
    setDiscoveryFilters((prev) => {
      const exists = prev.equipment.includes(eqSlug);
      const nextEq = exists
        ? prev.equipment.filter((item) => item !== eqSlug)
        : [...prev.equipment, eqSlug];
      return { ...prev, equipment: nextEq };
    });
  };

  const handleSelectAllEquipment = () => {
    setDiscoveryFilters((prev) => ({
      ...prev,
      equipment: DEFAULT_PRESELECTED_EQUIPMENT,
    }));
  };

  const handleClearAllEquipment = () => {
    setDiscoveryFilters((prev) => ({
      ...prev,
      equipment: [],
    }));
  };

  const handleResetAllFilters = () => {
    setDiscoveryFilters({
      category: 'Chest',
      muscleSlug: 'chest',
      subRegion: 'ALL',
      equipment: DEFAULT_PRESELECTED_EQUIPMENT,
      searchQuery: '',
      sortBy: 'popular',
      difficulty: 'ALL',
      savedOnly: false,
    });
    setSearchParams({});
  };

  const allFiveEquipmentSelected =
    discoveryFilters.equipment.length === DISCOVERY_EQUIPMENT_FILTERS.length;

  const activeCategoryName = discoveryFilters.category || 'Chest';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
      {/* Compact Breadcrumb & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-medium text-[#657565] mb-1"
          >
            <Link to="/explorer" className="hover:text-[#173F35] transition-colors">
              Muscle Explorer
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#657565]" />
            <span className="text-[#173F35] font-bold">
              {activeCategoryName}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#263B2D]">
            {activeCategoryName} Exercises
          </h1>
          <p className="text-xs sm:text-sm text-[#657565] mt-0.5">
            Explore exercises that target your {activeCategoryName.toLowerCase()} muscles
            using your available equipment.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setDiscoveryFilters((prev) => ({
              ...prev,
              savedOnly: !prev.savedOnly,
            }))
          }
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all self-start sm:self-auto ${
            discoveryFilters.savedOnly
              ? 'bg-[#173F35] text-white border-[#173F35]'
              : 'bg-[#F1F2E8] text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
          }`}
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${
              discoveryFilters.savedOnly ? 'fill-current' : ''
            }`}
          />
          <span>Saved ({savedExerciseSlugs.length})</span>
        </button>
      </div>

      {/* Selected Muscle Card */}
      <SelectedMuscleCard
        selectedCategory={activeCategoryName}
        selectedSubRegion={discoveryFilters.subRegion}
        onSelectSubRegion={(sub) =>
          setDiscoveryFilters((prev) => ({ ...prev, subRegion: sub }))
        }
        onChangeCategory={(catName, mSlug) =>
          setDiscoveryFilters((prev) => ({
            ...prev,
            category: catName,
            muscleSlug: mSlug,
            subRegion: 'ALL',
          }))
        }
      />

      {/* Smart Unified Toolbar: Equipment Chips + Search + Sort */}
      <section
        aria-label="Equipment and Search Controls"
        className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-4 space-y-3.5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {DISCOVERY_EQUIPMENT_FILTERS.map((eq) => {
              const isSelected = discoveryFilters.equipment.includes(eq.slug);
              return (
                <button
                  key={eq.slug}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => handleToggleEquipment(eq.slug)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#173F35] text-white border-[#173F35]'
                      : 'bg-[#E5E8CE]/60 text-[#657565] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#789575] border-[#789575] text-white'
                        : 'bg-white border-[#D2D9C5]'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span>{eq.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleSelectAllEquipment}
              disabled={allFiveEquipmentSelected}
              className={`px-2 py-1 rounded font-bold ${
                allFiveEquipmentSelected
                  ? 'text-[#657565]/40 cursor-default'
                  : 'text-[#173F35] hover:text-[#789575]'
              }`}
            >
              Select All
            </button>
            <span className="text-[#D2D9C5]">|</span>
            <button
              type="button"
              onClick={handleClearAllEquipment}
              disabled={discoveryFilters.equipment.length === 0}
              className={`px-2 py-1 rounded font-bold ${
                discoveryFilters.equipment.length === 0
                  ? 'text-[#657565]/40 cursor-default'
                  : 'text-[#657565] hover:text-[#263B2D]'
              }`}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-3 border-t border-[#D2D9C5]">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-[#173F35] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={discoveryFilters.searchQuery}
              onChange={(e) =>
                setDiscoveryFilters((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              placeholder={`Search ${activeCategoryName.toLowerCase()} exercises...`}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#D2D9C5] focus:border-[#173F35] text-xs text-[#263B2D] placeholder-[#657565]/70 focus:outline-none"
            />
            {discoveryFilters.searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setDiscoveryFilters((prev) => ({ ...prev, searchQuery: '' }))
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#657565] hover:text-[#263B2D]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <select
              aria-label="Filter by difficulty"
              value={discoveryFilters.difficulty}
              onChange={(e) =>
                setDiscoveryFilters((prev) => ({
                  ...prev,
                  difficulty: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#D2D9C5] focus:border-[#173F35] text-xs font-medium text-[#263B2D] focus:outline-none"
            >
              <option value="ALL">Level: All</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              aria-label="Sort exercises"
              value={discoveryFilters.sortBy}
              onChange={(e) =>
                setDiscoveryFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#D2D9C5] focus:border-[#173F35] text-xs font-medium text-[#263B2D] focus:outline-none"
            >
              <option value="popular">Sort: Popular</option>
              <option value="name">Sort: A–Z</option>
              <option value="difficulty">Sort: Difficulty</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#657565] pt-1">
          <span>
            Showing <strong className="text-[#263B2D]">{visibleExercises.length}</strong>{' '}
            matching exercises
            {discoveryFilters.subRegion !== 'ALL'
              ? ` (${discoveryFilters.subRegion})`
              : ''}
          </span>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="inline-flex items-center gap-1 text-[#173F35] hover:text-[#789575] font-bold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </section>

      {/* Responsive 3–4 Column Exercise Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#F1F2E8] border border-rose-300 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[#263B2D]">Could not load exercises</p>
          <p className="text-xs text-[#657565]">{error}</p>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : visibleExercises.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onQuickPreview={(ex) => setQuickPreviewExercise(ex)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl py-14 px-4 text-center space-y-3">
          <Dumbbell className="w-8 h-8 text-[#173F35] mx-auto opacity-80" />
          <h3 className="text-base font-bold text-[#263B2D]">
            No matching {activeCategoryName.toLowerCase()} exercises
          </h3>
          <p className="text-xs text-[#657565] max-w-sm mx-auto">
            Select additional equipment filters or reset your search query.
          </p>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {quickPreviewExercise && (
        <ExerciseDetailModal
          exercise={quickPreviewExercise}
          onClose={() => setQuickPreviewExercise(null)}
        />
      )}
    </div>
  );
}
