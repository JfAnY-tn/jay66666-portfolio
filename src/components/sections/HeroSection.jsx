import { useRef, useCallback, useEffect, useState } from 'react';
import siteConfig from '../../data/siteConfig.json';
import { useAudio } from '../../context/AudioContext';
import Button from '../ui/Button';
import useSmoothScroll from '../../hooks/useSmoothScroll';

const CIRCLE_BARS = 100;
const LINE_BARS_EACH = 35;
const TOTAL_BARS = CIRCLE_BARS + LINE_BARS_EACH * 2;
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

  const freqRef = useRef(frequencyData);
  freqRef.current = frequencyData;

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

  const barParams = useRef(
    Array.from({ length: TOTAL_BARS }, (_, i) => {
      if (i < CIRCLE_BARS) {
        const a = Math.sin(i * 0.7) * 0.4 + Math.cos(i * 1.9) * 0.3;
        const angle = (360 / CIRCLE_BARS) * i;
        // Junction fade: circle bars near 3 o'clock (90°) and 9 o'clock (270°) fade out
        const distToRight = angleDist(angle, 90);
        const distToLeft = angleDist(angle, 270);
        const distToJunction = Math.min(distToRight, distToLeft);
        const JUNCTION_RANGE = 20;
        const junctionFade = distToJunction < JUNCTION_RANGE
          ? Math.max(0, distToJunction / JUNCTION_RANGE)
          : 1;
        // Shuffled bin index: breaks angle→frequency correlation for even distribution
        const binSlot = (i * 73 + 17) % CIRCLE_BARS;
        return {
          type: 'circle',
          circleIdx: i,
          angle,
          junctionFade,
          binSlot,
          baseDelay: Math.abs(a),
          baseDuration: 0.45 + Math.abs(Math.cos(i * 1.1)) * 0.85,
          baseHeight: 22 + Math.abs(Math.sin(i * 2.3) * Math.cos(i * 0.5)) * 26,
          heightScale: 1,
        };
      } else {
        const lineIdx = i - CIRCLE_BARS;
        const side = lineIdx < LINE_BARS_EACH ? 'left' : 'right';
        const posInSide = side === 'left' ? lineIdx : lineIdx - LINE_BARS_EACH;
        // t: 0 at far edge, 1 at circle (for both sides)
        const t = side === 'left'
          ? posInSide / (LINE_BARS_EACH - 1)
          : 1 - posInSide / (LINE_BARS_EACH - 1);
        // Dramatic curve: bars shoot up ~2.5x near the circle
        const heightScale = 0.06 + 2.5 * Math.pow(t, 2.5);
        // Fade out line bars right at the circle junction (no overlap)
        const lineJunctionFade = t > 0.88 ? (1 - t) / 0.12 : 1;
        const a = Math.sin(lineIdx * 0.9) * 0.3 + Math.cos(lineIdx * 1.7) * 0.2;
        return {
          type: 'line',
          side,
          posInSide,
          t,
          heightScale,
          junctionFade: lineJunctionFade,
          baseDelay: Math.abs(a),
          baseDuration: 0.5 + Math.abs(Math.cos(lineIdx * 1.2)) * 0.8,
          baseHeight: 18 + Math.abs(Math.sin(lineIdx * 2.1) * Math.cos(lineIdx * 0.6)) * 32,
        };
      }
    })
  ).current;

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

      let lowEnergy = 0;
      for (let b = 0; b < Math.min(20, binCount); b++) lowEnergy += freq[b];
      lowEnergy = lowEnergy / Math.min(20, binCount) / 255;
      const globalPulse = lowEnergy * intensity;

      for (let i = 0; i < TOTAL_BARS; i++) {
        const el = bars[i];
        if (!el) continue;

        const p = barParams[i];

        const phase = (elapsed / p.baseDuration + p.baseDelay) * Math.PI * 2;
        const bounce =
          Math.sin(phase) * 0.7 +
          Math.sin(phase * 2.1) * 0.2 +
          Math.cos(phase * 0.45) * 0.1;
        const bounceNorm = 0.2 + (bounce + 1) / 2 * 0.8;
        const bounceH = p.baseHeight * bounceNorm;

        const idleH = Math.max(3, bounceH + (Math.random() - 0.5) * 4);

        // Map bars to frequency bins — symmetric & full-spectrum
        let normalizedSlot;
        if (p.type === 'circle') {
          normalizedSlot = p.binSlot / CIRCLE_BARS;
        } else {
          // Both sides at same t → same bin (mirror), covers full 0-1 range
          normalizedSlot = p.t;
        }
        const scatter = 2 + Math.floor(normalizedSlot * (binCount - 6)) + (i % 7 === 0 ? 2 : i % 7 === 3 ? -1 : 0);
        const binIdx = Math.max(2, Math.min(scatter, binCount - 1));
        const raw = freq[binIdx] || 0;
        const energy = Math.pow(raw / 255, 1.3);
        const freqH = 8 + energy * 65;
        const blended = freqH * 0.75 + bounceH * 0.25;
        const barPulse = 1 + globalPulse * (0.6 + Math.sin(i * 0.7) * 0.3);
        const musicH = Math.max(3, blended * barPulse);

        const h = idleH + (musicH - idleH) * intensity;

        const fade = p.junctionFade != null ? p.junctionFade : 1;
        el.style.height = `${h * p.heightScale * fade}px`;
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

  const circleSize = 'min(82vw, 540px)';

  const renderCircleBars = () =>
    Array.from({ length: CIRCLE_BARS }, (_, i) => {
      const params = barParams[i];
      const angle = params.angle;
      const jf = params.junctionFade;

      const dist = mouseActive && mouseAngle != null ? angleDist(angle, mouseAngle) : 999;
      const active = dist < ACTIVE_RANGE;
      const intensity = active ? 1 - dist / ACTIVE_RANGE : 0;

      const barColor =
        active && intensity > 0.6
          ? 'linear-gradient(to top, #C4B5FD, #F43F5E, #FFD166)'
          : active
            ? 'linear-gradient(to top, #A78BFA, #F43F5E)'
            : 'linear-gradient(to top, #8B5CF6, #F43F5E)';

      const baseOpacity = active ? 0.65 + intensity * 0.35 : 0.5;
      const opacity = baseOpacity * jf;
      const glow = active
        ? `0 0 ${4 + intensity * 12}px rgba(139,92,246,${(0.2 + intensity * 0.35) * jf})`
        : 'none';

      const baseH = 22 + Math.abs(Math.sin(i * 2.3) * Math.cos(i * 0.5)) * 26;
      const initialH = baseH * (0.2 + 0.8 * jf);

      return (
        <div
          key={`c-${i}`}
          className="absolute"
          style={{
            left: '50%',
            top: 0,
            width: '8px',
            height: '50%',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center bottom',
            opacity: jf < 0.02 ? 0 : undefined,
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
                height: `${initialH}px`,
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
    });

  const renderLineBars = (side) => {
    // Mouse proximity to this side's junction
    const junctionAngle = side === 'left' ? 270 : 90;
    const angleDistToMouse = mouseActive && mouseAngle != null
      ? angleDist(mouseAngle, junctionAngle)
      : 999;
    const sideActive = angleDistToMouse < ACTIVE_RANGE;
    const sideIntensity = sideActive ? 1 - angleDistToMouse / ACTIVE_RANGE : 0;

    const startIdx = side === 'left' ? CIRCLE_BARS : CIRCLE_BARS + LINE_BARS_EACH;
    return Array.from({ length: LINE_BARS_EACH }, (_, i) => {
      const idx = startIdx + i;
      const params = barParams[idx];
      const t = side === 'left'
        ? i / (LINE_BARS_EACH - 1)
        : 1 - i / (LINE_BARS_EACH - 1);
      const xPct = (i / (LINE_BARS_EACH - 1)) * 100;

      // Line bars fade out right at the circle junction (no overlap with circle)
      const lineJunctionFade = t > 0.88 ? (1 - t) / 0.12 : 1;

      // Unified highlight: mouse proximity to junction × bar proximity to circle
      const barHighlight = sideIntensity * t * lineJunctionFade;

      const barColor = barHighlight > 0.3
        ? 'linear-gradient(to top, #C4B5FD, #F43F5E, #FFD166)'
        : barHighlight > 0.1
          ? 'linear-gradient(to top, #A78BFA, #F43F5E)'
          : t > 0.4
            ? 'linear-gradient(to top, #A78BFA, #F43F5E)'
            : 'linear-gradient(to top, #8B5CF6, #F43F5E)';

      const opacity = Math.min(1, (0.3 + t * 0.6 + barHighlight * 0.15) * lineJunctionFade);
      const glowStrength = 0.1 + t * 0.3 + barHighlight * 0.5;
      const glow = (t > 0.4 || barHighlight > 0) && lineJunctionFade > 0.05
        ? `0 0 ${4 + t * 6 + barHighlight * 10}px rgba(139,92,246,${Math.min(1, glowStrength * lineJunctionFade)})`
        : 'none';

      // Grow taller when highlighted
      const scaleY = 1 + barHighlight * 0.5;

      return (
        <div
          key={`l-${side}-${i}`}
          ref={(el) => { barRefs.current[idx] = el; }}
          className="absolute rounded-full"
          style={{
            left: `${xPct}%`,
            top: '50%',
            width: '8px',
            height: `${params.baseHeight * params.heightScale * (0.3 + 0.7 * lineJunctionFade)}px`,
            transform: `translate(-50%, -50%) scaleY(${scaleY})`,
            background: barColor,
            opacity,
            boxShadow: glow,
            transition: 'opacity 0.3s, box-shadow 0.3s, background 0.3s, transform 0.2s',
          }}
        />
      );
    });
  };

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

      {/* Main shape — lines fill to screen edges */}
      <div className="relative flex items-center justify-center w-full px-0">
        {/* Left line section — fills from left screen edge to circle */}
        <div
          className="relative hidden sm:block flex-1"
          style={{ height: circleSize, minWidth: 0 }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-vivid-purple-500/25 shadow-[0_0_8px_#8B5CF620]" />
          {renderLineBars('left')}
        </div>

        {/* Circle section */}
        <div
          ref={circleRef}
          className="relative flex items-center justify-center flex-shrink-0"
          style={{ width: circleSize, height: circleSize }}
        >
          <div className="absolute inset-0">
            {renderCircleBars()}
          </div>

          <div className="absolute inset-0 rounded-full border-2 border-vivid-purple-500/20 shadow-[0_0_100px_#8B5CF612,inset_0_0_100px_#8B5CF606] animate-[fadeIn_0.6s_ease-out_0.1s_both]" />

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

        {/* Right line section — fills from circle to right screen edge */}
        <div
          className="relative hidden sm:block flex-1"
          style={{ height: circleSize, minWidth: 0 }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-vivid-purple-500/25 shadow-[0_0_8px_#8B5CF620]" />
          {renderLineBars('right')}
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
const GRID = 80;
const WAVE_W = 240;
const WAVE_H = 40;
const DASH_LEN = 340;
const WAVE_COUNT = 75;

const WAVE_COLOR = '#8B5CF6';
const WAVE_DURATION = '4s';

function ecgPath(seed) {
  const mid = WAVE_H / 2;
  const spike = WAVE_H * 0.75;
  const parts = [];
  const r = (n, min, max) => min + (((seed * 137 + n * 97 + 42) % 1000) / 1000) * (max - min);

  let x = 0;
  parts.push(`M 0,${mid}`);

  const leadIn = r(1, 0.04, 0.14);
  x = WAVE_W * leadIn;
  parts.push(`L ${x},${mid}`);

  const clusters = Math.floor(r(2, 1, 4));
  for (let c = 0; c < clusters; c++) {
    const bx = x + WAVE_W * r(3 + c * 10, 0.01, 0.04);
    const bh = mid - spike * r(4 + c * 10, 0.1, 0.35);
    parts.push(`L ${bx},${mid} L ${bx + WAVE_W * 0.01},${bh} L ${bx + WAVE_W * 0.02},${mid}`);

    const sx1 = bx + WAVE_W * r(5 + c * 10, 0.02, 0.05);
    const sh1 = mid - spike * r(6 + c * 10, 0.5, 1.0);
    parts.push(`L ${sx1},${sh1}`);

    const sx2 = sx1 + WAVE_W * r(7 + c * 10, 0.02, 0.05);
    const sh2 = mid + spike * r(8 + c * 10, 0.2, 0.7);
    parts.push(`L ${sx2},${sh2}`);

    const rx = sx2 + WAVE_W * r(9 + c * 10, 0.02, 0.05);
    parts.push(`L ${rx},${mid}`);

    x = rx;

    if (r(10 + c * 10, 0, 1) > 0.5) {
      const ax = x + WAVE_W * r(11 + c * 10, 0.01, 0.03);
      const ah = mid - spike * r(12 + c * 10, 0.1, 0.25);
      parts.push(`L ${ax},${ah} L ${ax + WAVE_W * 0.015},${mid}`);
      x = ax + WAVE_W * 0.015;
    }

    if (c < clusters - 1) {
      x += WAVE_W * r(13 + c * 10, 0.04, 0.15);
      parts.push(`L ${x},${mid}`);
    }
  }

  parts.push(`L ${WAVE_W},${mid}`);
  return parts.join(' ');
}

function generateWaveConfigs() {
  const configs = [];
  const cols = 50;
  const rows = 60;
  for (let i = 0; i < WAVE_COUNT; i++) {
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
      pathD: ecgPath(i),
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
