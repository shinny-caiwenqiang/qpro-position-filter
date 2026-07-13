import { createReadStream } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pageDir = dirname(fileURLToPath(import.meta.url));
const pageFile = join(pageDir, 'index.html');
const port = Number(process.env.PORT || 8812);
const qproOrigin = process.env.QPRO_API_ORIGIN || 'http://127.0.0.1:8811';
const allowedOrigins = new Set([
  'https://shinny-caiwenqiang.github.io',
  'http://127.0.0.1:' + port,
  'http://localhost:' + port,
]);

function cors(request, headers = {}) {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Private-Network'] = 'true';
  }
  return headers;
}

function error(request, response, status, message) {
  response.writeHead(status, cors(request, { 'Content-Type': 'application/json; charset=utf-8' }));
  response.end(JSON.stringify({ ok: false, error: message }));
}

function proxy(request, response) {
  const target = new URL(request.url.slice(4), qproOrigin);
  const upstream = httpRequest(target, {
    method: request.method,
    headers: { 'Content-Type': request.headers['content-type'] || 'application/json' },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, cors(request, {
      'Content-Type': upstreamResponse.headers['content-type'] || 'application/json; charset=utf-8',
    }));
    upstreamResponse.pipe(response);
  });
  upstream.on('error', (cause) => error(request, response, 502, cause.message));
  request.pipe(upstream);
}

createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:' + port);
  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors(request));
    response.end();
    return;
  }
  if (url.pathname === '/' && request.method === 'GET') {
    response.writeHead(200, cors(request, { 'Content-Type': 'text/html; charset=utf-8' }));
    createReadStream(pageFile).on('error', (cause) => error(request, response, 404, cause.message)).pipe(response);
    return;
  }
  if (url.pathname === '/api/health' || url.pathname === '/api/tables' || url.pathname === '/api/query') {
    proxy(request, response);
    return;
  }
  error(request, response, 404, 'not found');
}).listen(port, '127.0.0.1', () => {
  console.log('Position filter page: http://127.0.0.1:' + port);
  console.log('QPRO API proxy: ' + qproOrigin);
});
