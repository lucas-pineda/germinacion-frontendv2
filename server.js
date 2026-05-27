/**
 * Minimal static file server for the Vite SPA build output (dist/).
 * Uses only Node.js built-in modules — no extra dependencies required.
 * Handles SPA routing by falling back to index.html for unknown paths.
 *
 * Start command: node server.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.csv':  'text/csv',
};

const server = http.createServer((req, res) => {
  // Strip query string and decode URI
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Resolve to a file path inside dist/
  let filePath = path.join(DIST_DIR, urlPath);

  // Security: prevent path traversal outside dist/
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If the path points to a directory, try index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Serve the file if it exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Long-lived cache for hashed assets, no-cache for HTML
    const isHashed = /\.[a-f0-9]{8,}\.[a-z]+$/.test(path.basename(filePath));
    const cacheControl = ext === '.html'
      ? 'no-cache, no-store, must-revalidate'
      : isHashed
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SPA fallback — serve index.html for all unmatched routes
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found — run "npm run build" first to generate dist/');
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
