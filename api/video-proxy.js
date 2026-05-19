export default async function handler(req, res) {
  const fullUrl = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = fullUrl.searchParams.get('url');
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const headers = {
      'Referer': 'https://www.bilibili.com/',
      'Origin': 'https://www.bilibili.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const fetchRes = await fetch(targetUrl, { headers });

    const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    for (const h of passHeaders) {
      const v = fetchRes.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the response body
    const reader = fetchRes.body.getReader();
    res.status(fetchRes.status);
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        res.write(Buffer.from(value));
      }
    };
    await pump();
  } catch (e) {
    if (!res.headersSent) {
      res.status(502).json({ code: -1, message: 'Proxy error' });
    }
  }
}
