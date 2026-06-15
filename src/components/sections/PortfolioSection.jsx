import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import SectionHeading from '../ui/SectionHeading';
import ScrollReveal from '../ui/ScrollReveal';
import VideoCard from '../ui/VideoCard';
import VideoModal from '../ui/VideoModal';
import EditVideoModal from '../ui/EditVideoModal';
import PasswordGate from '../ui/PasswordGate';
import defaultPortfolio from '../../data/portfolio.json';

const DESKTOP_COLS = 3;
const MOBILE_COLS = 2;
const ITEMS_DESKTOP = 6;  // 3 cols × 2 rows
const ITEMS_MOBILE = 2;   // 2 cols × 1 row
const GAP = 24;

const categories = [
  { key: 'all', label: '全部' },
  { key: 'corporate', label: '企业宣传' },
  { key: 'short-video', label: '短视频' },
  { key: 'course-production', label: '课程制作' },
  { key: 'event', label: '活动记录' },
];

const STORAGE_KEY = 'portfolio_edits';

function loadEdits() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveEdits(edits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}

function cardVisibility(pageIndex, colIndex, scrollX, containerW) {
  if (containerW === 0) return 1;
  const pageStart = pageIndex * (containerW + GAP);
  const stagger = containerW * 0.07 * colIndex;
  const cardEntry = pageStart + stagger;
  const fadeZone = containerW * 0.8;

  const progress = (scrollX + containerW - cardEntry) / fadeZone;
  return Math.max(0, Math.min(1, progress));
}

function updateCardStyles(container, x, w) {
  const cards = container.querySelectorAll('[data-portfolio-card]');
  for (const card of cards) {
    const pageIdx = Number(card.dataset.page);
    const col = Number(card.dataset.col);
    const v = cardVisibility(pageIdx, col, x, w);
    card.style.opacity = v;
    card.style.transform = `translateX(${(1 - v) * 80}px)`;
  }
}

