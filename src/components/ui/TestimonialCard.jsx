export default function TestimonialCard({ name, role, company, quote }) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-8 transition-all duration-300 hover:border-vivid-purple-500/20">
      {/* Quote icon */}
      <svg className="w-8 h-8 text-vivid-purple-500/30 mb-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>

      <p className="text-gray-800 dark:text-cinema-text leading-relaxed flex-1">{quote}</p>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-cinema-surface/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vivid-purple-500 to-hot-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{name}</div>
          <div className="text-xs text-gray-500 dark:text-cinema-text-muted truncate">{role}，{company}</div>
        </div>
      </div>
    </div>
  );
}
