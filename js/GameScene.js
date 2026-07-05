class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.over = false;
    this.startTime = this.time.now;
    this.kills = 0;
    this.damageDealt = 0;
    this.aliveCount = TOTAL_PLAYERS;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // --- Mappa di sfondo ---
    this.add.image(0, 0, 'mappa').setOrigin(0).setDisplaySize(WORLD_W, WORLD_H).setDepth(-20);
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'floor').setOrigin(0).setDepth(-19).setAlpha(0.3);
    DISTRICTS.forEach(d => {
      this.add.image(d.x * WORLD_W, d.y * WORLD_H, 'glow').setDisplaySize(1200, 900).setTint(d.c).setAlpha(0.04).setDepth(-18);
    });

    // --- Gruppi fisici ---
    this.walls = this.physics.add.staticGroup();
    this.wallRects = [];
    this.bullets = this.physics.add.group();
    this.loot = this.physics.add.group({ allowGravity: false });
    this.units = [];

    this.buildCity();
    this.spawnLoot(60);

    this.player = this.spawnUnit(true);
    for (let i = 0; i < BOT_COUNT; i++) this.spawnUnit(false);

    // Halo giocatore
    this.halo = this.add.image(0, 0, 'glow').setTint(C.player).setAlpha(0.4).setDepth(3).setDisplaySize(90, 90).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.halo, alpha: 0.18, duration: 900, yoyo: true, repeat: -1 });

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.s, true, 0.12, 0.12);
    this.cameras.main.setBackgroundColor(C.bg);

    // Collisioni
    this.physics.add.overlap(this.bullets, this.walls, (b, w) => this.onBulletWall(b, w));
    this.physics.add.overlap(this.player.s, this.loot, (s, l) => this.pickup(this.player, l));

    // Vignetta
    this.vig = this.add.image(0, 0, 'vignette').setScrollFactor(0).setDepth(120).setOrigin(0.5);
    this.vig.setPosition(this.scale.width / 2, this.scale.height / 2).setDisplaySize(this.scale.width * 1.5, this.scale.height * 1.5);

    this.initZone();
    this.setupInput();
    this.buildHUD();
    this.zoneRot = 0;
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.zoneTick() });
  }

  // ==================== COSTRUZIONE CITTÀ ====================
  buildCity() {
    const addWall = (x, y, w, h, edge, type) => {
      if (type === 'water') {
        this.add.rectangle(x, y, w, h, C.water, 0.9).setOrigin(0).setDepth(-15).setStrokeStyle(3, C.waterEdge, 0.7);
        const sh = this.add.rectangle(x, y, w, h, C.waterEdge, 0.08).setOrigin(0).setDepth(-14);
        this.tweens.add({ targets: sh, alpha: 0.16, duration: 1800, yoyo: true, repeat: -1 });
      } else if (type === 'cover') {
        this.add.rectangle(x, y, w, h, 0x14102b).setOrigin(0).setStrokeStyle(2, edge, 0.9).setDepth(0);
        this.add.rectangle(x + 3, y + 3, w - 6, h - 6, edge, 0.07).setOrigin(0).setDepth(0);
      } else if (type === 'building') {
        this.add.image(x + w / 2, y + h / 2, 'glow').setDisplaySize(w + 120, h + 120).setTint(edge).setAlpha(0.05).setBlendMode(Phaser.BlendModes.ADD).setDepth(-1);
        this.add.rectangle(x, y, w, h, 0x100d24).setOrigin(0).setStrokeStyle(3, edge, 0.95).setDepth(0);
        this.add.rectangle(x + 5, y + 5, w - 10, h - 10, edge, 0.05).setOrigin(0).setDepth(0);
        for (let i = 0; i < Math.floor((w * h) / 9000); i++) {
          const wx = x + Phaser.Math.Between(8, w - 18), wy = y + Phaser.Math.Between(8, h - 14);
          this.add.rectangle(wx, wy, Phaser.Math.Between(6, 12), 6, Phaser.Utils.Array.GetRandom([edge, C.gold, C.magenta, C.cyan]), 0.55).setOrigin(0).setDepth(0);
        }
      } else {
        this.add.rectangle(x, y, w, h, 0x0f0c22).setOrigin(0).setStrokeStyle(3, edge, 0.9).setDepth(0);
      }
      if (type !== 'water') {
        const body = this.walls.create(x + w / 2, y + h / 2, 'px').setVisible(false);
        body.setDisplaySize(w, h); body.refreshBody();
        this.wallRects.push({ x, y, w, h });
      }
    };

    const t = 40;
    addWall(0, 0, WORLD_W, t, C.cyan, 'border');
    addWall(0, WORLD_H - t, WORLD_W, t, C.cyan, 'border');
    addWall(0, 0, t, WORLD_H, C.cyan, 'border');
    addWall(WORLD_W - t, 0, t, WORLD_H, C.cyan, 'border');

    // Canali d'acqua
    addWall(WORLD_W * 0.44, 80, 90, WORLD_H * 0.34, 0, 'water');
    addWall(WORLD_W * 0.60, WORLD_H * 0.55, WORLD_W * 0.30, 90, 0, 'water');

    // Edifici procedurali
    const cols = 8, rows = 6, cw = WORLD_W / cols, ch = WORLD_H / rows;
    for (let cxr = 0; cxr < cols; cxr++) for (let cyr = 0; cyr < rows; cyr++) {
      if (Math.random() < 0.30) continue;
      const margin = Phaser.Math.Between(74, 120);
      const bx = cxr * cw + margin, by = cyr * ch + margin;
      const bw = cw - margin * 2 - Phaser.Math.Between(0, 80), bh = ch - margin * 2 - Phaser.Math.Between(0, 80);
      if (bw < 120 || bh < 120) continue;
      const edge = Phaser.Utils.Array.GetRandom([C.cyan, C.magenta, C.purple, C.gold]);
      if (Math.random() < 0.4 && bw > 260 && bh > 200) {
        const wth = 34, gap = Phaser.Math.Between(90, 150), gy = by + Phaser.Math.Between(40, bh - gap - 40);
        addWall(bx, by, bw, wth, edge, 'building');
        addWall(bx, by + bh - wth, bw, wth, edge, 'building');
        addWall(bx, by, wth, bh, edge, 'building');
        addWall(bx + bw - wth, by, wth, gy - by, edge, 'building');
        addWall(bx + bw - wth, gy + gap, wth, by + bh - (gy + gap), edge, 'building');
      } else addWall(bx, by, bw, bh, edge, 'building');
    }
    for (let i = 0; i < 38; i++) {
      const w = Phaser.Math.Between(60, 130), h = Phaser.Math.Between(60, 130);
      const x = Phaser.Math.Between(80, WORLD_W - 80 - w), y = Phaser.Math.Between(80, WORLD_H - 80 - h);
      addWall(x, y, w, h, Phaser.Utils.Array.GetRandom([C.cyan, C.magenta]), 'cover');
    }
    DISTRICTS.forEach(d => {
      this.add.text(d.x * WORLD_W, d.y * WORLD_H, d.n, { fontSize: '40px', color: '#ffffff', fontStyle: '900' })
        .setOrigin(0.5).setDepth(-2).setAlpha(0.10).setTint(d.c);
    });
  }

  freeSpot(nd) {
    for (let k = 0; k < 60; k++) {
      let x, y;
      if (nd) {
        x = Phaser.Math.Clamp(nd.x * WORLD_W + Phaser.Math.Between(-260, 260), 80, WORLD_W - 80);
        y = Phaser.Math.Clamp(nd.y * WORLD_H + Phaser.Math.Between(-260, 260), 80, WORLD_H - 80);
      } else {
        x = Phaser.Math.Between(120, WORLD_W - 120); y = Phaser.Math.Between(120, WORLD_H - 120);
      }
      if (!this.wallRects.some(r => x > r.x - 30 && x < r.x + r.w + 30 && y > r.y - 30 && y < r.y + r.h + 30)) return { x, y };
    }
    return { x: WORLD_W / 2, y: WORLD_H / 2 };
  }

  // ==================== LOOT ====================
  spawnLoot(n) {
    for (let i = 0; i < n; i++) {
      const d = Phaser.Utils.Array.GetRandom(DISTRICTS);
      const p = this.freeSpot(d);
      const roll = Math.random();
      let type, frame, payload;
      if (roll < 0.30) { type = 'heal'; frame = SPRITE.LOOT.medikit; }
      else if (roll < 0.50) { type = 'shield'; frame = SPRITE.LOOT.shield; }
      else {
        type = 'weapon'; frame = SPRITE.LOOT.crate_tech;
        const pool = LOOT_TABLE.slice();
        if (d.tier >= 2) pool.push('rifle', 'rifle');
        if (d.tier >= 3) pool.push('rifle', 'shotgun', 'ricochet');
        payload = Phaser.Utils.Array.GetRandom(pool);
      }
      this.mkLoot(p.x, p.y, type, payload, frame);
    }
  }

  mkLoot(x, y, type, payload, frame, airdrop) {
    const l = this.loot.create(x, y, 'obj').setDepth(2).setScale(0.5);
    l.dataType = type; l.payload = payload; l.airdrop = !!airdrop;
    this.tweens.add({ targets: l, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (airdrop) {
      l.setScale(0.9);
      const halo = this.add.image(x, y, 'glow').setTint(C.gold).setAlpha(0.5).setDisplaySize(120, 120).setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
      this.tweens.add({ targets: halo, alpha: 0.2, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });
      l.halo = halo; l.on('destroy', () => halo.destroy());
    }
    return l;
  }

  // ==================== UNITÀ ====================
  spawnUnit(isPlayer) {
    const d = Phaser.Utils.Array.GetRandom(DISTRICTS);
    const p = this.freeSpot(d);
    let texKey, sprKey, frames;
    if (isPlayer) {
      const isFemale = GAME.char === 'f';
      texKey = 'sprites';
      sprKey = isFemale ? 'f_' : 'm_';
      frames = isFemale ? SPRITE.FEMALE : SPRITE.MALE;
    } else {
      texKey = 'bot';
      sprKey = 'bot_';
      frames = SPRITE.BOT;
    }

    const s = this.physics.add.sprite(p.x, p.y, texKey, frames.idle_front).setDepth(6);
    s.body.setCircle(15, 32, 32); // hitbox centrata nel frame 128×128
    s.setCollideWorldBounds(true);

    const u = {
      s, isPlayer, alive: true,
      hp: 100, maxhp: 100,
      shield: isPlayer ? 0 : Phaser.Math.Between(0, 50), maxshield: 100,
      weapon: isPlayer ? 'pistol' : Phaser.Utils.Array.GetRandom(['pistol', 'pistol', 'smg']),
      lastShot: 0, aim: 0, outside: false,
      ai: { state: 'wander', tx: p.x, ty: p.y, retarget: 0, strafe: 1 },
      animPrefix: sprKey, moving: false, shooting: false
    };
    s.unit = u;
    this.physics.add.collider(s, this.walls);
    if (!isPlayer) this.physics.add.overlap(s, this.loot, (ss, l) => this.pickup(u, l));
    this.units.push(u);
    return u;
  }

  updateUnitVisuals(u) {
    if (!u.alive) return;
    const s = u.s;
    const angle = s.body.velocity.length() > 10 ? Math.atan2(s.body.velocity.y, s.body.velocity.x) : u.aim;
    const dir = this.angleToDir(angle);
    const pre = u.animPrefix;

    // Flip per sinistra (angoli tra 90° e 270°)
    const deg = Phaser.Math.RadToDeg(Phaser.Math.Angle.Normalize(angle));
    if ((deg >= 90 && deg < 270) && dir === 'side') s.setFlipX(true);
    else s.setFlipX(false);

    if (u.shooting) {
      s.anims.play(pre + 'shoot_' + dir, true);
    } else if (s.body.velocity.length() > 20) {
      s.anims.play(pre + 'walk_' + dir, true);
    } else {
      s.anims.play(pre + 'idle_' + dir, true);
    }
  }

  angleToDir(angle) {
    // Normalizza in 0-2PI
    let a = Phaser.Math.Angle.Normalize(angle);
    // 8 direzioni -> 3 categorie
    // front: 45-135 (sud), back: 225-315 (nord), side: il resto (est/ovest)
    const deg = Phaser.Math.RadToDeg(a);
    if (deg >= 45 && deg < 135) return 'front';
    if (deg >= 225 && deg < 315) return 'back';
    return 'side';
  }

  // ==================== COMBATTIMENTO ====================
  shoot(u, angle) {
    const w = WEAPONS[u.weapon];
    if (this.time.now - u.lastShot < w.rate) return;
    u.lastShot = this.time.now;
    u.shooting = true;
    this.time.delayedCall(150, () => { if (u.alive) u.shooting = false; });

    for (let i = 0; i < w.pellets; i++) {
      const a = angle + Phaser.Math.FloatBetween(-w.spread, w.spread);
      const b = this.bullets.create(u.s.x + Math.cos(angle) * 24, u.s.y + Math.sin(angle) * 24, 'dot').setDepth(8);
      b.owner = u; b.dmg = w.dmg; b.behavior = w.b;
      b.setTint(w.col).setBlendMode(Phaser.BlendModes.ADD);
      b.pierce = w.pierce || 0; b.bounces = w.bounces || 0;
      b.splashR = w.splashR || 0; b.splashDmg = w.splashDmg || 0;
      b.turn = w.turn || 0;
      b.setRotation(a);
      const big = (w.b === 'explosive');
      b.setScale(big ? 1.1 : 0.55, big ? 1.1 : 0.4);
      this.physics.velocityFromRotation(a, w.speed, b.body.velocity);
      b.maxDist = w.range; b.sx = b.x; b.sy = b.y; b.hitSet = null;
    }
    const f = this.add.image(u.s.x + Math.cos(angle) * 30, u.s.y + Math.sin(angle) * 30, 'glow')
      .setTint(w.col).setBlendMode(Phaser.BlendModes.ADD).setDepth(9).setDisplaySize(46, 46);
    this.tweens.add({ targets: f, alpha: 0, scale: 0.3, duration: 110, onComplete: () => f.destroy() });
    if (u.isPlayer) this.cameras.main.shake(w.b === 'explosive' ? 90 : 40, 0.0022);
  }

  onBulletWall(b, wall) {
    if (!b.active) return;
    if (b.behavior === 'explosive') { this.explode(b.x, b.y, b.splashDmg, b.splashR, b.owner); b.destroy(); return; }
    if (b.behavior === 'bounce') {
      const bx = wall.body.left, br = wall.body.right, bt = wall.body.top, bb = wall.body.bottom;
      const penX = Math.min(Math.abs(b.x - bx), Math.abs(br - b.x)), penY = Math.min(Math.abs(b.y - bt), Math.abs(bb - b.y));
      if (penX < penY) b.body.velocity.x *= -1; else b.body.velocity.y *= -1;
      b.setRotation(Math.atan2(b.body.velocity.y, b.body.velocity.x));
      b.bounces--; if (b.bounces < 0) b.destroy(); return;
    }
    b.destroy();
  }

  explode(x, y, dmg, r, owner) {
    const e = this.add.image(x, y, 'glow').setTint(C.orange).setBlendMode(Phaser.BlendModes.ADD).setDepth(10).setDisplaySize(40, 40);
    this.tweens.add({ targets: e, displayWidth: r * 2.4, displayHeight: r * 2.4, alpha: 0, duration: 340, onComplete: () => e.destroy() });
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(x, y, 'spark').setTint(C.gold).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
      const a = Math.random() * 6.28, sp = Phaser.Math.Between(60, r);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * sp, y: y + Math.sin(a) * sp, scale: 0, duration: 360, onComplete: () => p.destroy() });
    }
    this.cameras.main.shake(120, 0.004);
    this.units.forEach(u => {
      if (!u.alive) return;
      const d = Phaser.Math.Distance.Between(x, y, u.s.x, u.s.y);
      if (d < r) { const fall = 1 - d / r; this.applyDamage(u, dmg * fall, owner); }
    });
  }

  applyDamage(u, dmg, owner) {
    if (u.shield > 0) { const a = Math.min(u.shield, dmg); u.shield -= a; dmg -= a; }
    u.hp -= dmg;
    if (owner && owner.isPlayer) this.damageDealt += dmg;
    // Flash rosso
    if (u.alive) {
      u.s.setTint(0xff0000);
      this.time.delayedCall(100, () => { if (u.alive) u.s.clearTint(); });
    }
    if (u.hp <= 0) this.killUnit(u, owner);
  }

  bulletHitUnit(b, u) {
    if (!b.active || !u.alive || b.owner === u) return false;
    if (b.behavior === 'explosive') { this.explode(b.x, b.y, b.splashDmg, b.splashR, b.owner); b.destroy(); return true; }
    if (b.behavior === 'pierce') {
      if (!b.hitSet) b.hitSet = new Set();
      if (b.hitSet.has(u)) return false;
      b.hitSet.add(u);
      this.hitSpark(u.s.x, u.s.y); this.applyDamage(u, b.dmg, b.owner); b.pierce--; if (b.pierce < 0) b.destroy(); return true;
    }
    this.hitSpark(u.s.x, u.s.y); this.applyDamage(u, b.dmg, b.owner); b.destroy(); return true;
  }

  hitSpark(x, y) {
    const s = this.add.image(x, y, 'glow').setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(12).setDisplaySize(30, 30);
    this.tweens.add({ targets: s, alpha: 0, scale: 0.2, duration: 130, onComplete: () => s.destroy() });
  }

  killUnit(u, by) {
    if (!u.alive) return;
    u.alive = false;
    this.aliveCount--;
    u.s.anims.play(u.animPrefix + 'death');
    u.s.body.setVelocity(0, 0);
    u.s.body.enable = false;

    for (let i = 0; i < 12; i++) {
      const p = this.add.image(u.s.x, u.s.y, 'spark').setTint(u.isPlayer ? C.player : C.enemy).setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
      const a = Math.random() * 6.28, sp = Phaser.Math.Between(40, 150);
      this.tweens.add({ targets: p, x: u.s.x + Math.cos(a) * sp, y: u.s.y + Math.sin(a) * sp, scale: 0, duration: 420, onComplete: () => p.destroy() });
    }
    this.mkLoot(u.s.x, u.s.y, 'weapon', u.weapon, 0);
    if (by && by.isPlayer && !u.isPlayer) { this.kills++; this.flashKill(); }
    if (u.isPlayer) this.endMatch(false);
    else if (this.aliveCount === 1 && this.player.alive) this.endMatch(true);
  }

  pickup(u, l) {
    if (!l.active) return;
    if (l.dataType === 'heal') { if (u.hp >= u.maxhp) return; u.hp = Math.min(u.maxhp, u.hp + 40); }
    else if (l.dataType === 'shield') { if (u.shield >= u.maxshield) return; u.shield = Math.min(u.maxshield, u.shield + 40); }
    else if (l.dataType === 'weapon') {
      if (!l.airdrop && WEAPONS[l.payload].tier <= WEAPONS[u.weapon].tier) return;
      u.weapon = l.payload;
      if (u.isPlayer) this.toast('▲ ' + WEAPONS[l.payload].name.toUpperCase(), WEAPONS[l.payload].col);
    }
    l.destroy();
  }

  // ==================== ZONA ====================
  initZone() {
    const R = Math.hypot(WORLD_W, WORLD_H) / 2;
    this.zone = { cx: WORLD_W / 2, cy: WORLD_H / 2, r: R, tcx: WORLD_W / 2, tcy: WORLD_H / 2, tr: R, phase: 0, state: 'wait', timer: 6000, dmg: 1 };
    this.zoneGfx = this.add.graphics().setDepth(55);
    this.phaseRadii = [0.72, 0.52, 0.36, 0.24, 0.15, 0.08].map(f => R * f);
    this.phaseDmg = [1, 2, 3, 5, 9, 14];
  }

  zoneTick() {
    if (this.over) return;
    this.units.forEach(u => {
      if (!u.alive) return;
      const d = Phaser.Math.Distance.Between(u.s.x, u.s.y, this.zone.cx, this.zone.cy);
      u.outside = d > this.zone.r;
      if (u.outside) this.applyDamage(u, this.zone.dmg, null);
    });
  }

  advanceZone() {
    if (this.zone.phase >= this.phaseRadii.length) return;
    const nr = this.phaseRadii[this.zone.phase];
    const ang = Math.random() * 6.28, off = (this.zone.r - nr) * 0.6 * Math.random();
    this.zone.tcx = Phaser.Math.Clamp(this.zone.cx + Math.cos(ang) * off, nr, WORLD_W - nr);
    this.zone.tcy = Phaser.Math.Clamp(this.zone.cy + Math.sin(ang) * off, nr, WORLD_H - nr);
    this.zone.tr = nr; this.zone.dmg = this.phaseDmg[Math.min(this.zone.phase, this.phaseDmg.length - 1)];
    const drops = this.zone.phase >= 2 ? 2 : 1;
    for (let i = 0; i < drops; i++) {
      const dr = Math.random() * nr * 0.7, da = Math.random() * 6.28;
      let ax = Phaser.Math.Clamp(this.zone.tcx + Math.cos(da) * dr, 120, WORLD_W - 120);
      let ay = Phaser.Math.Clamp(this.zone.tcy + Math.sin(da) * dr, 120, WORLD_H - 120);
      const sp = this.freeSpotNear(ax, ay); ax = sp.x; ay = sp.y;
      const wpn = Phaser.Utils.Array.GetRandom(AIRDROP_POOL);
      this.mkLoot(ax, ay, 'weapon', wpn, 0, true);
      const beam = this.add.rectangle(ax, ay - 420, 12, 840, C.gold, 0.22).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: beam, alpha: 0, duration: 2600, onComplete: () => beam.destroy() });
    }
    this.toast('AIRDROP IN ARRIVO', C.gold); this.zone.phase++;
  }

  freeSpotNear(x, y) {
    for (let k = 0; k < 30; k++) {
      const tx = Phaser.Math.Clamp(x + Phaser.Math.Between(-160, 160), 120, WORLD_W - 120);
      const ty = Phaser.Math.Clamp(y + Phaser.Math.Between(-160, 160), 120, WORLD_H - 120);
      if (!this.wallRects.some(r => tx > r.x - 40 && tx < r.x + r.w + 40 && ty > r.y - 40 && ty < r.y + r.h + 40)) return { x: tx, y: ty };
    }
    return { x, y };
  }

  // ==================== INPUT ====================
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.pointerAim = { x: 0, y: 0, down: false };
    this.input.on('pointermove', p => { this.pointerAim.x = p.worldX; this.pointerAim.y = p.worldY; });
    this.input.on('pointerdown', p => { if (!this.isTouch) this.pointerAim.down = true; });
    this.input.on('pointerup', () => { this.pointerAim.down = false; });
    this.isTouch = this.sys.game.device.input.touch;
    this.moveStick = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
    this.aimStick = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
    if (this.isTouch) {
      this.stickG = this.add.graphics().setScrollFactor(0).setDepth(200);
      this.input.addPointer(3);
      this.input.on('pointerdown', p => this.onTouchDown(p));
      this.input.on('pointermove', p => this.onTouchMove(p));
      this.input.on('pointerup', p => this.onTouchUp(p));
    }
  }

  onTouchDown(p) {
    const W = this.scale.width;
    if (p.x < W / 2 && !this.moveStick.active) Object.assign(this.moveStick, { active: true, id: p.id, ox: p.x, oy: p.y, dx: 0, dy: 0 });
    else if (p.x >= W / 2 && !this.aimStick.active) Object.assign(this.aimStick, { active: true, id: p.id, ox: p.x, oy: p.y, dx: 0, dy: 0 });
  }
  onTouchMove(p) {
    const cl = (st) => {
      let dx = p.x - st.ox, dy = p.y - st.oy;
      const m = Math.hypot(dx, dy), mx = 60;
      if (m > mx) { dx = dx / m * mx; dy = dy / m * mx; }
      st.dx = dx / mx; st.dy = dy / mx;
    };
    if (p.id === this.moveStick.id && this.moveStick.active) cl(this.moveStick);
    if (p.id === this.aimStick.id && this.aimStick.active) cl(this.aimStick);
  }
  onTouchUp(p) {
    if (p.id === this.moveStick.id) Object.assign(this.moveStick, { active: false, id: -1, dx: 0, dy: 0 });
    if (p.id === this.aimStick.id) Object.assign(this.aimStick, { active: false, id: -1, dx: 0, dy: 0 });
  }
  drawSticks() {
    if (!this.isTouch) return;
    const g = this.stickG; g.clear();
    const ring = (st, col) => {
      if (!st.active) return;
      g.lineStyle(3, col, 0.5); g.strokeCircle(st.ox, st.oy, 60);
      g.fillStyle(col, 0.35); g.fillCircle(st.ox + st.dx * 60, st.oy + st.dy * 60, 26);
    };
    ring(this.moveStick, C.player); ring(this.aimStick, C.gold);
  }

  // ==================== HUD ====================
  buildHUD() {
    const W = this.scale.width;
    this.hud = {};
    this.hud.bars = this.add.graphics().setScrollFactor(0).setDepth(150);
    this.hud.wpn = this.add.text(16, 58, '', { fontSize: '16px', color: '#e8e6ff', fontStyle: '800' }).setScrollFactor(0).setDepth(151);
    this.hud.alive = this.add.text(W - 14, 14, '', { fontSize: '20px', color: '#33e1ff', fontStyle: '900' }).setOrigin(1, 0).setScrollFactor(0).setDepth(151);
    this.hud.kills = this.add.text(W - 14, 42, '', { fontSize: '14px', color: '#8a86c8', fontStyle: '700' }).setOrigin(1, 0).setScrollFactor(0).setDepth(151);
    this.hud.zone = this.add.text(W / 2, 12, '', { fontSize: '13px', color: '#ff8ac0', fontStyle: '800' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(151);
    this.mm = { size: Math.min(150, W * 0.32) }; this.mm.x = W - this.mm.size - 12; this.mm.y = 66;
    this.mmGfx = this.add.graphics().setScrollFactor(0).setDepth(150);
    this.hud.toast = this.add.text(W / 2, this.scale.height * 0.34, '', { fontSize: '22px', fontStyle: '900', color: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
    this.hud.killfeed = this.add.text(W / 2, this.scale.height * 0.42, '', { fontSize: '26px', fontStyle: '900', color: '#ff3b6b' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
  }

  toast(msg, col) {
    this.hud.toast.setText(msg).setTint(col || 0xffffff).setAlpha(1);
    this.hud.toast.setY(this.scale.height * 0.34);
    this.tweens.add({ targets: this.hud.toast, alpha: 0, y: this.scale.height * 0.30, duration: 1400 });
  }
  flashKill() {
    this.hud.killfeed.setText('ELIMINATO').setAlpha(1).setScale(1.2);
    this.tweens.add({ targets: this.hud.killfeed, alpha: 0, scale: 1, duration: 800 });
  }

  updateHUD() {
    const g = this.hud.bars; g.clear();
    const bx = 16, by = 16, bw = Math.min(240, this.scale.width * 0.5), bh = 15;
    g.fillStyle(0x000000, 0.5); g.fillRoundedRect(bx - 3, by - 3, bw + 6, bh * 2 + 8, 6);
    g.fillStyle(0x1a1533, 1); g.fillRect(bx, by, bw, bh);
    g.fillStyle(C.shield, 1); g.fillRect(bx, by, bw * Phaser.Math.Clamp(this.player.shield / this.player.maxshield, 0, 1), bh);
    g.fillStyle(0x1a1533, 1); g.fillRect(bx, by + bh + 4, bw, bh);
    g.fillStyle(this.player.hp > 30 ? C.green : 0xff3b6b, 1); g.fillRect(bx, by + bh + 4, bw * Phaser.Math.Clamp(this.player.hp / this.player.maxhp, 0, 1), bh);
    this.hud.wpn.setText(WEAPONS[this.player.weapon].name.toUpperCase() + '  ·  ' + (GAME.mode === 'auto' ? 'AUTO' : 'MANUAL'));
    this.hud.alive.setText(this.aliveCount + ' VIVI'); this.hud.kills.setText('KILL ' + this.kills);
    const z = this.zone;
    this.hud.zone.setText(z.state === 'wait' ? '⚠ ZONA SI RESTRINGE' : (z.state === 'shrink' ? '▼ ZONA IN MOVIMENTO' : 'ZONA STABILE'));
    const mg = this.mmGfx; mg.clear();
    const { x, y, size } = this.mm, sx = size / WORLD_W, sy = size / WORLD_H;
    mg.fillStyle(0x05040d, 0.85); mg.fillRect(x - 2, y - 2, size + 4, size + 4);
    mg.lineStyle(2, 0x2a2550, 1); mg.strokeRect(x, y, size, size);
    mg.lineStyle(2, C.safe, 0.9); mg.strokeCircle(x + z.cx * sx, y + z.cy * sy, z.r * sx);
    mg.lineStyle(1, C.zone, 0.9); mg.strokeCircle(x + z.tcx * sx, y + z.tcy * sy, z.tr * sx);
    this.loot.getChildren().forEach(l => {
      if (l.airdrop) { mg.fillStyle(C.gold, 1); mg.fillCircle(x + l.x * sx, y + l.y * sy, 3); }
    });
    mg.fillStyle(C.player, 1); mg.fillCircle(x + this.player.s.x * sx, y + this.player.s.y * sy, 3.5);
  }

  drawZone() {
    const g = this.zoneGfx; g.clear(); const z = this.zone;
    g.lineStyle(10, C.zone, 0.25); g.strokeCircle(z.cx, z.cy, z.r + 22);
    g.lineStyle(6, C.zone, 0.5); g.strokeCircle(z.cx, z.cy, z.r + 8);
    g.lineStyle(3, C.zone, 1); g.strokeCircle(z.cx, z.cy, z.r);
    for (let i = 0; i < 48; i++) { const a = this.zoneRot + i / 48 * 6.283; g.fillStyle(C.zone, 0.8); g.fillCircle(z.cx + Math.cos(a) * z.r, z.cy + Math.sin(a) * z.r, 2); }
    g.lineStyle(2, C.safe, 0.5); g.strokeCircle(z.tcx, z.tcy, z.tr);
  }

  // ==================== LOOP ====================
  update(time, delta) {
    if (this.over) return;
    this.zoneRot += 0.01;
    const P = this.player, spd = 210;
    let mvx = 0, mvy = 0;

    if (this.isTouch) { mvx = this.moveStick.dx; mvy = this.moveStick.dy; }
    if (this.keys.A.isDown || this.keys.LEFT.isDown) mvx = -1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) mvx = 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) mvy = -1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) mvy = 1;
    const ml = Math.hypot(mvx, mvy);
    if (ml > 1) { mvx /= ml; mvy /= ml; }
    P.s.body.setVelocity(mvx * spd, mvy * spd);

    let aimAng = P.aim, firing = false;
    if (GAME.mode === 'manual') {
      if (this.isTouch) { if (this.aimStick.active && (Math.abs(this.aimStick.dx) + Math.abs(this.aimStick.dy)) > 0.25) { aimAng = Math.atan2(this.aimStick.dy, this.aimStick.dx); firing = true; } }
      else { aimAng = Phaser.Math.Angle.Between(P.s.x, P.s.y, this.pointerAim.x, this.pointerAim.y); firing = this.pointerAim.down; }
      if (!firing && ml > 0.1) aimAng = Math.atan2(mvy, mvx);
    } else {
      const w = WEAPONS[P.weapon]; let best = null, bd = w.range;
      this.units.forEach(u => { if (u === P || !u.alive) return; const d = Phaser.Math.Distance.Between(P.s.x, P.s.y, u.s.x, u.s.y); if (d < bd) { bd = d; best = u; } });
      if (best) { aimAng = Phaser.Math.Angle.Between(P.s.x, P.s.y, best.s.x, best.s.y); firing = true; }
      else if (ml > 0.1) aimAng = Math.atan2(mvy, mvx);
    }
    P.aim = aimAng;
    if (firing) this.shoot(P, aimAng);

    // Proiettili
    this.bullets.getChildren().forEach(b => {
      if (!b.active) return;
      if (b.behavior === 'homing' && b.turn) {
        let tgt = null, td = 520;
        this.units.forEach(u => { if (!u.alive || u === b.owner) return; const d = Phaser.Math.Distance.Between(b.x, b.y, u.s.x, u.s.y); if (d < td) { td = d; tgt = u; } });
        if (tgt) {
          const cur = Math.atan2(b.body.velocity.y, b.body.velocity.x), want = Phaser.Math.Angle.Between(b.x, b.y, tgt.s.x, tgt.s.y);
          const na = Phaser.Math.Angle.RotateTo(cur, want, b.turn); const sp = b.body.velocity.length();
          b.body.velocity.x = Math.cos(na) * sp; b.body.velocity.y = Math.sin(na) * sp; b.setRotation(na);
        }
      }
      if (Phaser.Math.Distance.Between(b.x, b.y, b.sx, b.sy) > b.maxDist) { b.destroy(); return; }
      for (let k = 0; k < this.units.length; k++) { const u = this.units[k]; if (u.alive && b.owner !== u && Phaser.Math.Distance.Between(b.x, b.y, u.s.x, u.s.y) < 24) { if (this.bulletHitUnit(b, u)) break; } }
    });

    this.updateBots(time);
    this.units.forEach(u => this.updateUnitVisuals(u));
    this.halo.setPosition(P.s.x, P.s.y);
    this.drawZone(); this.updateZoneState(delta); this.updateHUD(); this.drawSticks();
  }

  updateZoneState(delta) {
    const z = this.zone; z.timer -= delta;
    if (z.state === 'wait') { if (z.timer <= 0) { this.advanceZone(); z.state = 'shrink'; z.timer = 9000; z.sr = z.r; z.scx = z.cx; z.scy = z.cy; } }
    else if (z.state === 'shrink') {
      const p = 1 - Phaser.Math.Clamp(z.timer / 9000, 0, 1);
      z.r = Phaser.Math.Linear(z.sr, z.tr, p); z.cx = Phaser.Math.Linear(z.scx, z.tcx, p); z.cy = Phaser.Math.Linear(z.scy, z.tcy, p);
      if (z.timer <= 0) { z.state = z.phase >= this.phaseRadii.length ? 'final' : 'wait'; z.timer = 8000; }
    }
  }

  updateBots(time) {
    this.units.forEach(u => {
      if (u.isPlayer || !u.alive) return;
      const ai = u.ai, s = u.s, w = WEAPONS[u.weapon];
      const dz = Phaser.Math.Distance.Between(s.x, s.y, this.zone.cx, this.zone.cy);
      if (dz > this.zone.r - 120) ai.state = 'flee';
      let tgt = null, td = w.range * 1.05;
      this.units.forEach(o => { if (o === u || !o.alive) return; const d = Phaser.Math.Distance.Between(s.x, s.y, o.s.x, o.s.y); if (d < td) { td = d; tgt = o; } });
      let lt = null, ld = 260;
      if (w.tier < 2 || u.hp < 60) {
        this.loot.getChildren().forEach(l => { if (!l.active) return; const d = Phaser.Math.Distance.Between(s.x, s.y, l.x, l.y); if (d < ld) { ld = d; lt = l; } });
      }
      let vx = 0, vy = 0; const bspd = 150;
      if (ai.state === 'flee') {
        const a = Phaser.Math.Angle.Between(s.x, s.y, this.zone.cx, this.zone.cy); vx = Math.cos(a); vy = Math.sin(a);
        if (dz < this.zone.r - 200) ai.state = 'wander';
        if (tgt) { s.setRotation(Phaser.Math.Angle.Between(s.x, s.y, tgt.s.x, tgt.s.y)); this.botShoot(u, tgt); }
      } else if (tgt) {
        const a = Phaser.Math.Angle.Between(s.x, s.y, tgt.s.x, tgt.s.y); s.setRotation(a);
        const dist = Phaser.Math.Distance.Between(s.x, s.y, tgt.s.x, tgt.s.y), ideal = w.range * 0.6;
        if (dist > ideal + 40) { vx = Math.cos(a); vy = Math.sin(a); } else if (dist < ideal - 40) { vx = -Math.cos(a); vy = -Math.sin(a); }
        if (time > ai.retarget) { ai.strafe *= -1; ai.retarget = time + Phaser.Math.Between(600, 1400); }
        vx += Math.cos(a + Math.PI / 2) * ai.strafe * 0.7; vy += Math.sin(a + Math.PI / 2) * ai.strafe * 0.7;
        this.botShoot(u, tgt);
      } else if (lt) {
        const a = Phaser.Math.Angle.Between(s.x, s.y, lt.x, lt.y); vx = Math.cos(a); vy = Math.sin(a); s.setRotation(a);
      } else {
        if (time > ai.retarget || Phaser.Math.Distance.Between(s.x, s.y, ai.tx, ai.ty) < 40) { const sp = this.freeSpot(); ai.tx = sp.x; ai.ty = sp.y; ai.retarget = time + Phaser.Math.Between(1500, 3500); }
        const a = Phaser.Math.Angle.Between(s.x, s.y, ai.tx, ai.ty); vx = Math.cos(a); vy = Math.sin(a); s.setRotation(a);
      }
      const l = Math.hypot(vx, vy) || 1; s.body.setVelocity(vx / l * bspd, vy / l * bspd);
    });
  }

  botShoot(u, tgt) {
    const w = WEAPONS[u.weapon]; const d = Phaser.Math.Distance.Between(u.s.x, u.s.y, tgt.s.x, tgt.s.y); if (d > w.range) return;
    const a = Phaser.Math.Angle.Between(u.s.x, u.s.y, tgt.s.x, tgt.s.y) + Phaser.Math.FloatBetween(-0.08, 0.08); this.shoot(u, a);
  }

  // ==================== FINE PARTITA ====================
  endMatch(win) {
    if (this.over) return; this.over = true; this.physics.pause();
    const place = win ? 1 : Math.max(1, this.aliveCount + (this.player.alive ? 0 : 1));
    const durationSec = Math.round((this.time.now - this.startTime) / 1000);
    const mult = GAME.mode === 'manual' ? 1.5 : 1.0;
    const score = Math.round((this.kills * 100 + (TOTAL_PLAYERS - place) * 20 + Math.floor(durationSec / 2) + (win ? 300 : 0)) * mult);
    const credits = Math.round(score / 5);
    const matchId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
    const payload = { v: 1, app: 'nexus-royale', matchId, ts: Date.now(), char: GAME.char, mode: GAME.mode, kills: this.kills, placement: place, durationSec, score, credits };
    let code = ''; try { code = btoa(JSON.stringify(payload)); } catch (e) { code = JSON.stringify(payload); }
    this.showResults(win, { place, kills: this.kills, durationSec, score, credits, mult, code });
  }

  showResults(win, r) {
    const W = this.scale.width, H = this.scale.height, cx = W / 2;
    this.add.rectangle(0, 0, W, H, 0x05040d, 0.88).setOrigin(0).setScrollFactor(0).setDepth(300);
    this.add.text(cx, H * 0.12, win ? '#1 · VITTORIA' : 'ELIMINATO', {
      fontSize: Math.min(46, W * 0.1) + 'px', fontStyle: '900', color: win ? '#ffd23f' : '#ff3b6b'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setShadow(0, 0, win ? '#ff2ea6' : '#000', 20);
    const rows = [
      ['Piazzamento', '#' + r.place + ' / ' + TOTAL_PLAYERS],
      ['Eliminazioni', r.kills],
      ['Sopravvivenza', r.durationSec + 's'],
      ['Moltiplicatore', '×' + r.mult + (GAME.mode === 'manual' ? ' (manuale)' : ' (auto)')]
    ];
    rows.forEach((row, i) => {
      const y = H * 0.25 + i * 30;
      this.add.text(cx - Math.min(150, W * 0.4), y, row[0], { fontSize: '16px', color: '#8a86c8' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
      this.add.text(cx + Math.min(150, W * 0.4), y, '' + row[1], { fontSize: '16px', color: '#e8e6ff', fontStyle: '800' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(301);
    });
    this.add.text(cx, H * 0.46, r.score.toLocaleString('it') + ' PUNTI', { fontSize: Math.min(34, W * 0.08) + 'px', fontStyle: '900', color: '#33e1ff' }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(cx, H * 0.52, '= ' + r.credits + ' CREDITI INKANIMUS', { fontSize: '16px', fontStyle: '800', color: '#35e06a' }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(cx, H * 0.60, 'CODICE PARTITA', { fontSize: '12px', color: '#8a86c8', fontStyle: '700' }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(cx, H * 0.64, this.wrap(r.code, 34), { fontSize: '12px', color: '#ffd23f', align: 'center', fontFamily: 'monospace', backgroundColor: '#0d0b1c', padding: { x: 10, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    const copy = this.add.rectangle(cx, H * 0.78, Math.min(300, W * 0.7), 46, 0x14102b).setStrokeStyle(2, C.gold).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });
    const copyT = this.add.text(cx, H * 0.78, '⧉  COPIA CODICE', { fontSize: '16px', color: '#ffd23f', fontStyle: '800' }).setOrigin(0.5).setScrollFactor(0).setDepth(302);
    copy.on('pointerdown', () => { try { navigator.clipboard.writeText(r.code); copyT.setText('✓ COPIATO'); } catch (e) { copyT.setText('✓ (seleziona il codice)'); } });
    const again = this.add.rectangle(cx, H * 0.87, Math.min(300, W * 0.7), 50, 0x14102b).setStrokeStyle(2, C.player).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });
    this.add.text(cx, H * 0.87, '↻  RIGIOCA', { fontSize: '18px', color: '#33e1ff', fontStyle: '900' }).setOrigin(0.5).setScrollFactor(0).setDepth(302);
    again.on('pointerdown', () => this.scene.start('Menu'));
  }

  wrap(str, n) { let out = ''; for (let i = 0; i < str.length; i += n) out += str.slice(i, i + n) + '\n'; return out.trim(); }
}
