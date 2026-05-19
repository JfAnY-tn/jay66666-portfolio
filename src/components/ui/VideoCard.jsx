import { useState, useRef, useCallback, useEffect } from 'react';
import { getDirectVideoUrl } from '../../utils/videoPlatform';

const categoryMeta = {
  commercial:  { label: '商业广告', bg: 'bg-vivid-purple-500/80',  accent: '#8B5CF6', hover: 'hover:border-vivid-purple-500/40' },
  'music-video': { label: '音乐 MV',  bg: 'bg-hot-pink-500/80',      accent: '#F43F5E', hover: 'hover:border-hot-pink-500/30' },
  corporate:   { label: '企业宣传', bg: 'bg-electric-teal-500/80', accent: '#10B981', hover: 'hover:border-electric-teal-500/30' },
  'short-video': { label: '短视频',  bg: 'bg-amber-500/80',          accent: '#F59E0B', hover: 'hover:border-amber-500/30' },
  wedding:     { label: '婚礼电影', bg: 'bg-rose-400/80',           accent: '#FB7185', hover: 'hover:border-rose-400/30' },
  event:       { label: '活动记录', bg: 'bg-sky-500/80',            accent: '#0EA5E9', hover: 'hover:border-sky-500/30' },
};

export default function VideoCard({ title, category, thumbnailUrl, duration, tags, videoUrl, onClick, onEdit }) {
  const meta = categoryMeta[category] || categoryMeta.commercial;
  const [hovering, setHovering] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);
  const loadedRef = useRef(false);
  const scrubbingRef = useRef(false);
  const scrubTimerRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    setHovering(true);
    if (!loadedRef.current) {
      getDirectVideoUrl(videoUrl).then((url) => {
        if (url) {
          loadedRef.current = true;
          const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(url)}`;
          setVideoSrc(proxyUrl);
        }
      });
    }
  }, [videoUrl]);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
    clearTimeout(scrubTimerRef.current);
    scrubbingRef.current = false;
  }, []);

  const handleCanPlay = useCallback(() => {
    const v = videoRef.current;
    if (v && hovering) {
      v.play().catch(() => {});
    }
  }, [hovering]);

  const handleVideoError = useCallback(() => {
    setVideoSrc(null);
  }, []);

  useEffect(() => {
    return () => clearTimeout(scrubTimerRef.current);
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

  const showVideo = hovering && videoSrc;

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

      <button
        onClick={onClick}
        className="w-full text-left flex flex-col h-full"
      >
      {/* Thumbnail / Video */}
      <div
        className="relative aspect-video overflow-hidden bg-cinema-surface"
        onMouseMove={showVideo ? handleScrubMove : undefined}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
        />

        {showVideo && (
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-contain bg-black"
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
        {!showVideo && (
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: `${meta.accent}E6` }}>
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration */}
        <span className="absolute bottom-2 right-2 bg-cinema-black/80 text-white text-xs px-2 py-0.5 rounded z-10">
          {duration}
        </span>

        {/* Category badge */}
        <span className={`absolute top-2 left-2 text-xs text-white px-2 py-0.5 rounded z-10 ${meta.bg}`}>
          {meta.label}
        </span>

        {/* Scrub progress bar */}
        {showVideo && (
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
