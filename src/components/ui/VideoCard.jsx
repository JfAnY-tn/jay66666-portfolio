import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getDirectVideoUrl, detectVideoPlatform } from '../../utils/videoPlatform';

const categoryMeta = {
  corporate:   { label: '企业宣传', bg: 'bg-electric-teal-500/80', accent: '#10B981', hover: 'hover:border-electric-teal-500/30' },
  'short-video': { label: '短视频',  bg: 'bg-amber-500/80',          accent: '#F59E0B', hover: 'hover:border-amber-500/30' },
  'course-production': { label: '课程制作', bg: 'bg-indigo-500/80', accent: '#6366F1', hover: 'hover:border-indigo-500/30' },
};

export default function VideoCard({ title, category, thumbnailUrl, duration, tags, videoUrl, episodes, previewStart, previewEpisodeIndex, onClick, onEdit, onCaptureThumbnail }) {
  const meta = categoryMeta[category] || categoryMeta.corporate;

  // Preview from selected episode (for collections) otherwise first episode or main video
  const epIdx = previewEpisodeIndex ?? 0;
  const previewUrl = episodes?.length > 0 && episodes[epIdx]?.videoUrl ? episodes[epIdx].videoUrl : videoUrl;

  // Compute display duration: for collections, sum episodes
  const displayDuration = useMemo(() => {
    if (episodes?.length > 0) {
      let totalSec = 0;
      for (const ep of episodes) {
        if (!ep.duration) continue;
        const parts = ep.duration.split(':').map(Number);
        if (parts.length === 3) totalSec += parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) totalSec += parts[0] * 60 + parts[1];
        else totalSec += parts[0];
      }
      if (totalSec > 0) {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${m}:${String(s).padStart(2, '0')}`;
      }
    }
    return duration;
  }, [episodes, duration]);

  const platform = detectVideoPlatform(previewUrl);
  const isBilibili = platform?.platform === 'bilibili';
  const useIframe = isBilibili;
  const iframeRef = useRef(null);
  const startTime = previewStart || 0;
  const embedUrl = useIframe
    ? `https://player.bilibili.com/player.html?bvid=${platform.videoId}&page=1&high_quality=1&autoplay=1&muted=1&danmaku=0&t=${startTime}`
    : null;

  // Try to mute the B站 iframe player after it loads
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          { type: 'setMuted', muted: true },
          'https://player.bilibili.com'
        );
      } catch { /* cross-origin restriction, ignore */ }
    }
  }, []);

  const [hovering, setHovering] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);
  const loadedRef = useRef(false);
  const scrubbingRef = useRef(false);
  const scrubTimerRef = useRef(null);
  const iframeTimerRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    setHovering(true);
    if (useIframe) {
      iframeTimerRef.current = setTimeout(() => setShowIframe(true), 200);
    } else if (!loadedRef.current) {
      getDirectVideoUrl(previewUrl).then((url) => {
        if (url) {
          loadedRef.current = true;
          const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(url)}`;
          setVideoSrc(proxyUrl);
        }
      });
    }
  }, [useIframe, previewUrl]);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
    setShowIframe(false);
    clearTimeout(iframeTimerRef.current);
    clearTimeout(scrubTimerRef.current);
    scrubbingRef.current = false;
  }, []);

  const handleCanPlay = useCallback(() => {
    const v = videoRef.current;
    if (v && hovering) {
      if (startTime > 0) v.currentTime = startTime;
      v.play().catch(() => {});
    }
  }, [hovering, startTime]);

  const handleVideoError = useCallback(() => {
    setVideoSrc(null);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(scrubTimerRef.current);
      clearTimeout(iframeTimerRef.current);
    };
  }, []);

  const handleMeta = useCallback(() => {
    const v = videoRef.current;
    if (v) setVideoDuration(v.duration || 0);
  }, []);

  const handleTime = useCallback(() => {
    if (scrubbingRef.current) return;
    const v = videoRef.current;
    if (v && v.duration) setProgress(v.currentTime / v.duration);
  }, []);

  const handleScrubMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(p);
    const v = videoRef.current;
    if (v && v.duration) {
      if (!scrubbingRef.current) {
        scrubbingRef.current = true;
        v.pause();
      }
      v.currentTime = p * v.duration;
    }
    clearTimeout(scrubTimerRef.current);
    scrubTimerRef.current = setTimeout(() => {
      scrubbingRef.current = false;
      const vid = videoRef.current;
      if (vid) vid.play().catch(() => {});
    }, 150);
  }, []);

  const isShowingPreview = useIframe ? (hovering && showIframe) : (hovering && videoSrc);
  const showScrubbing = isShowingPreview && !useIframe;

  return (
    <div className={`group relative w-full h-full text-left rounded-2xl overflow-hidden border border-gray-100 dark:border-cinema-surface bg-gray-50/80 dark:bg-cinema-dark/50 transition-all duration-300 hover:-translate-y-1 ${meta.hover}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Edit button */}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-vivid-purple-500/80 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          title="编辑作品"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Capture thumbnail button (hover preview) */}
      {isShowingPreview && !useIframe && onCaptureThumbnail && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const video = videoRef.current;
            if (!video || capturing) return;
            setCapturing(true);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              const res = await fetch('/api/capture-thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl }),
              });
              const data = await res.json();
              if (data.ok) {
                onCaptureThumbnail(data.path);
              }
            } catch (err) {
              console.error('截图失败', err);
            } finally {
              setCapturing(false);
            }
          }}
          className="absolute top-10 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-vivid-purple-500/80 transition-all duration-200 backdrop-blur-sm"
          title="截取封面"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      <button
        onClick={onClick}
        className="w-full text-left flex flex-col h-full"
      >
      {/* Thumbnail / Video */}
      <div
        className="relative aspect-video overflow-hidden bg-cinema-surface"
        onMouseMove={showScrubbing ? handleScrubMove : undefined}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isShowingPreview ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* B站 iframe (production) */}
        {useIframe && hovering && showIframe && (
          <>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={title}
              onLoad={handleIframeLoad}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 z-10" />
          </>
        )}

        {/* Direct video (dev or mp4) */}
        {!useIframe && isShowingPreview && (
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleMeta}
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTime}
            onError={handleVideoError}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Play button overlay */}
        {!isShowingPreview && (
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: `${meta.accent}E6` }}>
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration */}
        <span className="absolute bottom-2 right-2 bg-cinema-black/80 text-white text-xs px-2 py-0.5 rounded z-10 flex items-center gap-1">
          {displayDuration}
          {episodes?.length > 0 && (
            <span className="opacity-70">· {episodes.length}集</span>
          )}
        </span>

        {/* 合集 badge */}
        {episodes?.length > 0 && (
          <span className="absolute top-8 left-2 text-xs text-white px-1.5 py-0.5 rounded z-10 bg-vivid-purple-500/80 flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            合集
          </span>
        )}

        {/* Category badge */}
        <span className={`absolute top-2 left-2 text-xs text-white px-2 py-0.5 rounded z-10 ${meta.bg}`}>
          {meta.label}{tags?.[0] ? ` · ${tags[0]}` : ''}
        </span>

        {/* Scrub progress bar (only for direct video) */}
        {showScrubbing && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-10">
            <div
              className="h-full bg-vivid-purple-500 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 dark:text-cinema-text group-hover:text-vivid-purple-400 transition-colors">
          {title}
        </h3>
        <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-gray-500 dark:text-cinema-text-muted bg-gray-100 dark:bg-cinema-surface px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
      </button>
    </div>
  );
}
