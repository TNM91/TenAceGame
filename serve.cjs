const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/tenaceiq-logo.png': ['tenaceiq-logo.png', 'image/png'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
  '/progression.js': ['progression.js', 'text/javascript; charset=utf-8'],
  '/character.js': ['character.js', 'text/javascript; charset=utf-8'],
  '/graphics.js': ['graphics.js', 'text/javascript; charset=utf-8'],
  '/physics.js': ['physics.js', 'text/javascript; charset=utf-8'],
  '/sound.js': ['sound.js', 'text/javascript; charset=utf-8'],
  '/rivals.js': ['rivals.js', 'text/javascript; charset=utf-8'],
};

http.createServer((req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(__dirname, file[0]), (error, data) => {
    if (error) { res.writeHead(500); res.end('Unable to read file'); return; }
    res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8080, '127.0.0.1', () => console.log('TenAce: http://127.0.0.1:8080'));
