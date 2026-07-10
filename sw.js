/* Cache offline. ALZA LA VERSIONE ogni volta che modifichi i file. */
const CACHE='nexus-royale-v6';
const ASSETS=['./index.html','./game.js','./assets_fallback.js','./manifest.json',
  './assets/splash.jpg','./assets/intro.mp4','./assets/logo.png',
  './assets/op_vyre.png','./assets/op_nova.png','./assets/op_oracle.png',
  './assets/op_aegis.png','./assets/op_omega.png','./assets/op_bot.png',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
