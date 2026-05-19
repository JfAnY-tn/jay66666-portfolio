export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const headers = {
      'Referer': 'https://www.bilibili.com/',
      'Origin': 'https://www.bilibili.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };
    // Forward range header for video seeking
    const range = request.headers.get('Range');
    if (range) headers['Range'] = range;

    const fetchRes = await fetch(targetUrl, { headers });

    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', '*');
    const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    for (const h of passHeaders) {
      const v = fetchRes.headers.get(h);
      if (v) resHeaders.set(h, v);
    }

    return new Response(fetchRes.body, {
      status: fetchRes.status,
      headers: resHeaders,
    });
  } catch {
    return new Response('Proxy error', { status: 502 });
  }
}
