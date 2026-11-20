import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gymGuideApi } from '../services/api.service';

const GymGuideContext = createContext(null);

const WORKOUT_STORAGE_KEY = 'gymguide_active_workout_v1';
const SAVED_EXERCISES_KEY = 'gymguide_saved_exercises_v1';

export const DEFAULT_PRESELECTED_EQUIPMENT = [
  'dumbbell',
  'barbell',
  'cable-machine',
  'machine',
  'bodyweight',
];

export function GymGuideProvider({ children }) {
  const [muscles, setMuscles] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedMuscleSlug, setSelectedMuscleSlug] = useState('chest');
  const [selectedSubMuscleId, setSelectedSubMuscleId] = useState(null);
  const [hasActiveSelection, setHasActiveSelection] = useState(false);
  const [bodyView, setBodyView] = useState('FRONT'); // 'FRONT' | 'BACK' | 'DUAL'
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isWorkoutDrawerOpen, setIsWorkoutDrawerOpen] = useState(false);
  const [compareSlugs, setCompareSlugs] = useState([
    'barbell-bench-press',
    'dumbbell-bench-press',
  ]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Persistent Discovery Filter State (Preserved across Exercise Details navigation)
  const [discoveryFilters, setDiscoveryFilters] = useState({
    category: 'Chest',
    muscleSlug: 'chest',
    subRegion: 'ALL',
    equipment: DEFAULT_PRESELECTED_EQUIPMENT,
    searchQuery: '',
    sortBy: 'popular',
    difficulty: 'ALL',
    savedOnly: false,
  });

  // Saved / Favorited Exercises
  const [savedExerciseSlugs, setSavedExerciseSlugs] = useState(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_EXERCISES_KEY);
      return raw
        ? JSON.parse(raw)
        : ['barbell-bench-press', 'dumbbell-bench-press', 'incline-dumbbell-bench-press'];
    } catch (_) {
      return ['barbell-bench-press', 'dumbbell-bench-press'];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVED_EXERCISES_KEY,
        JSON.stringify(savedExerciseSlugs)
      );
    } catch (_) {}
  }, [savedExerciseSlugs]);

  const isExerciseSaved = useCallback(
    (slug) => savedExerciseSlugs.includes(slug),
    [savedExerciseSlugs]
  );

  const toggleSavedExercise = useCallback((slug) => {
    if (!slug) return;
    setSavedExerciseSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  }, []);

  // User's Custom Workout Session
  const [workoutItems, setWorkoutItems] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem(WORKOUT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workoutItems));
    } catch (_) {}
  }, [workoutItems]);

  useEffect(() => {
    let mounted = true;
    async function loadMetadata() {
      try {
        const [musclesData, groupsData, eqData] = await Promise.all([
          gymGuideApi.getMuscles(),
          gymGuideApi.getMuscleGroups(),
          gymGuideApi.getEquipment(),
        ]);
        if (!mounted) return;
        setMuscles(musclesData || []);
        setMuscleGroups(groupsData || []);
        setEquipmentList(eqData || []);
      } catch (err) {
        console.error('Failed to load initial GymGuide metadata:', err);
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    }
    loadMetadata();
    return () => {
      mounted = false;
    };
  }, []);

  const selectMuscle = useCallback(
    (slug, preferredSide = null, categoryName = null, subMuscleId = null) => {
      if (!slug) return;
      setSelectedMuscleSlug(slug);
      setSelectedSubMuscleId(subMuscleId);
      setHasActiveSelection(true);
      if (preferredSide && preferredSide !== 'BOTH') {
        setBodyView((prev) => (prev === 'DUAL' ? 'DUAL' : preferredSide));
      }
      if (categoryName) {
        setDiscoveryFilters((prev) => ({
          ...prev,
          category: categoryName,
          muscleSlug: slug,
          subRegion: subMuscleId || 'ALL',
        }));
      }
    },
    []
  );

  const clearMuscleSelection = useCallback(() => {
    setSelectedSubMuscleId(null);
    setHasActiveSelection(false);
  }, []);

  const addToCompare = useCallback((exerciseSlug) => {
    if (!exerciseSlug) return;
    setCompareSlugs((prev) => {
      if (prev.includes(exerciseSlug)) return prev;
      return [prev[1] || 'barbell-bench-press', exerciseSlug];
    });
  }, []);

  const isExerciseInWorkout = useCallback(
    (slug) => workoutItems.some((item) => item.slug === slug),
    [workoutItems]
  );

  const toggleWorkoutExercise = useCallback((exercise) => {
    if (!exercise || !exercise.slug) return;
    setWorkoutItems((prev) => {
      const exists = prev.some((item) => item.slug === exercise.slug);
      if (exists) {
        return prev.filter((item) => item.slug !== exercise.slug);
      }
      const primaryMuscle =
        exercise.primaryMuscles?.[0]?.name || exercise.category || 'Target Muscle';
      const equipment = exercise.equipment?.[0]?.name || 'Bodyweight';
      return [
        ...prev,
        {
          slug: exercise.slug,
          name: exercise.name,
          category: exercise.category,
          primaryMuscle,
          equipment,
          sets: 3,
          reps: exercise.recommendedReps || '8–12 reps',
          rest: exercise.restDuration || '90s',
          completedSets: 0,
        },
      ];
    });
  }, []);

  const updateWorkoutItemSets = useCallback((slug, delta) => {
    setWorkoutItems((prev) =>
      prev.map((item) =>
        item.slug === slug
          ? { ...item, sets: Math.min(10, Math.max(1, (item.sets || 3) + delta)) }
          : item
      )
    );
  }, []);

  const toggleCompletedSet = useCallback((slug, setNumber) => {
    setWorkoutItems((prev) =>
      prev.map((item) => {
        if (item.slug !== slug) return item;
        const nextDone = item.completedSets === setNumber ? setNumber - 1 : setNumber;
        return { ...item, completedSets: Math.max(0, nextDone) };
      })
    );
  }, []);

  const removeWorkoutExercise = useCallback((slug) => {
    setWorkoutItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const clearWorkout = useCallback(() => {
    setWorkoutItems([]);
  }, []);

  const loadPlanDayIntoWorkout = useCallback((day) => {
    if (!day || !Array.isArray(day.exercises)) return;
    const mapped = day.exercises
      .filter((item) => item.exercise)
      .map((item) => ({
        slug: item.exercise.slug,
        name: item.exercise.name,
        category: item.exercise.category,
        primaryMuscle:
          item.exercise.primaryMuscles?.[0]?.name || item.exercise.category || 'Target',
        equipment: item.exercise.equipment?.[0]?.name || 'Bodyweight',
        sets: item.sets || 3,
        reps: item.reps || '10–12 reps',
        rest: item.restGuidance || '90s',
        completedSets: 0,
      }));
    setWorkoutItems(mapped);
    setIsWorkoutDrawerOpen(true);
  }, []);

  const value = {
    muscles,
    muscleGroups,
    equipmentList,
    selectedMuscleSlug,
    setSelectedMuscleSlug,
    selectedSubMuscleId,
    setSelectedSubMuscleId,
    hasActiveSelection,
    setHasActiveSelection,
    selectMuscle,
    clearMuscleSelection,
    bodyView,
    setBodyView,
    isSearchModalOpen,
    setIsSearchModalOpen,
    isWorkoutDrawerOpen,
    setIsWorkoutDrawerOpen,
    compareSlugs,
    setCompareSlugs,
    addToCompare,
    discoveryFilters,
    setDiscoveryFilters,
    savedExerciseSlugs,
    isExerciseSaved,
    toggleSavedExercise,
    workoutItems,
    isExerciseInWorkout,
    toggleWorkoutExercise,
    updateWorkoutItemSets,
    toggleCompletedSet,
    removeWorkoutExercise,
    clearWorkout,
    loadPlanDayIntoWorkout,
    loadingInitial,
  };

  return <GymGuideContext.Provider value={value}>{children}</GymGuideContext.Provider>;
}

export function useGymGuide() {
  const ctx = useContext(GymGuideContext);
  if (!ctx) {
    throw new Error('useGymGuide must be used within a GymGuideProvider');
  }
  return ctx;
}
