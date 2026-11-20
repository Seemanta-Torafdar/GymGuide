import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';
import { MyWorkoutDrawer } from '../components/common/MyWorkoutDrawer';

export function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#E5E8CE] text-[#657565] pb-20 lg:pb-0">
      <Navbar />
      <GlobalSearchModal />
      <MyWorkoutDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
