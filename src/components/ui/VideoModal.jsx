import { useEffect, useRef, useCallback } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { detectVideoPlatform } from '../../utils/videoPlatform';
import { useAudio } from '../../context/AudioContext';

export default function VideoModal({ video, isOpen, onClose }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { isPlaying, pause, resume } = useAudio();
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasPlayingRef.current = isPlaying;
      if (isPlaying) pause();
    } else {
      if (wasPlayingRef.current) resume();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

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

  useEffect(() => {
    if (isOpen && videoRef.current && !playerRef.current) {
      playerRef.current = new Plyr(videoRef.current, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
        ratio: '16:9',
        autoplay: true,
      });
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen || !video) return null;

  const platform = detectVideoPlatform(video.videoUrl);
  const useIframe = !!platform;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-cinema-dark shadow-2xl animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="关闭"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {useIframe ? (
          <div className="aspect-video w-full">
            <iframe
              src={platform.embedUrl}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={video.title}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            poster={video.thumbnailUrl}
            className="w-full"
            playsInline
          >
            <source src={video.videoUrl} type="video/mp4" />
            您的浏览器不支持视频播放。
          </video>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{video.title}</h3>
            {platform && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-vivid-purple-500/20 text-vivid-purple-400">
                {platform.label}
              </span>
            )}
          </div>
          {video.description && (
            <p className="mt-1 text-sm text-cinema-text-muted">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
