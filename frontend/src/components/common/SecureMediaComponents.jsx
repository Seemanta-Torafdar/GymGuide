import React, { useState, useEffect } from 'react';
import { RefreshCw, ImageOff, Loader2, AlertCircle } from 'lucide-react';
import { gymGuideApi } from '../../services/api.service';

export const STEP_ROLE_LABELS = {
  1: 'Starting Position',
  2: 'Movement Execution',
  3: 'Peak Contraction',
  4: 'Return & Target Muscle',
};

/**
 * Responsive, lazy-loaded WebP instructional image with loading state,
 * non-distorting aspect preservation, error placeholder & signed-URL refresh retry.
 */
export function SecureInstructionImage({
  mediaItem,
  exerciseName = 'Exercise',
  stepNumber,
  stepTitle,
  className = '',
}) {
  const [src, setSrc] = useState(
    mediaItem?.streamUrl || mediaItem?.signedUrl || ''
  );
  const [status, setStatus] = useState(src ? 'loading' : 'empty');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const nextUrl = mediaItem?.streamUrl || mediaItem?.signedUrl || '';
    setSrc(nextUrl);
    setStatus(nextUrl ? 'loading' : 'empty');
  }, [mediaItem?.id, mediaItem?.streamUrl, mediaItem?.signedUrl, mediaItem?.updatedAt]);

  const handleRetry = async () => {
    if (!mediaItem?.id) return;
    setRetrying(true);
    setStatus('loading');
    try {
      const fresh = await gymGuideApi.getSignedMediaUrl(mediaItem.id);
      const nextUrl = fresh?.streamUrl || fresh?.signedUrl || '';
      if (!nextUrl) throw new Error('No signed URL returned.');
      setSrc(nextUrl);
    } catch (_) {
      setStatus('error');
    } finally {
      setRetrying(false);
    }
  };

  if (!src && status === 'empty') {
    return null;
  }

  const label = stepTitle || STEP_ROLE_LABELS[stepNumber] || `Step ${stepNumber}`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#D2D9C5] bg-[#F1F2E8] flex items-center justify-center ${className}`}
    >
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#F1F2E8]/90 z-10 text-[#657565]">
          <Loader2 className="w-5 h-5 animate-spin text-[#173F35]" />
          <span className="text-[10px] font-semibold">Loading step {stepNumber}...</span>
        </div>
      )}

      {status === 'error' ? (
        <div className="p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[120px] w-full">
          <ImageOff className="w-5 h-5 text-[#657565]" />
          <p className="text-[11px] font-medium text-[#657565]">
            Failed to load Step {stepNumber} image
          </p>
          {mediaItem?.id && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#173F35] hover:bg-[#789575] text-white text-[11px] font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : (
        <img
          src={src}
          alt={`${exerciseName} - Step ${stepNumber}: ${label}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className="w-full h-full max-h-56 object-contain bg-white"
        />
      )}
    </div>
  );
}

/**
 * Signed Video Player supporting loading feedback, byte-range seeking & Retry refresh
 */
export function SecureRangeVideoPlayer({
  src,
  mediaId = null,
  title = 'Exercise demonstration',
  controls = true,
  className = 'w-full h-full object-contain bg-[#102E27]',
  onFallbackRequested,
}) {
  const [videoSrc, setVideoSrc] = useState(src || '');
  const [loadingVideo, setLoadingVideo] = useState(Boolean(src));
  const [hasError, setHasError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setVideoSrc(src || '');
    setLoadingVideo(Boolean(src));
    setHasError(false);
  }, [src]);

  const handleRetry = async () => {
    setRetrying(true);
    setHasError(false);
    setLoadingVideo(true);
    try {
      if (mediaId) {
        const fresh = await gymGuideApi.getSignedMediaUrl(mediaId);
        const refreshed = fresh?.streamUrl || fresh?.signedUrl;
        if (refreshed) {
          setVideoSrc(refreshed);
          return;
        }
      }
      // Cache-bust fallback for direct stream URLs
      if (src) {
        const sep = src.includes('?') ? '&' : '?';
        setVideoSrc(`${src}${sep}_r=${Date.now()}`);
      }
    } catch (_) {
      setHasError(true);
      setLoadingVideo(false);
    } finally {
      setRetrying(false);
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 bg-[#102E27] text-[#E5E8CE] p-4 text-center">
        <AlertCircle className="w-6 h-6 text-[#789575]" />
        <p className="text-xs font-semibold">Video unavailable or signed link expired</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#789575] hover:bg-[#173F35] text-white text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>Retry Video</span>
          </button>
          {typeof onFallbackRequested === 'function' && (
            <button
              type="button"
              onClick={onFallbackRequested}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
            >
              Use 2.5D Model
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#102E27] flex items-center justify-center overflow-hidden">
      {loadingVideo && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#102E27]/65 pointer-events-none">
          <Loader2 className="w-6 h-6 animate-spin text-[#E5E8CE]" />
        </div>
      )}
      <video
        key={videoSrc}
        src={videoSrc}
        title={title}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        controls={controls}
        onLoadedData={() => setLoadingVideo(false)}
        onCanPlay={() => setLoadingVideo(false)}
        onWaiting={() => setLoadingVideo(true)}
        onPlaying={() => setLoadingVideo(false)}
        onError={() => {
          setLoadingVideo(false);
          setHasError(true);
        }}
        className={className}
      />
    </div>
  );
}
