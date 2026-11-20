import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { MuscleExplorerSection } from '../components/anatomy/MuscleExplorerSection';
import { useGymGuide } from '../context/GymGuideContext';

export default function MuscleExplorerPage() {
  const { selectedMuscleSlug } = useGymGuide();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Compact Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#D2D9C5]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173F35] mb-1">
            <Activity className="w-3.5 h-3.5 text-[#789575]" />
            <span>Click Body Part → Select Equipment → Perform Workout & Muscle Hit Rating</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#263B2D]">
            Muscle Explorer
          </h1>
          <p className="text-xs sm:text-sm text-[#657565] mt-0.5">
            Tap any muscle on the 3D character, choose your equipment, view step-by-step form images, and click <strong className="text-[#173F35]">Perform Workout</strong> to see every muscle activation rate.
          </p>
        </div>

        <Link
          to={`/exercises?muscle=${selectedMuscleSlug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-extrabold transition-colors self-start sm:self-auto"
        >
          <span>Open in Exercise Discovery</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Interactive Explorer */}
      <MuscleExplorerSection showFullExerciseGrid={true} />
    </div>
  );
}
