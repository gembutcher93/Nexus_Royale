class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = this.scale.width, H = this.scale.height, cx = W / 2;

    this.add.rectangle(0, 0, W, H, C.bg).setOrigin(0);
    for (let i = 0; i < 26; i++) {
      const y = Phaser.Math.Between(0, H);
      this.add.rectangle(0, y, W, 1, Phaser.Utils.Array.GetRandom([C.cyan, C.magenta, C.purple]), 0.05).setOrigin(0);
    }
    this.add.image(cx, H * 0.5, 'vignette').setDisplaySize(W * 1.4, H * 1.4).setAlpha(0.6);
    this.add.text(cx, H * 0.12, 'NEXUS ROYALE', {
      fontSize: Math.min(64, W * 0.11) + 'px', fontStyle: '900', color: '#33e1ff'
    }).setOrigin(0.5).setShadow(0, 0, '#ff2ea6', 26);
    this.add.text(cx, H * 0.12 + Math.min(46, W * 0.08), 'INKANIMUS · BATTLE ROYALE', {
      fontSize: Math.min(15, W * 0.03) + 'px', color: '#8a86c8', fontStyle: '700'
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.29, 'SCEGLI OPERATORE', {
      fontSize: '14px', color: '#8a86c8', fontStyle: '700'
    }).setOrigin(0.5);

    const chars = [
      { k: 'm', label: 'VYRE', col: C.player, tex: 'vyre', frame: SPRITE.VYRE.idle_front },
      { k: 'f', label: 'NOVA', col: C.playerF, tex: 'nova', frame: SPRITE.NOVA.idle_front }
    ];
    this.charBtns = [];
    chars.forEach((c, i) => {
      const x = cx + (i === 0 ? -1 : 1) * Math.min(88, W * 0.18);
      const box = this.add.rectangle(x, H * 0.29 + 56, 104, 104, 0x0d0b1c).setStrokeStyle(3, 0x2a2550);
      const spr = this.add.sprite(x, H * 0.29 + 48, c.tex, c.frame).setScale(1.35);
      this.add.text(x, H * 0.29 + 92, c.label, { fontSize: '14px', color: '#e8e6ff', fontStyle: '700' }).setOrigin(0.5);
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => { GAME.char = c.k; this.refresh(); });
      this.charBtns.push({ box, col: c.col, k: c.k });
    });

    this.add.text(cx, H * 0.55, 'MODALITÀ DI MIRA', {
      fontSize: '14px', color: '#8a86c8', fontStyle: '700'
    }).setOrigin(0.5);

    const modes = [
      { k: 'auto', t: 'AUTO-AIM', s: 'Facile · punti ×1.0', col: C.green },
      { k: 'manual', t: 'MIRA MANUALE', s: 'Skill · punti ×1.5', col: C.gold }
    ];
    this.modeBtns = [];
    modes.forEach((m, i) => {
      const y = H * 0.55 + 38 + i * 62;
      const box = this.add.rectangle(cx, y, Math.min(320, W * 0.8), 52, 0x0d0b1c).setStrokeStyle(3, 0x2a2550);
      this.add.text(cx - Math.min(148, W * 0.37), y - 9, m.t, { fontSize: '17px', color: '#e8e6ff', fontStyle: '800' }).setOrigin(0, 0.5);
      this.add.text(cx - Math.min(148, W * 0.37), y + 11, m.s, { fontSize: '12px', color: '#8a86c8' }).setOrigin(0, 0.5);
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => { GAME.mode = m.k; this.refresh(); });
      this.modeBtns.push({ box, col: m.col, k: m.k });
    });

    const start = this.add.rectangle(cx, H * 0.86, Math.min(320, W * 0.8), 58, 0x14102b).setStrokeStyle(3, C.player);
    this.add.text(cx, H * 0.86, '▶  ENTRA IN PARTITA', { fontSize: '20px', color: '#33e1ff', fontStyle: '900' }).setOrigin(0.5);
    start.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('Game'));
    this.refresh();
  }

  refresh() {
    this.charBtns.forEach(b => b.box.setStrokeStyle(3, GAME.char === b.k ? b.col : 0x2a2550));
    this.modeBtns.forEach(b => b.box.setStrokeStyle(3, GAME.mode === b.k ? b.col : 0x2a2550));
  }
}
