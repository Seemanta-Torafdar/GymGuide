import React, { useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Film,
  Video,
} from 'lucide-react';
import { recordExercise2DVideo } from '../../utils/video2dRecorder';
import { gymGuideApi } from '../../services/api.service';

const DEFAULT_MASTER_PROMPT =
  '2D GymGuide articulated PNG character performing complete anatomical range of motion with matched gym equipment, zero camera cuts, and synchronized muscle activation highlighting across two smooth repetitions (6 seconds).';

/**
 * One-Prompt Automated 2D Exercise Video Library Generator
 * Reads the complete loaded exercise library automatically and uses Chrome Canvas MediaRecorder
 * + the user's real GymGuide 2D character sprites to batch-generate and attach separate
 * demonstration videos for every exercise without paid external APIs.
 */
export function Batch2DVideoGeneratorPanel({
  exercises = [],
  selectedCategory = 'ALL',
  onExerciseUpdated,
}) {
  const [masterPrompt, setMasterPrompt] = useState(DEFAULT_MASTER_PROMPT);
  const [scope, setScope] = useState('ALL'); // 'ALL' | 'MISSING' | 'CATEGORY'
  const [accentMode, setAccentMode] = useState('emerald'); // 'emerald' | 'crimson'
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [jobStates, setJobStates] = useState({}); // { [slug]: { status, url, sizeBytes, error, ext } }
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [previewClip, setPreviewClip] = useState(null);
  const cancelFlagRef = useRef(false);

  const targetExercises = useMemo(() => {
    if (scope === 'CATEGORY' && selectedCategory !== 'ALL') {
      return exercises.filter(
        (ex) => (ex.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (scope === 'MISSING') {
      return exercises.filter(
        (ex) => !ex.videoUrl || !ex.videoUrl.startsWith('/uploads/exercise-videos/')
      );
    }
    return exercises;
  }, [exercises, scope, selectedCategory]);

  const counts = useMemo(() => {
    let generated = 0;
    let failed = 0;
    let processing = 0;
    targetExercises.forEach((ex) => {
      const st = jobStates[ex.slug]?.status;
      if (st === 'done') generated += 1;
      else if (st === 'failed') failed += 1;
      else if (st === 'recording' || st === 'uploading') processing += 1;
    });
    const pending = Math.max(0, targetExercises.length - generated - failed - processing);
    return {
      total: targetExercises.length,
      generated,
      failed,
      processing,
      pending,
    };
  }, [targetExercises, jobStates]);

  const processSingleExercise = async (exercise) => {
    setJobStates((prev) => ({
      ...prev,
      [exercise.slug]: { status: 'recording' },
    }));
    setActiveWorkers((prev) => [...new Set([...prev, exercise.name])]);

    try {
      const result = await recordExercise2DVideo({
        exercise,
        durationMs: 6000,
        fps: 30,
        width: 1280,
        height: 720,
        accentMode,
        isDarkTheme,
      });

      setJobStates((prev) => ({
        ...prev,
        [exercise.slug]: { status: 'uploading', sizeBytes: result.sizeBytes },
      }));

      const updated = await gymGuideApi.uploadExerciseVideoFile(exercise.slug, {
        fileName: result.fileName,
        fileDataUrl: result.dataUrl,
        angle: 'front',
        organizedByCategory: true,
        videoNotes: `2D GymGuide Character Video (${result.resolution}, ${result.durationSeconds}s) — ${masterPrompt.slice(0, 110)}`,
      });

      setJobStates((prev) => ({
        ...prev,
        [exercise.slug]: {
          status: 'done',
          url: updated.videoUrl,
          sizeBytes: result.sizeBytes,
          ext: result.ext,
        },
      }));
      setPreviewClip({ name: updated.name, url: updated.videoUrl });

      if (onExerciseUpdated) {
        onExerciseUpdated(updated);
      }
    } catch (err) {
      setJobStates((prev) => ({
        ...prev,
        [exercise.slug]: {
          status: 'failed',
          error: err.message || 'Generation failed',
        },
      }));
    } finally {
      setActiveWorkers((prev) => prev.filter((name) => name !== exercise.name));
    }
  };

  const runBatchQueue = async (queueList) => {
    if (!queueList.length) return;
    cancelFlagRef.current = false;
    setIsRunning(true);

    // Run cleanly with 3 parallel canvas MediaRecorders so 69 exercises complete smoothly
    const concurrency = 3;
    let index = 0;

    const worker = async () => {
      while (index < queueList.length && !cancelFlagRef.current) {
        const current = queueList[index];
        index += 1;
        await processSingleExercise(current);
        await new Promise((r) => setTimeout(r, 120));
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, queueList.length) },
      () => worker()
    );
    await Promise.all(workers);

    setIsRunning(false);
    setActiveWorkers([]);
  };

  const handleGenerateCompleteLibrary = () => {
    const initialMap = {};
    targetExercises.forEach((ex) => {
      initialMap[ex.slug] = { status: 'pending' };
    });
    setJobStates(initialMap);
    runBatchQueue(targetExercises);
  };

  const handleRetryFailed = () => {
    const failedItems = targetExercises.filter(
      (ex) => jobStates[ex.slug]?.status === 'failed'
    );
    runBatchQueue(failedItems);
  };

  const handleStop = () => {
    cancelFlagRef.current = true;
  };

  const pct =
    counts.total > 0 ? Math.round(((counts.generated + counts.failed) / counts.total) * 100) : 0;

  return (
    <section
      aria-label="Automated 2D Exercise Video Library Generator"
      className="rounded-3xl border-2 border-[#789575]/50 bg-[#F1F2E8] p-5 sm:p-6 shadow-sm space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#173F35] text-white text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Free 2D Model Auto-Batch Pipeline • 0 Paid APIs</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#263B2D]">
            One-Prompt 2D Exercise Video Library Generator
          </h2>
          <p className="text-xs sm:text-sm text-[#657565]">
            Uses your GymGuide 2D anatomical character cutouts (<code>front</code>, <code>side</code>, <code>back</code> PNG sprites) cleanly articulated per exercise to render individual 6-second demonstration videos and attach every file to its exercise automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isRunning ? (
            <button
              type="button"
              disabled={targetExercises.length === 0}
              onClick={handleGenerateCompleteLibrary}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#173F35] hover:bg-[#789575] disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                GENERATE {scope === 'ALL' ? 'COMPLETE EXERCISE LIBRARY' : `${targetExercises.length} VIDEOS`} ({targetExercises.length})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Batch Queue</span>
            </button>
          )}

          {counts.failed > 0 && !isRunning && (
            <button
              type="button"
              onClick={handleRetryFailed}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed ({counts.failed})</span>
            </button>
          )}
        </div>
      </div>

      {/* Master Prompt & Style Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-[#D2D9C5] rounded-2xl p-4 space-y-2">
          <label
            htmlFor="master-video-prompt"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#173F35]"
          >
            Master Instruction Prompt (Applied Automatically to All Exercises)
          </label>
          <textarea
            id="master-video-prompt"
            rows={3}
            value={masterPrompt}
            onChange={(e) => setMasterPrompt(e.target.value)}
            disabled={isRunning}
            className="w-full rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] px-3 py-2 text-xs text-[#263B2D] focus:border-[#789575] focus:outline-none"
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#D2D9C5] rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block text-[11px] font-bold uppercase text-[#657565] mb-1">
              Batch Scope
            </span>
            <select
              value={scope}
              disabled={isRunning}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] px-2.5 py-2 font-semibold text-[#263B2D]"
            >
              <option value="ALL">Entire Library ({exercises.length})</option>
              <option value="MISSING">Missing Generated Videos Only</option>
              {selectedCategory !== 'ALL' && (
                <option value="CATEGORY">Only {selectedCategory}</option>
              )}
            </select>
          </div>

          <div>
            <span className="block text-[11px] font-bold uppercase text-[#657565] mb-1">
              Muscle Highlight
            </span>
            <select
              value={accentMode}
              disabled={isRunning}
              onChange={(e) => setAccentMode(e.target.value)}
              className="w-full rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] px-2.5 py-2 font-semibold text-[#263B2D]"
            >
              <option value="emerald">Emerald Green (Primary Glow)</option>
              <option value="crimson">GymGuide Crimson Red</option>
            </select>
          </div>

          <div className="col-span-2 flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 font-semibold text-[#263B2D] cursor-pointer">
              <input
                type="checkbox"
                checked={isDarkTheme}
                disabled={isRunning}
                onChange={(e) => setIsDarkTheme(e.target.checked)}
                className="accent-[#173F35]"
              />
              <span>Dark Studio Video Background</span>
            </label>
            <span className="text-[11px] font-mono text-[#657565]">1280×720 HD • 30fps • 6s</span>
          </div>
        </div>
      </div>

      {/* Live Progress Counters + Preview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white border border-[#D2D9C5] p-3">
          <div className="text-[11px] font-bold uppercase text-[#657565]">Total Target</div>
          <div className="text-2xl font-extrabold text-[#263B2D]">{counts.total}</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#D2D9C5] p-3">
          <div className="text-[11px] font-bold uppercase text-emerald-700">Videos Generated</div>
          <div className="text-2xl font-extrabold text-emerald-700">{counts.generated}</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#D2D9C5] p-3">
          <div className="text-[11px] font-bold uppercase text-sky-700">Pending / Active</div>
          <div className="text-2xl font-extrabold text-sky-700">
            {counts.pending + counts.processing}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#D2D9C5] p-3">
          <div className="text-[11px] font-bold uppercase text-rose-700">Failed</div>
          <div className="text-2xl font-extrabold text-rose-700">{counts.failed}</div>
        </div>
      </div>

      {(isRunning || counts.generated > 0 || counts.failed > 0) && (
        <div className="bg-white border border-[#D2D9C5] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#173F35] flex items-center gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>
                    Recording & Uploading: {activeWorkers.join(' • ') || 'Preparing next batch...'}
                  </span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-emerald-600" />
                  <span>Batch Pipeline Status: {pct}% Completed</span>
                </>
              )}
            </span>
            <span className="font-mono font-bold text-[#263B2D]">{pct}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#E5E8CE] overflow-hidden">
            <div
              className="h-full bg-[#173F35] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Live Generated Video Preview */}
          {previewClip && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-[#D2D9C5] items-center">
              <div className="md:col-span-5">
                <video
                  key={previewClip.url}
                  src={previewClip.url}
                  autoPlay
                  loop
                  muted
                  controls
                  playsInline
                  className="w-full rounded-xl border border-[#D2D9C5] bg-slate-950"
                />
              </div>
              <div className="md:col-span-7 space-y-1 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Latest Generated Video
                </span>
                <div className="text-base font-extrabold text-[#263B2D]">{previewClip.name}</div>
                <div className="font-mono text-[11px] text-[#657565] break-all">
                  Saved Path: {previewClip.url}
                </div>
              </div>
            </div>
          )}

          {/* Queue Item Status List */}
          <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-[#D2D9C5]">
            {targetExercises.map((ex) => {
              const st = jobStates[ex.slug];
              const isGenerated = st?.status === 'done' || (!st && ex.videoUrl?.startsWith('/uploads/exercise-videos/'));
              const activeUrl = st?.url || ex.videoUrl;

              return (
                <div
                  key={ex.slug}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F1F2E8] border border-[#D2D9C5] text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[#263B2D] truncate">{ex.name}</div>
                    <div className="text-[10px] text-[#657565]">{ex.category}</div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {st?.status === 'recording' || st?.status === 'uploading' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    ) : st?.status === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" title={st.error} />
                    ) : isGenerated ? (
                      <button
                        type="button"
                        onClick={() => setPreviewClip({ name: ex.name, url: activeUrl })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer"
                      >
                        <Video className="w-3 h-3" /> Play
                      </button>
                    ) : null}

                    {!isRunning && (
                      <button
                        type="button"
                        onClick={() => processSingleExercise(ex)}
                        title="Regenerate this 2D video"
                        className="p-1 rounded-lg bg-white hover:bg-[#E5E8CE] border border-[#D2D9C5] text-[#263B2D] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
