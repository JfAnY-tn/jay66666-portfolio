import { useRef, useCallback, useEffect, useState } from 'react';
import siteConfig from '../../data/siteConfig.json';
import { useAudio } from '../../context/AudioContext';
import Button from '../ui/Button';
import useSmoothScroll from '../../hooks/useSmoothScroll';

const BAR_COUNT = 100;
const ACTIVE_RANGE = 30;

function angleDist(a, b) {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

export default function HeroSection() {
  const scrollTo = useSmoothScroll();
  const circleRef = useRef(null);
  const barRefs = useRef([]);
  const [mouseAngle, setMouseAngle] = useState(null);
  const [mouseActive, setMouseActive] = useState(false);
  const rafRef = useRef(null);
  const { isPlaying, frequencyData } = useAudio();
  const musicIntensityRef = useRef(0);

  // Store latest frequencyData in a ref so the anim loop reads it
  const freqRef = useRef(frequencyData);
  freqRef.current = frequencyData;

  // Smoothly transition music intensity when play/pause toggles
  useEffect(() => {
    const target = isPlaying ? 1 : 0;
    const speed = 0.025;
    let frame;
    const tick = () => {
      const cur = musicIntensityRef.current;
      const next = cur + (target - cur) * speed;
      if (Math.abs(next - target) < 0.0005) {
        musicIntensityRef.current = target;
        return;
      }
      musicIntensityRef.current = next;
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  // Store per-bar random bounce parameters (stable, like original CSS animation)
  const barParams = useRef(
    Array.from({ length: BAR_COUNT }, (_, i) => {
      const a = Math.sin(i * 0.7) * 0.4 + Math.cos(i * 1.9) * 0.3;
      return {
        baseDelay: Math.abs(a),
        baseDuration: 0.45 + Math.abs(Math.cos(i * 1.1)) * 0.85,
        baseHeight: 14 + Math.floor(Math.abs(Math.sin(i * 2.3) * Math.cos(i * 0.5)) * 38),
      };
    })
  ).current;

  // Combined animation: random bounce + music frequency modulation
  useEffect(() => {
    let frame;
    let startTime = null;

    const loop = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) * 0.001;
      const bars = barRefs.current;
      const freq = freqRef.current;
      const binCount = freq.length;
      const intensity = musicIntensityRef.current;

      // Low-frequency energy for beat tracking (bins 0-20, ~0-860Hz)
      let lowEnergy = 0;
      for (let b = 0; b < Math.min(20, binCount); b++) lowEnergy += freq[b];
      lowEnergy = lowEnergy / Math.min(20, binCount) / 255;
      const globalPulse = lowEnergy * intensity;

      for (let i = 0; i < BAR_COUNT; i++) {
        const el = bars[i];
        if (!el) continue;

        const p = barParams[i];

        // Random bounce — each bar has its own timing
        const phase = (elapsed / p.baseDuration + p.baseDelay) * Math.PI * 2;
        const bounce =
          Math.sin(phase) * 0.7 +
          Math.sin(phase * 2.1) * 0.2 +
          Math.cos(phase * 0.45) * 0.1;
        const bounceNorm = 0.2 + (bounce + 1) / 2 * 0.8;
        const bounceH = p.baseHeight * bounceNorm;

        // Idle height: pure random bounce
        const idleH = Math.max(4, bounceH + (Math.random() - 0.5) * 4);

        // Music-driven height
        const scatter = 2 + Math.floor((i / BAR_COUNT) * (binCount - 6)) + (i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0);
        const binIdx = Math.max(2, Math.min(scatter, binCount - 1));
        const raw = freq[binIdx] || 0;
        const energy = Math.pow(raw / 255, 1.3);
        const freqH = 5 + energy * 85;
        const blended = freqH * 0.75 + bounceH * 0.25;
        const barPulse = 1 + globalPulse * (0.6 + Math.sin(i * 0.7) * 0.3);
        const musicH = Math.max(3, blended * barPulse);

        // Smooth blend between idle and music
        const h = idleH + (musicH - idleH) * intensity;

        el.style.height = `${h}px`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!circleRef.current) return;
      const rect = circleRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = ((Math.atan2(dy, dx) * (180 / Math.PI)) + 90 + 360) % 360;
      setMouseAngle(angle);
      setMouseActive(true);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#8B5CF610_0%,_transparent_60%)]" />
      </div>

      {/* ECG waveform background */}
      <WaveformBackground />

      {/* Circle + Bars */}
      <div
        ref={circleRef}
        className="relative flex items-center justify-center"
        style={{ width: 'min(82vw, 540px)', height: 'min(82vw, 540px)' }}
      >
        {/* Audio bars ring */}
        <div className="absolute inset-0">
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const angle = (360 / BAR_COUNT) * i;
            const dist = mouseActive && mouseAngle != null ? angleDist(angle, mouseAngle) : 999;
            const active = dist < ACTIVE_RANGE;
            const intensity = active ? 1 - dist / ACTIVE_RANGE : 0;

            const barColor =
              active && intensity > 0.6
                ? 'linear-gradient(to top, #C4B5FD, #F43F5E, #FFD166)'
                : active
                  ? 'linear-gradient(to top, #A78BFA, #F43F5E)'
                  : 'linear-gradient(to top, #8B5CF6, #F43F5E)';

            const opacity = active ? 0.65 + intensity * 0.35 : 0.5;
            const glow = active
              ? `0 0 ${4 + intensity * 12}px rgba(139,92,246,${0.2 + intensity * 0.35})`
              : 'none';

            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: '50%',
                  top: 0,
                  width: '8px',
                  height: '50%',
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'center bottom',
                }}
              >
                <div
                  className="absolute top-0 w-full"
                  style={{ transform: 'translateY(-100%)' }}
                >
                  <div
                    ref={(el) => { barRefs.current[i] = el; }}
                    className="w-full rounded-full"
                    style={{
                      height: `${12 + Math.abs(Math.sin(i * 2.3) * Math.cos(i * 0.5)) * 28}px`,
                      transformOrigin: 'bottom center',
                      background: barColor,
                      opacity,
                      boxShadow: glow,
                      transition: 'opacity 0.3s, box-shadow 0.3s, background 0.3s',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Circle ring */}
        <div className="absolute inset-0 rounded-full border-2 border-vivid-purple-500/20 shadow-[0_0_100px_#8B5CF612,inset_0_0_100px_#8B5CF606] animate-[fadeIn_0.6s_ease-out_0.1s_both]" />

        {/* Inner content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 animate-[fadeIn_0.8s_ease-out_0.5s_both]">
          <p className="mb-2 text-xs font-medium tracking-[0.3em] text-vivid-purple-400 uppercase">
            {siteConfig.role}
          </p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-gray-800 via-vivid-purple-400 to-hot-pink-500 dark:from-cinema-text dark:via-vivid-purple-400 dark:to-hot-pink-500 bg-clip-text text-transparent">
              {siteConfig.siteName}
            </span>
          </h1>
          <p className="mb-6 max-w-xs text-sm text-gray-500 dark:text-cinema-text-muted leading-relaxed">
            {siteConfig.tagline}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button size="md" onClick={() => scrollTo('portfolio')}>
              查看作品集
            </Button>
            <Button variant="secondary" size="md" onClick={() => scrollTo('contact')}>
              联系我
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 inset-x-0 z-10 flex justify-center animate-[fadeIn_0.8s_ease-out_1s_both]">
        <div className="flex flex-col items-center">
          <span className="block text-xs tracking-widest text-gray-500 dark:text-cinema-text-muted">
            向下滚动
          </span>
          <svg
            className="mt-2 h-5 w-5 animate-bounce text-gray-500 dark:text-cinema-text-muted"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}

// ── Grid-Aligned Waveform Background ──────────────────────────────
const GRID = 80;       // matches the CSS grid cell size
const WAVE_W = 240;    // 3 grid cells wide
const WAVE_H = 40;
const DASH_LEN = 340;  // slightly longer than path for smooth edges
const WAVE_COUNT = 75;

const WAVE_COLOR = '#8B5CF6';
const WAVE_DURATION = '4s';

// Generate a unique ECG-like path for each waveform
function ecgPath(seed) {
  const mid = WAVE_H / 2;
  const spike = WAVE_H * 0.75;
  const parts = [];
  // Flatten seed to a repeatable pseudo-random value per waveform
  const r = (n, min, max) => min + (((seed * 137 + n * 97 + 42) % 1000) / 1000) * (max - min);

  let x = 0;
  parts.push(`M 0,${mid}`);

  // Lead-in flat segment
  const leadIn = r(1, 0.04, 0.14);
  x = WAVE_W * leadIn;
  parts.push(`L ${x},${mid}`);

  // Random number of spike clusters (1 to 3)
  const clusters = Math.floor(r(2, 1, 4));
  for (let c = 0; c < clusters; c++) {
    // Small pre-bump
    const bx = x + WAVE_W * r(3 + c * 10, 0.01, 0.04);
    const bh = mid - spike * r(4 + c * 10, 0.1, 0.35);
    parts.push(`L ${bx},${mid} L ${bx + WAVE_W * 0.01},${bh} L ${bx + WAVE_W * 0.02},${mid}`);

    // Main spike up
    const sx1 = bx + WAVE_W * r(5 + c * 10, 0.02, 0.05);
    const sh1 = mid - spike * r(6 + c * 10, 0.5, 1.0);
    parts.push(`L ${sx1},${sh1}`);

    // Main spike down
    const sx2 = sx1 + WAVE_W * r(7 + c * 10, 0.02, 0.05);
    const sh2 = mid + spike * r(8 + c * 10, 0.2, 0.7);
    parts.push(`L ${sx2},${sh2}`);

    // Recovery back to baseline
    const rx = sx2 + WAVE_W * r(9 + c * 10, 0.02, 0.05);
    parts.push(`L ${rx},${mid}`);

    x = rx;

    // Optional tiny aftershock
    if (r(10 + c * 10, 0, 1) > 0.5) {
      const ax = x + WAVE_W * r(11 + c * 10, 0.01, 0.03);
      const ah = mid - spike * r(12 + c * 10, 0.1, 0.25);
      parts.push(`L ${ax},${ah} L ${ax + WAVE_W * 0.015},${mid}`);
      x = ax + WAVE_W * 0.015;
    }

    // Gap between clusters
    if (c < clusters - 1) {
      x += WAVE_W * r(13 + c * 10, 0.04, 0.15);
      parts.push(`L ${x},${mid}`);
    }
  }

  // Lead-out flat to end
  parts.push(`L ${WAVE_W},${mid}`);

  return parts.join(' ');
}

// Generate random grid-aligned positions — X snaps to grid, Y random within viewport
function generateWaveConfigs() {
  const configs = [];
  const cols = 50;
  const rows = 60;
  for (let i = 0; i < WAVE_COUNT; i++) {
    // Multiple prime seeds for least visible pattern
    const s1 = (i * 137 + 42) % 997;
    const s2 = (i * 251 + 17) % 991;
    const s3 = (i * 311 + 89) % 983;
    const col = Math.floor((s1 / 997) * cols);
    const row = Math.floor((s2 / 991) * rows);
    configs.push({
      id: i,
      left: col * GRID,
      top: row * GRID - WAVE_H / 2,
      flipX: s3 % 3 === 0,
      delay: `${(s1 * 0.043) % 7}s`,
      pathD: ecgPath(i), // unique shape per waveform
    });
  }
  return configs;
}

const waveConfigs = generateWaveConfigs();

function WaveformBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{ animation: 'wave-scroll 8s linear infinite' }}
    >
      <style>{`
        @keyframes wave-scroll {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(${GRID}px, ${GRID}px); }
        }
        @keyframes ecg-draw {
          0%    { stroke-dashoffset: -${DASH_LEN}; }
          25%   { stroke-dashoffset: 0; }
          75%   { stroke-dashoffset: 0; }
          100%  { stroke-dashoffset: ${DASH_LEN}; }
        }
        @keyframes ecg-fade {
          0%, 1% { opacity: 0; }
          25%    { opacity: 0.12; }
          75%    { opacity: 0.12; }
          99%, 100% { opacity: 0; }
        }
      `}</style>
      {waveConfigs.map((cfg) => (
        <svg
          key={cfg.id}
          className="absolute"
          style={{
            left: cfg.left,
            top: cfg.top,
            width: WAVE_W,
            height: WAVE_H,
            transform: cfg.flipX ? 'scaleX(-1)' : undefined,
            animation: `ecg-draw ${WAVE_DURATION} linear ${cfg.delay} infinite, ecg-fade ${WAVE_DURATION} linear ${cfg.delay} infinite`,
          }}
          viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
          fill="none"
          stroke={WAVE_COLOR}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={DASH_LEN}
          strokeDashoffset={-DASH_LEN}
        >
          <path d={cfg.pathD} />
        </svg>
      ))}
    </div>
  );
}
