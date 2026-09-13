const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const files = {
  '/original-player.js': ['original-player.js', 'text/javascript'],
  '/club-environment.js': ['club-environment.js', 'text/javascript'],
  '/match-presentation.css': ['match-presentation.css', 'text/css'],
  '/assets/club-foliage.png': ['assets/club-foliage.png', 'image/png'],
  '/rig-preview.html': ['rig-preview.html', 'text/html'],
  '/rig-preview.js': ['rig-preview.js', 'text/javascript'],
  '/rigged-player.js': ['rigged-player.js', 'text/javascript'],
  '/vendor/GLTFLoader.js': ['vendor/GLTFLoader.js', 'text/javascript'],
  '/vendor/SkeletonUtils.js': ['vendor/SkeletonUtils.js', 'text/javascript'],
  '/vendor/BufferGeometryUtils.js': ['vendor/BufferGeometryUtils.js', 'text/javascript'],
  '/assets/rigged/tenace-athlete.glb': ['assets/rigged/tenace-athlete.glb', 'model/gltf-binary'],
  '/assets/rigged/locomotion.glb': ['assets/rigged/locomotion.glb', 'model/gltf-binary'],
  '/technique.js': ['technique.js', 'text/javascript; charset=utf-8'],
  '/court3d.js': ['court3d.js', 'text/javascript; charset=utf-8'],
  '/vendor/three.module.min.js': ['vendor/three.module.min.js', 'text/javascript; charset=utf-8'],
  '/vendor/three.core.min.js': ['vendor/three.core.min.js', 'text/javascript; charset=utf-8'],
  '/assets/club-scenery-v08.png': ['assets/club-scenery-v08.png', 'image/png'],
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
}).listen(Number(process.env.PORT)||8080, '127.0.0.1', () => console.log('TenAce: http://127.0.0.1:'+(Number(process.env.PORT)||8080)));
