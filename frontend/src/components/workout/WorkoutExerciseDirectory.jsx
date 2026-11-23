import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Dumbbell, Layers, ArrowUpRight, RotateCcw } from 'lucide-react';
import {
  EXERCISE_DIRECTORY_GROUPS,
  DIRECTORY_EQUIPMENT_FILTERS,
  matchesDirectoryEquipment,
} from '../../data/exerciseDirectoryCatalog';

const TOTAL_EXERCISES = EXERCISE_DIRECTORY_GROUPS.reduce(
  (sum, group) => sum + group.exercises.length,
  0
);

/**
 * Filterable directory of all 69 GymGuide exercises organized by the 10 body parts.
 * Supports filtering by body part name, equipment name, and exercise name search.
 */
export function WorkoutExerciseDirectory() {
  const [selectedBodyPart, setSelectedBodyPart] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasActiveFilters =
    selectedBodyPart !== 'ALL' || selectedEquipment !== 'ALL' || normalizedQuery.length > 0;

  const filteredGroups = useMemo(() => {
    return EXERCISE_DIRECTORY_GROUPS.filter(
      (group) => selectedBodyPart === 'ALL' || group.id === selectedBodyPart
    )
      .map((group) => {
        const matchingRows = group.exercises.filter((row) => {
          if (!matchesDirectoryEquipment(row.equipment, selectedEquipment)) {
            return false;
          }
          if (!normalizedQuery) return true;
          return (
            row.name.toLowerCase().includes(normalizedQuery) ||
            row.equipment.toLowerCase().includes(normalizedQuery) ||
            row.targetPortion.toLowerCase().includes(normalizedQuery) ||
            group.bodyPart.toLowerCase().includes(normalizedQuery)
          );
        });
        return { ...group, exercises: matchingRows };
      })
      .filter((group) => group.exercises.length > 0);
  }, [selectedBodyPart, selectedEquipment, normalizedQuery]);

  const matchingTotal = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.exercises.length, 0),
    [filteredGroups]
  );

  const resetFilters = () => {
    setSelectedBodyPart('ALL');
    setSelectedEquipment('ALL');
    setSearchQuery('');
  };

  return (
    <section
      id="exercise-directory"
      aria-label="Complete Exercise Directory by Body Part and Equipment"
      className="pt-4 border-t border-[#D2D9C5] space-y-5"
    >
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
            Complete Workout Catalog
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#263B2D] mt-0.5">
            Exercise Directory by Body Part ({TOTAL_EXERCISES} Exercises)
          </h2>
          <p className="text-xs sm:text-sm text-[#657565] mt-0.5">
            Filter all {TOTAL_EXERCISES} workouts by body part, equipment type, or exercise name. Click any exercise to open its visual guide.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-xs font-bold text-[#173F35]">
            Showing {matchingTotal} of {TOTAL_EXERCISES}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#173F35] text-xs font-bold text-[#263B2D] hover:text-white border border-[#D2D9C5] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar: Body Part Select + Equipment Select + Exercise Name Search */}
      <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search by Exercise Name */}
          <div className="md:col-span-4 relative">
            <label htmlFor="directory-search" className="block text-[11px] font-bold text-[#657565] mb-1">
              Exercise Name Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#657565] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="directory-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise (e.g. Cable Fly, Squat)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D2D9C5] text-xs sm:text-sm text-[#263B2D] placeholder:text-[#657565]/70 focus:outline-none focus:border-[#173F35]"
              />
            </div>
          </div>

          {/* Filter by Body Part */}
          <div className="md:col-span-4">
            <label htmlFor="directory-bodypart" className="block text-[11px] font-bold text-[#657565] mb-1">
              Filter by Body Part
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-[#173F35] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="directory-bodypart"
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D2D9C5] text-xs sm:text-sm font-semibold text-[#263B2D] focus:outline-none focus:border-[#173F35]"
              >
                <option value="ALL">All Body Parts ({TOTAL_EXERCISES})</option>
                {EXERCISE_DIRECTORY_GROUPS.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.number}. {group.bodyPart} ({group.exercises.length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter by Equipment Name */}
          <div className="md:col-span-4">
            <label htmlFor="directory-equipment" className="block text-[11px] font-bold text-[#657565] mb-1">
              Filter by Equipment Name
            </label>
            <div className="relative">
              <Dumbbell className="w-4 h-4 text-[#173F35] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="directory-equipment"
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D2D9C5] text-xs sm:text-sm font-semibold text-[#263B2D] focus:outline-none focus:border-[#173F35]"
              >
                {DIRECTORY_EQUIPMENT_FILTERS.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Body Part Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#D2D9C5]">
          <button
            type="button"
            onClick={() => setSelectedBodyPart('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
              selectedBodyPart === 'ALL'
                ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]'
                : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
            }`}
          >
            All ({TOTAL_EXERCISES})
          </button>
          {EXERCISE_DIRECTORY_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedBodyPart(group.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                selectedBodyPart === group.id
                  ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]'
                  : 'bg-white text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
              }`}
            >
              {group.number}. {group.bodyPart} ({group.exercises.length})
            </button>
          ))}
        </div>

        {/* Quick Equipment Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#657565] mr-1">Equipment:</span>
          {DIRECTORY_EQUIPMENT_FILTERS.map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => setSelectedEquipment(eq.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                selectedEquipment === eq.id
                  ? 'bg-[#173F35] text-[#F1F2E8] border-[#173F35]'
                  : 'bg-[#E5E8CE] text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
              }`}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Serialized Body Part Tables */}
      {filteredGroups.length > 0 ? (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-4 sm:px-5 py-3 bg-[#E5E8CE]/80 border-b border-[#D2D9C5] flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-extrabold font-display text-[#263B2D]">
                  {group.number}. {group.bodyPart}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#173F35] text-[#F1F2E8] text-xs font-bold">
                  {group.exercises.length}{' '}
                  {group.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D2D9C5] bg-white/60 text-[11px] font-extrabold uppercase tracking-wider text-[#657565]">
                      <th className="py-2.5 pl-4 pr-2 w-10">#</th>
                      <th className="py-2.5 px-3 w-48">Equipment</th>
                      <th className="py-2.5 px-3">Target portion</th>
                      <th className="py-2.5 pl-3 pr-4">Exercise name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D9C5]/70 text-xs sm:text-sm">
                    {group.exercises.map((row, idx) => (
                      <tr
                        key={row.slug}
                        className="hover:bg-white/80 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 font-mono text-[11px] text-[#657565]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-bold text-[#173F35] whitespace-nowrap">
                            {row.equipment}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#657565] font-medium">
                          {row.targetPortion}
                        </td>
                        <td className="py-2.5 pl-3 pr-4">
                          <Link
                            to={`/exercises/${row.slug}`}
                            className="inline-flex items-center gap-1 font-bold text-[#263B2D] hover:text-[#173F35] hover:underline"
                          >
                            <span>{row.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#789575] shrink-0" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-8 text-center space-y-2.5">
          <p className="text-sm font-bold text-[#263B2D]">
            No exercises match this body part and equipment combination.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-xs font-bold text-[#F1F2E8] transition-colors"
          >
            Show All {TOTAL_EXERCISES} Exercises
          </button>
        </div>
      )}
    </section>
  );
}
