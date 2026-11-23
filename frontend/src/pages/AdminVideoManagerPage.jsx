import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Video,
  Upload,
  Link2,
  Trash2,
  CheckCircle2,
  Circle,
  Search,
  ExternalLink,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Save,
  RefreshCw,
  Shield,
  LogOut,
  Images,
  HardDrive,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { ExerciseVisualDemo } from '../components/exercises/ExerciseVisualDemo';
import { Batch2DVideoGeneratorPanel } from '../components/exercises/Batch2DVideoGeneratorPanel';
import {
  SecureInstructionImage,
  STEP_ROLE_LABELS,
} from '../components/common/SecureMediaComponents';
import {
  SUB_MUSCLE_CATALOG,
  deriveActiveSubMuscleIdsForExercise,
} from '../data/characterHitRegions';
import { gymGuideApi } from '../services/api.service';
import {
  DISCOVERY_EQUIPMENT_FILTERS,
  EXERCISE_CATEGORIES,
  formatDifficultyLabel,
  getChestSubRegionLabel,
  getEquipmentDisplayLabel,
} from '../utils/formatters';

function matchesEquipmentFilter(ex, eqSlug) {
  if (!eqSlug || eqSlug === 'ALL') return true;
  return (ex.equipment || []).some((eq) => {
    const s = (eq.slug || '').toLowerCase();
    if (eqSlug === 'cable-machine') return s.includes('cable');
    if (eqSlug === 'dumbbell') return s.includes('dumbbell');
    if (eqSlug === 'barbell') return s.includes('barbell') || s.includes('ez-curl');
    if (eqSlug === 'machine') return s === 'machine' || s.includes('smith');
    if (eqSlug === 'bodyweight') {
      return s === 'bodyweight' || s === 'dip-station' || s === 'pull-up-bar';
    }
    return s === eqSlug;
  });
}

function getSmartTargetLabel(ex) {
  if (!ex) return '';
  if (ex.targetMusclePart) return ex.targetMusclePart;
  if ((ex.category || '').toLowerCase() === 'chest') {
    return getChestSubRegionLabel(ex);
  }
  const headIds = Array.from(deriveActiveSubMuscleIdsForExercise(ex));
  const primarySlugs = new Set((ex.primaryMuscles || []).map((m) => m.slug));
  const matchingHead = headIds
    .map((id) => SUB_MUSCLE_CATALOG[id])
    .find((meta) => meta && primarySlugs.has(meta.slug));
  return matchingHead?.shortName || ex.primaryMuscles?.[0]?.name || ex.category || '';
}

