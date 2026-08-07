#!/usr/bin/env node
// Tiny no-dependency static server for local playtesting.
//   node tools/serve.js [port]
// Exists because the in-app preview pane treats file:// pages as static snapshots
// and will not reliably reload them, which makes visual iteration impossible.
// Serving over http gives a normal page with a normal reload.
// Nothing in the game depends on this — afterglow.html still runs by double-clicking.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8123;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
                '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png',
                '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/afterglow.html';
  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)){ res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err){ res.writeHead(404, {'Content-Type':'text/plain'}).end('not found: ' + rel); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // never cache: the whole point is that a reload shows the newest edit
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('Afterglow served at http://127.0.0.1:' + PORT + '/  (Ctrl+C to stop)');
});
