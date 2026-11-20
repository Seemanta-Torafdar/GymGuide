import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, HeartPulse } from 'lucide-react';
import { useGymGuide } from '../context/GymGuideContext';

/**
 * Footer Component
 * - Footer main background: #173F35
 * - Footer bottom bar: #102E27
 */
export function Footer() {
  const { selectMuscle } = useGymGuide();

  return (
    <footer className="bg-[#173F35] text-[#F1F2E8] mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#789575] flex items-center justify-center text-white">
                <Dumbbell className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="text-lg font-extrabold font-display tracking-tight text-white">
                Gym<span className="text-[#E5E8CE]">Guide</span>
              </span>
            </Link>
            <p className="text-xs text-[#D2D9C5]">
              Train Smarter. Understand Every Muscle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#D2D9C5]">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link
              to="/exercises"
              onClick={() => selectMuscle('chest', 'FRONT', 'Chest')}
              className="hover:text-white transition-colors"
            >
              Exercises
            </Link>
            <Link to="/explorer" className="hover:text-white transition-colors">
              Muscle Explorer
            </Link>
            <Link to="/workout-plans" className="hover:text-white transition-colors">
              Beginner Workouts
            </Link>
            <Link to="/compare" className="hover:text-white transition-colors">
              Compare
            </Link>
            <Link to="/admin" className="hover:text-white transition-colors">
              Admin Videos
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar (#102E27) */}
      <div className="bg-[#102E27] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D2D9C5]">
          <p>© {new Date().getFullYear()} GymGuide Platform.</p>
          <p className="inline-flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-[#789575]" />
            <span>Prioritize controlled technique and full range of motion on every set.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
