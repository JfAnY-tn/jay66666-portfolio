import { useState, useRef, useEffect } from 'react';

const PASSWORD = 'jay66666';

export default function PasswordGate({ isOpen, onUnlock, onClose }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value === PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setValue('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-cinema-dark border border-gray-200 dark:border-cinema-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-cinema-text mb-1">
          需要密码
        </h3>
        <p className="text-sm text-gray-500 dark:text-cinema-text-muted mb-4">
          请输入密码解锁编辑功能
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="密码"
            className={`flex-1 px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-cinema-surface text-gray-800 dark:text-cinema-text outline-none transition-colors ${
              error
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                : 'border-gray-200 dark:border-cinema-surface-hover focus:border-vivid-purple-500 focus:ring-2 focus:ring-vivid-purple-500/20'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-vivid-purple-500 text-white text-sm rounded-lg hover:bg-vivid-purple-600 transition-colors"
          >
            确认
          </button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-red-500">密码错误，请重试</p>
        )}
      </div>
    </div>
  );
}
