/**
 * Cloudflare Pages Function — B站 API 代理
 * 处理 /api/bilibili/* 请求，转发到 api.bilibili.com
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 提取 B站 API 路径: /api/bilibili/x/web-interface/view → x/web-interface/view
  const bilibiliPath = url.pathname.replace(/^\/api\/bilibili\/?/, '');
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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ code: -1, message: 'Proxy error: ' + e.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