export default function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [edits, setEdits] = useState(loadEdits);
  const [unlocked, setUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pendingEditRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollAnimRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(
    window.innerWidth < 1024 ? ITEMS_MOBILE : ITEMS_DESKTOP
  );
  const [colsPerRow, setColsPerRow] = useState(
    window.innerWidth < 1024 ? MOBILE_COLS : DESKTOP_COLS
  );

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setItemsPerPage(mobile ? ITEMS_MOBILE : ITEMS_DESKTOP);
      setColsPerRow(mobile ? MOBILE_COLS : DESKTOP_COLS);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const portfolio = useMemo(() =>
    defaultPortfolio.map((item) => edits[item.id] ? { ...item, ...edits[item.id] } : item),
    [edits]
  );

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? portfolio
        : portfolio.filter((item) => item.category === activeCategory),
    [portfolio, activeCategory]
  );

  const pages = useMemo(() => {
    const result = [];
    for (let i = 0; i < filtered.length; i += itemsPerPage) {
      result.push(filtered.slice(i, i + itemsPerPage));
    }
    return result;
  }, [filtered, itemsPerPage]);

  const totalPages = pages.length;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const x = el.scrollLeft;
    const w = el.clientWidth;
    setCanScrollLeft(x > 4);
    const maxScroll = el.scrollWidth - w;
    setCanScrollRight(maxScroll > 0 && x < maxScroll - 4);
    if (maxScroll > 0) {
      const progress = x / maxScroll;
      const idx = Math.round(progress * (totalPages - 1));
      setActivePage(Math.max(0, Math.min(idx, totalPages - 1)));
    }
    updateCardStyles(el, x, w);
  }, [totalPages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const startScrollAnim = useCallback(() => {
    if (scrollAnimRef.current) return;
    let count = 0;
    const maxFrames = 90;
    const animate = () => {
      const el = scrollRef.current;
      if (!el || count >= maxFrames) {
        scrollAnimRef.current = null;
        return;
      }
      count++;
      updateCardStyles(el, el.scrollLeft, el.clientWidth);
      scrollAnimRef.current = requestAnimationFrame(animate);
    };
    scrollAnimRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const page = el.querySelector('.snap-start');
    const pageWidth = page?.offsetWidth || el.clientWidth;
    el.scrollBy({ left: direction * (pageWidth + GAP), behavior: 'smooth' });
    startScrollAnim();
  };

  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    setActivePage(0);
    scrollRef.current?.scrollTo({ left: 0, behavior: 'instant' });
    const el = scrollRef.current;
    if (el) updateCardStyles(el, 0, el.clientWidth);
  };

  const handleEditSave = (updated) => {
    const newEdits = { ...edits, [updated.id]: updated };
    setEdits(newEdits);
    saveEdits(newEdits);
  };

  const handleEditReset = (id) => {
    const newEdits = { ...edits };
    delete newEdits[id];
    setEdits(newEdits);
    saveEdits(newEdits);
  };

  return (
    <section id="portfolio" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          number="作品集"
          title="精选作品"
          subtitle="每一个项目都是一次全新的创作旅程。点击视频卡片观看完整作品。"
        />

        {/* Filter tags */}
        <ScrollReveal className="mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`px-4 py-2 text-sm rounded-full transition-all duration-200 ${
                  activeCategory === cat.key
                    ? 'bg-vivid-purple-500 text-white shadow-lg shadow-vivid-purple-500/25'
                    : 'bg-gray-100 dark:bg-cinema-surface text-gray-500 dark:text-cinema-text-muted hover:bg-gray-200 dark:hover:bg-cinema-surface-hover hover:text-gray-800 dark:hover:text-cinema-text'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Carousel */}
        {filtered.length > 0 && (
          <div className="relative">
            {/* Left arrow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={() => scroll(-1)}
                disabled={!canScrollLeft}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-cinema-dark/80 border border-gray-200 dark:border-cinema-surface transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:hover:bg-gray-100 dark:enabled:hover:bg-cinema-surface enabled:hover:border-vivid-purple-500/30 text-gray-800 dark:text-cinema-text shadow-lg shadow-black/10 dark:shadow-black/20"
                aria-label="上一页"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Right arrow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={() => scroll(1)}
                disabled={!canScrollRight}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-cinema-dark/80 border border-gray-200 dark:border-cinema-surface transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:hover:bg-gray-100 dark:enabled:hover:bg-cinema-surface enabled:hover:border-vivid-purple-500/30 text-gray-800 dark:text-cinema-text shadow-lg shadow-black/10 dark:shadow-black/20"
                aria-label="下一页"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Scrollable track */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {pages.map((pageItems, pageIdx) => (
                <div
                  key={pageIdx}
                  className={`snap-start flex-shrink-0 w-full grid gap-4 md:gap-6 ${itemsPerPage <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}
                >
                  {pageItems.map((item, i) => {
                    const col = i % colsPerRow;
                    return (
                      <div
                        key={item.id}
                        data-portfolio-card
                        data-page={pageIdx}
                        data-col={col}
                        className="h-full"
                        style={{
                          opacity: 1,
                          willChange: 'opacity, transform',
                        }}
                      >
                        <VideoCard
                          {...item}
                          onClick={() => setActiveVideo(item)}
                          onEdit={() => {
                            if (unlocked) {
                              setEditingItem(item);
                            } else {
                              pendingEditRef.current = item;
                              setShowPassword(true);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page dots */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  const page = el.querySelectorAll('.snap-start')[i];
                  page?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                  startScrollAnim();
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === activePage
                    ? 'w-6 h-2 bg-vivid-purple-500'
                    : 'w-2 h-2 bg-gray-300 dark:bg-cinema-surface-hover hover:bg-gray-400 dark:hover:bg-cinema-text-muted'
                }`}
                aria-label={`第 ${i + 1} 页`}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 dark:text-cinema-text-muted py-12">
            该分类暂无作品，敬请期待。
          </p>
        )}
      </div>

      <VideoModal
        video={activeVideo}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      <EditVideoModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleEditSave}
        onReset={handleEditReset}
      />

      <PasswordGate
        isOpen={showPassword}
        onClose={() => setShowPassword(false)}
        onUnlock={() => {
          setUnlocked(true);
          setShowPassword(false);
          if (pendingEditRef.current) {
            setEditingItem(pendingEditRef.current);
            pendingEditRef.current = null;
          }
        }}
      />
    </section>
  );
}
