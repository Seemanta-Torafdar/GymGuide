import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Calendar,
  Bookmark,
  ArrowRight,
} from 'lucide-react';
import {
  HeroMuscularModel,
  DualExplorerAnatomyBodies,
  MuscleCategoryThumbnail,
  FlexedBicepIcon,
} from '../components/anatomy/HomepageVisualAssets';
import { MuscleTorsoIcon } from '../layouts/MobileBottomNav';
import { gymGuideApi } from '../services/api.service';
import {
  useGymGuide,
  DEFAULT_PRESELECTED_EQUIPMENT,
} from '../context/GymGuideContext';

const QUICK_ACCESS_CARDS = [
  {
    id: 'exercises',
    title: 'Exercises',
    icon: Dumbbell,
    path: '/exercises',
  },
  {
    id: 'workouts',
    title: 'Workouts',
    icon: Calendar,
    path: '/workout-plans',
  },
  {
    id: 'muscles',
    title: 'Muscles',
    icon: MuscleTorsoIcon,
    path: '/explorer',
  },
  {
    id: 'saved',
    title: 'Saved',
    icon: Bookmark,
    path: '/exercises?saved=true',
  },
];

const MUSCLE_GROUP_CARDS = [
  {
    id: 'chest',
    name: 'Chest',
    categoryName: 'Chest',
    muscleSlug: 'chest',
    side: 'FRONT',
  },
  {
    id: 'back',
    name: 'Back',
    categoryName: 'Back',
    muscleSlug: 'latissimus-dorsi',
    side: 'BACK',
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    categoryName: 'Shoulders',
    muscleSlug: 'front-deltoids',
    side: 'FRONT',
  },
  {
    id: 'arms',
    name: 'Arms',
    categoryName: 'Biceps',
    muscleSlug: 'biceps',
    side: 'FRONT',
  },
  {
    id: 'legs',
    name: 'Legs',
    categoryName: 'Legs',
    muscleSlug: 'quadriceps',
    side: 'FRONT',
  },
];

