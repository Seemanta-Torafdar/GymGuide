import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  Layers,
  Filter,
  Play,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { InteractiveMuscleMap } from './InteractiveMuscleMap';
import { ExerciseWorkoutSimulator } from '../exercises/ExerciseWorkoutSimulator';
import { AnatomicalPerformerCanvas } from '../exercises/AnatomicalPerformerCanvas';
import {
  SUB_MUSCLE_CATALOG,
  matchesSubMuscleKeywords,
} from '../../data/characterHitRegions';
import { gymGuideApi } from '../../services/api.service';
import { useGymGuide } from '../../context/GymGuideContext';
import {
  formatDifficultyLabel,
  getDifficultyBadgeClasses,
  getEquipmentDisplayLabel,
} from '../../utils/formatters';

export function MuscleExplorerSection({ showFullExerciseGrid = true }) {
  const {
    muscles,
    selectedMuscleSlug,
    selectedSubMuscleId,
    setSelectedSubMuscleId,
    hasActiveSelection,
    selectMuscle,
    clearMuscleSelection,
    bodyView,
    setBodyView,
    isExerciseSaved,
    toggleSavedExercise,
  } = useGymGuide();

  const [muscleDetail, setMuscleDetail] = useState(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const [exactHeadOnly, setExactHeadOnly] = useState(false);
  const [loadingMuscle, setLoadingMuscle] = useState(false);

  const [activeExerciseSlug, setActiveExerciseSlug] = useState(null);
  const [fullExerciseDetail, setFullExerciseDetail] = useState(null);
  const [performTrigger, setPerformTrigger] = useState(0);
  const workoutListRef = useRef(null);
  const simulatorRef = useRef(null);

  const muscleStatsMap = useMemo(() => {
    const map = {};
    for (const m of muscles) {
      map[m.slug] = m.stats || {
        primaryExerciseCount: 0,
        secondaryExerciseCount: 0,
        totalExerciseCount: 0,
      };
    }
    return map;
  }, [muscles]);

  // Load selected body part / muscle details and related exercises
  useEffect(() => {
    let active = true;
    async function fetchSelectedMuscle() {
      if (!selectedMuscleSlug) return;
      setLoadingMuscle(true);
      try {
        const data = await gymGuideApi.getMuscleExercises(selectedMuscleSlug, 'ALL');
        if (active) {
          setMuscleDetail(data);
          setEquipmentFilter('ALL');
          setRoleFilter('ALL');
        }
      } catch (err) {
        console.error('Error loading muscle details:', err);
      } finally {
        if (active) setLoadingMuscle(false);
      }
    }
    fetchSelectedMuscle();
    return () => {
      active = false;
    };
  }, [selectedMuscleSlug]);

  const activeMuscle = muscleDetail?.muscle;
  const primaryExercises = muscleDetail?.primaryExercises || [];
  const secondaryExercises = muscleDetail?.secondaryExercises || [];
  const synergistMuscles = muscleDetail?.synergistMuscles || [];
  const synergistSlugs = useMemo(
    () => synergistMuscles.map((s) => s.slug),
    [synergistMuscles]
  );

  // Exercises matching selected role (All / Primary / Secondary) and prioritized by sub-muscle head
  const selectedSubMuscleMeta = selectedSubMuscleId
    ? SUB_MUSCLE_CATALOG[selectedSubMuscleId]
    : null;

  const roleMatchedExercises = useMemo(() => {
    const base =
      roleFilter === 'PRIMARY'
        ? primaryExercises
        : roleFilter === 'SECONDARY'
        ? secondaryExercises
        : [...primaryExercises, ...secondaryExercises];

    if (!selectedSubMuscleId) return base;

    const headMatches = [];
    const otherGroup = [];
    for (const ex of base) {
      if (matchesSubMuscleKeywords(ex, selectedSubMuscleId)) {
        headMatches.push({ ...ex, _exactHeadMatch: true });
      } else {
        otherGroup.push(ex);
      }
    }

    if (exactHeadOnly && headMatches.length > 0) {
      return headMatches;
    }
    return [...headMatches, ...otherGroup];
  }, [roleFilter, primaryExercises, secondaryExercises, selectedSubMuscleId, exactHeadOnly]);

  // Dynamically discover ALL equipment usable for this body part / muscle
  const availableEquipmentOptions = useMemo(() => {
    const eqMap = new Map();
    for (const ex of roleMatchedExercises) {
      for (const eq of ex.equipment || []) {
        const existing = eqMap.get(eq.slug) || {
          slug: eq.slug,
          name: getEquipmentDisplayLabel(eq.slug || eq.name),
          rawName: eq.name,
          category: eq.category,
          count: 0,
        };
        existing.count += 1;
        eqMap.set(eq.slug, existing);
      }
    }
    return Array.from(eqMap.values()).sort((a, b) => b.count - a.count);
  }, [roleMatchedExercises]);

  // Exercises filtered by selected equipment
  const displayedExercises = useMemo(() => {
    if (equipmentFilter === 'ALL') return roleMatchedExercises;
    return roleMatchedExercises.filter((ex) =>
      (ex.equipment || []).some((eq) => eq.slug === equipmentFilter)
    );
  }, [roleMatchedExercises, equipmentFilter]);

  // Keep active exercise automatically synced with muscle + equipment filter
  useEffect(() => {
    if (displayedExercises.length === 0) {
      setActiveExerciseSlug(null);
      return;
    }
    const stillVisible = displayedExercises.some((e) => e.slug === activeExerciseSlug);
    if (!stillVisible) {
      setActiveExerciseSlug(displayedExercises[0].slug);
    }
  }, [displayedExercises, activeExerciseSlug]);

  const selectedExerciseBase = useMemo(() => {
    return (
      displayedExercises.find((e) => e.slug === activeExerciseSlug) ||
      displayedExercises[0] ||
      null
    );
  }, [displayedExercises, activeExerciseSlug]);

  // Fetch full exercise details (to include custom attached videos from Admin Studio)
  useEffect(() => {
    let active = true;
    async function loadFullExercise() {
      if (!activeExerciseSlug) {
        setFullExerciseDetail(null);
        return;
      }
      try {
        const detail = await gymGuideApi.getExerciseById(activeExerciseSlug);
        if (active) setFullExerciseDetail(detail);
      } catch (_) {
        if (active) setFullExerciseDetail(null);
      }
    }
    loadFullExercise();
    return () => {
      active = false;
    };
  }, [activeExerciseSlug]);

  const activeExercise =
    fullExerciseDetail && fullExerciseDetail.slug === activeExerciseSlug
      ? {
          ...selectedExerciseBase,
          ...fullExerciseDetail,
          primaryMuscles:
            selectedExerciseBase?.primaryMuscles || fullExerciseDetail.primaryMuscles,
          secondaryMuscles:
            selectedExerciseBase?.secondaryMuscles || fullExerciseDetail.secondaryMuscles,
        }
      : selectedExerciseBase;

  const handleOpenInSimulator = (exSlug) => {
    setActiveExerciseSlug(exSlug);
    setPerformTrigger((prev) => prev + 1);
    if (simulatorRef.current) {
      simulatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visibleExercises = showFullExerciseGrid
    ? displayedExercises
    : displayedExercises.slice(0, 6);

  return (
    <div className="w-full space-y-6">
      {/* STEP 1: Interactive 3D Character Anatomy Map */}
      <InteractiveMuscleMap
        selectedMuscleSlug={selectedMuscleSlug}
        selectedSubMuscleId={selectedSubMuscleId}
        hasActiveSelection={hasActiveSelection}
        onClearSelection={clearMuscleSelection}
        onSelectMuscle={(slug, side, category, subId) => {
          setExactHeadOnly(false);
          selectMuscle(slug, side, category, subId);
        }}
        viewMode={bodyView}
        onChangeViewMode={setBodyView}
        muscleStatsMap={muscleStatsMap}
        onMuscleChosenJump={() =>
          workoutListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />

      {/* STEP 2: Clicked Body Part Details + Equipment Options + Related Exercises */}
      <div
        ref={workoutListRef}
        className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* LEFT 4 COLS: Clicked Body Part Profile Card */}
        <div className="lg:col-span-4 bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-5 shadow-sm space-y-4">
          {loadingMuscle && !activeMuscle ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-48 bg-[#E5E8CE] rounded" />
              <div className="h-14 w-full bg-[#E5E8CE] rounded-xl" />
            </div>
          ) : activeMuscle ? (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#173F35] text-white text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {selectedSubMuscleMeta ? 'Selected Muscle Head' : 'Selected Body Part'}
                  </span>
                  <h2 className="text-2xl font-extrabold font-display text-[#263B2D]">
                    {selectedSubMuscleMeta ? selectedSubMuscleMeta.name : activeMuscle.name}
                  </h2>
                  <p className="text-xs font-mono text-[#657565]">
                    {activeMuscle.scientificName}
                  </p>
                </div>
              </div>

              {selectedSubMuscleMeta && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExactHeadOnly((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      exactHeadOnly
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:border-[#DC2626]'
                    }`}
                  >
                    {exactHeadOnly
                      ? `Showing ${selectedSubMuscleMeta.shortName} Focus`
                      : `Filter Only ${selectedSubMuscleMeta.shortName}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubMuscleId(null);
                      setExactHeadOnly(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-bold text-[#173F35] hover:bg-[#789575] hover:text-white transition-colors"
                  >
                    Whole {activeMuscle.name}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-[#E5E8CE] border border-[#D2D9C5] text-[#173F35]">
                  {primaryExercises.length} Primary Exercises
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D2D9C5] text-[#657565]">
                  {availableEquipmentOptions.length} Equipment Types
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#657565] leading-relaxed">
                {activeMuscle.shortDescription}{' '}
                <strong className="text-[#263B2D]">Function:</strong>{' '}
                {activeMuscle.anatomicalFunction}
              </p>

              <div className="p-3 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] flex items-start gap-2 text-xs text-[#263B2D]">
                <CheckCircle2 className="w-4 h-4 text-[#173F35] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#173F35]">Smart Tip:</strong>{' '}
                  {activeMuscle.trainingTip}
                </span>
              </div>

              {synergistMuscles.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#657565] mr-1 inline-flex items-center gap-1 font-semibold">
                    <Layers className="w-3 h-3 text-[#789575]" />
                    Co-Active Muscles:
                  </span>
                  {synergistMuscles.map((syn) => (
                    <button
                      key={syn.slug}
                      type="button"
                      onClick={() => selectMuscle(syn.slug, syn.bodySide)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white hover:bg-[#789575] border border-[#D2D9C5] text-[11px] font-semibold text-[#263B2D] hover:text-white transition-colors"
                    >
                      <span>{syn.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <Link
                to={`/exercises?muscle=${activeMuscle.slug}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E5E8CE] hover:bg-[#789575] text-xs font-bold text-[#263B2D] hover:text-white border border-[#D2D9C5] transition-colors"
              >
                <span>Browse All {activeMuscle.name} in Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : null}
        </div>

        {/* RIGHT 8 COLS: Available Equipment + Exercise Cards for Clicked Muscle */}
        <div className="lg:col-span-8 bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#173F35]">
                Choose Equipment & Movement
              </span>
              <h3 className="text-lg font-extrabold text-[#263B2D] flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#173F35]" />
                <span>
                  {selectedSubMuscleMeta
                    ? `${selectedSubMuscleMeta.shortName} (${activeMuscle?.name || ''})`
                    : activeMuscle
                    ? activeMuscle.name
                    : 'Targeted'}{' '}
                  Exercises ({displayedExercises.length})
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-[#E5E8CE] p-1 rounded-xl border border-[#D2D9C5]">
              {['ALL', 'PRIMARY', 'SECONDARY'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    roleFilter === role
                      ? 'bg-[#173F35] text-[#F1F2E8]'
                      : 'text-[#657565] hover:text-[#263B2D]'
                  }`}
                >
                  {role === 'ALL'
                    ? 'All'
                    : role === 'PRIMARY'
                    ? `Primary (${primaryExercises.length})`
                    : `Secondary (${secondaryExercises.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Equipment Selector Available for This Body Part */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#657565] block">
              Available Equipment for {activeMuscle?.name || 'this muscle'}:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEquipmentFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  equipmentFilter === 'ALL'
                    ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35] shadow-sm'
                    : 'bg-[#E5E8CE] text-[#263B2D] hover:bg-[#789575] hover:text-white border-[#D2D9C5]'
                }`}
              >
                All Equipment ({roleMatchedExercises.length})
              </button>

              {availableEquipmentOptions.map((eq) => {
                const isSelected = equipmentFilter === eq.slug;
                return (
                  <button
                    key={eq.slug}
                    type="button"
                    onClick={() => setEquipmentFilter(eq.slug)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35] shadow-sm'
                        : 'bg-white text-[#263B2D] hover:bg-[#789575] hover:text-white border-[#D2D9C5]'
                    }`}
                  >
                    <span>{eq.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected
                          ? 'bg-[#789575] text-white'
                          : 'bg-[#E5E8CE] text-[#657565]'
                      }`}
                    >
                      {eq.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Exercise Grid — Click Any Exercise to Load Into Perform Workout Simulator */}
          {visibleExercises.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {visibleExercises.map((exercise) => {
                const isActive = activeExercise?.slug === exercise.slug;
                const isSaved = isExerciseSaved(exercise.slug);
                const eqLabels = (exercise.equipment || []).map((eq) =>
                  getEquipmentDisplayLabel(eq.slug || eq.name)
                );

                return (
                  <article
                    key={exercise.id}
                    onClick={() => setActiveExerciseSlug(exercise.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveExerciseSlug(exercise.slug);
                      }
                    }}
                    className={`group relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white border-2 border-[#173F35] shadow-md ring-2 ring-[#789575]/30'
                        : 'bg-white/85 border-[#D2D9C5] hover:border-[#789575] hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Save Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavedExercise(exercise.slug);
                      }}
                      aria-label={isSaved ? 'Unsave' : 'Save'}
                      className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                        isSaved
                          ? 'bg-[#173F35] text-white border-[#173F35]'
                          : 'bg-[#F1F2E8]/90 text-[#657565] hover:text-[#173F35] border-[#D2D9C5]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    {exercise._exactHeadMatch && selectedSubMuscleMeta && (
                      <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-[#DC2626] text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm">
                        Hits {selectedSubMuscleMeta.shortName}
                      </span>
                    )}

                    {/* Compact Form Preview Visual */}
                    <div className="bg-[#F1F2E8] bg-anatomy-grid border-b border-[#D2D9C5] px-2 pt-2 pb-1">
                      <AnatomicalPerformerCanvas
                        exercise={exercise}
                        equipmentSlug={equipmentFilter}
                        phaseProgress={0.75}
                        activeIntensity={0.88}
                        compact={true}
                      />
                    </div>

                    <div className="p-3.5 flex flex-col flex-1 space-y-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#263B2D] line-clamp-1">
                          {exercise.name}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {eqLabels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="px-2 py-0.5 rounded-full bg-[#E5E8CE] border border-[#D2D9C5] text-[10px] font-bold text-[#263B2D]"
                            >
                              {label}
                            </span>
                          ))}
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getDifficultyBadgeClasses(
                              exercise.difficulty
                            )}`}
                          >
                            {formatDifficultyLabel(exercise.difficulty)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInSimulator(exercise.slug);
                          }}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors ${
                            isActive
                              ? 'bg-[#173F35] text-white'
                              : 'bg-[#E5E8CE] hover:bg-[#173F35] text-[#173F35] hover:text-white'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isActive ? 'Selected Below' : 'Perform Workout'}</span>
                        </button>

                        <Link
                          to={`/exercises/${exercise.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Open standalone detail page"
                          className="p-1.5 rounded-xl bg-[#F1F2E8] hover:bg-[#789575] text-[#657565] hover:text-white border border-[#D2D9C5] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5]">
              <Filter className="w-6 h-6 text-[#173F35] mx-auto mb-2 opacity-75" />
              <p className="text-xs sm:text-sm font-bold text-[#263B2D]">
                No exercises match this equipment filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setEquipmentFilter('ALL');
                  setRoleFilter('ALL');
                }}
                className="mt-2.5 px-3.5 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-bold transition-colors"
              >
                Show All Equipment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: INTERACTIVE WORKOUT PERFORMER, STEP FORM IMAGES & LIVE MUSCLE HIT RATING */}
      {activeExercise && (
        <div ref={simulatorRef} className="scroll-mt-20">
          <ExerciseWorkoutSimulator
            exercise={activeExercise}
            selectedEquipmentSlug={equipmentFilter}
            performTrigger={performTrigger}
          />
        </div>
      )}
    </div>
  );
}
