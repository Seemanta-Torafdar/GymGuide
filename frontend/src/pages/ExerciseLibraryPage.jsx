import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Check,
  X,
  RotateCcw,
  Dumbbell,
  Bookmark,
  ChevronRight,
  Target,
} from 'lucide-react';
import { SelectedMuscleCard } from '../components/anatomy/SelectedMuscleCard';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { ExerciseDetailModal } from '../components/exercises/ExerciseDetailModal';
import { ExerciseWorkoutSimulator } from '../components/exercises/ExerciseWorkoutSimulator';
import {
  SUB_MUSCLE_CATALOG,
  deriveActiveSubMuscleIdsForExercise,
} from '../data/characterHitRegions';
import { useDebounce } from '../hooks/useDebounce';
import { gymGuideApi } from '../services/api.service';
import {
  useGymGuide,
  DEFAULT_PRESELECTED_EQUIPMENT,
} from '../context/GymGuideContext';
import {
  DISCOVERY_EQUIPMENT_FILTERS,
  EXERCISE_CATEGORIES,
  getEquipmentDisplayLabel,
  getChestSubRegionLabel,
} from '../utils/formatters';

function getMovementFamilyKey(ex) {
  const s = `${ex?.slug || ''} ${ex?.name || ''}`.toLowerCase();
  if (s.includes('low-to-high') || s.includes('incline dumbbell fly')) return 'incline-fly';
  if (s.includes('high-to-low') || s.includes('decline')) {
    if (s.includes('decline push-up')) return 'incline-press';
    if (s.includes('fly')) return 'lower-fly';
    return 'decline-press';
  }
  if (s.includes('incline')) {
    if (s.includes('push-up')) return 'decline-press';
    if (s.includes('curl')) return 'bicep-curl';
    return 'incline-press';
  }
  if (s.includes('crossover') || s.includes('chest fly') || s.includes('pec deck')) return 'flat-fly';
  if (s.includes('bench press') || s.includes('chest press') || s.includes('push-up')) {
    if (s.includes('close-grip')) return 'tricep-press';
    return 'flat-press';
  }
  if (s.includes('dip')) return s.includes('tricep') ? 'tricep-dip' : 'decline-press';
  if (s.includes('pulldown') || s.includes('pull-up')) return 'vertical-pull';
  if (s.includes('row')) return 'horizontal-row';
  if (s.includes('deadlift') || s.includes('rdl')) return 'hinge';
  if (s.includes('shoulder press') || s.includes('overhead barbell') || s.includes('arnold')) return 'overhead-press';
  if (s.includes('curl') && !s.includes('leg') && !s.includes('wrist')) return 'bicep-curl';
  if (s.includes('calf')) return 'calf-raise';
  return s;
}

function exerciseMatchesEquipment(ex, targetEqSlug) {
  if (!ex || !targetEqSlug) return false;
  return (ex.equipment || []).some(
    (eq) =>
      eq.slug === targetEqSlug ||
      (targetEqSlug === 'cable-machine' && eq.slug.includes('cable')) ||
      (targetEqSlug === 'dumbbell' && eq.slug.includes('dumbbell')) ||
      (targetEqSlug === 'barbell' && (eq.slug.includes('barbell') || eq.slug.includes('ez-curl'))) ||
      (targetEqSlug === 'machine' && (eq.slug.includes('machine') || eq.slug.includes('smith'))) ||
      (targetEqSlug === 'bodyweight' &&
        (eq.slug === 'bodyweight' || eq.slug === 'dip-station' || eq.slug === 'pull-up-bar'))
  );
}

function findBestSiblingForEquipment(exercisesList, currentExercise, targetEqSlug) {
  if (!exercisesList?.length || !currentExercise) return null;
  const familyKey = getMovementFamilyKey(currentExercise);

  // 1. Exact same movement family + target equipment
  const familyMatch = exercisesList.find(
    (ex) => getMovementFamilyKey(ex) === familyKey && exerciseMatchesEquipment(ex, targetEqSlug)
  );
  if (familyMatch) return familyMatch;

  // 2. Same category + target equipment
  return exercisesList.find((ex) => exerciseMatchesEquipment(ex, targetEqSlug)) || null;
}

