import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const AudioCtx = createContext();

const PLAYLIST = [
  { url: '/bgm.mp3', title: 'Shoreline', artist: 'Roa Music' },
  { url: '/bgm2.mp3', title: 'Pool', artist: 'KV' },
  // New tracks — place bgm3.mp3 ~ bgm7.mp3 in public/
  { url: '/bgm3.mp3', title: 'Upbeat 1', artist: 'Unknown' },
  { url: '/bgm4.mp3', title: 'Upbeat 2', artist: 'Unknown' },
  { url: '/bgm5.mp3', title: 'Upbeat 3', artist: 'Unknown' },
  { url: '/bgm6.mp3', title: 'Upbeat 4', artist: 'Unknown' },
  { url: '/bgm7.mp3', title: 'Upbeat 5', artist: 'Unknown' },
];

const CROSSFADE_S = 2.5; // crossfade duration in seconds

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
  const gainNodeRef = useRef(null);
  const sourceRef = useRef(null);
  const audioElRef = useRef(null);
  const animRef = useRef(null);
  const trackIdxRef = useRef(0);

  // Crossfade state
  const nextAudioRef = useRef(null);
  const nextGainRef = useRef(null);
  const nextSourceRef = useRef(null);
  const crossfadeRef = useRef(false);
  const crossfadeAnimRef = useRef(null);

  const cleanup = useCallback(() => {
    if (crossfadeAnimRef.current) {
      cancelAnimationFrame(crossfadeAnimRef.current);
      crossfadeAnimRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (nextSourceRef.current) {
      try { nextSourceRef.current.disconnect(); } catch (e) { /* */ }
      nextSourceRef.current = null;
    }
    if (nextAudioRef.current) {
      nextAudioRef.current.pause();
      nextAudioRef.current.removeAttribute('src');
      nextAudioRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) { /* */ }
      sourceRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.removeEventListener('ended', onEnded);
      audioElRef.current.removeEventListener('timeupdate', onTimeUpdate);
      audioElRef.current = null;
    }
    crossfadeRef.current = false;
  }, []);

  const initAudioContext = useCallback(() => {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }
    if (ctx.state === 'suspended') ctx.resume();

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.15;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    }
    return ctx;
  }, []);

  const startFreqLoop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteFrequencyData(data);
      setFrequencyData(new Uint8Array(data));
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const createAudioSource = useCallback((trackUrl) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    const audio = new Audio(trackUrl);
    audio.crossOrigin = 'anonymous';
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(analyserRef.current);
    return { audio, source, gain };
  }, []);

  // Crossfade animation: fade out current, fade in next
  const runCrossfade = useCallback((currentGain, nextGain, onDone) => {
    const startTime = performance.now();
    const duration = CROSSFADE_S * 1000;
    const ctx = audioCtxRef.current;
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // ease-in-out curve for smooth transition
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      currentGain.value = 1 - ease;
      nextGain.value = ease;
      if (t < 1) {
        crossfadeAnimRef.current = requestAnimationFrame(tick);
      } else {
        currentGain.value = 0;
        nextGain.value = 1;
        crossfadeAnimRef.current = null;
        onDone();
      }
    };
    crossfadeAnimRef.current = requestAnimationFrame(tick);
  }, []);

  // Start preloading next track and crossfade
  const startCrossfade = useCallback((currentAudio) => {
    if (crossfadeRef.current) return;
    crossfadeRef.current = true;

    const nextIdx = pickRandom(trackIdxRef.current);
    trackIdxRef.current = nextIdx;
    setTrackIndex(nextIdx);
    const track = PLAYLIST[nextIdx];

    initAudioContext();
    const result = createAudioSource(track.url);
    if (!result) {
      crossfadeRef.current = false;
      return;
    }
    nextAudioRef.current = result.audio;
    nextGainRef.current = result.gain;
    nextSourceRef.current = result.source;

    result.audio.play().catch(() => {});

    runCrossfade(gainNodeRef.current, result.gain, () => {
      // Crossfade done — swap: next becomes current
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeAttribute('src');
        currentAudio.removeEventListener('ended', onEnded);
        currentAudio.removeEventListener('timeupdate', onTimeUpdate);
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch (e) { /* */ }
      }

      audioElRef.current = result.audio;
      sourceRef.current = result.source;
      result.audio.addEventListener('ended', onEnded);
      result.audio.addEventListener('timeupdate', onTimeUpdate);
      crossfadeRef.current = false;

      // Clean next refs
      nextAudioRef.current = null;
      nextGainRef.current = null;
      nextSourceRef.current = null;
    });
  }, [initAudioContext, createAudioSource, runCrossfade]);

  const onTimeUpdate = useCallback(() => {
    const audio = audioElRef.current;
    if (!audio || crossfadeRef.current) return;
    const remaining = audio.duration - audio.currentTime;
    if (remaining < CROSSFADE_S + 0.5 && audio.currentTime > 1) {
      startCrossfade(audio);
    }
  }, [startCrossfade]);

  const onEnded = useCallback(() => {
    // If crossfade already started, onEnded is a safety net
    if (!crossfadeRef.current) {
      startCrossfade(audioElRef.current);
    }
  }, [startCrossfade]);

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
      if (vol < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);

    startFreqLoop();
  }, [startFreqLoop]);

  const play = useCallback(() => {
    cleanup();

    const idx = pickRandom(trackIdxRef.current);
    trackIdxRef.current = idx;
    setTrackIndex(idx);
    const track = PLAYLIST[idx];

    const ctx = initAudioContext();
    const result = createAudioSource(track.url);
    if (!result) return;

    const { audio, source, gain } = result;
    gain.gain.value = 1;
    audioElRef.current = audio;
    sourceRef.current = source;
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.play().catch(() => stop());

    setIsPlaying(true);
    startFreqLoop();
  }, [initAudioContext, createAudioSource, onEnded, onTimeUpdate, stop, startFreqLoop]);

  // Auto-play on first user interaction
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
