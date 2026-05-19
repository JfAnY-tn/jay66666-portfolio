import { useAudio } from '../../context/AudioContext';

export default function MusicToggle() {
  const { isPlaying, toggle } = useAudio();

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
        isPlaying
          ? 'text-vivid-purple-400 bg-vivid-purple-500/10'
          : 'text-gray-500 dark:text-cinema-text-muted hover:text-vivid-purple-400 hover:bg-vivid-purple-500/10'
      }`}
      aria-label={isPlaying ? '暂停音乐' : '播放音乐'}
      title={isPlaying ? '暂停音乐' : '播放音乐'}
    >
      {isPlaying ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" fill="currentColor" />
          <circle cx="18" cy="16" r="3" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
