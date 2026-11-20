import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Dumbbell,
  Calendar,
  Bookmark,
} from 'lucide-react';
import { useGymGuide } from '../context/GymGuideContext';

export function MuscleTorsoIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.5 3.5h5l1.5 2.5 3.5 1.5c1 .4 1.5 1.5 1.3 2.6l-.8 4.4c-.2 1-.9 1.5-1.8 1.5h-.7" />
      <path d="M9.5 3.5L8 6 4.5 7.5C3.5 7.9 3 9 3.2 10.1l.8 4.4c.2 1 .9 1.5 1.8 1.5h.7" />
      <path d="M6.5 9.5c1.5 1.8 4 2 5.5 1 1.5 1 4 .8 5.5-1" />
      <path d="M7 11l1 9.5h8L17 11" />
      <line x1="12" y1="10.5" x2="12" y2="20" />
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
      <line x1="9.5" y1="17.5" x2="14.5" y2="17.5" />
    </svg>
  );
}

/**
 * Fixed Bottom Navigation Bar
 * Navbar background: rgba(255,255,255,0.75)
 * Active indicator: #789575
 */
export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { discoveryFilters, setDiscoveryFilters } = useGymGuide();

  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const isSavedActive =
    pathname === '/exercises' &&
    (searchParams.get('saved') === 'true' || discoveryFilters.savedOnly);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: pathname === '/',
      onClick: () => {
        setDiscoveryFilters((prev) => ({ ...prev, savedOnly: false }));
        navigate('/');
      },
    },
    {
      id: 'exercises',
      label: 'Exercises',
      icon: Dumbbell,
      isActive: pathname.startsWith('/exercises') && !isSavedActive,
      onClick: () => {
        setDiscoveryFilters((prev) => ({ ...prev, savedOnly: false }));
        navigate('/exercises');
      },
    },
    {
      id: 'muscle-map',
      label: 'Muscle Map',
      icon: MuscleTorsoIcon,
      isActive: pathname === '/explorer' || pathname === '/muscles',
      onClick: () => {
        setDiscoveryFilters((prev) => ({ ...prev, savedOnly: false }));
        navigate('/explorer');
      },
    },
    {
      id: 'workouts',
      label: 'Workouts',
      icon: Calendar,
      isActive: pathname.startsWith('/workout-plans'),
      onClick: () => {
        setDiscoveryFilters((prev) => ({ ...prev, savedOnly: false }));
        navigate('/workout-plans');
      },
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: Bookmark,
      isActive: isSavedActive,
      onClick: () => {
        setDiscoveryFilters((prev) => ({ ...prev, savedOnly: true }));
        navigate('/exercises?saved=true');
      },
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.82)' }}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t border-[#D2D9C5] px-2 pt-1.5 pb-2"
    >
      <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
        {navItems.map(({ id, label, icon: Icon, isActive, onClick }) => (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              isActive
                ? 'bg-[#789575] text-white shadow-sm'
                : 'text-[#657565] hover:text-[#263B2D]'
            }`}
          >
            <Icon
              className={`w-5 h-5 mb-0.5 transition-transform ${
                isActive ? 'scale-105 stroke-[2.3]' : 'stroke-[1.9]'
              }`}
            />
            <span
              className={`text-[11px] leading-tight ${
                isActive ? 'font-bold text-white' : 'font-medium text-[#657565]'
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
