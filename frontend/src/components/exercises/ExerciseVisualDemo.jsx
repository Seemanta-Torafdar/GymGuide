import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Columns,
} from 'lucide-react';
import { getEquipmentDisplayLabel, getChestSubRegionLabel } from '../../utils/formatters';

export function parseVideoSource(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1`,
    };
  }

  if (url.toLowerCase().endsWith('.gif')) {
    return {
      type: 'gif',
      src: url,
    };
  }

  return {
    type: 'video',
    src: url,
  };
}

export function ExerciseVisualDemo({
  exercise,
  size = 'card',
  hideAdminButton = false,
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
    exercise.equipment?.[0]?.slug || exercise.equipment?.[0]?.name || 'bodyweight'
  );
  const subRegionLabel =
    category === 'chest'
      ? getChestSubRegionLabel(exercise)
      : exercise.primaryMuscles?.[0]?.name || exercise.category;

  const renderSingleVideoStream = (parsedSource, label) => {
    if (!parsedSource) return null;

    return (
      <div className="relative w-full h-full bg-[#173F35] flex items-center justify-center overflow-hidden">
        {parsedSource.type === 'video' && (
          <video
            key={parsedSource.src}
            src={parsedSource.src}
            autoPlay
            loop
            muted
            playsInline
            controls={isHero}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
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

  /**
   * Realistic Athletic Figure Illustration on Clean Warm Cream (#F1F2E8) Card Surface
   * Matches the clean exercise demonstration cards in the reference image.
   */
  const renderAnatomicalSchematic = () => {
    const nameLower = (exercise.name || '').toLowerCase();
    const isLateral = nameLower.includes('lateral') || nameLower.includes('fly') || nameLower.includes('crossover');
    const isFrontRaise = nameLower.includes('front raise') || nameLower.includes('push-up') || nameLower.includes('pushup');
    const isBentOver = nameLower.includes('rear delt') || nameLower.includes('row') || nameLower.includes('deadlift');
    const isBenchPress =
      nameLower.includes('bench') ||
      (category === 'chest' && (nameLower.includes('press') || nameLower.includes('dumbbell') || nameLower.includes('barbell')));

    // Realistic skin & gym-wear palette matching reference image
    const skinTone = '#C68B63';
    const skinShadow = '#A56E48';
    const hairDark = '#232323';
    const shortsDark = '#1E2420';
    const weightDark = '#2B302C';

    if (isBenchPress) {
      return (
        <g>
          {/* Flat / Incline Gym Bench */}
          <rect x="46" y="136" width="148" height="7" rx="3.5" fill="#7A827C" />
          <rect x="68" y="143" width="7" height="24" rx="2" fill="#3D433F" />
          <rect x="164" y="143" width="7" height="24" rx="2" fill="#3D433F" />

          {/* Athlete Torso on Bench */}
          <circle cx="72" cy="118" r="10" fill={skinTone} />
          <path d="M 65 110 C 68 105 76 105 79 110 Z" fill={hairDark} />
          <rect x="84" y="114" width="52" height="20" rx="8" fill={skinTone} />
          {/* Active Pectoral Highlight */}
          <ellipse cx="104" cy="120" rx="14" ry="7" fill="#39B963" opacity="0.88" />
          {/* Gym Shorts & Legs */}
          <rect x="132" y="115" width="32" height="19" rx="6" fill={shortsDark} />
          <path d="M 162 122 L 184 140 L 186 164" fill="none" stroke={skinTone} strokeWidth="8" strokeLinecap="round" />

          {/* Animated Pressing Arms & Barbell/Dumbbell */}
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-22; 0,0"
              dur="2.3s"
              repeatCount="indefinite"
            />
            <line x1="104" y1="118" x2="104" y2="74" stroke={skinShadow} strokeWidth="6.5" strokeLinecap="round" />
            <line x1="78" y1="72" x2="130" y2="72" stroke="#525854" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="73" y="61" width="8" height="22" rx="2.5" fill={weightDark} />
            <rect x="127" y="61" width="8" height="22" rx="2.5" fill={weightDark} />
          </g>
        </g>
      );
    }

    if (isLateral) {
      return (
        <g>
          {/* Head & Hair */}
          <circle cx="120" cy="48" r="11" fill={skinTone} />
          <path d="M 110 43 C 112 34 128 34 130 43 Z" fill={hairDark} />
          <rect x="115" y="57" width="10" height="10" fill={skinTone} />

          {/* Muscular Torso */}
          <path d="M 96 66 L 144 66 L 136 122 L 104 122 Z" fill={skinTone} />
          <path d="M 120 68 L 120 118 M 104 86 L 136 86" stroke={skinShadow} strokeWidth="1.5" />
          {/* Shorts */}
          <path d="M 103 120 L 137 120 L 140 162 L 123 162 L 120 138 L 117 162 L 100 162 Z" fill={shortsDark} />

          {/* Lateral Raise Arms */}
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,4; 0,-6; 0,4"
              dur="2.2s"
              repeatCount="indefinite"
            />
            <path d="M 96 72 L 54 74" stroke={skinTone} strokeWidth="7" strokeLinecap="round" />
            <path d="M 144 72 L 186 74" stroke={skinTone} strokeWidth="7" strokeLinecap="round" />
            {/* Dumbbells */}
            <rect x="42" y="65" width="6" height="18" rx="2" fill={weightDark} />
            <rect x="54" y="65" width="6" height="18" rx="2" fill={weightDark} />
            <line x1="45" y1="74" x2="57" y2="74" stroke={weightDark} strokeWidth="3" />

            <rect x="180" y="65" width="6" height="18" rx="2" fill={weightDark} />
            <rect x="192" y="65" width="6" height="18" rx="2" fill={weightDark} />
            <line x1="183" y1="74" x2="195" y2="74" stroke={weightDark} strokeWidth="3" />
          </g>
        </g>
      );
    }

    if (isFrontRaise) {
      return (
        <g>
          {/* Side Profile Athlete */}
          <circle cx="106" cy="48" r="11" fill={skinTone} />
          <path d="M 96 44 C 98 34 114 34 116 44 Z" fill={hairDark} />
          <path d="M 94 64 L 118 64 L 115 120 L 95 120 Z" fill={skinTone} />
          <path d="M 94 118 L 116 118 L 118 162 L 94 162 Z" fill={shortsDark} />

          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,6; 0,-6; 0,6"
              dur="2.2s"
              repeatCount="indefinite"
            />
            <path d="M 112 72 L 156 72" stroke={skinTone} strokeWidth="7" strokeLinecap="round" />
            <rect x="152" y="62" width="7" height="20" rx="2" fill={weightDark} />
            <rect x="163" y="62" width="7" height="20" rx="2" fill={weightDark} />
            <line x1="154" y1="72" x2="168" y2="72" stroke={weightDark} strokeWidth="3" />
          </g>
        </g>
      );
    }

    if (isBentOver) {
      return (
        <g>
          {/* Bent-Over / Row / Rear Delt Figure */}
          <circle cx="120" cy="58" r="10.5" fill={skinTone} />
          <path d="M 110 53 C 112 44 128 44 130 53 Z" fill={hairDark} />
          <path d="M 96 70 L 144 70 L 136 122 L 104 122 Z" fill={skinTone} />
          <path d="M 103 120 L 137 120 L 140 162 L 123 162 L 120 138 L 117 162 L 100 162 Z" fill={shortsDark} />

          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,3; 0,-7; 0,3"
              dur="2.1s"
              repeatCount="indefinite"
            />
            <path d="M 96 76 L 56 86" stroke={skinTone} strokeWidth="7" strokeLinecap="round" />
            <path d="M 144 76 L 184 86" stroke={skinTone} strokeWidth="7" strokeLinecap="round" />
            <rect x="44" y="77" width="6" height="18" rx="2" fill={weightDark} />
            <rect x="55" y="77" width="6" height="18" rx="2" fill={weightDark} />
            <rect x="179" y="77" width="6" height="18" rx="2" fill={weightDark} />
            <rect x="190" y="77" width="6" height="18" rx="2" fill={weightDark} />
          </g>
        </g>
      );
    }

    // Default Overhead / Dumbbell Press / Curl Athletic Figure
    return (
      <g>
        {/* Head & Hair */}
        <circle cx="120" cy="56" r="11" fill={skinTone} />
        <path d="M 110 50 C 112 40 128 40 130 50 Z" fill={hairDark} />
        <rect x="115" y="65" width="10" height="10" fill={skinTone} />

        {/* Muscular Torso */}
        <path d="M 96 74 L 144 74 L 136 126 L 104 126 Z" fill={skinTone} />
        <path d="M 120 76 L 120 124 M 104 94 L 136 94" stroke={skinShadow} strokeWidth="1.5" />
        {/* Shorts */}
        <path d="M 103 124 L 137 124 L 140 164 L 123 164 L 120 142 L 117 164 L 100 164 Z" fill={shortsDark} />

        {/* Pressing Arms & Dumbbells */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,4; 0,-12; 0,4"
            dur="2.2s"
            repeatCount="indefinite"
          />
          <polyline
            points="96,80 74,80 74,46"
            fill="none"
            stroke={skinTone}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="144,80 166,80 166,46"
            fill="none"
            stroke={skinTone}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Left Dumbbell */}
          <rect x="61" y="38" width="6" height="16" rx="2" fill={weightDark} />
          <rect x="81" y="38" width="6" height="16" rx="2" fill={weightDark} />
          <line x1="65" y1="46" x2="83" y2="46" stroke={weightDark} strokeWidth="3.5" />

          {/* Right Dumbbell */}
          <rect x="153" y="38" width="6" height="16" rx="2" fill={weightDark} />
          <rect x="173" y="38" width="6" height="16" rx="2" fill={weightDark} />
          <line x1="157" y1="46" x2="175" y2="46" stroke={weightDark} strokeWidth="3.5" />
        </g>
      </g>
    );
  };

  const activeShowVideo = hasAnyVideo && displayMode === 'VIDEO' && !videoError;

  return (
    <div
      className={`relative w-full overflow-hidden ${
        isHero
          ? 'h-72 sm:h-96 rounded-2xl bg-[#F1F2E8] border border-[#D2D9C5]'
          : 'h-40 bg-[#F1F2E8]'
      }`}
    >
      {/* Hero Top Controls */}
      {isHero && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5E8CE] border border-[#D2D9C5] text-[11px] font-bold text-[#263B2D]">
            <span className="w-2 h-2 rounded-full bg-[#173F35]" />
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
              <span>{displayMode === 'VIDEO' ? 'Diagram' : 'Video'}</span>
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

      {/* Card Video Toggle Pill (Only shown on card if custom video exists) */}
      {!isHero && hasAnyVideo && !videoError && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDisplayMode((prev) => (prev === 'VIDEO' ? 'ILLUSTRATION' : 'VIDEO'));
          }}
          className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#173F35] text-white text-[10px] font-bold"
        >
          <Video className="w-2.5 h-2.5" />
          <span>{displayMode === 'VIDEO' ? 'Diagram' : 'Video'}</span>
        </button>
      )}

      {isHero && (
        <div className="absolute top-3 right-3 z-20">
          <span className="px-2.5 py-1 rounded-full bg-[#789575] text-white text-[11px] font-bold">
            {equipmentLabel}
          </span>
        </div>
      )}

      {activeShowVideo ? (
        <div className="w-full h-full">
          {videoAngle === 'DUAL' && frontVideo && sideVideo ? (
            <div className="grid grid-cols-2 w-full h-full divide-x divide-[#D2D9C5]">
              {renderSingleVideoStream(frontVideo, 'Front Angle')}
              {renderSingleVideoStream(sideVideo, 'Side Angle')}
            </div>
          ) : (
            renderSingleVideoStream(frontVideo || sideVideo, 'Demonstration Video')
          )}
        </div>
      ) : (
        <svg
          viewBox="0 0 240 175"
          className="w-full h-full object-contain px-3 pt-2"
          role="img"
          aria-label={`${exercise.name} exercise demonstration illustration`}
        >
          {renderAnatomicalSchematic()}
        </svg>
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
