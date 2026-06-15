/**
 * Cloudflare Pages Function — B站 API 代理 (catch-all)
 * 匹配 /api/bilibili/* 所有路径
 * - x/web-interface/view: 从 B站手机页 __INITIAL_STATE__ 提取视频信息
 * - 其他路径: 直接转发到 api.bilibili.com
 */
export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  const bilibiliPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');

  if (bilibiliPath.startsWith('x/web-interface/view')) {
    return handleViewEndpoint(url);
  }

  // 其他 API
  const targetUrl = `https://api.bilibili.com/${bilibiliPath}${url.search}`;
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (e) {
    return jsonResponse({ code: -1, message: `代理请求失败: ${e.message}` }, 502);
  }
}

/**
 * 从 B站手机版页面提取视频信息
 * m.bilibili.com 的 __INITIAL_STATE__ 嵌入完整视频元数据
 */
async function handleViewEndpoint(url) {
  const bvid = url.searchParams.get('bvid');
  if (!bvid) {
    return jsonResponse({ code: -400, message: '缺少 bvid 参数' }, 400);
  }

  try {
    const response = await fetch(`https://m.bilibili.com/video/${bvid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      // 手机版也失败了，试试 www 兜底
      if (response.status === 412 || response.status === 403) {
        return await fallbackToWww(bvid);
      }
      throw new Error(`B站页面返回 ${response.status}`);
    }

    const html = await response.text();

    // 提取 window.__INITIAL_STATE__ JSON
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
    if (!stateMatch) {
      return jsonResponse({ code: -1, message: '无法解析页面数据' }, 502);
    }

    const state = JSON.parse(stateMatch[1]);
    const videoInfo = findVideoInfo(state, bvid);

    if (!videoInfo) {
      return jsonResponse({ code: -1, message: '未找到视频信息' }, 502);
    }

    return jsonResponse({
      code: 0,
      message: 'OK',
      data: {
        title: videoInfo.title || '',
        pic: (videoInfo.pic || '').replace(/^http:/, 'https:'),
        duration: videoInfo.duration || undefined,
      },
    });
  } catch (e) {
    return jsonResponse({ code: -1, message: `页面信息获取失败: ${e.message}` }, 502);
  }
}

/**
 * 兜底: 尝试 www.bilibili.com 桌面版
 */
async function fallbackToWww(bvid) {
  const response = await fetch(`https://www.bilibili.com/video/${bvid}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  if (!response.ok) {
    throw new Error(`B站页面返回 ${response.status}`);
  }

  const html = await response.text();

  // 从 meta 标签提取
  let title = extractMeta(html, 'og:title') || extractMeta(html, 'title', 'name') || '';
  let pic = extractMeta(html, 'og:image') || extractMeta(html, 'image', 'itemprop') || '';

  if (pic) {
    if (pic.startsWith('//')) pic = 'https:' + pic;
    else if (pic.startsWith('http:')) pic = pic.replace(/^http:/, 'https:');
    pic = pic.replace(/@[^/]+$/, '');
  }

  // 从 <title> 提取标题
  if (!title) {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch) title = titleMatch[1].replace(/_哔哩哔哩_bilibili$/, '');
  }

  return jsonResponse({
    code: 0,
    message: 'OK',
    data: { title, pic },
  });
}

/**
 * 在 __INITIAL_STATE__ JSON 中查找视频信息
 */
function findVideoInfo(state, bvid) {
  // 尝试多种路径
  if (state.videoData) return state.videoData;
  if (state.videoInfo) return state.videoInfo;

  // 深层搜索
  for (const key of Object.keys(state)) {
    const val = state[key];
    if (!val || typeof val !== 'object') continue;
    if (val.bvid === bvid) return val;
    if (val.title && val.pic) return val;
    // 递归一层
    for (const subKey of Object.keys(val)) {
      const sub = val[subKey];
      if (sub && typeof sub === 'object' && (sub.bvid === bvid || (sub.title && sub.pic))) {
        return sub;
      }
    }
  }
  return null;
}

function extractMeta(html, attrValue, attrName = 'property') {
  const esc = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*${attrName}=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attrName}=["']${esc}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
