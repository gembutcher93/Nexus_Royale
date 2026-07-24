/* Cache offline. ALZA LA VERSIONE ogni volta che modifichi i file. */
const CACHE='nexus-royale-v52';
const ASSETS=['./index.html','./game.js','./assets_fallback.js','./manifest.json',
  './assets/splash.jpg','./assets/intro.mp4','./assets/logo.png',
  './assets/op_vyre.png','./assets/op_nova.png','./assets/op_oracle.png',
  './assets/op_aegis.png','./assets/op_omega.png','./assets/op_bot.png',
  './assets/spr_vyre.png','./assets/spr_nova.png','./assets/spr_oracle.png',
  './assets/spr_aegis.png','./assets/spr_wraith.png','./assets/spr_bot.png','./assets/chip_vyre.png','./assets/chip_nova.png','./assets/chip_oracle.png','./assets/chip_aegis.png','./assets/chip_wraith.png','./assets/b_tl.png','./assets/b_t.png','./assets/b_tr.png','./assets/b_l.png','./assets/b_c.png','./assets/b_r.png','./assets/b_bl.png','./assets/b_b.png','./assets/b_br.png','./assets/w_ctl.png','./assets/w_ctr.png','./assets/w_cbl.png','./assets/w_cbr.png','./assets/w_v.png','./assets/w_h.png','./assets/w_f.png','./assets/wpn_pistol.png','./assets/wpn_smg.png','./assets/wpn_shotgun.png','./assets/wpn_rifle.png','./assets/wpn_plasma.png','./assets/wpn_launcher.png','./assets/wpn_seeker.png','./assets/wpn_ricochet.png','./assets/wpn_railgun.png','./assets/wpn_rifle_leg.png','./assets/lootH.png','./assets/lootS.png','./assets/fl_n.png','./assets/wl_c.png','./assets/wl_v.png','./assets/wl_h.png','./assets/fan1.png','./assets/fan2.png','./assets/fan3.png','./assets/fan4.png','./assets/sol1.png','./assets/sol2.png','./assets/fur1.png','./assets/fur2.png','./assets/fur3.png','./assets/fur4.png','./assets/fur5.png',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
