import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('themeMode') || 'dark';
  });

  const [dark, setDark] = useState(() => {
    if (mode === 'auto') return isNightTime();
    return mode !== 'light';
  });

  const setMode = useCallback((m) => {
    setModeState(m);
    localStorage.setItem('themeMode', m);
  }, []);

  // Sync dark state when mode changes
  useEffect(() => {
    if (mode === 'auto') {
      setDark(isNightTime());
    } else {
      setDark(mode === 'dark');
    }
  }, [mode]);

  // Auto-check time every minute when in auto mode
  useEffect(() => {
    if (mode !== 'auto') return;
    const timer = setInterval(() => {
      setDark(isNightTime());
    }, 60000);
    return () => clearInterval(timer);
  }, [mode]);

  // Apply dark class to html
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  }, [setMode]);

  return (
    <ThemeContext.Provider value={{ dark, mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
