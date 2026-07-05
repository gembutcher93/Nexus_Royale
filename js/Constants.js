/* ==========================================================================
   NEXUS ROYALE v2.0 — Costanti e configurazione globale
   Griglia sprite: 77x77 pixel
   ========================================================================== */

const WORLD_W = 4224, WORLD_H = 2304;
const TOTAL_PLAYERS = 30;
const BOT_COUNT = TOTAL_PLAYERS - 1;

const SPRITE = {
  FRAME_W: 77, FRAME_H: 77,

  VYRE: {
    idle_front: 0,  idle_side: 2,  idle_back: 3,
    walk_front: 4,  walk_side: 5,  walk_back: 6,
    shoot_front: 8, shoot_side: 9, shoot_back: 10,
    death_start: 11, death_end: 14
  },
  NOVA: {
    idle_front: 0,  idle_side: 2,  idle_back: 3,
    walk_front: 4,  walk_side: 5,  walk_back: 6,
    shoot_front: 8, shoot_side: 9, shoot_back: 10,
    death_start: 11, death_end: 14
  },
  BOT: {
    idle_front: 0,  idle_side: 2,  idle_back: 3,
    walk_front: 4,  walk_side: 5,  walk_back: 6,
    shoot_front: 8, shoot_side: 9, shoot_back: 10,
    death_start: 11, death_end: 14
  }
};

const C = {
  bg: 0x060410, floor: 0x0d0a1c, grid: 0x1c1748, road: 0x141033,
  player: 0x33e1ff, playerF: 0x8be3ff, enemy: 0xff3b6b,
  gold: 0xffd23f, green: 0x35e06a, shield: 0x38b6ff,
  magenta: 0xff2ea6, purple: 0xa25bff, orange: 0xff7a2f, cyan: 0x00e5ff,
  zone: 0xff2e4d, safe: 0x00e5ff, water: 0x123a6e, waterEdge: 0x2fa8ff,
};

const WEAPONS = {
  pistol:   { name:'Pistol',   dmg:18, rate:320, speed:640, spread:0.05, pellets:1, range:520, tier:0, col:C.player,  b:'normal' },
  smg:      { name:'SMG',      dmg:11, rate:105, speed:720, spread:0.11, pellets:1, range:470, tier:1, col:C.green,   b:'normal' },
  shotgun:  { name:'Shotgun',  dmg:9,  rate:640, speed:620, spread:0.30, pellets:6, range:330, tier:2, col:C.magenta, b:'normal' },
  rifle:    { name:'Rifle',    dmg:31, rate:255, speed:900, spread:0.02, pellets:1, range:780, tier:3, col:C.purple,  b:'normal' },
  plasma:   { name:'Plasma',   dmg:40, rate:170, speed:820, spread:0.03, pellets:1, range:840, tier:4, col:C.gold,    b:'normal' },
  launcher: { name:'Launcher', dmg:26, rate:820, speed:360, spread:0.02, pellets:1, range:720, tier:4, col:C.orange,  b:'explosive', splashR:130, splashDmg:60 },
  seeker:   { name:'Seeker',   dmg:15, rate:150, speed:540, spread:0.06, pellets:1, range:700, tier:4, col:C.magenta, b:'homing', turn:0.075 },
  ricochet: { name:'Ricochet', dmg:14, rate:95,  speed:760, spread:0.06, pellets:1, range:640, tier:3, col:0x7dff9e,  b:'bounce', bounces:3 },
  railgun:  { name:'Railgun',  dmg:52, rate:600, speed:1650,spread:0.0,  pellets:1, range:1050,tier:4, col:0x9dfcff,  b:'pierce', pierce:5 },
};

const LOOT_TABLE = ['pistol','smg','smg','shotgun','shotgun','rifle'];
const AIRDROP_POOL = ['launcher','railgun','seeker','ricochet','plasma','rifle'];

const DISTRICTS = [
  { n:'NEON MARKET',   x:0.72, y:0.16, tier:1, c:C.magenta },
  { n:'TECH TOWER',    x:0.50, y:0.42, tier:2, c:C.cyan },
  { n:'OMEGA HQ',      x:0.40, y:0.80, tier:3, c:C.purple },
  { n:'RESEARCH LAB',  x:0.63, y:0.82, tier:3, c:C.green },
  { n:'POWER CORE',    x:0.15, y:0.42, tier:2, c:C.orange },
  { n:'WAREHOUSE',     x:0.24, y:0.62, tier:1, c:C.gold },
  { n:"HACKER'S BAY",  x:0.83, y:0.40, tier:2, c:C.shield },
  { n:'SLUMS',         x:0.81, y:0.66, tier:0, c:0x6a6a9a },
];

let GAME = { char:'m', mode:'auto' };