export default function ExerciseLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    discoveryFilters,
    setDiscoveryFilters,
    savedExerciseSlugs,
  } = useGymGuide();

  const [quickPreviewExercise, setQuickPreviewExercise] = useState(null);
  const [allCategoryExercises, setAllCategoryExercises] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive 4-step guided workflow state (Chest first by default)
  const [studioExerciseSlug, setStudioExerciseSlug] = useState('barbell-bench-press');
  const [studioEquipmentSlug, setStudioEquipmentSlug] = useState('barbell');
  const [studioFullDetail, setStudioFullDetail] = useState(null);
  const [studioPerformTrigger, setStudioPerformTrigger] = useState(0);
  const simulatorSectionRef = useRef(null);

  // Default to Chest first on /exercises unless URL explicitly overrides
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
    } else if (!discoveryFilters.category) {
      setDiscoveryFilters((prev) => ({ ...prev, category: 'Chest', muscleSlug: 'chest' }));
    }
  }, [searchParams, setDiscoveryFilters]);

  const activeCategoryName = discoveryFilters.category || 'Chest';
  const debouncedSearch = useDebounce(discoveryFilters.searchQuery, 200);

  // Load ALL exercises in active category so Step 1 (Exercise) & Step 2 (Machine) always work smoothly
  useEffect(() => {
    let active = true;
    async function loadCategoryPool() {
      try {
        const res = await gymGuideApi.getExercises({
          limit: 80,
          category: activeCategoryName,
          sort: 'popular',
        });
        if (!active) return;
        const list = res.exercises || [];
        setAllCategoryExercises(list);
        if (list.length > 0) {
          const matchingForEq = list.filter((e) =>
            exerciseMatchesEquipment(e, studioEquipmentSlug)
          );
          if (matchingForEq.length > 0) {
            const stillInEq = matchingForEq.find((e) => e.slug === studioExerciseSlug);
            setStudioExerciseSlug((stillInEq || matchingForEq[0]).slug);
          } else {
            setStudioExerciseSlug('');
          }
        }
      } catch (_) {}
    }
    loadCategoryPool();
    return () => {
      active = false;
    };
  }, [activeCategoryName]);

  // Filtered library grid request
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
          category: activeCategoryName,
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
    activeCategoryName,
    discoveryFilters.equipment,
    discoveryFilters.subRegion,
    discoveryFilters.difficulty,
    discoveryFilters.sortBy,
    debouncedSearch,
  ]);

  // Strictly filter studio exercises to those performable with chosen machine/equipment (+ active sub-region if set)
  const studioCompatibleExercises = useMemo(() => {
    const sub = (discoveryFilters.subRegion || 'ALL').toLowerCase();
    return allCategoryExercises.filter((ex) => {
      if (!exerciseMatchesEquipment(ex, studioEquipmentSlug)) return false;
      if (sub !== 'all') {
        const sr = (ex.subRegion || '').toLowerCase();
        const nameDesc = `${ex.name} ${ex.description || ''}`.toLowerCase();
        if (sr && sr.includes(sub)) return true;
        if (sub.includes('upper')) {
          return (
            nameDesc.includes('incline') ||
            nameDesc.includes('low-to-high') ||
            nameDesc.includes('clavicular') ||
            nameDesc.includes('decline push-up')
          );
        }
        if (sub.includes('lower')) {
          return (
            nameDesc.includes('decline') ||
            nameDesc.includes('dip') ||
            nameDesc.includes('high-to-low')
          );
        }
        if (sub.includes('middle')) {
          return !nameDesc.includes('incline') && !nameDesc.includes('decline');
        }
      }
      return true;
    });
  }, [allCategoryExercises, studioEquipmentSlug, discoveryFilters.subRegion]);

  // Keep studioExerciseSlug strictly valid for selected equipment, or null if 0 exercises match
  const studioExerciseBase = useMemo(() => {
    if (studioCompatibleExercises.length === 0) return null;
    return (
      studioCompatibleExercises.find((e) => e.slug === studioExerciseSlug) ||
      studioCompatibleExercises[0]
    );
  }, [studioCompatibleExercises, studioExerciseSlug]);

  // Fetch full details + attached custom videos for active studio exercise
  useEffect(() => {
    let active = true;
    async function loadStudioFull() {
      if (!studioExerciseBase?.slug) {
        setStudioFullDetail(null);
        return;
      }
      try {
        const detail = await gymGuideApi.getExerciseById(studioExerciseBase.slug);
        if (active) setStudioFullDetail(detail);
      } catch (_) {
        if (active) setStudioFullDetail(null);
      }
    }
    loadStudioFull();
    return () => {
      active = false;
    };
  }, [studioExerciseBase?.slug]);

  const activeStudioExercise =
    studioFullDetail && studioFullDetail.slug === studioExerciseBase?.slug
      ? {
          ...studioExerciseBase,
          ...studioFullDetail,
          primaryMuscles:
            studioExerciseBase?.primaryMuscles || studioFullDetail.primaryMuscles,
          secondaryMuscles:
            studioExerciseBase?.secondaryMuscles || studioFullDetail.secondaryMuscles,
        }
      : studioExerciseBase;

  const studioHitHeads = useMemo(() => {
    if (!activeStudioExercise) return [];
    const ids = deriveActiveSubMuscleIdsForExercise(activeStudioExercise);
    return Array.from(ids)
      .map((id) => SUB_MUSCLE_CATALOG[id])
      .filter(Boolean);
  }, [activeStudioExercise]);

  const visibleExercises = useMemo(() => {
    if (!discoveryFilters.savedOnly) return exercises;
    return exercises.filter((ex) => savedExerciseSlugs.includes(ex.slug));
  }, [exercises, discoveryFilters.savedOnly, savedExerciseSlugs]);

  const handleSelectStudioExercise = (ex) => {
    if (!ex) return;
    setStudioExerciseSlug(ex.slug);
    setStudioPerformTrigger((prev) => prev + 1);
  };

  const handleSelectStudioMachine = (eqSlug) => {
    setStudioEquipmentSlug(eqSlug);
    const matchingForEq = allCategoryExercises.filter((ex) =>
      exerciseMatchesEquipment(ex, eqSlug)
    );
    const sibling = activeStudioExercise
      ? findBestSiblingForEquipment(matchingForEq, activeStudioExercise, eqSlug)
      : matchingForEq[0];
    setStudioExerciseSlug(sibling ? sibling.slug : '');
    setStudioPerformTrigger((prev) => prev + 1);
  };

  const handlePerformFromCard = (ex) => {
    if (!ex) return;
    const normalizedEq = DISCOVERY_EQUIPMENT_FILTERS.find((f) =>
      exerciseMatchesEquipment(ex, f.slug)
    );
    if (normalizedEq) {
      setStudioEquipmentSlug(normalizedEq.slug);
    } else if (ex.equipment?.[0]?.slug) {
      setStudioEquipmentSlug(ex.equipment[0].slug);
    }
    handleSelectStudioExercise(ex);
    simulatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
            <span className="text-[#173F35] font-bold">{activeCategoryName}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#263B2D]">
            {activeCategoryName} Exercises &amp; Interactive Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#657565] mt-0.5">
            Starting with Chest first — pick an exercise name, choose your machine or equipment, preview the exact muscles hit, and perform with live red muscle activation.
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
            className={`w-3.5 h-3.5 ${discoveryFilters.savedOnly ? 'fill-current' : ''}`}
          />
          <span>Saved ({savedExerciseSlugs.length})</span>
        </button>
      </div>

      {/* Category Quick Switcher Tabs (Chest Always First!) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {EXERCISE_CATEGORIES.map((cat) => {
          const isCurrent = cat.name.toLowerCase() === activeCategoryName.toLowerCase();
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() =>
                setDiscoveryFilters((prev) => ({
                  ...prev,
                  category: cat.name,
                  muscleSlug: cat.muscleSlug,
                  subRegion: 'ALL',
                }))
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shrink-0 transition-all ${
                isCurrent
                  ? 'bg-[#173F35] text-white border-[#173F35] shadow-sm'
                  : 'bg-[#F1F2E8] text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Selected Muscle Banner Card (with ?v=7 Red Model Thumbnail) */}
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

      {/* GUIDED 3-STEP MACHINE/EQUIPMENT FIRST -> COMPATIBLE EXERCISE -> PERFORM STUDIO */}
      {allCategoryExercises.length > 0 && (
        <section
          ref={simulatorSectionRef}
          aria-label="Guided Machine, Exercise & Perform Workout Studio"
          className="bg-[#F1F2E8] border-2 border-[#789575]/45 rounded-3xl p-4 sm:p-6 space-y-5 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Step 1 (FIRST): Choose Machine / Equipment */}
            <div className="lg:col-span-4 bg-white border border-[#D2D9C5] rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#173F35] block">
                Step 1 • Choose Machine / Equipment
              </span>
              <p className="text-[11px] text-[#657565]">
                Pick equipment first to filter compatible {activeCategoryName} exercises:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DISCOVERY_EQUIPMENT_FILTERS.map((eq) => {
                  const compatibleCount = allCategoryExercises.filter((ex) =>
                    exerciseMatchesEquipment(ex, eq.slug)
                  ).length;
                  const isCurrentEq = studioEquipmentSlug === eq.slug;
                  return (
                    <button
                      key={eq.slug}
                      type="button"
                      onClick={() => handleSelectStudioMachine(eq.slug)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isCurrentEq
                          ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                          : compatibleCount > 0
                          ? 'bg-[#E5E8CE] text-[#263B2D] border-[#D2D9C5] hover:bg-[#173F35] hover:text-white'
                          : 'bg-[#F1F2E8] text-[#657565]/70 border-[#D2D9C5] hover:border-[#173F35] hover:text-[#263B2D]'
                      }`}
                    >
                      <Dumbbell className="w-3 h-3" />
                      <span>{eq.label}</span>
                      <span className="text-[10px] opacity-80">({compatibleCount})</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-1 text-[11px] font-semibold text-[#173F35]">
                {activeStudioExercise ? (
                  <>
                    Active Setup: <strong>{activeStudioExercise.name}</strong> ({getEquipmentDisplayLabel(studioEquipmentSlug)})
                  </>
                ) : (
                  <span className="text-[#DC2626]">
                    No {activeCategoryName} exercises available for {getEquipmentDisplayLabel(studioEquipmentSlug)}
                  </span>
                )}
              </div>
            </div>

            {/* Step 2 (SECOND): Compatible Exercises for Selected Machine */}
            <div className="lg:col-span-5 bg-white border border-[#D2D9C5] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#173F35]">
                  Step 2 • {getEquipmentDisplayLabel(studioEquipmentSlug)} {activeCategoryName} Exercises
                </span>
                <span className="text-[11px] font-bold text-[#657565]">
                  {studioCompatibleExercises.length} option{studioCompatibleExercises.length === 1 ? '' : 's'}
                </span>
              </div>

              {studioCompatibleExercises.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {studioCompatibleExercises.map((ex) => {
                    const isActive = activeStudioExercise?.slug === ex.slug;
                    return (
                      <button
                        key={ex.slug}
                        type="button"
                        onClick={() => handleSelectStudioExercise(ex)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all text-left ${
                          isActive
                            ? 'bg-[#173F35] text-white border-[#173F35] shadow-sm'
                            : 'bg-[#F1F2E8] text-[#263B2D] border-[#D2D9C5] hover:border-[#789575]'
                        }`}
                      >
                        {ex.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] p-3 text-xs text-[#657565]">
                  No exercises in <strong>{activeCategoryName}</strong> can be performed with{' '}
                  <strong>{getEquipmentDisplayLabel(studioEquipmentSlug)}</strong>. Choose another machine in Step 1.
                </div>
              )}
            </div>

            {/* Step 3: Body Parts Hit Readout (shown only when a compatible exercise exists) */}
            <div className="lg:col-span-3 bg-white border border-[#D2D9C5] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#DC2626]">
                  Step 3 • Target Hit Zone
                </span>
                <Target className="w-4 h-4 text-[#DC2626]" />
              </div>

              {activeStudioExercise ? (
                <>
                  {activeStudioExercise.category === 'Chest' && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30 text-[11px] font-extrabold text-[#DC2626]">
                      Focus: {getChestSubRegionLabel(activeStudioExercise)}
                    </span>
                  )}

                  <div className="space-y-1.5">
                    {studioHitHeads.slice(0, 3).map((head) => (
                      <div
                        key={head.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F2E8] border border-[#D2D9C5] text-[11px] font-bold text-[#263B2D]"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                        <span className="truncate">{head.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-[#657565]">
                  Select an available equipment type to inspect target muscles.
                </p>
              )}
            </div>
          </div>

          {/* Step 4: Live Perform Workout Video & Model Form Simulator (ONLY rendered when compatible exercise matches selected equipment) */}
          {activeStudioExercise && (
            <ExerciseWorkoutSimulator
              exercise={activeStudioExercise}
              selectedEquipmentSlug={studioEquipmentSlug}
              performTrigger={studioPerformTrigger}
              autoPlayOnSelect={true}
            />
          )}
        </section>
      )}

      {/* Smart Unified Toolbar: Equipment Checkboxes + Search + Sort for Full Library Grid */}
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
              onPerformInStudio={handlePerformFromCard}
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
