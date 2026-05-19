import { useState, useRef, useCallback, useEffect } from 'react';
import SectionHeading from '../ui/SectionHeading';
import TestimonialCard from '../ui/TestimonialCard';
import testimonials from '../../data/testimonials.json';

export default function TestimonialsSection() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollRight(maxScroll > 0 && el.scrollLeft < maxScroll - 4);
    if (maxScroll > 0) {
      const progress = el.scrollLeft / maxScroll;
      const idx = Math.round(progress * (testimonials.length - 1));
      setActiveIndex(Math.max(0, Math.min(idx, testimonials.length - 1)));
    }
  }, []);

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

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.snap-start')?.offsetWidth || 380;
    const gap = 24;
    el.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  };

  return (
    <section id="testimonials" className="py-24 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          number="客户评价"
          title="他们这样说"
          subtitle="来自 20+ 合作客户的真实反馈，每一份认可都是继续创作的动力。"
        />

        {/* Carousel */}
        <div className="relative">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-cinema-dark/80 border border-cinema-surface text-cinema-text hover:bg-cinema-surface hover:border-vivid-purple-500/30 transition-all shadow-lg shadow-black/20"
              aria-label="上一页"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-cinema-dark/80 border border-cinema-surface text-cinema-text hover:bg-cinema-surface hover:border-vivid-purple-500/30 transition-all shadow-lg shadow-black/20"
              aria-label="下一页"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="snap-start flex-shrink-0 w-[85vw] sm:w-[380px]"
              >
                <TestimonialCard {...item} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const card = el.querySelectorAll('.snap-start')[i];
                card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
              }}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-6 h-2 bg-vivid-purple-500'
                  : 'w-2 h-2 bg-cinema-surface-hover hover:bg-cinema-text-muted'
              }`}
              aria-label={`第 ${i + 1} 条评价`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
