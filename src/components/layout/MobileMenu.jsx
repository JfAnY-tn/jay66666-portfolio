import { useEffect } from 'react';

export default function MobileMenu({ isOpen, onClose, navItems, activeId, onNavigate }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-white/98 dark:bg-cinema-black/98 backdrop-blur-sm flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-gray-500 dark:text-cinema-text-muted hover:text-gray-800 dark:hover:text-cinema-text"
        aria-label="关闭菜单"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {navItems.map((item, i) => (
        <button
          key={item.href}
          onClick={() => onNavigate(item.href)}
          className={`text-2xl tracking-widest transition-all hover:text-vivid-purple-400 ${
            activeId === item.href.replace('#', '')
              ? 'text-vivid-purple-400'
              : 'text-gray-500 dark:text-cinema-text-muted'
          }`}
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
