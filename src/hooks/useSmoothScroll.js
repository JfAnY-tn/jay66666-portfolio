import { useCallback } from 'react';

export default function useSmoothScroll() {
  const scrollTo = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `/#${sectionId}`);
    }
  }, []);

  return scrollTo;
}
