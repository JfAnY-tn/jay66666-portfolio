import siteConfig from '../../data/siteConfig.json';
import useSmoothScroll from '../../hooks/useSmoothScroll';

function handleExportEdits() {
  const edits = localStorage.getItem('portfolio_edits');
  if (!edits || edits === '{}') {
    alert('没有编辑数据可导出');
    return;
  }
  const blob = new Blob([edits], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio_edits.json';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Footer() {
  const scrollTo = useSmoothScroll();

  return (
    <footer className="border-t border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <button
            onClick={() => scrollTo('hero')}
            className="text-lg font-bold text-vivid-purple-400 hover:text-vivid-purple-500 transition-colors"
          >
            {siteConfig.siteName}
          </button>

          <div className="flex gap-6">
            {siteConfig.navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href.replace('#', ''))}
                className="text-sm text-gray-500 dark:text-cinema-text-muted hover:text-vivid-purple-400 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-cinema-text-muted">
          <div className="flex gap-4">
            {Object.entries(siteConfig.socialLinks).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize text-gray-500 dark:text-cinema-text-muted hover:text-vivid-purple-400 transition-colors"
              >
                {name}
              </a>
            ))}
          </div>
          <p>© {new Date().getFullYear()} {siteConfig.siteName}. All rights reserved.</p>
          {import.meta.env.DEV && (
          <button
            onClick={handleExportEdits}
            className="text-xs text-gray-400 hover:text-vivid-purple-400 transition-colors underline"
            title="导出编辑数据"
          >
            📤 导出编辑数据
          </button>
          )}
        </div>
      </div>
    </footer>
  );
}
