import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BILIBILI_HEADERS = {
  'Referer': 'https://www.bilibili.com/',
  'Origin': 'https://www.bilibili.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

function videoProxyPlugin() {
  return {
    name: 'video-proxy',
    configureServer(server) {
      server.middlewares.use('/api/video-proxy', async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          res.writeHead(400);
          res.end('Missing url parameter');
          return;
        }

        try {
          const headers = { ...BILIBILI_HEADERS };
          // Forward range header for video seeking
          if (req.headers.range) {
            headers['Range'] = req.headers.range;
          }

          const fetchRes = await fetch(targetUrl, { headers });
          const status = fetchRes.status;

          // Forward content-related headers
          const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
          const resHeaders = {};
          for (const h of passHeaders) {
            const v = fetchRes.headers.get(h);
            if (v) resHeaders[h] = v;
          }

          // Handle CORS for localhost
          resHeaders['access-control-allow-origin'] = '*';

          res.writeHead(status, resHeaders);

          // Stream the body
          const reader = fetchRes.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                break;
              }
              res.write(value);
            }
          };
          pump().catch(() => res.end());
        } catch (e) {
          if (!res.headersSent) {
            res.writeHead(502);
            res.end('Proxy error');
          }
        }
      });

      // Local export endpoint — save localStorage edits to portfolio_edits.json
      server.middlewares.use('/api/export-edits', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end('Method not allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.resolve(__dirname, 'portfolio_edits_export.json');
            // Pretty-print
            const parsed = JSON.parse(body);
            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, path: filePath }));
          } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

// videoProxyPlugin only needed for local dev; skip on Cloudflare Pages to avoid Wrangler parse errors
const isLocalDev = !process.env.CF_PAGES;

export default defineConfig({
  plugins: [react(), ...(isLocalDev ? [videoProxyPlugin()] : [])],
  server: {
    proxy: {
      '/api/bilibili': {
        target: 'https://api.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bilibili/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('Origin');
            proxyReq.setHeader('Referer', 'https://www.bilibili.com');
            proxyReq.setHeader('User-Agent', BILIBILI_HEADERS['User-Agent']);
          });
        },
      },
      '/api/youtube': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/youtube/, ''),
      },
    },
  },
});
