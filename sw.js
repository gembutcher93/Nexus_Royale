/* Cache offline. ALZA LA VERSIONE ogni volta che modifichi i file. */
const CACHE='nexus-royale-v42';
const ASSETS=['./index.html','./game.js','./assets_fallback.js','./manifest.json',
  './assets/splash.jpg','./assets/intro.mp4','./assets/logo.png',
  './assets/op_vyre.png','./assets/op_nova.png','./assets/op_oracle.png',
  './assets/op_aegis.png','./assets/op_omega.png','./assets/op_bot.png',
  './assets/spr_vyre.png','./assets/spr_nova.png','./assets/spr_oracle.png',
  './assets/spr_aegis.png','./assets/spr_wraith.png','./assets/spr_bot.png','./assets/chip_vyre.png','./assets/chip_nova.png','./assets/chip_oracle.png','./assets/chip_aegis.png','./assets/chip_wraith.png',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
