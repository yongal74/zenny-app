const http = require('http');
const httpProxy = require('http-proxy');

const API_PORT = 3000;
const METRO_PORT = 8080;
const GATEWAY_PORT = 5000;

const proxy = httpProxy.createProxyServer({ ws: true });

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error' }));
  }
});

proxy.on('proxyReq', (proxyReq, req) => {
  if (req.url.startsWith('/api/') || req.url === '/health') {
    const originalHost = req.headers['host'] || req.headers['x-forwarded-host'];
    if (originalHost) {
      proxyReq.setHeader('x-forwarded-host', originalHost);
    }
  } else {
    proxyReq.setHeader('origin', `http://localhost:${METRO_PORT}`);
    proxyReq.setHeader('host', `localhost:${METRO_PORT}`);
  }
});

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/') || req.url === '/health') {
    proxy.web(req, res, { target: `http://127.0.0.1:${API_PORT}` });
  } else {
    proxy.web(req, res, { target: `http://127.0.0.1:${METRO_PORT}` });
  }
});

server.on('upgrade', (req, socket, head) => {
  req.headers.origin = `http://localhost:${METRO_PORT}`;
  req.headers.host = `localhost:${METRO_PORT}`;
  proxy.ws(req, socket, head, { target: `http://127.0.0.1:${METRO_PORT}` });
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`Gateway running on http://0.0.0.0:${GATEWAY_PORT}`);
  console.log(`  /api/* -> http://127.0.0.1:${API_PORT}`);
  console.log(`  /*     -> http://127.0.0.1:${METRO_PORT}`);
});
