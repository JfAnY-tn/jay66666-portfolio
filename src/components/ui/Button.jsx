const variants = {
  primary:
    'bg-gradient-to-r from-vivid-purple-500 to-hot-pink-500 text-white hover:from-vivid-purple-600 hover:to-hot-pink-500 shadow-lg shadow-vivid-purple-500/25',
  secondary:
    'border border-vivid-purple-500 text-vivid-purple-400 hover:bg-vivid-purple-500/10',
  ghost: 'text-cinema-text-muted hover:text-cinema-text hover:bg-cinema-surface',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
