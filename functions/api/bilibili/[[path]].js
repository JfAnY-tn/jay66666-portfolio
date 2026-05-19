export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const apiPath = params.path?.join('/') || '';
  const target = `https://api.bilibili.com/${apiPath}${url.search}`;

  try {
    const res = await fetch(target, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(JSON.stringify({ code: -1, message: 'Proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
