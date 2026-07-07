import { useEffect, useRef, useCallback, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { detectVideoPlatform } from '../../utils/videoPlatform';
import { useAudio } from '../../context/AudioContext';

function EpisodeItem({ episode, index, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-vivid-purple-500/15 border border-vivid-purple-500/30'
          : 'hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
      }`}
    >
      <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
        isActive ? 'bg-vivid-purple-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
      }`}>
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${isActive ? 'text-vivid-purple-400 font-medium' : 'text-gray-700 dark:text-cinema-text'}`}>
          {episode.title}
        </p>
        {episode.duration && (
          <span className="text-xs text-gray-400 dark:text-cinema-text-muted">{episode.duration}</span>
        )}
      </div>
    </button>
  );
}

export default function VideoModal({ video, isOpen, onClose }) {
  const { isPlaying, pause, resume } = useAudio();
  const wasPlayingRef = useRef(false);
  const videoRef = useRef(null);
  const plyrRef = useRef(null);
  const [epIndex, setEpIndex] = useState(0);

  const hasEpisodes = video?.episodes?.length > 0;
  const currentEp = hasEpisodes ? video.episodes[epIndex] : video;
  const platform = detectVideoPlatform(currentEp?.videoUrl);
  const isBilibili = platform?.platform === 'bilibili';
  const hasVideoUrl = !!currentEp?.videoUrl;

  // Reset when modal opens with new video
  useEffect(() => {
    if (isOpen) setEpIndex(0);
  }, [isOpen, video?.id]);

  // Init/destroy Plyr for non-B站 videos
  useEffect(() => {
    if (!isOpen || isBilibili || !hasVideoUrl) return;
    const timer = setTimeout(() => {
      if (videoRef.current && !plyrRef.current) {
        plyrRef.current = new Plyr(videoRef.current, {
          controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
          ratio: '16:9',
          autoplay: true,
        });
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
      }
    };
  }, [isOpen, currentEp?.videoUrl, isBilibili, hasVideoUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
      }
    };
  }, []);

  // BGM pause/resume
  useEffect(() => {
    if (isOpen) {
      wasPlayingRef.current = isPlaying;
      if (isPlaying) pause();
    } else {
      if (wasPlayingRef.current) resume();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, handleKey]);

  if (!isOpen || !video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl rounded-2xl overflow-hidden bg-cinema-dark shadow-2xl animate-[scaleIn_0.3s_ease-out] ${hasEpisodes ? 'flex flex-col lg:flex-row' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={hasEpisodes ? { maxHeight: '90vh' } : undefined}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="关闭"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Video area */}
        <div className={`${hasEpisodes ? 'flex-1 min-w-0' : 'w-full'}`}>
          {!hasVideoUrl && (
            <div className="aspect-video w-full flex items-center justify-center bg-gray-100 dark:bg-cinema-surface/50">
              <div className="text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">待添加视频链接</p>
              </div>
            </div>
          )}

          {hasVideoUrl && isBilibili && (
            <div className="aspect-video w-full">
              <iframe
                key={`${video.id}-${epIndex}`}
                src={platform.embedUrl}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={currentEp?.title}
              />
            </div>
          )}

          {hasVideoUrl && !isBilibili && (
            <video
              key={`${video.id}-${epIndex}`}
              ref={videoRef}
              poster={currentEp?.thumbnailUrl}
              className="w-full"
              playsInline
            >
              <source src={currentEp?.videoUrl} type="video/mp4" />
              您的浏览器不支持视频播放。
            </video>
          )}

          {/* Info bar */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">
                {hasEpisodes ? currentEp?.title : video.title}
              </h3>
              {platform && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-vivid-purple-500/20 text-vivid-purple-400 shrink-0">
                  {platform.label}
                </span>
              )}
            </div>
            {hasEpisodes && (
              <p className="mt-0.5 text-xs text-cinema-text-muted">
                {video.title} · 第 {epIndex + 1} / {video.episodes.length} 集
              </p>
            )}
            {video.description && !hasEpisodes && (
              <p className="mt-1 text-sm text-cinema-text-muted">{video.description}</p>
            )}
          </div>
        </div>

        {/* Episode sidebar */}
        {hasEpisodes && (
          <div className="lg:w-72 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-48 lg:max-h-full">
            <div className="px-3 py-2.5 border-b border-white/10">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">选集</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {video.episodes.map((ep, i) => (
                <EpisodeItem
                  key={ep.id || i}
                  episode={ep}
                  index={i}
                  isActive={i === epIndex}
                  onClick={setEpIndex}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
