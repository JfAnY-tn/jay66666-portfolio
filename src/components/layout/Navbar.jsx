import { useState, useEffect } from 'react';
import siteConfig from '../../data/siteConfig.json';
import useScrollSpy from '../../hooks/useScrollSpy';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import MobileMenu from './MobileMenu';
import ThemeToggle from '../ui/ThemeToggle';
import MusicToggle from '../ui/MusicToggle';

const sectionIds = ['hero', 'portfolio', 'services', 'about', 'testimonials', 'contact'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = useScrollSpy(sectionIds);
  const scrollTo = useSmoothScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    scrollTo(href.replace('#', ''));
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 dark:bg-cinema-dark/15 dark:border-white/[0.05]'
            : 'bg-white/40 backdrop-blur-xl border-b border-transparent dark:bg-cinema-dark/5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => scrollTo('hero')}
            className="text-xl font-bold tracking-tight text-vivid-purple-400 hover:text-vivid-purple-500 transition-colors"
          >
            {siteConfig.siteName}
          </button>

          <div className="hidden md:flex items-center gap-8">
            {siteConfig.navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`text-sm tracking-wide transition-colors hover:text-vivid-purple-400 ${
                  activeId === item.href.replace('#', '')
                    ? 'text-vivid-purple-400'
                    : 'text-gray-500 dark:text-cinema-text-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
            <MusicToggle />
            <ThemeToggle />
          </div>

          <div className="flex md:hidden items-center gap-3">
            <MusicToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col gap-1.5 p-2"
              aria-label="打开菜单"
            >
              <span className="block h-0.5 w-6 bg-gray-700 dark:bg-cinema-text" />
              <span className="block h-0.5 w-6 bg-gray-700 dark:bg-cinema-text" />
              <span className="block h-0.5 w-4 bg-gray-700 dark:bg-cinema-text" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={siteConfig.navItems}
        activeId={activeId}
        onNavigate={handleNav}
      />
    </>
  );
}
