const PLATFORMS = [
  {
    name: 'bilibili',
    label: 'B站',
    match: (url) => {
      const bv = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
      if (bv) return bv[1];
      const b23 = url.match(/b23\.tv\/(BV[a-zA-Z0-9]+)/);
      return b23 ? b23[1] : null;
    },
    embed: (id) => `https://player.bilibili.com/player.html?bvid=${id}&page=1&high_quality=1&autoplay=1`,
  },
  {
    name: 'youtube',
    label: 'YouTube',
    match: (url) => {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      return m ? m[1] : null;
    },
    embed: (id) => `https://www.youtube.com/embed/${id}?autoplay=1`,
  },
];

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function bilibiliApiUrl(path, params) {
  const qs = new URLSearchParams(params).toString();
  return `/api/bilibili/x/${path}?${qs}`;
}

async function fetchBilibiliMeta(bvid) {
  const url = bilibiliApiUrl('web-interface/view', { bvid });
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || `HTTP ${res.status}: 获取B站视频信息失败`);
  }
  const { title, pic, duration } = json.data;
  return { title, thumbnailUrl: pic?.replace(/^http:/, 'https:'), duration: formatDuration(duration) };
}

async function fetchYouTubeMeta(videoId) {
  const res = await fetch(`/api/youtube/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
  if (!res.ok) throw new Error('获取YouTube视频信息失败');
  const json = await res.json();
  return {
    title: json.title,
    thumbnailUrl: json.thumbnail_url,
    duration: null,
  };
}

async function fetchBilibiliPlayUrl(bvid) {
  try {
    const infoUrl = bilibiliApiUrl('web-interface/view', { bvid });
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const infoJson = await infoRes.json();
    if (infoJson.code !== 0) return null;
    const cid = infoJson.data?.cid;
    if (!cid) return null;

    const playUrl = bilibiliApiUrl('player/playurl', { bvid, cid, qn: 64, fnval: 0 });
    const playRes = await fetch(playUrl);
    if (!playRes.ok) return null;
    const playJson = await playRes.json();
    if (playJson.code !== 0) return null;
    const durl = playJson.data?.durl;
    if (durl && durl.length > 0) {
      return durl[0].url?.replace(/^http:/, 'https:');
    }
    return null;
  } catch {
    return null;
  }
}

export function detectVideoPlatform(url) {
  if (!url) return null;
  for (const p of PLATFORMS) {
    const id = p.match(url);
    if (id) return { platform: p.name, label: p.label, embedUrl: p.embed(id), videoId: id };
  }
  return null;
}

export async function fetchVideoMeta(url) {
  if (!url) throw new Error('URL 为空');
  for (const p of PLATFORMS) {
    const id = p.match(url);
    if (id) {
      if (p.name === 'bilibili') return fetchBilibiliMeta(id);
      if (p.name === 'youtube') return fetchYouTubeMeta(id);
    }
  }
  throw new Error('不支持的视频平台');
}

export async function getDirectVideoUrl(url) {
  if (!url) return null;
  if (isDirectVideo(url)) return url;
  for (const p of PLATFORMS) {
    const id = p.match(url);
    if (id) {
      if (p.name === 'bilibili') return fetchBilibiliPlayUrl(id);
    }
  }
  return null;
}

export function isDirectVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(url);
}
