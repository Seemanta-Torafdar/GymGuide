import React, { useEffect, useRef, useState } from 'react';
import {
  loadGymGuide2DSprites,
  renderGymGuide2DFrame,
} from '../../utils/gymGuide2DRig';

/**
 * Interactive 2D Articulated GymGuide Character Performer
 * Uses the user's real ?v=7 PNG model images sliced into anatomical joints,
 * performing the selected exercise with the chosen gym equipment and live muscle highlights.
 */
export function AnatomicalPerformerCanvas({
  exercise,
  equipmentSlug = 'ALL',
  phaseProgress = 0.5,
  activeIntensity = 0.85,
  compact = false,
  accentMode = 'crimson',
  isDarkTheme = false,
  motionDirection = null,
  showHud = !compact,
  className = '',
}) {
  const canvasRef = useRef(null);
  const [sprites, setSprites] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadGymGuide2DSprites()
      .then((loaded) => {
        if (mounted) setSprites(loaded);
      })
      .catch((err) => {
        console.error('Failed to load GymGuide 2D sprites:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sprites || !exercise) return;

    const ctx = canvas.getContext('2d');
    const w = compact ? 640 : 1280;
    const h = compact ? 360 : 720;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    renderGymGuide2DFrame(ctx, sprites, {
      width: w,
      height: h,
      exercise,
      equipmentSlug,
      phaseProgress,
      activeIntensity,
      accentMode,
      showMuscleOverlay: true,
      showHud,
      repCount: 1,
      isDarkTheme,
      motionDirection,
    });
  }, [
    sprites,
    exercise,
    equipmentSlug,
    phaseProgress,
    activeIntensity,
    compact,
    accentMode,
    isDarkTheme,
    motionDirection,
    showHud,
  ]);

  if (!exercise) return null;

  if (exercise.slug === 'incline-dumbbell-bench-press') {
    const p = Number(phaseProgress ?? 0.5);
    const curatedSrc = compact
      ? '/images/exercises/incline-dumbbell-bench-press/hero-press.webp?v=2'
      : p < 0.18
      ? '/images/exercises/incline-dumbbell-bench-press/step-01-starting.webp?v=2'
      : p > 0.82
      ? '/images/exercises/incline-dumbbell-bench-press/step-03-contraction.webp?v=2'
      : motionDirection === 'eccentric' || (p >= 0.18 && p < 0.38)
      ? '/images/exercises/incline-dumbbell-bench-press/step-04-return-muscle.webp?v=2'
      : '/images/exercises/incline-dumbbell-bench-press/step-02-movement.webp?v=2';

    return (
      <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-xl bg-[#121820]">
        <img
          src={curatedSrc}
          alt={`${exercise.name} 3D visual demonstration`}
          className={`block w-full h-full object-cover ${
            className || (compact ? 'max-h-44 rounded-xl' : 'max-h-[280px] sm:max-h-[340px] rounded-xl')
          }`}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={compact ? 640 : 1280}
        height={compact ? 360 : 720}
        aria-label={`${exercise.name} performed by 2D GymGuide character model`}
        className={`block w-full h-full object-contain ${
          className || (compact ? 'max-h-44 rounded-xl' : 'max-h-[280px] sm:max-h-[340px] rounded-xl')
        }`}
      />
    </div>
  );
}
