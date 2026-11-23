// ============================================================================
// GYMGUIDE - REAL 2D EXERCISE VIDEO RECORDER (HTML5 Canvas + MediaRecorder)
// Generates genuine 6-second playable WebM/MP4 binary exercise demonstration
// files directly from the 2D articulated GymGuide character engine.
// ============================================================================

import { loadGymGuide2DSprites, renderGymGuide2DFrame } from './gymGuide2DRig';

export function detectSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder API is not supported in this browser.');
  }
  const candidates = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const item of candidates) {
    if (MediaRecorder.isTypeSupported(item.mime)) {
      return item;
    }
  }
  return { mime: 'video/webm', ext: 'webm' };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to encode rendered video blob.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Records a clean 6-second (30 FPS, 2 full repetitions) animated 2D exercise demonstration
 * using the user's real GymGuide character PNG cutouts and returns a validated binary blob + dataUrl.
 */
export async function recordExercise2DVideo({
  exercise,
  equipmentSlug = 'ALL',
  durationMs = 6000,
  fps = 30,
  width = 1280,
  height = 720,
  accentMode = 'emerald',
  isDarkTheme = true,
}) {
  if (!exercise) throw new Error('Exercise object is required to record video.');
  const sprites = await loadGymGuide2DSprites();
  const format = detectSupportedVideoMimeType();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Render initial setup frame before stream capture starts
  renderGymGuide2DFrame(ctx, sprites, {
    width,
    height,
    exercise,
    equipmentSlug,
    phaseProgress: 0.05,
    accentMode,
    showMuscleOverlay: true,
    showHud: true,
    repCount: 1,
    isDarkTheme,
  });

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: format.mime,
    videoBitsPerSecond: 2600000,
  });

  const chunks = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  return new Promise((resolve, reject) => {
    let intervalId = null;
    const startTime = performance.now();

    recorder.onerror = (err) => {
      if (intervalId) clearInterval(intervalId);
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error(err?.error?.message || 'Canvas MediaRecorder error occurred.'));
    };

    recorder.onstop = async () => {
      if (intervalId) clearInterval(intervalId);
      stream.getTracks().forEach((t) => t.stop());
      try {
        const cleanMime = format.mime.split(';')[0];
        const blob = new Blob(chunks, { type: cleanMime });
        if (!blob || blob.size < 4096) {
          reject(new Error(`Generated video buffer for ${exercise.slug} was empty (${blob?.size || 0} bytes).`));
          return;
        }
        const dataUrl = await blobToDataUrl(blob);
        resolve({
          slug: exercise.slug,
          blob,
          sizeBytes: blob.size,
          mimeType: cleanMime,
          ext: format.ext,
          fileName: `${exercise.slug}.${format.ext}`,
          dataUrl,
          durationSeconds: Number((durationMs / 1000).toFixed(1)),
          resolution: `${width}x${height}`,
          fps,
        });
      } catch (e) {
        reject(e);
      }
    };

    const drawTick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // 2 complete smooth eccentric/concentric rep cycles in durationMs (6s -> 3s per rep)
      const repCycle = (t * 2) % 1;
      const repCount = Math.min(2, Math.floor(t * 2) + 1);
      const phaseProgress = 0.5 - 0.5 * Math.cos(repCycle * 2 * Math.PI);

      renderGymGuide2DFrame(ctx, sprites, {
        width,
        height,
        exercise,
        equipmentSlug,
        phaseProgress,
        accentMode,
        showMuscleOverlay: true,
        showHud: true,
        repCount,
        isDarkTheme,
      });

      if (elapsed >= durationMs) {
        clearInterval(intervalId);
        intervalId = null;
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    };

    recorder.start(250);
    intervalId = setInterval(drawTick, Math.round(1000 / fps));
  });
}
