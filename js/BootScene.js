class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Nessun caricamento — tutto in create()
  }

  create() {
    this.loadCount = 0;
    this.totalToLoad = 5; // vyre, nova, bot, obj, mappa
    this.onAllLoaded = () => {
      this.makeProceduralTextures();
      this.createAnimations();
      this.scene.start('Menu');
    };
    this.loadBase64Textures();
  }

  loadBase64Textures() {
    const loadSheet = (key, src, fw, fh) => {
      const img = new Image();
      img.onload = () => {
        this.textures.addSpriteSheet(key, img, { frameWidth: 77, frameHeight: 77 });
        this.checkLoaded();
      };
      img.onerror = () => {
        console.error('Failed to load:', key);
        this.checkLoaded();
      };
      img.src = src;
    };

    const loadImage = (key, src) => {
      const img = new Image();
      img.onload = () => {
        this.textures.addImage(key, img);
        this.checkLoaded();
      };
      img.onerror = () => {
        console.error('Failed to load:', key);
        this.checkLoaded();
      };
      img.src = src;
    };

    // Personaggi: griglia 100×100
    loadSheet('vyre', ASSETS.vyre, 100, 100);
    loadSheet('nova', ASSETS.nova, 100, 100);
    loadSheet('bot', ASSETS.bot, 100, 100);

    // Oggetti: usiamo come immagine singola per ora
    loadImage('obj', ASSETS.obj);

    // Mappa
    loadImage('mappa', ASSETS.mappa);
  }

  checkLoaded() {
    this.loadCount++;
    if (this.loadCount >= this.totalToLoad) {
      this.onAllLoaded();
    }
  }

  makeProceduralTextures() {
    const rad = (key, size, stops) => {
      const cv = this.textures.createCanvas(key, size, size);
      const ctx = cv.getContext();
      const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      stops.forEach(s => g.addColorStop(s[0], s[1]));
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
      cv.refresh();
    };

    rad('glow', 128, [
      [0, 'rgba(255,255,255,1)'],
      [0.35, 'rgba(255,255,255,0.55)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    rad('vignette', 512, [
      [0, 'rgba(0,0,0,0)'],
      [0.62, 'rgba(0,0,0,0)'],
      [1, 'rgba(4,2,12,0.85)']
    ]);

    const g = this.make.graphics({ x:0, y:0, add:false });
    g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8); g.generateTexture('px', 8, 8);
    g.clear(); g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); g.generateTexture('dot', 16, 16);
    g.clear(); g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6); g.generateTexture('spark', 12, 12);
    g.clear(); g.fillStyle(C.floor, 1); g.fillRect(0, 0, 128, 128);
    g.lineStyle(1, C.grid, 0.55); g.strokeRect(0, 0, 128, 128);
    g.lineStyle(1, C.grid, 0.28); g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.moveTo(0, 64); g.lineTo(128, 64); g.strokePath();
    g.fillStyle(C.grid, 0.5); g.fillCircle(0, 0, 2); g.fillCircle(128, 0, 2); g.fillCircle(0, 128, 2); g.fillCircle(128, 128, 2);
    g.generateTexture('floor', 128, 128);
    g.destroy();
  }

  createAnimations() {
    const dirs = ['front', 'side', 'back'];
    const chars = [
      { key: 'vyre', pre: 'm_', map: SPRITE.VYRE },
      { key: 'nova', pre: 'f_', map: SPRITE.NOVA },
      { key: 'bot',  pre: 'bot_', map: SPRITE.BOT }
    ];

    chars.forEach(c => {
      const pre = c.pre;
      const map = c.map;
      const texKey = c.key;

      dirs.forEach(d => {
        this.anims.create({ key: pre + 'idle_' + d, frames: [{ key: texKey, frame: map['idle_' + d] }], frameRate: 1, repeat: -1 });
      });
      this.anims.create({ key: pre + 'walk_front', frames: [{ key: texKey, frame: map.idle_front }, { key: texKey, frame: map.walk_front }], frameRate: 4, repeat: -1 });
      this.anims.create({ key: pre + 'walk_side',  frames: [{ key: texKey, frame: map.idle_side },  { key: texKey, frame: map.walk_side }],  frameRate: 4, repeat: -1 });
      this.anims.create({ key: pre + 'walk_back',  frames: [{ key: texKey, frame: map.idle_back },  { key: texKey, frame: map.walk_back }],  frameRate: 4, repeat: -1 });
      dirs.forEach(d => {
        this.anims.create({ key: pre + 'shoot_' + d, frames: [{ key: texKey, frame: map['shoot_' + d] }], frameRate: 1, repeat: 0 });
      });
      this.anims.create({ key: pre + 'death', frames: this.anims.generateFrameNumbers(texKey, { start: map.death_start, end: map.death_end }), frameRate: 8, repeat: 0 });
    });
  }
}
