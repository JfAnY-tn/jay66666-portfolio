export default async function handler(req, res) {
  const fullUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = fullUrl.searchParams.get('path') || '';
  fullUrl.searchParams.delete('path');
  const queryString = fullUrl.searchParams.toString();
  const target = `https://api.bilibili.com/${path}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(target, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (e) {
    res.status(502).json({ code: -1, message: 'Proxy error' });
  }
}