const FALLBACK_WORKOUT_PLANS = [
  {
    id: 'wp-full-body',
    slug: 'full-body-workout',
    displayTitle: 'Full Body (3 Days / Week)',
    shortDesc: 'A simple and effective plan for beginners.',
    iconType: 'calendar',
  },
  {
    id: 'wp-upper-lower',
    slug: 'upper-lower-split',
    displayTitle: 'Upper / Lower Split',
    shortDesc: 'Build strength and muscle balance.',
    iconType: 'dumbbell',
  },
  {
    id: 'wp-ppl',
    slug: 'push-pull-legs',
    displayTitle: 'Push Pull Legs',
    shortDesc: 'A classic for balanced development.',
    iconType: 'dumbbell',
  },
  {
    id: 'wp-beginner-4-day',
    slug: 'beginner-4-day-workout',
    displayTitle: 'Beginner 4-Day Split',
    shortDesc: 'More volume, more results.',
    iconType: 'muscle',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const {
    selectMuscle,
    setDiscoveryFilters,
  } = useGymGuide();

  const [selectedCategoryCard, setSelectedCategoryCard] = useState('chest');
  const [workoutPlans, setWorkoutPlans] = useState(FALLBACK_WORKOUT_PLANS);

  useEffect(() => {
    let mounted = true;
    async function fetchPlans() {
      try {
        const plans = await gymGuideApi.getWorkoutPlans();
        if (!mounted || !Array.isArray(plans) || plans.length === 0) return;
        const iconCycle = ['calendar', 'dumbbell', 'dumbbell', 'muscle'];
        const defaultDescs = [
          'A simple and effective plan for beginners.',
          'Build strength and muscle balance.',
          'A classic for balanced development.',
          'More volume, more results.',
        ];
        const formatted = plans.slice(0, 4).map((p, idx) => ({
          id: p.id,
          slug: p.slug,
          displayTitle:
            idx === 0
              ? 'Full Body (3 Days / Week)'
              : idx === 1
              ? 'Upper / Lower Split'
              : idx === 2
              ? 'Push Pull Legs'
              : 'Beginner 4-Day Split',
          shortDesc: defaultDescs[idx] || p.subtitle || p.description,
          iconType: iconCycle[idx] || 'calendar',
        }));
        setWorkoutPlans(formatted);
      } catch (_) {}
    }
    fetchPlans();
    return () => {
      mounted = false;
    };
  }, []);

  const handleQuickAccess = (card) => {
    if (card.id === 'saved') {
      setDiscoveryFilters((prev) => ({ ...prev, savedOnly: true }));
    } else {
      setDiscoveryFilters((prev) => ({ ...prev, savedOnly: false }));
    }
    navigate(card.path);
  };

  const handleSelectMuscleCategory = (cat) => {
    setSelectedCategoryCard(cat.id);
    selectMuscle(cat.muscleSlug, cat.side, cat.categoryName);
    setDiscoveryFilters((prev) => ({
      ...prev,
      category: cat.categoryName,
      muscleSlug: cat.muscleSlug,
      subRegion: 'ALL',
      equipment:
        prev.equipment && prev.equipment.length > 0
          ? prev.equipment
          : DEFAULT_PRESELECTED_EQUIPMENT,
      savedOnly: false,
    }));
    navigate(`/exercises?category=${encodeURIComponent(cat.categoryName)}`);
  };

  const renderPlanIcon = (iconType) => {
    if (iconType === 'dumbbell') {
      return <Dumbbell className="w-5 h-5 stroke-[2.1]" />;
    }
    if (iconType === 'muscle') {
      return <MuscleTorsoIcon className="w-5 h-5 stroke-[2]" />;
    }
    return <Calendar className="w-5 h-5 stroke-[2.1]" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-10 space-y-5 sm:space-y-7"
    >
      {/* =====================================================================
          1. HERO SECTION (Direct on #E5E8CE background with Sage Halo & Athlete)
      ===================================================================== */}
      <section className="relative overflow-hidden pt-2 sm:pt-4">
        <div className="grid grid-cols-12 items-center gap-2 sm:gap-6">
          {/* Left Hero Copy (7 cols) */}
          <div className="col-span-7 z-10 space-y-3 sm:space-y-4 pb-3">
            <h1 className="text-[28px] leading-[1.1] sm:text-5xl font-extrabold font-display tracking-tight text-[#173F35]">
              Train Smarter.
              <span className="block text-[#173F35] mt-0.5">
                Understand
              </span>
              <span className="block text-[#173F35]">
                Every Muscle.
              </span>
            </h1>

            <p className="text-xs sm:text-base text-[#657565] max-w-md leading-relaxed">
              Explore exercises, muscle groups, and beginner workout routines.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/explorer')}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#173F35] hover:bg-[#789575] text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
              >
                <FlexedBicepIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Explore Muscle Map</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Hero Muscular Male Fitness Model (5 cols) */}
          <div className="col-span-5 -ml-4 sm:ml-0">
            <HeroMuscularModel />
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. FOUR QUICK-ACCESS CARDS (#F1F2E8 Cream Cards with #D2D9C5 Border)
      ===================================================================== */}
      <section aria-label="Quick Access Navigation">
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {QUICK_ACCESS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleQuickAccess(card)}
                className="flex flex-col items-center justify-center py-4 sm:py-5 px-2 rounded-2xl bg-[#F1F2E8] hover:bg-[#789575] border border-[#D2D9C5] hover:border-[#789575] transition-all group shadow-sm"
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#173F35] group-hover:text-white transition-colors mb-2 stroke-[1.9]" />
                <span className="text-xs sm:text-sm font-bold text-[#263B2D] group-hover:text-white transition-colors">
                  {card.title}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. MUSCLE EXPLORER FEATURE CARD (#F1F2E8 Cream Card)
      ===================================================================== */}
      <section aria-label="Interactive Muscle Explorer Feature">
        <div className="relative overflow-hidden rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5] p-5 sm:p-7 shadow-sm">
          <div className="grid grid-cols-12 items-center gap-3 sm:gap-6 relative z-10">
            <div className="col-span-6 space-y-2.5 sm:space-y-3">
              <h2 className="text-xl sm:text-3xl font-extrabold font-display text-[#263B2D] tracking-tight">
                Muscle Explorer
              </h2>
              <p className="text-xs sm:text-sm text-[#657565] leading-relaxed max-w-sm">
                Tap any body part to discover exercises, target muscles, and
                proper techniques.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/explorer')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#173F35] hover:bg-[#789575] text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
                >
                  <span>Explore Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="col-span-6">
              <DualExplorerAnatomyBodies
                onSelectMuscle={(slug, side) => {
                  selectMuscle(slug, side);
                  navigate('/explorer');
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. BROWSE BY MUSCLE GROUP (#F1F2E8 Cards with 3D Grayscale & Green Muscles)
      ===================================================================== */}
      <section aria-label="Browse by Muscle Group" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold font-display text-[#263B2D]">
            Browse by Muscle Group
          </h2>
          <Link
            to="/exercises"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#173F35] hover:text-[#789575] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex sm:grid sm:grid-cols-5 gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar pb-1">
          {MUSCLE_GROUP_CARDS.map((cat) => {
            const isSelected = selectedCategoryCard === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectMuscleCategory(cat)}
                className={`w-[104px] sm:w-auto shrink-0 flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#E3EAD3] to-[#F1F2E8] border-2 border-[#789575]'
                    : 'bg-gradient-to-b from-[#EAECE0] to-[#F1F2E8] hover:border-[#789575] border-[#D2D9C5]'
                }`}
              >
                <div className="w-full flex items-center justify-center overflow-hidden rounded-xl pt-1">
                  <MuscleCategoryThumbnail categoryId={cat.id} />
                </div>
                <span className="mt-1.5 block text-xs sm:text-sm font-bold text-[#263B2D]">
                  {cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5. BEGINNER WORKOUT PLANS (2x2 Cream #F1F2E8 Cards)
      ===================================================================== */}
      <section aria-label="Beginner Workout Plans" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold font-display text-[#263B2D]">
            Beginner Workout Plans
          </h2>
          <Link
            to="/workout-plans"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#173F35] hover:text-[#789575] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {workoutPlans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/workout-plans/${plan.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/workout-plans/${plan.slug}`);
              }}
              className="group flex items-center justify-between gap-3.5 p-4 rounded-2xl bg-[#F1F2E8] hover:border-[#789575] border border-[#D2D9C5] cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#173F35] shrink-0">
                  {renderPlanIcon(plan.iconType)}
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#263B2D] group-hover:text-[#173F35] transition-colors">
                    {plan.displayTitle}
                  </h3>
                  <p className="text-xs text-[#657565] mt-0.5 line-clamp-1">
                    {plan.shortDesc}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-[#C9D8C5] group-hover:bg-[#789575] text-[#173F35] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-4 h-4 stroke-[2.4]" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
