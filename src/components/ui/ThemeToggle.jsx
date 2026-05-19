import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const options = [
  {
    mode: 'light',
    label: '日间模式',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M4 12H2M22 12h-2M6.5 6.5l1 1M16.5 16.5l1 1M6.5 17.5l1-1M16.5 7.5l1-1" />
      </svg>
    ),
  },
  {
    mode: 'dark',
    label: '夜间模式',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  },
  {
    mode: 'auto',
    label: '自动切换',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const current = options.find((o) => o.mode === mode) || options[1];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:text-vivid-purple-400 hover:bg-vivid-purple-500/10 ${
          mode === 'light' ? 'text-amber-500' : 'text-gray-500 dark:text-cinema-text-muted'
        }`}
        aria-label="主题设置"
      >
        {current.icon}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-white dark:bg-cinema-dark border border-gray-200 dark:border-cinema-surface shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          {options.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => {
                setMode(opt.mode);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                mode === opt.mode
                  ? 'text-vivid-purple-400 bg-vivid-purple-500/10'
                  : 'text-gray-600 dark:text-cinema-text-muted hover:bg-gray-50 dark:hover:bg-cinema-surface'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
              {mode === opt.mode && (
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
