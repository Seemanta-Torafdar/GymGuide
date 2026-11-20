import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Video,
  Upload,
  Link2,
  Trash2,
  CheckCircle2,
  Search,
  Play,
  ExternalLink,
  AlertCircle,
  Film,
  Columns,
} from 'lucide-react';
import { ExerciseVisualDemo } from '../components/exercises/ExerciseVisualDemo';
import { gymGuideApi } from '../services/api.service';
import { EXERCISE_CATEGORIES, formatDifficultyLabel } from '../utils/formatters';

const SAMPLE_DEMO_VIDEOS = [
  {
    label: 'Sample Chest Press Loop (MP4)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-on-a-bench-press-40241-large.mp4',
  },
  {
    label: 'Sample Dumbbell Workout Loop (MP4)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-lifting-dumbbells-at-the-gym-40244-large.mp4',
  },
  {
    label: 'Sample Cable / Pull Exercise Loop (MP4)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-exercising-his-back-in-the-gym-40247-large.mp4',
  },
  {
    label: 'Sample Squat / Lower Body Loop (MP4)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-with-a-barbell-40238-large.mp4',
  },
];

export default function AdminVideoManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [videoStatusFilter, setVideoStatusFilter] = useState('ALL');

  const [selectedExerciseSlug, setSelectedExerciseSlug] = useState(
    searchParams.get('exercise') || 'barbell-bench-press'
  );
  const [activeTab, setActiveTab] = useState('URL');

  const [videoUrl, setVideoUrl] = useState('');
  const [sideVideoUrl, setSideVideoUrl] = useState('');
  const [videoNotes, setVideoNotes] = useState('');
  const [uploadAngle, setUploadAngle] = useState('front');
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const res = await gymGuideApi.getExercises({ limit: 100 }, true);
      setExercises(res.exercises || []);
    } catch (err) {
      console.error('Failed to load exercises in Admin panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    const paramEx = searchParams.get('exercise');
    if (paramEx) {
      setSelectedExerciseSlug(paramEx);
    }
  }, [searchParams]);

  const selectedExercise = useMemo(() => {
    return (
      exercises.find((e) => e.slug === selectedExerciseSlug) ||
      exercises[0] ||
      null
    );
  }, [exercises, selectedExerciseSlug]);

  useEffect(() => {
    if (!selectedExercise) return;
    setVideoUrl(selectedExercise.videoUrl || selectedExercise.mediaUrl || '');
    setSideVideoUrl(selectedExercise.sideVideoUrl || '');
    setVideoNotes(selectedExercise.videoNotes || '');
    setStatusBanner(null);
  }, [selectedExercise]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      if (
        selectedCategory !== 'ALL' &&
        ex.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (videoStatusFilter === 'WITH_VIDEO' && !ex.hasCustomVideo) {
        return false;
      }
      if (videoStatusFilter === 'NO_VIDEO' && ex.hasCustomVideo) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ex.name.toLowerCase().includes(q) ||
          ex.category.toLowerCase().includes(q) ||
          (ex.primaryMuscles || []).some((m) => m.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [exercises, selectedCategory, videoStatusFilter, searchQuery]);

  const handleSelectExercise = (slug) => {
    setSelectedExerciseSlug(slug);
    setSearchParams({ exercise: slug });
  };

  const handleSaveVideoUrls = async (e) => {
    e.preventDefault();
    if (!selectedExercise) return;
    setSaving(true);
    setStatusBanner(null);
    try {
      const updated = await gymGuideApi.updateExerciseVideo(selectedExercise.slug, {
        videoUrl: videoUrl.trim(),
        sideVideoUrl: sideVideoUrl.trim(),
        videoNotes: videoNotes.trim(),
      });
      setExercises((prev) =>
        prev.map((item) => (item.slug === updated.slug ? updated : item))
      );
      setStatusBanner({
        type: 'success',
        text: `Saved demonstration video for "${updated.name}"! It is now live on the exercise card and details page.`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Failed to save video URL.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUploadChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExercise) return;

    if (file.size > 40 * 1024 * 1024) {
      setStatusBanner({
        type: 'error',
        text: 'File size exceeds 40MB maximum limit. Please choose a shorter MP4/WebM clip.',
      });
      return;
    }

    setSaving(true);
    setStatusBanner({
      type: 'info',
      text: `Uploading "${file.name}" for ${selectedExercise.name}...`,
    });

    try {
      const fileDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read video file.'));
        reader.readAsDataURL(file);
      });

      const updated = await gymGuideApi.uploadExerciseVideoFile(selectedExercise.slug, {
        fileName: file.name,
        fileDataUrl,
        angle: uploadAngle,
        videoNotes: videoNotes.trim(),
      });

      setExercises((prev) =>
        prev.map((item) => (item.slug === updated.slug ? updated : item))
      );
      setVideoUrl(updated.videoUrl || '');
      setSideVideoUrl(updated.sideVideoUrl || '');
      setStatusBanner({
        type: 'success',
        text: `Uploaded "${file.name}" (${uploadAngle.toUpperCase()} angle) for "${updated.name}"!`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Video file upload failed.',
      });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleRemoveVideo = async () => {
    if (!selectedExercise) return;
    setSaving(true);
    setStatusBanner(null);
    try {
      const updated = await gymGuideApi.removeExerciseVideo(selectedExercise.slug);
      setExercises((prev) =>
        prev.map((item) => (item.slug === updated.slug ? updated : item))
      );
      setVideoUrl('');
      setSideVideoUrl('');
      setVideoNotes('');
      setStatusBanner({
        type: 'success',
        text: `Removed custom video from "${updated.name}". Reverted to 3D X-Ray animation.`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Could not remove video.',
      });
    } finally {
      setSaving(false);
    }
  };

  const livePreviewExercise = useMemo(() => {
    if (!selectedExercise) return null;
    return {
      ...selectedExercise,
      videoUrl: videoUrl.trim() || null,
      mediaUrl: videoUrl.trim() || null,
      sideVideoUrl: sideVideoUrl.trim() || null,
      videoNotes: videoNotes.trim() || null,
      hasCustomVideo: Boolean(videoUrl.trim() || sideVideoUrl.trim()),
    };
  }, [selectedExercise, videoUrl, sideVideoUrl, videoNotes]);

  const videosConfiguredCount = exercises.filter((e) => e.hasCustomVideo).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D2D9C5]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F2E8] border border-[#D2D9C5] text-xs font-bold text-[#173F35] mb-2.5">
            <Film className="w-3.5 h-3.5 text-[#789575]" />
            <span>MuscleWiki & iMuscle Content Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#263B2D]">
            Admin Exercise Video Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#657565] mt-1 max-w-2xl">
            Select any exercise below to upload an `.mp4`/`.webm`/`.gif` video file from your
            computer or attach Front Angle &amp; Side Angle video URLs (MP4 or YouTube).
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#F1F2E8] px-4 py-2.5 rounded-xl border border-[#D2D9C5] text-xs text-[#657565]">
          <Video className="w-4 h-4 text-[#173F35]" />
          <span>
            <strong className="text-[#263B2D]">{videosConfiguredCount}</strong> /{' '}
            {exercises.length} Exercises with Custom Video
          </span>
        </div>
      </div>

      {/* Main Split Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Filterable Exercise Catalog */}
        <div className="lg:col-span-5 bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#657565] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise to attach video..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] focus:border-[#789575] text-xs text-[#263B2D] placeholder-[#657565]/70 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] text-xs font-medium text-[#263B2D] focus:border-[#789575] focus:outline-none"
              >
                <option value="ALL">All Categories (10)</option>
                {EXERCISE_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={videoStatusFilter}
                onChange={(e) => setVideoStatusFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] text-xs font-medium text-[#263B2D] focus:border-[#789575] focus:outline-none"
              >
                <option value="ALL">All Video States</option>
                <option value="WITH_VIDEO">Has Custom Video</option>
                <option value="NO_VIDEO">Using 3D X-Ray Default</option>
              </select>
            </div>
          </div>

          <div className="max-h-[540px] overflow-y-auto space-y-1.5 pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#657565]">
                Loading exercises...
              </div>
            ) : (
              filteredExercises.map((ex) => {
                const isSelected = selectedExercise?.slug === ex.slug;
                return (
                  <button
                    key={ex.slug}
                    type="button"
                    onClick={() => handleSelectExercise(ex.slug)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#173F35] border-[#173F35] text-[#F1F2E8] shadow-sm'
                        : 'bg-[#E5E8CE]/70 border-[#D2D9C5] text-[#263B2D] hover:border-[#789575]'
                    }`}
                  >
                    <div className="pr-2">
                      <p
                        className={`text-xs sm:text-sm font-bold line-clamp-1 ${
                          isSelected ? 'text-[#F1F2E8]' : 'text-[#263B2D]'
                        }`}
                      >
                        {ex.name}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isSelected ? 'text-[#E5E8CE]/80' : 'text-[#657565]'
                        }`}
                      >
                        {ex.category} • {ex.equipment?.[0]?.name || 'Bodyweight'}
                      </p>
                    </div>

                    {ex.hasCustomVideo ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#789575] text-white'
                            : 'bg-[#173F35] text-[#F1F2E8]'
                        }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>Video Live</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-mono shrink-0 ${
                          isSelected
                            ? 'bg-[#102E27] text-[#E5E8CE] border-[#789575]'
                            : 'bg-[#F1F2E8] text-[#657565] border-[#D2D9C5]'
                        }`}
                      >
                        3D X-Ray
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Video Assignment Editor & Live Dual-Angle Preview */}
        <div className="lg:col-span-7 space-y-6">
          {selectedExercise ? (
            <div className="bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#D2D9C5]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#789575]">
                    Editing Exercise Video • {selectedExercise.category}
                  </span>
                  <h2 className="text-2xl font-extrabold font-display text-[#263B2D] mt-0.5">
                    {selectedExercise.name}
                  </h2>
                  <p className="text-xs text-[#657565] mt-0.5">
                    Primary Muscle:{' '}
                    <strong className="text-[#263B2D]">
                      {(selectedExercise.primaryMuscles || [])
                        .map((m) => m.name)
                        .join(', ')}
                    </strong>{' '}
                    • Difficulty: {formatDifficultyLabel(selectedExercise.difficulty)}
                  </p>
                </div>

                <Link
                  to={`/exercises/${selectedExercise.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-xs font-bold text-[#F1F2E8] transition-colors"
                >
                  <span>View Exercise Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {statusBanner && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                    statusBanner.type === 'success'
                      ? 'bg-[#E5E8CE] border-[#789575] text-[#173F35]'
                      : statusBanner.type === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-[#E5E8CE] border-[#D2D9C5] text-[#263B2D]'
                  }`}
                >
                  {statusBanner.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{statusBanner.text}</span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-[#E5E8CE] p-1.5 rounded-xl border border-[#D2D9C5]">
                <button
                  type="button"
                  onClick={() => setActiveTab('URL')}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'URL'
                      ? 'bg-[#173F35] text-[#F1F2E8]'
                      : 'text-[#657565] hover:text-[#263B2D]'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Video URL / YouTube / MP4 Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('UPLOAD')}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'UPLOAD'
                      ? 'bg-[#173F35] text-[#F1F2E8]'
                      : 'text-[#657565] hover:text-[#263B2D]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Video File (.MP4 / .WebM / .GIF)</span>
                </button>
              </div>

              {activeTab === 'URL' ? (
                <form onSubmit={handleSaveVideoUrls} className="space-y-4">
                  <div>
                    <label
                      htmlFor="front-video-url"
                      className="block text-xs font-bold text-[#263B2D] mb-1.5"
                    >
                      Angle 1 — Primary / Front Demonstration Video URL (MP4, WebM, GIF, or YouTube)
                    </label>
                    <input
                      id="front-video-url"
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/videos/bench-press-front.mp4 or https://www.youtube.com/watch?v=..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] focus:border-[#789575] text-xs sm:text-sm text-[#263B2D] placeholder-[#657565]/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="side-video-url"
                      className="block text-xs font-bold text-[#263B2D] mb-1.5 flex items-center gap-1.5"
                    >
                      <Columns className="w-3.5 h-3.5 text-[#173F35]" />
                      <span>
                        Angle 2 — Optional Side-View Video URL (For MuscleWiki Dual-Angle View)
                      </span>
                    </label>
                    <input
                      id="side-video-url"
                      type="text"
                      value={sideVideoUrl}
                      onChange={(e) => setSideVideoUrl(e.target.value)}
                      placeholder="https://example.com/videos/bench-press-side.mp4 (optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] focus:border-[#789575] text-xs sm:text-sm text-[#263B2D] placeholder-[#657565]/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="video-notes"
                      className="block text-xs font-bold text-[#263B2D] mb-1.5"
                    >
                      Video Technique Caption / Tempo Note (Optional)
                    </label>
                    <input
                      id="video-notes"
                      type="text"
                      value={videoNotes}
                      onChange={(e) => setVideoNotes(e.target.value)}
                      placeholder="e.g., Tuck elbows 45° and pause 1 second on the chest"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] focus:border-[#789575] text-xs text-[#263B2D] placeholder-[#657565]/60 focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#E5E8CE] border border-[#D2D9C5] space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#173F35] block">
                      Quick-Fill Sample Demonstration Video Clips:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_DEMO_VIDEOS.map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          onClick={() => setVideoUrl(sample.url)}
                          className="px-2.5 py-1 rounded-lg bg-[#F1F2E8] hover:bg-[#789575] text-[11px] font-semibold text-[#263B2D] hover:text-white border border-[#D2D9C5] transition-colors"
                        >
                          + {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#173F35] hover:bg-[#789575] disabled:opacity-50 text-[#F1F2E8] text-xs sm:text-sm font-bold transition-all shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {saving ? 'Saving Video...' : `Save Video for ${selectedExercise.name}`}
                      </span>
                    </button>

                    {selectedExercise.hasCustomVideo && (
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#E5E8CE] hover:bg-rose-100 text-xs font-semibold text-[#657565] hover:text-rose-800 border border-[#D2D9C5] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Custom Video</span>
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#263B2D]">Target Camera Angle:</span>
                    <button
                      type="button"
                      onClick={() => setUploadAngle('front')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        uploadAngle === 'front'
                          ? 'bg-[#173F35] text-[#F1F2E8]'
                          : 'bg-[#E5E8CE] text-[#657565] border border-[#D2D9C5]'
                      }`}
                    >
                      Angle 1 (Front View)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadAngle('side')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        uploadAngle === 'side'
                          ? 'bg-[#173F35] text-[#F1F2E8]'
                          : 'bg-[#E5E8CE] text-[#657565] border border-[#D2D9C5]'
                      }`}
                    >
                      Angle 2 (Side View)
                    </button>
                  </div>

                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#789575] hover:border-[#173F35] rounded-2xl bg-[#E5E8CE] cursor-pointer transition-all text-center">
                    <Upload className="w-10 h-10 text-[#173F35] mb-3" />
                    <span className="text-sm font-bold text-[#263B2D]">
                      Click to Choose a Video File for {selectedExercise.name}
                    </span>
                    <span className="text-xs text-[#657565] mt-1">
                      Supports `.mp4`, `.webm`, `.mov`, or `.gif` (up to 40 MB)
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,image/gif"
                      onChange={handleFileUploadChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Live Preview Player */}
              <div className="pt-4 border-t border-[#D2D9C5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#173F35] flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    <span>Live Exercise Player Preview ({selectedExercise.name})</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#657565]">
                    {livePreviewExercise?.hasCustomVideo
                      ? 'Playing Custom Video Stream'
                      : 'Showing 3D X-Ray Default'}
                  </span>
                </div>

                <ExerciseVisualDemo
                  key={`${livePreviewExercise?.slug}-${livePreviewExercise?.videoUrl}-${livePreviewExercise?.sideVideoUrl}`}
                  exercise={livePreviewExercise}
                  size="hero"
                  hideAdminButton={true}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
