import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronDown, Check, Activity } from 'lucide-react';
import { EXERCISE_CATEGORIES } from '../../utils/formatters';
import { MuscleCategoryThumbnail } from './HomepageVisualAssets';

export function SelectedMuscleCard({
  selectedCategory = 'Chest',
  selectedSubRegion = 'ALL',
  onSelectSubRegion,
  onChangeCategory,
}) {
  const navigate = useNavigate();
  const [showMuscleSwitcher, setShowMuscleSwitcher] = useState(false);

  const activeCategoryMeta =
    EXERCISE_CATEGORIES.find(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    ) || EXERCISE_CATEGORIES[0];

  const thumbKey =
    activeCategoryMeta.slug === 'biceps' ||
    activeCategoryMeta.slug === 'triceps' ||
    activeCategoryMeta.slug === 'forearms'
      ? 'arms'
      : activeCategoryMeta.slug === 'calves'
      ? 'legs'
      : [
          'chest',
          'back',
          'shoulders',
          'arms',
          'legs',
          'abs',
          'glutes',
        ].includes(activeCategoryMeta.slug)
      ? activeCategoryMeta.slug
      : 'chest';

  return (
    <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* 3D Character Muscle Illustration Thumbnail */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-[#E5EAD6] to-[#F1F2E8] border border-[#D2D9C5] flex items-center justify-center shrink-0 p-1.5">
            <MuscleCategoryThumbnail categoryId={thumbKey} />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold font-display text-[#263B2D]">
                {activeCategoryMeta.name}
              </h2>
              <span className="text-xs font-medium text-[#657565]">
                / {activeCategoryMeta.anatomicalName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectSubRegion && onSelectSubRegion('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  selectedSubRegion === 'ALL'
                    ? 'bg-[#173F35] text-white border-[#173F35]'
                    : 'bg-[#E5E8CE] text-[#657565] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
                }`}
              >
                All {activeCategoryMeta.name}
              </button>
              {activeCategoryMeta.subRegions.map((sub) => {
                const isActive =
                  selectedSubRegion.toLowerCase() === sub.toLowerCase();
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() =>
                      onSelectSubRegion &&
                      onSelectSubRegion(isActive ? 'ALL' : sub)
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-[#789575] text-white border-[#789575]'
                        : 'bg-[#E5E8CE]/70 text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setShowMuscleSwitcher((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Change Muscle</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showMuscleSwitcher ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => navigate('/explorer')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E5E8CE] hover:bg-[#789575] text-[#263B2D] hover:text-white border border-[#D2D9C5] text-xs font-bold transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Body Map</span>
          </button>
        </div>
      </div>

      {showMuscleSwitcher && (
        <div className="mt-4 pt-3.5 border-t border-[#D2D9C5]">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {EXERCISE_CATEGORIES.map((cat) => {
              const isCurrent =
                cat.name.toLowerCase() === selectedCategory.toLowerCase();
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    onChangeCategory && onChangeCategory(cat.name, cat.muscleSlug);
                    setShowMuscleSwitcher(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#789575] text-white border-[#789575]'
                      : 'bg-[#E5E8CE]/60 text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
