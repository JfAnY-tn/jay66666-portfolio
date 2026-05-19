import ScrollReveal from './ScrollReveal';

export default function SectionHeading({ number, title, subtitle }) {
  return (
    <ScrollReveal className="mb-14 text-center">
      {/* Top accent: badge + flanking lines */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <span className="hidden sm:block h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-vivid-purple-500/40" />
        <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-vivid-purple-500/10 border border-vivid-purple-500/20 text-sm font-semibold tracking-widest text-vivid-purple-400 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-vivid-purple-400 animate-pulse" />
          {number}
          <span className="w-1.5 h-1.5 rounded-full bg-vivid-purple-400 animate-pulse" />
        </span>
        <span className="hidden sm:block h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-vivid-purple-500/40" />
      </div>

      {/* Title with gradient */}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
        <span className="bg-gradient-to-r from-gray-900 via-gray-900 to-vivid-purple-500 dark:from-cinema-text dark:via-cinema-text dark:to-vivid-purple-300 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>

      {/* Bottom decorative bar */}
      <div className="mt-4 flex items-center justify-center gap-1">
        <span className="h-1 w-8 rounded-full bg-gradient-to-r from-vivid-purple-500 to-hot-pink-500" />
        <span className="h-1 w-2 rounded-full bg-hot-pink-500/60" />
      </div>

      {subtitle && (
        <p className="mt-5 text-gray-500 dark:text-cinema-text-muted max-w-2xl mx-auto leading-relaxed text-base">
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}
