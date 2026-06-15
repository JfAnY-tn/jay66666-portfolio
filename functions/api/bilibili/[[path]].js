/**
 * Cloudflare Pages Function — B站 API 代理 (catch-all)
 * 匹配 /api/bilibili/* 所有路径
 * - x/web-interface/view: 从 B站视频页 HTML meta 标签提取信息（API 被 Cloudflare IP 封了）
 * - 其他路径: 直接转发到 api.bilibili.com
 */
export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  const bilibiliPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');

  // B站 API 封了 Cloudflare IP，对 view 接口用 HTML 爬取代替
  if (bilibiliPath.startsWith('x/web-interface/view')) {
    return handleViewEndpoint(url);
  }

  // 其他 API 直接转发
  const targetUrl = `https://api.bilibili.com/${bilibiliPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      code: -1,
      message: `代理请求失败: ${e.message}`,
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * 从 B站视频页 HTML 提取视频信息（title + cover）
 */
async function handleViewEndpoint(url) {
  const bvid = url.searchParams.get('bvid');
  if (!bvid) {
    return jsonResponse({ code: -400, message: '缺少 bvid 参数' }, 400);
  }

  try {
    const response = await fetch(`https://www.bilibili.com/video/${bvid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`B站页面返回 ${response.status}`);
    }

    const html = await response.text();

    // 提取标题
    let title = extractMeta(html, 'og:title')
      || extractMeta(html, 'title', 'name')
      || extractTitleTag(html)
      || '';

    // 提取封面 — og:image 带 @ 后缀的是小图，去掉后得到大图
    let pic = extractMeta(html, 'og:image')
      || extractMeta(html, 'image', 'itemprop')
      || extractMeta(html, 'thumbnailUrl', 'itemprop')
      || '';

    // 修复封面 URL
    if (pic) {
      // 确保 https
      if (pic.startsWith('//')) pic = 'https:' + pic;
      else if (pic.startsWith('http:')) pic = pic.replace(/^http:/, 'https:');
      // 去掉 @ 后缀得到原图（og:image 会给 @100w_100h_1c.png 这种小图）
      pic = pic.replace(/@[^/]+$/, '');
    }

    return jsonResponse({
      code: 0,
      message: 'OK',
      data: {
        title: title,
        pic: pic,
      },
    });
  } catch (e) {
    return jsonResponse({
      code: -1,
      message: `页面信息获取失败: ${e.message}`,
    }, 502);
  }
}

/**
 * 从 HTML 中提取 meta 标签 content
 * attr: property / name / itemprop
 */
function extractMeta(html, attrValue, attrName = 'property') {
  const esc = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // property="..." content="..." 或 content="..." property="..."
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

/**
 * 从 <title> 标签提取标题
 */
function extractTitleTag(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].replace(/_哔哩哔哩_bilibili$/, '') : null;
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