function formatFileSize(bytes = 0) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminVideoManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Auth & MinIO infrastructure status
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [storageStatus, setStorageStatus] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [overviewBySlug, setOverviewBySlug] = useState({});
  const [loading, setLoading] = useState(true);

  // View Mode & Filters
  const [viewMode, setViewMode] = useState('STUDIO'); // 'STUDIO' | 'MATRIX'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedEquipmentSlug, setSelectedEquipmentSlug] = useState('ALL');
  const [uploadStatusFilter, setUploadStatusFilter] = useState('ALL'); // 'ALL' | 'MISSING_VIDEO' | 'MISSING_STEPS' | 'COMPLETE' | 'HAS_MEDIA'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseSlug, setSelectedExerciseSlug] = useState(
    searchParams.get('exercise') || ''
  );

  // Active exercise video state
  const [targetMusclePart, setTargetMusclePart] = useState('');
  const [uploadAngle, setUploadAngle] = useState('front');
  const [videoUrl, setVideoUrl] = useState('');
  const [sideVideoUrl, setSideVideoUrl] = useState('');
  const [showSideUrlInput, setShowSideUrlInput] = useState(false);
  const [videoNotes, setVideoNotes] = useState('');
  const [stagedVideoFile, setStagedVideoFile] = useState(null);
  const [stagedVideoPreviewUrl, setStagedVideoPreviewUrl] = useState('');
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [failedVideoUploadFile, setFailedVideoUploadFile] = useState(null);

  // 4-step instructional image state
  const [stagedStepFiles, setStagedStepFiles] = useState({}); // { [1..4]: { file, previewUrl } }
  const [stepErrors, setStepErrors] = useState({}); // { [1..4]: string }
  const [savingStep, setSavingStep] = useState(null);
  const [batchQueuedSteps, setBatchQueuedSteps] = useState([]); // [{ file, previewUrl, stepNumber, status, error }]
  const [batchUploading, setBatchUploading] = useState(false);

  // Save / migration banner state
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState(null);
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);

  const isAdmin = authUser?.role === 'ADMIN';
  const minioOnline = Boolean(storageStatus?.connected);

  // Cleanup staged blob URLs safely
  useEffect(() => {
    return () => {
      if (stagedVideoPreviewUrl && stagedVideoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(stagedVideoPreviewUrl);
      }
    };
  }, [stagedVideoPreviewUrl]);

  const loadAllStudioData = async (preserveSlug = true) => {
    setLoading(true);
    try {
      const [exRes, overviewRes, statusRes] = await Promise.all([
        gymGuideApi.getExercises({ limit: 100 }, true),
        gymGuideApi.getMediaOverview().catch(() => null),
        gymGuideApi.getMediaStatus().catch(() => null),
      ]);

      const catOrder = EXERCISE_CATEGORIES.map((c) => c.name.toLowerCase());
      const sorted = [...(exRes.exercises || [])].sort((a, b) => {
        const ca = catOrder.indexOf((a.category || '').toLowerCase());
        const cb = catOrder.indexOf((b.category || '').toLowerCase());
        if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
        return (a.name || '').localeCompare(b.name || '');
      });
      setExercises(sorted);

      if (overviewRes?.items) {
        const map = {};
        overviewRes.items.forEach((item) => {
          map[item.slug] = item;
        });
        setOverviewBySlug(map);
        setStorageStatus(overviewRes.storage || statusRes);
      } else if (statusRes) {
        setStorageStatus(statusRes);
      }

      const paramEx = searchParams.get('exercise');
      if (paramEx) {
        const found = sorted.find((e) => e.slug === paramEx);
        if (found) {
          setSelectedCategory(found.category || 'ALL');
          setSelectedExerciseSlug(found.slug);
          return;
        }
      }
      if (!preserveSlug || !selectedExerciseSlug) {
        if (sorted.length > 0) setSelectedExerciseSlug(sorted[0].slug);
      }
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Unable to load Admin Studio data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      setAuthLoading(true);
      try {
        const me = await gymGuideApi.getMe();
        if (active) setAuthUser(me?.user || null);
      } catch (_) {
        if (active) setAuthUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
      await loadAllStudioData(false);
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const data = await gymGuideApi.login(loginEmail.trim(), loginPassword);
      setAuthUser(data?.user || null);
      setLoginPassword('');
      if (data?.user?.role !== 'ADMIN') {
        setLoginError('Signed in, but an ADMIN role account is required to upload or delete MinIO media.');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await gymGuideApi.logout().catch(() => {});
    setAuthUser(null);
  };

  const categoryExercises = useMemo(() => {
    if (selectedCategory === 'ALL') return exercises;
    return exercises.filter(
      (ex) => (ex.category || '').toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [exercises, selectedCategory]);

  const matchingWorkouts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categoryExercises.filter((ex) => {
      if (!matchesEquipmentFilter(ex, selectedEquipmentSlug)) return false;

      const ov = overviewBySlug[ex.slug];
      const hasVid = Boolean(ov?.hasVideo || ex.hasCustomVideo);
      const stepCount = ov?.stepCount || 0;

      if (uploadStatusFilter === 'MISSING_VIDEO' && hasVid) return false;
      if (uploadStatusFilter === 'MISSING_STEPS' && stepCount === 4) return false;
      if (uploadStatusFilter === 'COMPLETE' && (!hasVid || stepCount < 4)) return false;
      if (uploadStatusFilter === 'HAS_MEDIA' && !hasVid && stepCount === 0) return false;

      if (q) {
        const match =
          ex.name.toLowerCase().includes(q) ||
          (ex.category || '').toLowerCase().includes(q) ||
          (ex.primaryMuscles || []).some((m) => m.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [
    categoryExercises,
    selectedEquipmentSlug,
    uploadStatusFilter,
    searchQuery,
    overviewBySlug,
  ]);

  const selectedIndex = useMemo(() => {
    const idx = matchingWorkouts.findIndex((e) => e.slug === selectedExerciseSlug);
    return idx >= 0 ? idx : matchingWorkouts.length > 0 ? 0 : -1;
  }, [matchingWorkouts, selectedExerciseSlug]);

  const selectedExercise = selectedIndex >= 0 ? matchingWorkouts[selectedIndex] : null;
  const activeOverview = selectedExercise ? overviewBySlug[selectedExercise.slug] : null;

  const exerciseTargetPartOptions = useMemo(() => {
    if (!selectedExercise) return [];
    const options = [];
    if ((selectedExercise.category || '').toLowerCase() === 'chest') {
      options.push(getChestSubRegionLabel(selectedExercise));
    }
    Array.from(deriveActiveSubMuscleIdsForExercise(selectedExercise)).forEach((id) => {
      const meta = SUB_MUSCLE_CATALOG[id];
      if (meta && !options.includes(meta.shortName)) {
        options.push(meta.shortName);
      }
    });
    (selectedExercise.primaryMuscles || []).forEach((m) => {
      if (m.name && !options.includes(m.name)) options.push(m.name);
    });
    return options;
  }, [selectedExercise]);

  useEffect(() => {
    if (!selectedExercise) return;
    setVideoUrl(selectedExercise.videoUrl || selectedExercise.mediaUrl || '');
    setSideVideoUrl(selectedExercise.sideVideoUrl || '');
    setShowSideUrlInput(Boolean(selectedExercise.sideVideoUrl));
    setVideoNotes(selectedExercise.videoNotes || '');
    setTargetMusclePart(
      selectedExercise.targetMusclePart ||
        exerciseTargetPartOptions[0] ||
        getSmartTargetLabel(selectedExercise)
    );
    setStagedVideoFile(null);
    setStagedVideoPreviewUrl('');
    setFailedVideoUploadFile(null);
    Object.values(stagedStepFiles).forEach((entry) => {
      if (entry?.previewUrl && entry.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    });
    batchQueuedSteps.forEach((entry) => {
      if (entry?.previewUrl && entry.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    });
    setStagedStepFiles({});
    setStepErrors({});
    setBatchQueuedSteps([]);
    setStatusBanner(null);
  }, [selectedExercise?.slug]);

  const selectWorkout = (slug, switchToStudio = false) => {
    setSelectedExerciseSlug(slug);
    setSearchParams({ exercise: slug }, { replace: true });
    if (switchToStudio) setViewMode('STUDIO');
  };

  const stepQueue = (delta) => {
    if (matchingWorkouts.length === 0) return;
    const nextIdx =
      (selectedIndex + delta + matchingWorkouts.length) % matchingWorkouts.length;
    selectWorkout(matchingWorkouts[nextIdx].slug);
  };

  const jumpToNextMissing = () => {
    const pool = matchingWorkouts.length > 0 ? matchingWorkouts : exercises;
    const currentIdx = pool.findIndex((e) => e.slug === selectedExercise?.slug);
    const ordered =
      currentIdx >= 0
        ? [...pool.slice(currentIdx + 1), ...pool.slice(0, currentIdx + 1)]
        : pool;
    const nextMissing =
      ordered.find((e) => !e.hasCustomVideo && e.slug !== selectedExercise?.slug) ||
      exercises.find((e) => !e.hasCustomVideo && e.slug !== selectedExercise?.slug);

    if (nextMissing) {
      if (
        selectedCategory !== 'ALL' &&
        (nextMissing.category || '').toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        setSelectedCategory('ALL');
        setSelectedEquipmentSlug('ALL');
      }
      selectWorkout(nextMissing.slug, true);
    } else {
      setStatusBanner({
        type: 'success',
        text: 'All exercises already have video coverage.',
      });
    }
  };

  const stageVideoFile = (file) => {
    if (!file || !selectedExercise) return;
    const validExt = /\.(mp4|webm|mov)$/i.test(file.name);
    if (!file.type.startsWith('video/') && !validExt) {
      setStatusBanner({
        type: 'error',
        text: 'Please choose a valid MP4, WebM, or MOV video file.',
      });
      return;
    }
    const maxMb = 100;
    if (file.size > maxMb * 1024 * 1024) {
      setStatusBanner({
        type: 'error',
        text: `Video exceeds ${maxMb} MB limit.`,
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setStagedVideoFile(file);
    setStagedVideoPreviewUrl(previewUrl);
    setFailedVideoUploadFile(null);
    setStatusBanner({
      type: 'info',
      text: `Video staged (${formatFileSize(file.size)}). Click "Save Video to MinIO" below to commit.`,
    });
  };

  const handleSaveVideo = async (e, retryFile = null) => {
    if (e) e.preventDefault();
    if (!selectedExercise) return;

    const fileToUpload = retryFile || stagedVideoFile;
    if (fileToUpload) {
      if (!isAdmin) {
        setStatusBanner({
          type: 'error',
          text: 'Admin sign-in is required to upload videos to MinIO.',
        });
        return;
      }
      setSaving(true);
      setStatusBanner({
        type: 'info',
        text: `Uploading "${fileToUpload.name}" to MinIO (${targetMusclePart || selectedExercise.category})...`,
      });
      try {
        await gymGuideApi.uploadMediaFile({
          file: fileToUpload,
          exerciseSlug: selectedExercise.slug,
          mediaType: 'VIDEO',
          angle: uploadAngle,
          targetMusclePart,
          notes: videoNotes.trim(),
        });
        setStagedVideoFile(null);
        setStagedVideoPreviewUrl('');
        setFailedVideoUploadFile(null);
        await loadAllStudioData(true);
        setStatusBanner({
          type: 'success',
          text: `Uploaded to MinIO & saved metadata for "${selectedExercise.name}". Live now on /exercises.`,
          showNextMissing: true,
        });
      } catch (err) {
        setFailedVideoUploadFile(fileToUpload);
        setStatusBanner({
          type: 'error',
          text: err.message || 'MinIO video upload failed.',
          canRetryVideo: true,
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    const cleanUrl = videoUrl.trim();
    const cleanSideUrl = sideVideoUrl.trim();
    if (!cleanUrl && !cleanSideUrl) {
      setStatusBanner({
        type: 'error',
        text: 'Select a video file or paste a video URL first.',
      });
      return;
    }

    setSaving(true);
    try {
      await gymGuideApi.updateExerciseVideo(selectedExercise.slug, {
        videoUrl: cleanUrl,
        sideVideoUrl: cleanSideUrl,
        videoNotes: videoNotes.trim(),
        targetMusclePart,
        targetEquipment:
          selectedEquipmentSlug !== 'ALL'
            ? selectedEquipmentSlug
            : selectedExercise.equipment?.[0]?.name || '',
      });
      await loadAllStudioData(true);
      setStatusBanner({
        type: 'success',
        text: `Saved video metadata for "${selectedExercise.name}".`,
        showNextMissing: true,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Failed to save video metadata.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMinioMedia = async (mediaItem, label) => {
    if (!mediaItem?.id || !isAdmin) return;
    setSaving(true);
    try {
      await gymGuideApi.deleteMediaItem(mediaItem.id);
      await loadAllStudioData(true);
      setStatusBanner({
        type: 'info',
        text: `Deleted ${label} (${mediaItem.objectKey}) from MinIO and PostgreSQL.`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || `Failed to delete ${label}.`,
      });
    } finally {
      setSaving(false);
    }
  };

  // --- 4-STEP INSTRUCTIONAL IMAGE HANDLERS ---
  const handleStageStepImage = (stepNumber, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setStepErrors((prev) => ({
        ...prev,
        [stepNumber]: 'Use JPG, PNG, or WebP image files.',
      }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setStagedStepFiles((prev) => ({
      ...prev,
      [stepNumber]: { file, previewUrl },
    }));
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[stepNumber];
      return next;
    });
  };

  const handleUploadSingleStepImage = async (stepNumber, overrideFile = null) => {
    if (!selectedExercise || !isAdmin) {
      setStepErrors((prev) => ({
        ...prev,
        [stepNumber]: 'Admin sign-in is required.',
      }));
      return;
    }
    const staged = stagedStepFiles[stepNumber];
    const file = overrideFile || staged?.file;
    if (!file) return;

    setSavingStep(stepNumber);
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[stepNumber];
      return next;
    });

    try {
      await gymGuideApi.uploadMediaFile({
        file,
        exerciseSlug: selectedExercise.slug,
        mediaType: 'IMAGE',
        stepNumber,
        targetMusclePart,
      });
      setStagedStepFiles((prev) => {
        const next = { ...prev };
        delete next[stepNumber];
        return next;
      });
      await loadAllStudioData(true);
      setStatusBanner({
        type: 'success',
        text: `Step ${stepNumber} WebP image saved to MinIO for "${selectedExercise.name}".`,
      });
    } catch (err) {
      setStepErrors((prev) => ({
        ...prev,
        [stepNumber]: err.message || `Failed to upload Step ${stepNumber}.`,
      }));
    } finally {
      setSavingStep(null);
    }
  };

  const handleQueueBatchStepFiles = (fileList) => {
    const incoming = Array.from(fileList || []).slice(0, 4);
    const items = incoming.map((file, idx) => {
      const nameMatch = file.name.match(/step[-_ ]?0?([1-4])/i);
      const guessedStep = nameMatch ? parseInt(nameMatch[1], 10) : Math.min(4, idx + 1);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        stepNumber: guessedStep,
        status: 'ready',
        error: null,
      };
    });
    setBatchQueuedSteps(items);
  };

  const handleUploadBatchSteps = async (onlyFailed = false) => {
    if (!selectedExercise || !isAdmin || batchQueuedSteps.length === 0) return;
    const targets = onlyFailed
      ? batchQueuedSteps.filter((q) => q.status === 'failed')
      : batchQueuedSteps.filter((q) => q.status !== 'uploaded');
    if (targets.length === 0) return;

    setBatchUploading(true);
    try {
      const res = await gymGuideApi.uploadMultipleMediaFiles({
        files: targets.map((t) => t.file),
        items: targets.map((t) => ({
          mediaType: 'IMAGE',
          stepNumber: t.stepNumber,
          targetMusclePart,
        })),
        exerciseSlug: selectedExercise.slug,
        targetMusclePart,
      });

      const uploadedSteps = new Set((res.uploaded || []).map((u) => Number(u.stepNumber)));
      const failedByStep = new Map(
        (res.failed || []).map((f) => [Number(f.stepNumber), f.error])
      );

      setBatchQueuedSteps((prev) =>
        prev.map((q) => {
          if (uploadedSteps.has(Number(q.stepNumber))) {
            return { ...q, status: 'uploaded', error: null };
          }
          if (failedByStep.has(Number(q.stepNumber))) {
            return {
              ...q,
              status: 'failed',
              error: failedByStep.get(Number(q.stepNumber)),
            };
          }
          return q;
        })
      );

      await loadAllStudioData(true);

      if (res.failedCount > 0) {
        setStatusBanner({
          type: 'error',
          text: `${res.uploadedCount} step image(s) uploaded, ${res.failedCount} failed. Check failed items below to retry.`,
        });
      } else {
        setStatusBanner({
          type: 'success',
          text: `Uploaded ${res.uploadedCount} WebP instructional image(s) to MinIO.`,
        });
      }
    } catch (err) {
      setBatchQueuedSteps((prev) =>
        prev.map((q) =>
          q.status === 'uploaded' ? q : { ...q, status: 'failed', error: err.message }
        )
      );
      setStatusBanner({
        type: 'error',
        text: err.message || 'Multi-image batch upload failed.',
      });
    } finally {
      setBatchUploading(false);
    }
  };

  const handleRunMigration = async () => {
    if (!isAdmin) return;
    setMigrating(true);
    setMigrationReport(null);
    try {
      const report = await gymGuideApi.migrateMediaToMinio(false);
      setMigrationReport(report);
      await loadAllStudioData(true);
      setStatusBanner({
        type: 'success',
        text: `Migration checked ${report.totalExercises} exercises: ${report.migratedFiles.length} migrated, ${report.skippedAlreadyMigrated.length} already in MinIO, ${report.failedMigrations.length} failed.`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Migration request failed.',
      });
    } finally {
      setMigrating(false);
    }
  };

  const livePreviewExercise = useMemo(() => {
    if (!selectedExercise) return null;
    const activeFront =
      uploadAngle === 'front' && stagedVideoPreviewUrl
        ? stagedVideoPreviewUrl
        : videoUrl.trim() || null;
    const activeSide =
      uploadAngle === 'side' && stagedVideoPreviewUrl
        ? stagedVideoPreviewUrl
        : sideVideoUrl.trim() || null;
    return {
      ...selectedExercise,
      videoUrl: activeFront,
      mediaUrl: activeFront,
      sideVideoUrl: activeSide,
      videoNotes: videoNotes.trim() || null,
      targetMusclePart: targetMusclePart || null,
      hasCustomVideo: Boolean(activeFront || activeSide),
    };
  }, [
    selectedExercise,
    stagedVideoPreviewUrl,
    uploadAngle,
    videoUrl,
    sideVideoUrl,
    videoNotes,
    targetMusclePart,
  ]);

  const videosConfiguredCount = useMemo(
    () => exercises.filter((e) => e.hasCustomVideo).length,
    [exercises]
  );
  const fullStepsCount = useMemo(
    () =>
      exercises.filter((e) => (overviewBySlug[e.slug]?.stepCount || 0) === 4).length,
    [exercises, overviewBySlug]
  );
  const progressPct =
    exercises.length > 0 ? Math.round((videosConfiguredCount / exercises.length) * 100) : 0;

  const canSaveVideo = Boolean(stagedVideoFile || videoUrl.trim() || sideVideoUrl.trim());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* Studio Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#D2D9C5]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#263B2D]">
            Media Studio
          </h1>

          {/* Real MinIO Health Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              minioOnline
                ? 'bg-[#F1F2E8] border-[#789575] text-[#173F35]'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <HardDrive className="w-3 h-3" />
            <span>
              {minioOnline
                ? `MinIO: ${storageStatus?.bucket || 'gymguide-media'}`
                : 'MinIO Offline (Docker required)'}
            </span>
          </span>

          {/* Progress Counters */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D2D9C5] text-[11px]">
            <span className="font-mono font-bold text-[#173F35]">
              Videos {videosConfiguredCount}/{exercises.length}
            </span>
            <span className="text-[#D2D9C5]">|</span>
            <span className="font-mono font-bold text-[#263B2D]">
              4-Step Images {fullStepsCount}/{exercises.length}
            </span>
            <div className="w-12 h-1.5 rounded-full bg-[#E5E8CE] overflow-hidden hidden sm:block">
              <div
                className="h-full bg-[#173F35] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Studio | 69-Exercise Matrix */}
          <div className="inline-flex rounded-full border border-[#D2D9C5] bg-[#F1F2E8] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('STUDIO')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                viewMode === 'STUDIO'
                  ? 'bg-[#173F35] text-white'
                  : 'text-[#657565] hover:text-[#263B2D]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                viewMode === 'MATRIX'
                  ? 'bg-[#173F35] text-white'
                  : 'text-[#657565] hover:text-[#263B2D]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>All 69 Matrix</span>
            </button>
          </div>

          <button
            type="button"
            onClick={jumpToNextMissing}
            disabled={loading || videosConfiguredCount >= exercises.length}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#173F35] hover:bg-[#789575] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
          >
            <span>Next Missing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleRunMigration}
              disabled={migrating || !minioOnline}
              title={
                minioOnline
                  ? 'Migrate local uploads into MinIO safely'
                  : 'Start MinIO Docker container first'
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D2D9C5] bg-white hover:bg-[#F1F2E8] disabled:opacity-40 text-xs font-semibold text-[#263B2D] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
              <span>{migrating ? 'Migrating...' : 'Migrate to MinIO'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowBatchGenerator((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
              showBatchGenerator
                ? 'bg-[#263B2D] text-white border-[#263B2D]'
                : 'bg-[#F1F2E8] text-[#263B2D] border-[#D2D9C5]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto 2D</span>
          </button>

          {authUser && (
            <button
              type="button"
              onClick={handleLogout}
              title={`Signed in as ${authUser.email} (${authUser.role})`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#D2D9C5] bg-white hover:bg-rose-50 text-[11px] font-semibold text-[#657565] hover:text-rose-700 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Admin Authentication Gate Banner / Card */}
      {!authLoading && !isAdmin && (
        <section className="bg-white border border-[#D2D9C5] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173F35]">
              <Shield className="w-4 h-4" />
              <span>Admin Authorization Required for MinIO Uploads & Deletions</span>
            </div>
            <p className="text-xs text-[#657565]">
              {authUser
                ? `Signed in as ${authUser.email} (${authUser.role}). Sign in with an ADMIN account to modify media.`
                : 'Sign in via HttpOnly JWT session to upload videos, convert 4-step WebP images, or delete MinIO objects.'}
            </p>
            {loginError && (
              <p className="text-xs font-semibold text-rose-700">{loginError}</p>
            )}
          </div>

          <form onSubmit={handleLogin} className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Admin email"
              className="px-3 py-2 rounded-xl border border-[#D2D9C5] text-xs text-[#263B2D] bg-[#F1F2E8]/40 focus:bg-white focus:outline-none focus:border-[#789575]"
            />
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              className="px-3 py-2 rounded-xl border border-[#D2D9C5] text-xs text-[#263B2D] bg-[#F1F2E8]/40 focus:bg-white focus:outline-none focus:border-[#789575]"
            />
            <button
              type="submit"
              disabled={loggingIn}
              className="px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold cursor-pointer"
            >
              {loggingIn ? 'Signing in...' : 'Admin Sign In'}
            </button>
          </form>
        </section>
      )}

      {/* Migration Summary Panel */}
      {migrationReport && (
        <div className="bg-white border border-[#789575] rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <strong className="text-[#173F35]">MinIO Resumable Migration Report</strong>
            <button
              type="button"
              onClick={() => setMigrationReport(null)}
              className="text-[#657565] hover:text-[#263B2D] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#F1F2E8]">Total: <strong>{migrationReport.totalExercises}</strong></div>
            <div className="p-2 rounded-lg bg-[#F1F2E8]">Existing Videos: <strong>{migrationReport.existingVideos}</strong></div>
            <div className="p-2 rounded-lg bg-[#F1F2E8]">Migrated: <strong>{migrationReport.migratedFiles?.length || 0}</strong></div>
            <div className="p-2 rounded-lg bg-[#F1F2E8]">Skipped: <strong>{migrationReport.skippedAlreadyMigrated?.length || 0}</strong></div>
            <div className="p-2 rounded-lg bg-[#F1F2E8]">External Preserved: <strong>{migrationReport.externalPreservedReferences?.length || 0}</strong></div>
            <div className="p-2 rounded-lg bg-[#F1F2E8]">Missing / Failed: <strong>{(migrationReport.missingMedia?.length || 0) + (migrationReport.failedMigrations?.length || 0)}</strong></div>
          </div>
        </div>
      )}

      {showBatchGenerator && (
        <Batch2DVideoGeneratorPanel
          exercises={exercises}
          selectedCategory={selectedCategory === 'ALL' ? 'Chest' : selectedCategory}
          onExerciseUpdated={() => loadAllStudioData(true)}
        />
      )}

      {/* Unified Filter Bar */}
      <div className="bg-[#F1F2E8]/80 border border-[#D2D9C5] rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#173F35] text-white'
                : 'bg-white text-[#263B2D] border border-[#D2D9C5] hover:border-[#789575]'
            }`}
          >
            All ({exercises.length})
          </button>
          {EXERCISE_CATEGORIES.map((cat) => {
            const catList = exercises.filter(
              (e) => (e.category || '').toLowerCase() === cat.name.toLowerCase()
            );
            const catWithVideo = catList.filter((e) => e.hasCustomVideo).length;
            const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#173F35] text-white'
                    : 'bg-white text-[#263B2D] border border-[#D2D9C5] hover:border-[#789575]'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-[#E5E8CE]' : 'text-[#657565]'}`}>
                  {catWithVideo}/{catList.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D2D9C5]/70">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedEquipmentSlug('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                selectedEquipmentSlug === 'ALL'
                  ? 'bg-[#263B2D] text-white'
                  : 'text-[#657565] hover:bg-white'
              }`}
            >
              All Gear
            </button>
            {DISCOVERY_EQUIPMENT_FILTERS.map((eq) => {
              const count = categoryExercises.filter((ex) =>
                matchesEquipmentFilter(ex, eq.slug)
              ).length;
              return (
                <button
                  key={eq.slug}
                  type="button"
                  onClick={() => setSelectedEquipmentSlug(eq.slug)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    selectedEquipmentSlug === eq.slug
                      ? 'bg-[#263B2D] text-white'
                      : 'text-[#263B2D] bg-white border border-[#D2D9C5] hover:border-[#789575]'
                  }`}
                >
                  {eq.label} {count > 0 ? `· ${count}` : ''}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'MISSING_VIDEO', label: 'Missing Video' },
              { id: 'MISSING_STEPS', label: 'Missing Steps' },
              { id: 'COMPLETE', label: 'Complete (Video + 4)' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setUploadStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                  uploadStatusFilter === st.id
                    ? 'bg-[#173F35] text-white border-[#173F35]'
                    : 'bg-white text-[#657565] border-[#D2D9C5] hover:text-[#263B2D]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODE 1: 69-EXERCISE COVERAGE MATRIX TABLE */}
      {viewMode === 'MATRIX' ? (
        <section className="bg-white border border-[#D2D9C5] rounded-2xl overflow-hidden">
          <div className="p-3.5 border-b border-[#D2D9C5] flex flex-wrap items-center justify-between gap-2 bg-[#F1F2E8]/60">
            <span className="text-xs font-bold text-[#263B2D]">
              Showing {matchingWorkouts.length} exercises — click any row to upload or manage media
            </span>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-[#657565] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#D2D9C5] text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D2D9C5] bg-[#F1F2E8]/40 text-[11px] uppercase tracking-wider text-[#657565]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Exercise</th>
                  <th className="py-2.5 px-3">Body Part</th>
                  <th className="py-2.5 px-3">Equipment</th>
                  <th className="py-2.5 px-3">Video Status</th>
                  <th className="py-2.5 px-3 text-center">Step 1</th>
                  <th className="py-2.5 px-3 text-center">Step 2</th>
                  <th className="py-2.5 px-3 text-center">Step 3</th>
                  <th className="py-2.5 px-3 text-center">Step 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D9C5]/60">
                {matchingWorkouts.map((ex, idx) => {
                  const ov = overviewBySlug[ex.slug];
                  const eqLabel = (ex.equipment || []).map((e) => e.name).join(', ') || 'Bodyweight';
                  return (
                    <tr
                      key={ex.slug}
                      onClick={() => selectWorkout(ex.slug, true)}
                      className="hover:bg-[#F1F2E8]/70 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#657565]">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#263B2D]">{ex.name}</td>
                      <td className="py-2.5 px-3 text-[#657565]">{ex.category}</td>
                      <td className="py-2.5 px-3 text-[#657565] max-w-[160px] truncate">{eqLabel}</td>
                      <td className="py-2.5 px-3">
                        {ov?.hasMinioVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#173F35] text-white text-[10px] font-bold">
                            MinIO · {formatFileSize(ov.video?.fileSize)}
                          </span>
                        ) : ov?.hasLegacyVideo || ex.hasCustomVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5E8CE] text-[#263B2D] border border-[#D2D9C5] text-[10px] font-bold">
                            Legacy/URL
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#657565]">Missing</span>
                        )}
                      </td>
                      {[1, 2, 3, 4].map((stepNum) => {
                        const s = ov?.steps?.[stepNum];
                        return (
                          <td key={stepNum} className="py-2.5 px-3 text-center">
                            {s ? (
                              <span
                                title={`${s.originalFilename} (${formatFileSize(s.fileSize)})`}
                                className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#F1F2E8] border border-[#789575] text-[#173F35] text-[10px] font-mono font-bold"
                              >
                                {formatFileSize(s.fileSize)}
                              </span>
                            ) : (
                              <span className="text-[#D2D9C5]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* MODE 2: MASTER-DETAIL MEDIA STUDIO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT QUEUE */}
          <aside className="lg:col-span-4 bg-white border border-[#D2D9C5] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[#D2D9C5] flex items-center gap-2 bg-[#F1F2E8]/60">
              <Search className="w-3.5 h-3.5 text-[#657565] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workout..."
                className="w-full bg-transparent text-xs text-[#263B2D] placeholder-[#657565]/75 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#657565] hover:text-[#263B2D] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] font-mono text-[#657565] shrink-0">
                {matchingWorkouts.length}
              </span>
            </div>

            <div className="max-h-[720px] overflow-y-auto divide-y divide-[#D2D9C5]/60">
              {loading ? (
                <div className="py-14 text-center text-xs text-[#657565]">
                  Loading exercises...
                </div>
              ) : matchingWorkouts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2.5 text-xs text-[#657565]">
                  <p>No workouts match these filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedEquipmentSlug('ALL');
                      setUploadStatusFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#173F35] text-white font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                matchingWorkouts.map((ex, idx) => {
                  const isSelected = selectedExercise?.slug === ex.slug;
                  const ov = overviewBySlug[ex.slug];
                  const equipLabel = getEquipmentDisplayLabel(
                    ex.equipment?.[0]?.slug || ex.equipment?.[0]?.name || 'bodyweight'
                  );
                  const stepCount = ov?.stepCount || 0;

                  return (
                    <button
                      key={ex.slug}
                      type="button"
                      onClick={() => selectWorkout(ex.slug)}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#173F35] text-white'
                          : 'hover:bg-[#F1F2E8] text-[#263B2D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`text-[10px] font-mono w-5 shrink-0 ${
                            isSelected ? 'text-[#E5E8CE]/75' : 'text-[#657565]'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{ex.name}</p>
                          <p
                            className={`text-[11px] truncate ${
                              isSelected ? 'text-[#E5E8CE]/80' : 'text-[#657565]'
                            }`}
                          >
                            {selectedCategory === 'ALL' ? `${ex.category} · ` : ''}
                            {equipLabel} · {stepCount}/4 steps
                          </p>
                        </div>
                      </div>

                      {ex.hasCustomVideo || ov?.hasVideo ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-[#E5E8CE]' : 'text-[#173F35]'
                          }`}
                        />
                      ) : (
                        <Circle
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-white/40' : 'text-[#D2D9C5]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT WORKSPACE */}
          <main className="lg:col-span-8 space-y-5">
            {selectedExercise ? (
              <>
                {/* CARD 1: EXERCISE VIDEO MANAGER */}
                <form
                  onSubmit={handleSaveVideo}
                  className="bg-white border border-[#D2D9C5] rounded-2xl overflow-hidden divide-y divide-[#D2D9C5]/70"
                >
                  <div className="px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#657565]">
                        <span>{selectedExercise.category}</span>
                        <span>·</span>
                        <span>
                          {(selectedExercise.equipment || []).map((e) => e.name).join(', ') ||
                            'Bodyweight'}
                        </span>
                        <span>·</span>
                        <span>{formatDifficultyLabel(selectedExercise.difficulty)}</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-extrabold font-display text-[#263B2D] truncate mt-0.5">
                        {selectedExercise.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stepQueue(-1)}
                        disabled={matchingWorkouts.length <= 1}
                        className="p-2 rounded-lg border border-[#D2D9C5] text-[#263B2D] hover:bg-[#F1F2E8] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => stepQueue(1)}
                        disabled={matchingWorkouts.length <= 1}
                        className="p-2 rounded-lg border border-[#D2D9C5] text-[#263B2D] hover:bg-[#F1F2E8] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/exercises/${selectedExercise.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D9C5] hover:bg-[#F1F2E8] text-xs font-semibold text-[#263B2D]"
                      >
                        <span>Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Preview + MinIO Object Metadata */}
                  <div className="px-4 py-3.5 sm:px-5 bg-[#F1F2E8]/40 space-y-2.5">
                    <ExerciseVisualDemo
                      key={`${livePreviewExercise?.slug}-${stagedVideoPreviewUrl || livePreviewExercise?.videoUrl || ''}-${livePreviewExercise?.sideVideoUrl || ''}-${targetMusclePart}`}
                      exercise={livePreviewExercise}
                      size="hero"
                      heightClass="h-52 sm:h-60"
                      hideAdminButton={true}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#657565] mr-1">Target Part:</span>
                        {exerciseTargetPartOptions.map((partName) => (
                          <button
                            key={partName}
                            type="button"
                            onClick={() => setTargetMusclePart(partName)}
                            className={`px-2.5 py-1 rounded-full font-semibold border cursor-pointer ${
                              targetMusclePart === partName
                                ? 'bg-[#173F35] text-white border-[#173F35]'
                                : 'bg-white text-[#263B2D] border-[#D2D9C5]'
                            }`}
                          >
                            {partName}
                          </button>
                        ))}
                      </div>

                      {activeOverview?.video && (
                        <span className="font-mono text-[#173F35] bg-white px-2.5 py-1 rounded-full border border-[#D2D9C5]">
                          {activeOverview.video.objectKey} ·{' '}
                          {formatFileSize(activeOverview.video.fileSize)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Video Upload Controls */}
                  <div className="px-4 py-4 sm:px-5 space-y-3">
                    {statusBanner && (
                      <div
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex flex-wrap items-center justify-between gap-2 ${
                          statusBanner.type === 'success'
                            ? 'bg-[#F1F2E8] border-[#789575] text-[#173F35]'
                            : statusBanner.type === 'error'
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : 'bg-[#F1F2E8] border-[#D2D9C5] text-[#263B2D]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {statusBanner.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{statusBanner.text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBanner.canRetryVideo && failedVideoUploadFile && (
                            <button
                              type="button"
                              onClick={() => handleSaveVideo(null, failedVideoUploadFile)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                          {statusBanner.showNextMissing && (
                            <button
                              type="button"
                              onClick={jumpToNextMissing}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#173F35] text-white text-[11px] font-bold cursor-pointer"
                            >
                              <span>Next Missing</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-lg border border-[#D2D9C5] p-0.5 bg-[#F1F2E8]">
                        {['front', 'side'].map((angle) => (
                          <button
                            key={angle}
                            type="button"
                            onClick={() => setUploadAngle(angle)}
                            className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                              uploadAngle === angle
                                ? 'bg-white text-[#173F35]'
                                : 'text-[#657565]'
                            }`}
                          >
                            {angle === 'front' ? 'Front Video' : 'Side Video'}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={videoNotes}
                        onChange={(e) => setVideoNotes(e.target.value)}
                        placeholder={`Optional technique cue for ${selectedExercise.name}...`}
                        className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-[#F1F2E8]/60 border border-[#D2D9C5] text-xs text-[#263B2D]"
                      />
                    </div>

                    {stagedVideoFile ? (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#789575] bg-[#F1F2E8]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Video className="w-4 h-4 text-[#173F35] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#263B2D] truncate">
                              {stagedVideoFile.name}
                            </p>
                            <p className="text-[11px] text-[#657565]">
                              {formatFileSize(stagedVideoFile.size)} · Ready to upload to MinIO
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setStagedVideoFile(null);
                            setStagedVideoPreviewUrl('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#D2D9C5] text-[11px] font-semibold cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingVideo(true);
                        }}
                        onDragLeave={() => setIsDraggingVideo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingVideo(false);
                          const dropped = e.dataTransfer?.files?.[0];
                          if (dropped) stageVideoFile(dropped);
                        }}
                        className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer ${
                          isDraggingVideo
                            ? 'border-[#173F35] bg-[#E5E8CE]/60'
                            : 'border-[#D2D9C5] hover:border-[#789575] bg-[#F1F2E8]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#D2D9C5] flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 text-[#173F35]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#263B2D]">
                              {activeOverview?.video
                                ? 'Drop replacement MP4 / WebM / MOV here'
                                : 'Drop MP4 / WebM / MOV video here or select file'}
                            </p>
                            <p className="text-[11px] text-[#657565]">
                              Stored in MinIO bucket `gymguide-media` (max 100 MB)
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-white border border-[#D2D9C5] text-xs font-bold text-[#263B2D] shrink-0">
                          Choose Video
                        </span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) stageVideoFile(f);
                          }}
                          disabled={saving}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* URL Fallback */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-[220px] relative flex items-center">
                        <Link2 className="w-3.5 h-3.5 text-[#657565] absolute left-3" />
                        <input
                          type="text"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Or preserve external video URL (MP4 / YouTube)..."
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#D2D9C5] text-xs text-[#263B2D]"
                        />
                      </div>
                      {!showSideUrlInput && (
                        <button
                          type="button"
                          onClick={() => setShowSideUrlInput(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-[#D2D9C5] text-[11px] font-semibold text-[#657565] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Side URL</span>
                        </button>
                      )}
                    </div>

                    {showSideUrlInput && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sideVideoUrl}
                          onChange={(e) => setSideVideoUrl(e.target.value)}
                          placeholder="Optional Side-View Video URL..."
                          className="flex-1 px-3 py-2 rounded-lg border border-[#D2D9C5] text-xs text-[#263B2D]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSideVideoUrl('');
                            setShowSideUrlInput(false);
                          }}
                          className="p-2 text-[#657565] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D2D9C5]/70">
                      <div className="flex items-center gap-2">
                        {activeOverview?.video && isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMinioMedia(activeOverview.video, 'Video')}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D2D9C5] hover:bg-rose-50 text-xs font-semibold text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete MinIO Video</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={saving || !canSaveVideo || (Boolean(stagedVideoFile) && !isAdmin)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          canSaveVideo
                            ? 'bg-[#173F35] hover:bg-[#789575] text-white shadow-sm'
                            : 'bg-[#E5E8CE] text-[#657565] cursor-not-allowed'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {saving
                            ? 'Saving...'
                            : stagedVideoFile
                            ? 'Save Video to MinIO'
                            : 'Save Video'}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* CARD 2: 4-STEP INSTRUCTIONAL IMAGES (MINIO WEBP MANAGER) */}
                <section className="bg-white border border-[#D2D9C5] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D2D9C5]/70">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#173F35]">
                        <Images className="w-4 h-4" />
                        <span>4-Step Instructional Images (Auto-Optimized to WebP)</span>
                      </div>
                      <p className="text-[11px] text-[#657565] mt-0.5">
                        Upload individually or select all 4 images together · stored privately in MinIO
                      </p>
                    </div>

                    <label
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isAdmin
                          ? 'bg-[#F1F2E8] hover:bg-[#173F35] hover:text-white border-[#D2D9C5] text-[#263B2D] cursor-pointer'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Multiple Steps</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        disabled={!isAdmin || batchUploading}
                        onChange={(e) => {
                          handleQueueBatchStepFiles(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Staged Batch Multi-Image Preview & Step Assignment */}
                  {batchQueuedSteps.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#F1F2E8] border border-[#789575] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#173F35]">
                          Batch Queue ({batchQueuedSteps.length} images staged — preview before saving)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUploadBatchSteps(false)}
                            disabled={batchUploading}
                            className="px-3.5 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#789575] text-white text-xs font-bold cursor-pointer"
                          >
                            {batchUploading ? 'Uploading Batch...' : 'Save All Queued Images'}
                          </button>
                          {batchQueuedSteps.some((q) => q.status === 'failed') && (
                            <button
                              type="button"
                              onClick={() => handleUploadBatchSteps(true)}
                              disabled={batchUploading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry Failed</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setBatchQueuedSteps([])}
                            className="p-1.5 text-[#657565] hover:text-[#263B2D] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {batchQueuedSteps.map((q, idx) => (
                          <div
                            key={`${q.file.name}-${idx}`}
                            className="p-2 rounded-xl bg-white border border-[#D2D9C5] space-y-1.5"
                          >
                            <img
                              src={q.previewUrl}
                              alt={q.file.name}
                              className="w-full h-24 object-contain rounded-lg bg-[#F1F2E8]/40"
                            />
                            <p className="text-[10px] font-semibold text-[#263B2D] truncate">
                              {q.file.name} ({formatFileSize(q.file.size)})
                            </p>
                            <select
                              value={q.stepNumber}
                              disabled={q.status === 'uploaded'}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setBatchQueuedSteps((prev) =>
                                  prev.map((item, j) =>
                                    j === idx ? { ...item, stepNumber: val } : item
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-[#D2D9C5] text-[11px]"
                            >
                              {[1, 2, 3, 4].map((n) => (
                                <option key={n} value={n}>
                                  Step {n}: {STEP_ROLE_LABELS[n]}
                                </option>
                              ))}
                            </select>
                            {q.status === 'uploaded' && (
                              <span className="block text-[10px] font-bold text-[#173F35]">
                                ✓ Uploaded
                              </span>
                            )}
                            {q.status === 'failed' && (
                              <span className="block text-[10px] font-semibold text-rose-700">
                                Failed: {q.error}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual 4 Instructional Steps Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[1, 2, 3, 4].map((stepNum) => {
                      const existingImg = activeOverview?.steps?.[stepNum] || null;
                      const staged = stagedStepFiles[stepNum] || null;
                      const stepInfo = (selectedExercise.instructions || []).find(
                        (s) => Number(s.stepNumber) === stepNum
                      );
                      const label =
                        stepInfo?.title || STEP_ROLE_LABELS[stepNum] || `Step ${stepNum}`;
                      const errText = stepErrors[stepNum];
                      const isSavingThis = savingStep === stepNum;

                      return (
                        <div
                          key={stepNum}
                          className="p-3.5 rounded-xl border border-[#D2D9C5] bg-[#F1F2E8]/40 space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono font-bold uppercase text-[#173F35]">
                                Step {stepNum} · {STEP_ROLE_LABELS[stepNum]}
                              </span>
                              <h3 className="text-xs font-bold text-[#263B2D] truncate">
                                {label}
                              </h3>
                            </div>
                            {existingImg ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#173F35] text-white text-[10px] font-mono shrink-0">
                                {formatFileSize(existingImg.fileSize)}
                              </span>
                            ) : staged ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#789575] text-white text-[10px] font-bold shrink-0">
                                Staged
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-white border border-[#D2D9C5] text-[10px] text-[#657565] shrink-0">
                                Missing
                              </span>
                            )}
                          </div>

                          {/* Preview Image before saving OR Saved MinIO Image */}
                          {staged ? (
                            <div className="relative rounded-xl border border-[#789575] bg-white overflow-hidden">
                              <img
                                src={staged.previewUrl}
                                alt={`Staged Step ${stepNum}`}
                                className="w-full h-36 object-contain"
                              />
                              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-white/95 border border-[#D2D9C5] text-[10px] font-semibold">
                                Preview ({formatFileSize(staged.file.size)})
                              </span>
                            </div>
                          ) : existingImg ? (
                            <SecureInstructionImage
                              mediaItem={existingImg}
                              exerciseName={selectedExercise.name}
                              stepNumber={stepNum}
                              stepTitle={label}
                              className="h-36"
                            />
                          ) : (
                            <div className="h-36 rounded-xl border border-dashed border-[#D2D9C5] bg-white flex flex-col items-center justify-center text-center px-3 text-[11px] text-[#657565]">
                              <span>No Step {stepNum} WebP image uploaded</span>
                            </div>
                          )}

                          {existingImg && (
                            <p className="text-[10px] font-mono text-[#657565] truncate">
                              {existingImg.objectKey}
                              {existingImg.width ? ` · ${existingImg.width}×${existingImg.height}` : ''}
                            </p>
                          )}

                          {errText && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center justify-between gap-2">
                              <span className="truncate">{errText}</span>
                              {staged && (
                                <button
                                  type="button"
                                  onClick={() => handleUploadSingleStepImage(stepNum, staged.file)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-700 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Retry</span>
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <label
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                isAdmin
                                  ? 'bg-white border-[#D2D9C5] hover:border-[#789575] text-[#263B2D] cursor-pointer'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <Upload className="w-3 h-3" />
                              <span>{existingImg ? 'Replace' : 'Select Image'}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={!isAdmin || isSavingThis}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = '';
                                  if (f) handleStageStepImage(stepNum, f);
                                }}
                                className="hidden"
                              />
                            </label>

                            <div className="flex items-center gap-1.5">
                              {staged && (
                                <button
                                  type="button"
                                  onClick={() => handleUploadSingleStepImage(stepNum)}
                                  disabled={!isAdmin || isSavingThis}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#789575] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{isSavingThis ? 'Saving...' : 'Save Step'}</span>
                                </button>
                              )}

                              {existingImg && isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMinioMedia(existingImg, `Step ${stepNum} image`)
                                  }
                                  disabled={saving || isSavingThis}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D9C5] hover:bg-rose-50 text-[11px] font-semibold text-rose-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              <div className="bg-white border border-[#D2D9C5] rounded-2xl py-24 text-center text-xs text-[#657565]">
                Select a workout from the queue to upload video and 4-step instructional images.
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
