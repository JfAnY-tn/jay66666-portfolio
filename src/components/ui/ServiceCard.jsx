export default function ServiceCard({ icon, title, description, priceRange, index = 0 }) {
  return (
    <div className="group flex flex-col h-full rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-8 transition-all duration-300 hover:border-vivid-purple-500/30 hover:bg-gray-50 dark:hover:bg-cinema-surface/50 hover:-translate-y-1">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-3 text-lg font-bold group-hover:text-vivid-purple-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-cinema-text-muted leading-relaxed flex-1">
        {description}
      </p>
      <span className="inline-block self-start mt-4 text-sm font-medium text-golden bg-golden/10 px-3 py-1 rounded-full">
        {priceRange}
      </span>
    </div>
  );
}
