import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import HomePage from './pages/HomePage';

// Code-split secondary pages
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage'));
const MuscleExplorerPage = lazy(() => import('./pages/MuscleExplorerPage'));
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage'));
const WorkoutPlansPage = lazy(() => import('./pages/WorkoutPlansPage'));
const WorkoutPlanDetailPage = lazy(() => import('./pages/WorkoutPlanDetailPage'));
const ExerciseComparePage = lazy(() => import('./pages/ExerciseComparePage'));
const AdminVideoManagerPage = lazy(() => import('./pages/AdminVideoManagerPage'));

function PageLoader() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#11251B] border border-[#263A30] text-sm font-semibold text-[#35E68A] shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-[#35E68A] animate-ping" />
        <span>Loading GymGuide...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Homepage: Reference-Based Premium Dark Fitness Mobile App UI */}
          <Route path="/" element={<HomePage />} />
          {/* Interactive Muscle Explorer */}
          <Route path="/explorer" element={<MuscleExplorerPage />} />
          <Route path="/muscles" element={<MuscleExplorerPage />} />
          {/* Exercise Discovery & Details */}
          <Route path="/exercises" element={<ExerciseLibraryPage />} />
          <Route path="/exercises/chest" element={<ExerciseLibraryPage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          {/* Beginner Workout Plans */}
          <Route path="/workout-plans" element={<WorkoutPlansPage />} />
          <Route path="/workout-plans/:id" element={<WorkoutPlanDetailPage />} />
          {/* Exercise Comparison & Admin Videos */}
          <Route path="/compare" element={<ExerciseComparePage />} />
          <Route path="/admin" element={<AdminVideoManagerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
      );
}
