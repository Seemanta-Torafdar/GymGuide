import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  Home,
  Dumbbell,
  Activity,
  Calendar,
  Bookmark,
  GitCompare,
  Video,
} from 'lucide-react';
import { useGymGuide } from '../context/GymGuideContext';

const MENU_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/explorer', label: 'Muscle Map', icon: Activity },
  { to: '/workout-plans', label: 'Workouts', icon: Calendar },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/admin', label: 'Admin Videos', icon: Video },
];

function DumbbellBrandLogo() {
  return (
    <svg
      viewBox="0 0 40 24"
      className="w-8 h-5 sm:w-9 sm:h-6 text-[#173F35] shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="4" height="14" rx="2" fill="#789575" />
      <rect x="7.5" y="2" width="5" height="20" rx="2.2" />
      <rect x="12.5" y="9.5" width="15" height="5" rx="1.5" />
      <rect x="27.5" y="2" width="5" height="20" rx="2.2" />
      <rect x="34" y="5" width="4" height="14" rx="2" fill="#789575" />
    </svg>
  );
}

/**
 * Navigation Header
 * - Navbar background: rgba(255,255,255,0.75)
 * - Navbar active indicator: #789575
 * - Primary buttons: #173F35 | Hover: #789575
 * - Headings: #263B2D | Body text: #657565 | Borders: #D2D9C5
 */
export function Navbar() {
  const navigate = useNavigate();
  const {
    setIsSearchModalOpen,
    savedExerciseSlugs,
    setDiscoveryFilters,
  } = useGymGuide();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpenSaved = () => {
    setDiscoveryFilters((prev) => ({
      ...prev,
      savedOnly: true,
    }));
    setMenuOpen(false);
    navigate('/exercises?saved=true');
  };

  return (
    <header
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)' }}
      className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-[#D2D9C5]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Dumbbell Icon + GymGuide Text */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <DumbbellBrandLogo />
          <span className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-[#263B2D]">
            Gym<span className="text-[#789575]">Guide</span>
          </span>
        </Link>

        {/* Center Desktop Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F1F2E8] p-1 rounded-full border border-[#D2D9C5]">
          {MENU_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#789575] text-white shadow-sm'
                    : 'text-[#657565] hover:text-[#263B2D]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Search Icon + Saved Button + Hamburger Menu Icon */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="p-2.5 rounded-full text-[#263B2D] hover:bg-[#789575] hover:text-white transition-colors"
            aria-label="Open search"
            title="Search exercises and muscles"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            type="button"
            onClick={handleOpenSaved}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedExerciseSlugs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2.5 rounded-full text-[#263B2D] hover:bg-[#789575] hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Menu className="w-6 h-6 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Hamburger Navigation Drawer */}
      {menuOpen && (
        <div className="bg-[#F1F2E8] border-b border-[#D2D9C5] px-4 pt-3 pb-5 shadow-lg">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MENU_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${
                    isActive
                      ? 'bg-[#789575] text-white border-[#789575]'
                      : 'bg-[#E5E8CE]/60 text-[#263B2D] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleOpenSaved}
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold bg-[#173F35] hover:bg-[#789575] text-white border border-[#173F35] transition-all"
            >
              <span className="flex items-center gap-3">
                <Bookmark className="w-4 h-4" />
                <span>Saved Exercises</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                {savedExerciseSlugs.length}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
