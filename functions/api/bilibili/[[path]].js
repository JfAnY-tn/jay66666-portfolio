/**
 * Cloudflare Pages Function — B站 API 代理 (catch-all)
 * 匹配 /api/bilibili/* 所有路径，转发到 api.bilibili.com
 */
export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // params.path 捕获 [[path]] 的内容，如 "x/web-interface/view"
  const bilibiliPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const targetUrl = `https://api.bilibili.com/${bilibiliPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'Origin': 'https://www.bilibili.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      code: -1,
      message: `代理请求失败: ${e.message}`,
      debug: { targetUrl, path: bilibiliPath },
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
