import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const AudioCtx = createContext();

const PLAYLIST = [
  { url: '/bgm.mp3', title: 'Shoreline', artist: 'Roa Music' },
  { url: '/bgm2.mp3', title: 'Pool', artist: 'KV' },
];

function pickRandom(excludeIdx) {
  if (PLAYLIST.length <= 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * PLAYLIST.length); } while (idx === excludeIdx);
  return idx;
}

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(128).fill(1));
  const [trackIndex, setTrackIndex] = useState(0);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const audioElRef = useRef(null);
  const animRef = useRef(null);
  const trackIdxRef = useRef(0);

  const cleanup = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) { /* ignore */ }
      sourceRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.removeEventListener('ended', onEnded);
      audioElRef.current = null;
    }
  }, []);

  const initAudio = useCallback((trackUrl) => {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.15;
    analyserRef.current = analyser;

    const audio = new Audio(trackUrl);
    audio.crossOrigin = 'anonymous';
    audioElRef.current = audio;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceRef.current = source;
  }, []);

  const onEnded = useCallback(() => {
    cleanup();
    const next = pickRandom(trackIdxRef.current);
    trackIdxRef.current = next;
    setTrackIndex(next);
    const track = PLAYLIST[next];
    initAudio(track.url);
    const ctx = audioCtxRef.current;
    const audio = audioElRef.current;
    if (ctx && audio) {
      if (ctx.state === 'suspended') ctx.resume();
      audio.addEventListener('ended', onEnded);
      audio.play().catch(() => {});
      const analyser = analyserRef.current;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        setFrequencyData(new Uint8Array(data));
        animRef.current = requestAnimationFrame(loop);
      };
      loop();
    }
  }, [cleanup, initAudio]);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
  }, [cleanup]);

  const pause = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    const audio = audioElRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    const audio = audioElRef.current;
    const ctx = audioCtxRef.current;
    if (!audio || !ctx) return;

    if (ctx.state === 'suspended') ctx.resume();
    audio.volume = 0;
    audio.play().catch(() => {});

    setIsPlaying(true);

    let vol = 0;
    const fadeIn = () => {
      vol = Math.min(1, vol + 0.03);
      audio.volume = vol;
      if (vol < 1) {
        requestAnimationFrame(fadeIn);
      }
    };
    requestAnimationFrame(fadeIn);

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteFrequencyData(data);
      setFrequencyData(new Uint8Array(data));
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const play = useCallback(() => {
    // Always cleanup before creating new audio to prevent double-play
    cleanup();

    const idx = pickRandom(trackIdxRef.current);
    trackIdxRef.current = idx;
    setTrackIndex(idx);
    const track = PLAYLIST[idx];

    initAudio(track.url);

    const ctx = audioCtxRef.current;
    const audio = audioElRef.current;
    if (!ctx || !audio) return;

    if (ctx.state === 'suspended') ctx.resume();
    audio.addEventListener('ended', onEnded);
    audio.play().catch(() => stop());

    setIsPlaying(true);
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      setFrequencyData(new Uint8Array(data));
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [initAudio, onEnded, stop]);

  // Auto-play on first user interaction (browsers block autoplay without gesture)
  useEffect(() => {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      play();
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('touchstart', start);
    };
    document.addEventListener('click', start);
    document.addEventListener('keydown', start);
    document.addEventListener('touchstart', start);
    return () => {
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('touchstart', start);
    };
  }, [play]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTrack = PLAYLIST[trackIndex];

  return (
    <AudioCtx.Provider value={{ isPlaying, frequencyData, toggle, stop, pause, resume, currentTrack }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
