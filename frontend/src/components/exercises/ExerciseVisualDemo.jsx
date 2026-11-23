import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Columns } from 'lucide-react';
import { getEquipmentDisplayLabel, getChestSubRegionLabel } from '../../utils/formatters';
import { parseVideoSource } from '../../utils/movementKinematics';
import { AnatomicalPerformerCanvas } from './AnatomicalPerformerCanvas';
import { SecureRangeVideoPlayer } from '../common/SecureMediaComponents';

/**
 * Exercise Visual Demo
 * - Uses the user's real ?v=7 3D character cutout model with accurate sub-muscle crimson red staining
 *   alongside interactive MP4/YouTube/GIF angles when attached.
 */
export function ExerciseVisualDemo({
  exercise,
  size = 'card',
  heightClass = '',
  hideAdminButton = false,
  selectedEquipmentSlug = 'ALL',
  phaseProgress = 0.72,
}) {
  const navigate = useNavigate();
  if (!exercise) return null;

  const isHero = size === 'hero';
  const frontVideo = parseVideoSource(exercise.videoUrl || exercise.mediaUrl);
  const sideVideo = parseVideoSource(exercise.sideVideoUrl);
  const hasAnyVideo = Boolean(frontVideo || sideVideo);

  const [displayMode, setDisplayMode] = useState(
    hasAnyVideo && isHero ? 'VIDEO' : 'ILLUSTRATION'
  );
  const [videoAngle, setVideoAngle] = useState(
    frontVideo && sideVideo && isHero ? 'DUAL' : frontVideo ? 'FRONT' : 'SIDE'
  );
  const [videoError, setVideoError] = useState(false);

  const category = (exercise.category || 'Chest').toLowerCase();
  const equipmentLabel = getEquipmentDisplayLabel(
    selectedEquipmentSlug !== 'ALL'
      ? selectedEquipmentSlug
      : exercise.equipment?.[0]?.slug || exercise.equipment?.[0]?.name || 'bodyweight'
  );
  const subRegionLabel =
    exercise.targetMusclePart ||
    (category === 'chest'
      ? getChestSubRegionLabel(exercise)
      : exercise.primaryMuscles?.[0]?.name || exercise.category);

  const renderSingleVideoStream = (parsedSource, label, mediaId = null) => {
    if (!parsedSource) return null;

    return (
      <div className="relative w-full h-full bg-[#102E27] flex items-center justify-center overflow-hidden">
        {parsedSource.type === 'video' && (
          <SecureRangeVideoPlayer
            src={parsedSource.src}
            mediaId={mediaId}
            title={`${exercise.name} ${label}`}
            controls={isHero}
            onFallbackRequested={() => setDisplayMode('ILLUSTRATION')}
            className="w-full h-full object-contain bg-[#102E27]"
          />
        )}
        {parsedSource.type === 'gif' && (
          <img
            src={parsedSource.src}
            alt={`${exercise.name} ${label} demonstration`}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          />
        )}
        {parsedSource.type === 'iframe' && (
          <iframe
            src={parsedSource.src}
            title={`${exercise.name} ${label} video`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
        {label && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#F1F2E8]/95 border border-[#D2D9C5] text-[10px] font-bold text-[#263B2D] pointer-events-none">
            {label}
          </span>
        )}
      </div>
    );
  };

  const activeShowVideo = hasAnyVideo && displayMode === 'VIDEO' && !videoError;

  return (
    <div
      className={`relative w-full overflow-hidden ${
        isHero
          ? `${heightClass || 'h-72 sm:h-96'} rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5]`
          : `${heightClass || 'h-44'} bg-[#F1F2E8] border-b border-[#D2D9C5]`
      }`}
    >
      {/* Top Left Badges / Toggle */}
      {isHero && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-bold text-[#263B2D]">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span>{subRegionLabel}</span>
          </span>

          {hasAnyVideo && !videoError && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDisplayMode((prev) => (prev === 'VIDEO' ? 'ILLUSTRATION' : 'VIDEO'));
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                displayMode === 'VIDEO'
                  ? 'bg-[#173F35] text-white border-[#173F35]'
                  : 'bg-[#F1F2E8] text-[#173F35] border-[#D2D9C5] hover:bg-[#789575] hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>{displayMode === 'VIDEO' ? '3D Form' : 'Video'}</span>
            </button>
          )}

          {activeShowVideo && frontVideo && sideVideo && isHero && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setVideoAngle((prev) => (prev === 'DUAL' ? 'FRONT' : 'DUAL'));
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F2E8] text-[#263B2D] border border-[#D2D9C5] text-[11px] font-bold"
            >
              <Columns className="w-3 h-3 text-[#173F35]" />
              <span>{videoAngle === 'DUAL' ? 'Single Angle' : 'Dual Angle'}</span>
            </button>
          )}
        </div>
      )}

      {!isHero && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 border border-[#D2D9C5] text-[10px] font-bold text-[#263B2D] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>{subRegionLabel}</span>
          </span>
          {hasAnyVideo && !videoError && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDisplayMode((prev) => (prev === 'VIDEO' ? 'ILLUSTRATION' : 'VIDEO'));
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#173F35] text-white text-[10px] font-bold"
            >
              <Video className="w-2.5 h-2.5" />
              <span>{displayMode === 'VIDEO' ? 'Model' : 'Video'}</span>
            </button>
          )}
        </div>
      )}

      {isHero && (
        <div className="absolute top-3 right-3 z-20">
          <span className="px-2.5 py-1 rounded-full bg-[#173F35] text-white text-[11px] font-bold">
            {equipmentLabel}
          </span>
        </div>
      )}

      {activeShowVideo ? (
        <div className="w-full h-full">
          {videoAngle === 'DUAL' && frontVideo && sideVideo ? (
            <div className="grid grid-cols-2 w-full h-full divide-x divide-[#D2D9C5]">
              {renderSingleVideoStream(
                frontVideo,
                'Front Angle',
                (exercise.mediaItems || []).find((m) => m.mediaType === 'VIDEO' && m.angle !== 'side')?.id || null
              )}
              {renderSingleVideoStream(
                sideVideo,
                'Side Angle',
                (exercise.mediaItems || []).find((m) => m.mediaType === 'VIDEO' && m.angle === 'side')?.id || null
              )}
            </div>
          ) : (
            renderSingleVideoStream(
              frontVideo || sideVideo,
              `${exercise.name} Video`,
              (exercise.mediaItems || []).find((m) => m.mediaType === 'VIDEO')?.id || null
            )
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#F1F2E8] bg-anatomy-grid px-3 pt-6 pb-2">
          <AnatomicalPerformerCanvas
            exercise={exercise}
            equipmentSlug={selectedEquipmentSlug}
            phaseProgress={phaseProgress}
            activeIntensity={0.92}
            compact={!isHero}
            dualAngle={true}
          />
        </div>
      )}

      {isHero && !hideAdminButton && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/admin?exercise=${exercise.slug}`);
          }}
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#173F35] hover:bg-[#789575] text-xs font-bold text-white transition-colors"
        >
          <Video className="w-3.5 h-3.5" />
          <span>{hasAnyVideo ? 'Manage Video' : '+ Attach Video'}</span>
        </button>
      )}
    </div>
  );
}
