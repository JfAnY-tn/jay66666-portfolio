import { useState, useEffect, useMemo } from 'react';
import { detectVideoPlatform, fetchVideoMeta } from '../../utils/videoPlatform';
import Button from './Button';

const categoryOptions = [
  { value: 'commercial', label: '商业广告' },
  { value: 'music-video', label: '音乐 MV' },
  { value: 'corporate', label: '企业宣传' },
  { value: 'short-video', label: '短视频' },
  { value: 'wedding', label: '婚礼电影' },
  { value: 'event', label: '活动记录' },
];

export default function EditVideoModal({ item, isOpen, onClose, onSave, onReset }) {
  const [form, setForm] = useState({});

  const detectedPlatform = useMemo(() => detectVideoPlatform(form.videoUrl || ''), [form.videoUrl]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        category: item.category || 'commercial',
        thumbnailUrl: item.thumbnailUrl || '',
        videoUrl: item.videoUrl || '',
        duration: item.duration || '',
        tags: (item.tags || []).join('，'),
        description: item.description || '',
      });
    }
  }, [item]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleFetchMeta = async () => {
    if (!form.videoUrl) return;
    setFetching(true);
    setFetchError('');
    try {
      const meta = await fetchVideoMeta(form.videoUrl);
      setForm((prev) => ({
        ...prev,
        title: meta.title || prev.title,
        thumbnailUrl: meta.thumbnailUrl || prev.thumbnailUrl,
        duration: meta.duration || prev.duration,
      }));
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...item,
      title: form.title.trim(),
      category: form.category,
      thumbnailUrl: form.thumbnailUrl.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: form.duration.trim(),
      tags: form.tags.split('，').map((t) => t.trim()).filter(Boolean),
      description: form.description.trim(),
    });
    onClose();
  };

  const handleReset = () => {
    onReset(item.id);
    onClose();
  };

  const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 px-4 py-3 text-sm text-gray-800 dark:text-cinema-text placeholder:text-gray-400 dark:placeholder:text-cinema-text-muted/50 focus:outline-none focus:ring-2 focus:ring-vivid-purple-500/50 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-cinema-dark border border-gray-200 dark:border-cinema-surface rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-cinema-dark border-b border-gray-200 dark:border-cinema-surface px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-bold text-lg text-gray-800 dark:text-cinema-text">编辑作品</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 dark:text-cinema-text-muted hover:text-gray-800 dark:hover:text-cinema-text"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">标题</label>
            <input name="title" value={form.title} onChange={handleChange} className={inputClass} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">分类</label>
            <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">缩略图 URL</label>
            <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} className={inputClass} placeholder="https://placehold.co/600x338/..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">
              视频 URL
              {detectedPlatform && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-electric-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-teal-400 animate-pulse" />
                  已识别：{detectedPlatform.label}
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input name="videoUrl" value={form.videoUrl} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="粘贴 B站/YouTube 链接或本地视频路径" />
              {detectedPlatform && (
                <button
                  type="button"
                  onClick={handleFetchMeta}
                  disabled={fetching}
                  className="shrink-0 px-4 py-3 text-sm font-medium rounded-xl bg-vivid-purple-500 text-white hover:bg-vivid-purple-600 disabled:opacity-50 transition-colors"
                >
                  {fetching ? '获取中...' : '获取视频信息'}
                </button>
              )}
            </div>
            {fetchError && (
              <div className="mt-1.5 p-3 rounded-lg bg-hot-pink-500/10 border border-hot-pink-500/20">
                <p className="text-xs text-hot-pink-500 mb-2">{fetchError}</p>
                {detectedPlatform?.platform === 'bilibili' && (
                  <div className="text-xs text-gray-600 dark:text-cinema-text-muted space-y-1">
                    <p>B站 API 限制了海外服务器访问。请手动操作：</p>
                    <p>1. <a href={form.videoUrl} target="_blank" rel="noopener noreferrer" className="text-electric-teal-400 hover:underline">打开B站视频页</a>，复制标题</p>
                    <p>2. 右键视频封面 → 复制图片地址，粘贴到「缩略图 URL」</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">时长</label>
            <input name="duration" value={form.duration} onChange={handleChange} className={inputClass} placeholder="1:30" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">标签（用中文逗号分隔）</label>
            <input name="tags" value={form.tags} onChange={handleChange} className={inputClass} placeholder="广告, 调色" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">描述</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" size="md" className="flex-1">保存</Button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-500 dark:text-cinema-text-muted hover:text-hot-pink-500 transition-colors"
            >
              恢复默认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
