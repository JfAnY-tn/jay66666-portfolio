import { useState, useEffect, useMemo, useRef } from 'react';
import { detectVideoPlatform, fetchVideoMeta, getDirectVideoUrl } from '../../utils/videoPlatform';
import Button from './Button';

const categoryOptions = [
  { value: 'corporate', label: '企业宣传' },
  { value: 'short-video', label: '短视频' },
  { value: 'course-production', label: '课程制作' },
];

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 px-4 py-3 text-sm text-gray-800 dark:text-cinema-text placeholder:text-gray-400 dark:placeholder:text-cinema-text-muted/50 focus:outline-none focus:ring-2 focus:ring-vivid-purple-500/50 transition-colors';

function EpisodeFields({ episode, index, onChange, onRemove, canRemove, onCaptureClick, onFetchMeta }) {
  const epPlatform = useMemo(() => detectVideoPlatform(episode.videoUrl || ''), [episode.videoUrl]);
  const [epFetching, setEpFetching] = useState(false);

  const handleFetchEpMeta = async () => {
    if (!episode.videoUrl) return;
    setEpFetching(true);
    try {
      const meta = await fetchVideoMeta(episode.videoUrl);
      if (meta.duration) {
        onChange(index, 'duration', meta.duration);
        // Auto-save: trigger parent save
        if (onFetchMeta) onFetchMeta();
      }
    } catch (err) {
      console.error('获取分集信息失败', err);
    } finally {
      setEpFetching(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-cinema-surface bg-gray-50/50 dark:bg-cinema-dark/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-cinema-text">第 {index + 1} 集</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs text-hot-pink-500 hover:text-hot-pink-400 transition-colors"
          >
            删除
          </button>
        )}
      </div>
      <input
        value={episode.title || ''}
        onChange={(e) => onChange(index, 'title', e.target.value)}
        className={inputClass}
        placeholder="集标题"
      />
      <div className="flex gap-2">
        <input
          value={episode.videoUrl || ''}
          onChange={(e) => onChange(index, 'videoUrl', e.target.value)}
          className={`${inputClass} flex-1`}
          placeholder="视频链接 (B站/YouTube)"
        />
        {epPlatform && (
          <button
            type="button"
            onClick={handleFetchEpMeta}
            disabled={epFetching}
            className="shrink-0 px-3 py-3 text-xs font-medium rounded-xl bg-vivid-purple-500 text-white hover:bg-vivid-purple-600 disabled:opacity-50 transition-colors"
          >
            {epFetching ? '获取中...' : '获取时长'}
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={episode.thumbnailUrl || ''}
            onChange={(e) => onChange(index, 'thumbnailUrl', e.target.value)}
            className={`${inputClass} flex-1`}
            placeholder="缩略图 URL"
          />
          <button type="button" onClick={() => onCaptureClick(index)} className="shrink-0 px-3 py-3 text-sm rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition-colors" title="从视频截取封面">📸</button>
        </div>
        <input
          value={episode.duration || ''}
          onChange={(e) => onChange(index, 'duration', e.target.value)}
          className={inputClass}
          placeholder="时长 (如 15:00)"
        />
      </div>
    </div>
  );
}

function PreviewTimeSelector({ videoUrl, onSet, onClose }) {
  const videoRef = useRef(null);
  const [playUrl, setPlayUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoUrl) { setLoading(false); return; }
    setLoading(true);
    getDirectVideoUrl(videoUrl).then((url) => {
      if (url) setPlayUrl(`/api/video-proxy?url=${encodeURIComponent(url)}`);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [videoUrl]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white dark:bg-cinema-dark rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-cinema-surface flex items-center justify-between">
          <h4 className="font-bold text-sm">选取预览起点</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {loading && (
          <div className="aspect-video flex items-center justify-center bg-black text-gray-400 text-sm">加载视频中...</div>
        )}
        {!loading && !playUrl && (
          <div className="aspect-video flex items-center justify-center bg-black text-gray-400 text-sm">视频加载失败</div>
        )}
        {playUrl && (
          <video ref={videoRef} src={playUrl} className="w-full max-h-[50vh] bg-black" controls crossOrigin="anonymous" />
        )}

        <div className="p-3 flex gap-2 justify-end sticky bottom-0 bg-white dark:bg-cinema-dark border-t border-gray-200 dark:border-cinema-surface">
          <button onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            const t = Math.floor(v.currentTime);
            onSet(t);
          }} disabled={!playUrl} className="px-4 py-2 text-sm rounded-lg bg-vivid-purple-500 text-white disabled:opacity-50">
            设为预览起点（第 {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0} 秒）
          </button>
        </div>
      </div>
    </div>
  );
}

function ThumbnailCapture({ videoUrl, episodes, onCaptured, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [playUrl, setPlayUrl] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEp, setSelectedEp] = useState(0);

  const sourceUrl = episodes?.length > 0 ? episodes[selectedEp]?.videoUrl : videoUrl;

  useEffect(() => {
    if (!sourceUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCaptured(null);
    getDirectVideoUrl(sourceUrl).then((url) => {
      if (url) {
        setPlayUrl(`/api/video-proxy?url=${encodeURIComponent(url)}`);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sourceUrl]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      setCaptured(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
      alert('截图失败: ' + e.message + '（可能是跨域问题）');
    }
  };

  const handleSave = async () => {
    if (!captured) {
      alert('没有截图数据');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/capture-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: captured }),
      });
      const data = await res.json();
      if (data.ok) {
        onCaptured(data.path);
        onClose();
      } else {
        alert('保存失败: ' + (data.error || '未知错误'));
      }
    } catch (e) {
      alert('请求失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white dark:bg-cinema-dark rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-cinema-surface flex items-center justify-between">
          <h4 className="font-bold text-sm">截取封面</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {episodes?.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-cinema-surface flex gap-1.5 overflow-x-auto">
            {episodes.map((ep, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedEp(i)}
                className={`shrink-0 px-3 py-1 text-xs rounded-full transition-colors ${
                  i === selectedEp
                    ? 'bg-vivid-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                第{i + 1}集
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="aspect-video flex items-center justify-center bg-black text-gray-400 text-sm">
            加载视频中...
          </div>
        )}

        {!loading && !playUrl && (
          <div className="aspect-video flex items-center justify-center bg-black text-gray-400 text-sm">
            视频加载失败，请检查链接
          </div>
        )}

        {playUrl && (
          <div className="relative">
            <video
              ref={videoRef}
              src={playUrl}
              className="w-full max-h-[50vh] bg-black"
              controls
              crossOrigin="anonymous"
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {captured && (
          <div className="px-4 pb-2">
            <div className="rounded-lg overflow-hidden border border-vivid-purple-500/30">
              <img src={captured} alt="截图预览" className="w-full" />
            </div>
            <p className="text-xs text-center text-gray-400 mt-1">截图预览</p>
          </div>
        )}

        <div className="p-3 flex gap-2 justify-end sticky bottom-0 bg-white dark:bg-cinema-dark border-t border-gray-200 dark:border-cinema-surface">
          {captured ? (
            <>
              <button onClick={() => setCaptured(null)} className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-white/10">重拍</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-vivid-purple-500 text-white disabled:opacity-50">
                {saving ? '保存中...' : '使用此图'}
              </button>
            </>
          ) : (
            <button onClick={handleCapture} disabled={!playUrl} className="px-4 py-2 text-sm rounded-lg bg-vivid-purple-500 text-white disabled:opacity-50">
              📸 截图
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditVideoModal({ item, isOpen, onClose, onSave, onReset }) {
  const [form, setForm] = useState({});
  const [captureTarget, setCaptureTarget] = useState(null);

  const showEpisodesEditor = form.category === 'course-production' || form.category === 'short-video';

  const autoSaveForm = () => {
    const data = {
      ...item,
      title: form.title.trim(),
      category: form.category,
      thumbnailUrl: form.thumbnailUrl.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: form.duration.trim(),
      previewStart: Number(form.previewStart) || 0,
      previewEpisodeIndex: form.previewEpisodeIndex != null ? Number(form.previewEpisodeIndex) : undefined,
      tags: form.tags.split('，').map((t) => t.trim()).filter(Boolean),
      description: form.description.trim(),
    };
    if (showEpisodesEditor && form.episodes?.length > 0) {
      data.episodes = form.episodes.map((ep, i) => ({
        ...ep,
        id: ep.id || `ep-${i + 1}`,
      }));
    }
    onSave(data);
  };

  const detectedPlatform = useMemo(() => detectVideoPlatform(form.videoUrl || ''), [form.videoUrl]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        category: item.category || 'corporate',
        thumbnailUrl: item.thumbnailUrl || '',
        videoUrl: item.videoUrl || '',
        duration: item.duration || '',
        previewStart: item.previewStart || 0,
        previewEpisodeIndex: item.previewEpisodeIndex ?? 0,
        tags: (item.tags || []).join('，'),
        description: item.description || '',
        episodes: item.episodes ? [...item.episodes] : [],
      });
    }
  }, [item]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  // Wrap onClose to auto-save first
  const handleClose = () => {
    autoSaveForm();
    onClose();
  };

  if (!isOpen || !item) return null;

  const handleFetchMeta = async () => {
    if (!form.videoUrl) return;
    setFetching(true);
    setFetchError('');
    try {
      const meta = await fetchVideoMeta(form.videoUrl);
      if (meta.duration) {
        setForm((prev) => ({ ...prev, duration: meta.duration }));
      }
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

  const handleEpisodeChange = (index, field, value) => {
    setForm((prev) => {
      const episodes = [...(prev.episodes || [])];
      episodes[index] = { ...episodes[index], [field]: value };
      return { ...prev, episodes };
    });
  };

  const addEpisode = () => {
    setForm((prev) => ({
      ...prev,
      episodes: [
        ...(prev.episodes || []),
        { id: `ep-${Date.now()}`, title: '', videoUrl: '', thumbnailUrl: '', duration: '' },
      ],
    }));
  };

  const removeEpisode = (index) => {
    setForm((prev) => ({
      ...prev,
      episodes: (prev.episodes || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...item,
      title: form.title.trim(),
      category: form.category,
      thumbnailUrl: form.thumbnailUrl.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: form.duration.trim(),
      previewStart: Number(form.previewStart) || 0,
      previewEpisodeIndex: form.previewEpisodeIndex != null ? Number(form.previewEpisodeIndex) : undefined,
      tags: form.tags.split('，').map((t) => t.trim()).filter(Boolean),
      description: form.description.trim(),
    };

    if (showEpisodesEditor && form.episodes?.length > 0) {
      data.episodes = form.episodes.map((ep, i) => ({
        ...ep,
        id: ep.id || `ep-${i + 1}`,
      }));
    } else {
      delete data.episodes;
    }

    onSave(data);
    handleClose();
  };

  const handleReset = () => {
    onReset(item.id);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-cinema-dark border border-gray-200 dark:border-cinema-surface rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-cinema-dark border-b border-gray-200 dark:border-cinema-surface px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-bold text-lg text-gray-800 dark:text-cinema-text">编辑作品</h3>
          <button
            onClick={handleClose}
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
            <div className="flex gap-2">
              <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://placehold.co/600x338/..." />
              <button type="button" onClick={() => setCaptureTarget('main')} className="shrink-0 px-3 py-3 text-sm rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition-colors" title="从视频截取封面">📸</button>
            </div>
          </div>

          {!showEpisodesEditor && (
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
                  {fetching ? '获取中...' : '获取时长'}
                </button>
              )}
            </div>
            {fetchError && (
              <div className="mt-1.5 p-3 rounded-lg bg-hot-pink-500/10 border border-hot-pink-500/20">
                <p className="text-xs text-hot-pink-500 mb-2">{fetchError}</p>
                {detectedPlatform?.platform === 'bilibili' && (
                  <div className="text-xs text-gray-600 dark:text-cinema-text-muted space-y-1.5">
                    <p className="font-medium text-gray-700 dark:text-cinema-text">💡 手动获取封面和标题：</p>
                    <p>1. <a href={form.videoUrl} target="_blank" rel="noopener noreferrer" className="text-electric-teal-400 hover:underline font-medium">点此打开B站视频页</a></p>
                    <p>2. 右键点击视频播放器上的<b>封面大图</b> → 「复制图片地址」</p>
                    <p>3. 粘贴到上方「缩略图 URL」字段</p>
                    <p>4. 复制视频标题，粘贴到「标题」字段</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-electric-teal-400 hover:underline">找不到封面图？更多方法</summary>
                      <div className="mt-2 pl-3 space-y-1.5 border-l-2 border-electric-teal-400/30">
                        <p><b>🔖 一键提取（推荐）：</b>拖下面的按钮到书签栏，在B站视频页点一下即可复制封面+标题：</p>
                        <a
                          href={`javascript:(function(){const t=document.querySelector('meta[property=\\\"og:title\\\"]')?.content||document.title.replace(/_哔哩哔哩_bilibili.*/,'');const p=document.querySelector('meta[property=\\\"og:image\\\"]')?.content?.replace(/@.*/,'').replace(/^\\/\\//,'https://');const d='标题: '+t+'\\n封面: '+p;prompt('复制下面的内容 (Ctrl+C)',d);})()`}
                          className="inline-block px-3 py-1.5 text-xs font-medium rounded-lg bg-vivid-purple-500 text-white hover:bg-vivid-purple-600 cursor-grab active:cursor-grabbing"
                          title="拖到书签栏，在B站视频页点击即可提取封面链接"
                        >📋 B站封面提取</a>
                        <p className="!mt-2"><b>方法B：</b>按 F12 → Network → Img → 刷新页面 → 找最大的 jpg 图片 → 右键 Copy link address</p>
                        <p><b>方法C：</b>在B站页面按 Ctrl+U 查看源码 → 搜索 <code className="text-xs bg-gray-200 dark:bg-cinema-surface px-1 rounded">og:image</code> → 复制链接，去掉末尾 <code className="text-xs bg-gray-200 dark:bg-cinema-surface px-1 rounded">@100w_100h_1c.png</code></p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {!showEpisodesEditor && (
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">时长</label>
            <input name="duration" value={form.duration} onChange={handleChange} className={inputClass} placeholder="1:30" />
          </div>
          )}

          {/* Preview source selector for collections */}
          {(form.episodes?.length > 0) && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">悬停预览取自</label>
              <select
                name="previewEpisodeIndex"
                value={form.previewEpisodeIndex ?? 0}
                onChange={handleChange}
                className={inputClass}
              >
                {form.episodes.map((ep, i) => (
                  <option key={i} value={i}>第{i + 1}集：{ep.title || '(无标题)'}</option>
                ))}
              </select>
            </div>
          )}

          {/* Preview start time selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">
              悬停预览起点
              <span className="font-normal text-gray-400 ml-1">
                {form.previewStart > 0 ? `（第 ${form.previewStart} 秒）` : '（从头开始）'}
              </span>
            </label>
            <div className="flex gap-2">
              <input name="previewStart" type="number" min="0" step="1" value={form.previewStart || 0} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="从第几秒开始预览" />
              <button
                type="button"
                onClick={() => {
                  const srcUrl = (form.previewEpisodeIndex != null && form.episodes?.[form.previewEpisodeIndex]?.videoUrl)
                    ? form.episodes[form.previewEpisodeIndex].videoUrl
                    : (form.videoUrl || form.episodes?.[0]?.videoUrl || '');
                  if (!srcUrl) return;
                  setCaptureTarget('preview-select');
                }}
                className="shrink-0 px-3 py-3 text-sm rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition-colors"
                title="拖进度条选取起始点"
              >🎬 选取</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">标签（用中文逗号分隔）</label>
            <input name="tags" value={form.tags} onChange={handleChange} className={inputClass} placeholder="广告, 调色" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">描述</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} />
          </div>

          {/* Episode editor — only for course-production */}
          {showEpisodesEditor && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-cinema-text">
                  课程选集 <span className="text-gray-400 font-normal">（{form.episodes?.length || 0} 集）</span>
                </label>
                <button
                  type="button"
                  onClick={addEpisode}
                  className="text-xs px-3 py-1.5 rounded-lg bg-vivid-purple-500/10 text-vivid-purple-400 hover:bg-vivid-purple-500/20 transition-colors font-medium"
                >
                  + 添加一集
                </button>
              </div>
              {(form.episodes?.length || 0) === 0 && (
                <p className="text-xs text-gray-400 dark:text-cinema-text-muted">暂未添加选集，点击上方按钮添加。</p>
              )}
              {form.episodes?.map((ep, i) => (
                <EpisodeFields
                  key={i}
                  episode={ep}
                  index={i}
                  onChange={handleEpisodeChange}
                  onRemove={removeEpisode}
                  canRemove={form.episodes.length > 1}
                  onCaptureClick={(i) => setCaptureTarget(`ep-${i}`)}
                  onFetchMeta={autoSaveForm}
                />
              ))}
            </div>
          )}

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
      {captureTarget && (() => {
        if (captureTarget === 'preview-select') {
          const srcUrl = (form.previewEpisodeIndex != null && form.episodes?.[form.previewEpisodeIndex]?.videoUrl)
            ? form.episodes[form.previewEpisodeIndex].videoUrl
            : (form.videoUrl || form.episodes?.[0]?.videoUrl || '');
          return (
            <PreviewTimeSelector
              videoUrl={srcUrl}
              currentTime={form.previewStart || 0}
              onSet={(seconds) => {
                setForm(prev => ({ ...prev, previewStart: seconds }));
                setCaptureTarget(null);
              }}
              onClose={() => setCaptureTarget(null)}
            />
          );
        }
        const targetUrl = captureTarget === 'main'
          ? (form.videoUrl || form.episodes?.[0]?.videoUrl || '')
          : (form.episodes?.[parseInt(captureTarget.split('-')[1])]?.videoUrl || '');
        const handleCaptured = (path) => {
          if (captureTarget === 'main') {
            setForm(prev => ({ ...prev, thumbnailUrl: path }));
          } else {
            const idx = parseInt(captureTarget.split('-')[1]);
            handleEpisodeChange(idx, 'thumbnailUrl', path);
          }
          setCaptureTarget(null);
        };
        return (
          <ThumbnailCapture
            videoUrl={targetUrl}
            episodes={(captureTarget === 'main' || showEpisodesEditor) ? form.episodes : undefined}
            onCaptured={handleCaptured}
            onClose={() => setCaptureTarget(null)}
          />
        );
      })()}
    </div>
  );
}
