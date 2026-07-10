/* ==========================================================================
   NEXUS ROYALE — top-down battle royale (visual+weapons pass)
   ========================================================================== */
let WORLD_W=6600, WORLD_H=4800;
let TOTAL_PLAYERS=100;
const LIVE_ZOOM=0.85;
const TITLE_FONT='Orbitron, "Segoe UI", system-ui, sans-serif';
// design tokens (touch>=44px, type scale, 8pt spacing, 150-300ms motion)
const T={ tap:44, s1:8,s2:16,s3:24,s4:32,
  fXs:'11px',fSm:'13px',fMd:'16px',fLg:'20px',fXl:'28px',
  txt:'#e8e6ff', txtDim:'#a8a4d0', txtMute:'#8a86c8',   // >=4.5:1 on #0b0918
  motion:200, motionSlow:300 };
// --- swappable assets (replace the files in /assets, keep the names) ---
const ART={
  splash:'assets/splash.jpg',
  ops:{vyre:'assets/op_vyre.png',nova:'assets/op_nova.png',oracle:'assets/op_oracle.png',aegis:'assets/op_aegis.png',wraith:'assets/op_omega.png'},
  bot:'assets/op_bot.png',
  intro:'assets/intro.mp4'
};
let ART_OK={};

function matchCfg(){ if(GAME.match==='blitz') return {total:30,w:4200,h:3000,loot:95,deploy:5,first:12000,wait:9000,shrink:9000,pr:[0.60,0.40,0.24,0.12,0.05],pd:[2,3,5,8,13]};
  return {total:100,w:6600,h:4800,loot:170,deploy:8,first:22000,wait:14000,shrink:13000,pr:[0.78,0.60,0.45,0.32,0.20,0.11,0.05],pd:[1,1,2,3,5,8,12]}; }
// quality affects EFFECTS ONLY (bot count never changes)
const FXQ={ low:{particles:0.25,glow:false,shake:false,signs:0,lights:6,trails:false},
            med:{particles:0.55,glow:true, shake:true, signs:8, lights:16,trails:false},
            high:{particles:1,   glow:true, shake:true, signs:22,lights:26,trails:true} };
function fxq(){ return FXQ[GAME.quality]||FXQ.high; }
const SKINS=[
  {id:'base',  name:'STANDARD',cost:0,    tint:0xffffff, halo:0,      desc:'Equipaggiamento di serie.'},
  {id:'neon',  name:'NEON',    cost:900,  tint:0xffffff, halo:1,      desc:'Contorni al neon pulsanti.'},
  {id:'chrome',name:'CHROME',  cost:1800, tint:0xdfe6ff, halo:0.4,    desc:'Corazza cromata riflettente.'},
  {id:'void',  name:'VOID',    cost:3200, tint:0x6b5aa8, halo:0.7,    desc:'Lega oscura, aura viola.'},
];
const SKIN=id=>SKINS.find(s=>s.id===id)||SKINS[0];

const C={
  bg:0x060410, floor:0x0d0a1c, grid:0x1c1748, road:0x141033,
  player:0x33e1ff, playerF:0x8be3ff, enemy:0xff3b6b,
  gold:0xffd23f, green:0x35e06a, shield:0x38b6ff, magenta:0xff2ea6, purple:0xa25bff, orange:0xff7a2f, cyan:0x00e5ff,
  zone:0xff2e4d, safe:0x00e5ff, water:0x123a6e, waterEdge:0x2fa8ff,
};

// gun visual buckets: small / wide / long / heavy
const WEAPONS={
  pistol : {name:'Pistol',  dmg:18, rate:320, speed:640, spread:0.05, pellets:1, range:520, tier:0, col:C.player,  gun:'small', b:'normal'},
  smg    : {name:'SMG',     dmg:11, rate:105, speed:720, spread:0.11, pellets:1, range:470, tier:1, col:C.green,   gun:'small', b:'normal'},
  shotgun: {name:'Shotgun', dmg:9,  rate:640, speed:620, spread:0.30, pellets:6, range:330, tier:2, col:C.magenta, gun:'wide',  b:'normal'},
  rifle  : {name:'Rifle',   dmg:31, rate:255, speed:900, spread:0.02, pellets:1, range:780, tier:3, col:C.purple,  gun:'long',  b:'normal'},
  plasma : {name:'Plasma',  dmg:40, rate:170, speed:820, spread:0.03, pellets:1, range:840, tier:4, col:C.gold,    gun:'heavy', b:'normal'},
  launcher:{name:'Launcher',dmg:26, rate:820, speed:360, spread:0.02, pellets:1, range:720, tier:4, col:C.orange,  gun:'heavy', b:'explosive', splashR:130, splashDmg:60},
  seeker : {name:'Seeker',  dmg:15, rate:150, speed:540, spread:0.06, pellets:1, range:700, tier:4, col:C.magenta, gun:'heavy', b:'homing', turn:0.075},
  ricochet:{name:'Ricochet',dmg:14, rate:95,  speed:760, spread:0.06, pellets:1, range:640, tier:3, col:0x7dff9e,  gun:'small', b:'bounce', bounces:3},
  railgun: {name:'Railgun', dmg:52, rate:600, speed:1650,spread:0.0,  pellets:1, range:1050,tier:4, col:0x9dfcff,  gun:'long',  b:'pierce', pierce:5},
};
const LOOT_TABLE=['pistol','smg','smg','shotgun','shotgun','rifle'];
const AIRDROP_POOL=['launcher','railgun','seeker','ricochet','plasma','rifle'];

const DISTRICTS=[
  {n:'NEON MARKET',   x:0.72, y:0.16, tier:1, c:C.magenta},
  {n:'TECH TOWER',    x:0.50, y:0.42, tier:2, c:C.cyan},
  {n:'OMEGA HQ',      x:0.40, y:0.80, tier:3, c:C.purple},
  {n:'RESEARCH LAB',  x:0.63, y:0.82, tier:3, c:C.green},
  {n:'POWER CORE',    x:0.15, y:0.42, tier:2, c:C.orange},
  {n:'WAREHOUSE',     x:0.24, y:0.62, tier:1, c:C.gold},
  {n:"HACKER'S BAY",  x:0.83, y:0.40, tier:2, c:C.shield},
  {n:'SLUMS',         x:0.81, y:0.66, tier:0, c:0x6a6a9a},
];

let GAME={char:'vyre', mode:'auto', match:'royale', skin:'base', quality:'high', mmAlpha:1};
let SEEN_TUTORIAL=false;

// ---- operators (Apex-style: colour + unique ability) ----
const OPERATORS=[
  {id:'vyre',  name:'VYRE',  col:0x33e1ff, ab:'DASH',   abName:'Scatto',      icon:'»', cd:5000,  cost:0,    desc:'Scatto rapido: schivi e chiudi la distanza (breve invulnerabilità).'},
  {id:'nova',  name:'NOVA',  col:0xff2ea6, ab:'GRENADE',abName:'Granata',     icon:'✸', cd:8000,  cost:0,    desc:'Lanci una granata che esplode ad area verso dove miri.'},
  {id:'oracle',name:'ORACLE',col:0x35e06a, ab:'SCAN',   abName:'Scansione',   icon:'◎', cd:9000,  cost:1200, desc:'Riveli i nemici vicini per qualche secondo, anche sulla minimappa.'},
  {id:'aegis', name:'AEGIS', col:0x38b6ff, ab:'DOME',   abName:'Cupola',      icon:'◗', cd:14000, cost:2500, desc:'Generi una cupola che blocca i proiettili nemici.'},
  {id:'wraith',name:'OMEGA', col:0xa25bff, ab:'CLOAK',  abName:'Invisibilità',icon:'○', cd:12000, cost:4000, desc:'Diventi invisibile: i nemici smettono di vederti.'},
];
const OP=id=>OPERATORS.find(o=>o.id===id)||OPERATORS[0];

const STUDIO_REWARD={name:'PREMIO STUDIO',cost:5000};

// ---- persistent profile + daily challenges (localStorage) ----
const Profile={
  data:{credits:0,lifetime:0,transferred:0,matches:0,wins:0,kills:0,best:99,
    bestKills:0, maxDmg:0, totalDmg:0, bestTime:0, totalTime:0, placeSum:0,
    streak:0, bestStreak:0, topScore:0, ops:{},
    unlocked:['vyre','nova'],skins:['base'],daily:null},
  load(){ try{ const s=localStorage.getItem('nexusProfile'); if(s) this.data=Object.assign(this.data,JSON.parse(s)); }catch(e){} this.ensureDaily(); },
  save(){ try{ localStorage.setItem('nexusProfile',JSON.stringify(this.data)); }catch(e){} },
  ensureDaily(){ const key=new Date().toISOString().slice(0,10); if(!this.data.daily||this.data.daily.key!==key) this.data.daily=this.genDaily(key); },
  genDaily(key){ const pool=[
      {id:'k10',t:'Fai 10 eliminazioni',goal:10,type:'kills',reward:120},
      {id:'k25',t:'Fai 25 eliminazioni',goal:25,type:'kills',reward:250},
      {id:'win',t:'Vinci una partita',goal:1,type:'wins',reward:200},
      {id:'top5',t:'Arriva nei primi 5',goal:1,type:'top5',reward:100},
      {id:'play3',t:'Gioca 3 partite',goal:3,type:'matches',reward:80},
      {id:'km5',t:'5 kill in mira manuale',goal:5,type:'killsManual',reward:150},
    ];
    let seed=0; for(let i=0;i<key.length;i++) seed=(seed*31+key.charCodeAt(i))>>>0;
    const p=pool.slice(), out=[]; for(let i=0;i<3&&p.length;i++){ seed=(seed*1103515245+12345)&0x7fffffff; out.push(Object.assign({prog:0,done:false},p.splice(seed%p.length,1)[0])); }
    return {key,list:out};
  },
  unlockedOp(id){ return this.data.unlocked.indexOf(id)>=0; },
  unlock(id,cost){ if(this.unlockedOp(id)) return true; if(this.data.credits>=cost){ this.data.credits-=cost; this.data.unlocked.push(id); this.save(); return true; } return false; },
  unlockedSkin(id){ return (this.data.skins||['base']).indexOf(id)>=0; },
  unlockSkin(id,cost){ if(!this.data.skins) this.data.skins=['base']; if(this.unlockedSkin(id)) return true; if(this.data.credits>=cost){ this.data.credits-=cost; this.data.skins.push(id); this.save(); return true; } return false; },
  record(res){ const d=this.data;
    d.matches++; d.kills+=res.kills; if(res.win) d.wins++; if(res.placement<d.best) d.best=res.placement;
    if(res.kills>(d.bestKills||0)) d.bestKills=res.kills;
    d.totalDmg=(d.totalDmg||0)+Math.round(res.damage||0);
    if((res.damage||0)>(d.maxDmg||0)) d.maxDmg=Math.round(res.damage);
    d.totalTime=(d.totalTime||0)+(res.durationSec||0);
    if((res.durationSec||0)>(d.bestTime||0)) d.bestTime=res.durationSec;
    d.placeSum=(d.placeSum||0)+res.placement;
    if(res.win){ d.streak=(d.streak||0)+1; if(d.streak>(d.bestStreak||0)) d.bestStreak=d.streak; } else d.streak=0;
    if((res.score||0)>(d.topScore||0)) d.topScore=res.score;
    d.ops=d.ops||{}; d.ops[res.op]=(d.ops[res.op]||0)+1;
    this.ensureDaily(); let bonus=0;
    this.data.daily.list.forEach(c=>{ if(c.done) return;
      if(c.type==='kills') c.prog+=res.kills; else if(c.type==='killsManual'&&res.mode==='manual') c.prog+=res.kills;
      else if(c.type==='wins'&&res.win) c.prog+=1; else if(c.type==='matches') c.prog+=1; else if(c.type==='top5'&&res.placement<=5) c.prog+=1;
      if(c.prog>=c.goal){ c.done=true; bonus+=c.reward; } });
    const gain=res.credits+bonus;
    this.data.credits+=gain; this.data.lifetime=(this.data.lifetime||0)+gain;
    this.save(); return {earned:res.credits,bonus}; }
};
Profile.load();
try{ const q=localStorage.getItem('nexusQuality'); if(q) GAME.quality=q;
     const a=localStorage.getItem('nexusMmAlpha'); if(a!==null) GAME.mmAlpha=Math.max(0.15,Math.min(1,parseFloat(a)||1)); }catch(e){}

// ---- INKANIMUS: trasferimento crediti (un codice, non piu' uno per partita) ----
function makeTransferCode(amount){
  if(amount<=0 || amount>Profile.data.credits) return null;
  const tid=(Date.now().toString(36)+Math.random().toString(36).slice(2,8)).toUpperCase();
  const payload={ v:2, app:'nexus-royale', kind:'transfer', tid, ts:Date.now(), amount,
    stats:{ matches:Profile.data.matches, wins:Profile.data.wins, kills:Profile.data.kills, best:Profile.data.best } };
  Profile.data.credits-=amount;
  Profile.data.transferred=(Profile.data.transferred||0)+amount;
  Profile.save();
  try{ return 'NXR2:'+btoa(JSON.stringify(payload)); }catch(e){ return 'NXR2:'+JSON.stringify(payload); }
}

// weapons that "see & hit" far → widen the camera when held
const SCOPED={rifle:1, railgun:1};

// ---- tiny synth (no audio files) ----
const SFX={
  ctx:null, master:null, on:true, musicTimer:null, step:0,
  init(){ if(this.ctx) return; try{ const AC=window.AudioContext||window.webkitAudioContext; this.ctx=new AC();
    this.master=this.ctx.createGain(); this.master.gain.value=0.5; this.master.connect(this.ctx.destination); }catch(e){ this.ctx=null; } },
  resume(){ this.init(); try{ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); }catch(e){} },
  tone(freq,dur,type,vol,slideTo){ if(!this.on||!this.ctx) return; try{ const t=this.ctx.currentTime,
    o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40,slideTo),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+0.02); }catch(e){} },
  noise(dur,vol,filt){ if(!this.on||!this.ctx) return; try{ const t=this.ctx.currentTime, n=Math.floor(this.ctx.sampleRate*dur),
    buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate), d=buf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
    const s=this.ctx.createBufferSource(); s.buffer=buf; const g=this.ctx.createGain();
    g.gain.setValueAtTime(vol||0.2,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=filt||1400;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t+dur); }catch(e){} },
  shoot(tier){ this.tone(340-tier*22,0.07,'square',0.10,170); this.noise(0.045,0.05,2400); },
  hit(){ this.tone(920,0.05,'sine',0.13); },
  kill(){ this.tone(190,0.18,'sawtooth',0.18,90); this.noise(0.12,0.10,900); },
  explode(){ this.noise(0.32,0.26,700); this.tone(80,0.32,'sawtooth',0.16,40); },
  pickup(){ this.tone(520,0.05,'triangle',0.13); this.tone(800,0.07,'triangle',0.11); },
  zone(){ this.tone(150,0.5,'sawtooth',0.11,120); },
  ui(){ this.tone(440,0.05,'square',0.09); },
  music(on){ if(on){ if(this.musicTimer||!this.ctx) return; this.step=0;
      const sc=[220,261.6,293.7,329.6,392,440], bs=[110,110,146.8,98];
      this.musicTimer=setInterval(()=>{ if(!this.on||!this.ctx) return;
        this.tone(bs[this.step%4],0.42,'sawtooth',0.045);
        this.tone(sc[(this.step*3)%sc.length]*2,0.16,'triangle',0.03);
        if(this.step%2===0) this.tone(sc[this.step%sc.length]*4,0.09,'square',0.018); this.step++; },270);
    } else if(this.musicTimer){ clearInterval(this.musicTimer); this.musicTimer=null; } },
  toggle(){ this.on=!this.on; if(!this.on) this.music(false); return this.on; }
};

/* ============================ BOOT ============================ */
class Boot extends Phaser.Scene{
  constructor(){ super('Boot'); }
  preload(){
    this.load.image('art_splash',ART.splash);
    Object.keys(ART.ops).forEach(k=>this.load.image('port_'+k,ART.ops[k]));
    this.load.image('port_bot',ART.bot);
    this.load.video('intro_video',ART.intro,'loadeddata',false,false);
    this.load.on('loaderror',(f)=>{ ART_OK[f.key]=false; console.warn('asset mancante:',f.key); });
  }
  create(){
    // if image files failed (opened as file:// or missing), restore from embedded fallback
    const missing=Object.keys(ART_OK).filter(k=>ART_OK[k]===false);
    if(missing.length && window.ART_FALLBACK){
      const todo=missing.filter(k=>window.ART_FALLBACK[k] && !this.textures.exists(k));
      if(todo.length){ let added=0;
        const onAdd=()=>{ if(++added>=todo.length){ this.textures.off('addtexture',onAdd); this.buildAll(); } };
        this.textures.on('addtexture',onAdd);
        todo.forEach(k=>this.textures.addBase64(k,window.ART_FALLBACK[k]));
        this.time.delayedCall(2000,()=>{ this.textures.off('addtexture',onAdd); this.buildAll(); });
        return;
      }
    }
    this.buildAll();
  }
  buildAll(){
    if(this._built) return; this._built=true;
    // --- canvas gradient textures (soft glow + vignette) ---
    const rad=(key,size,stops)=>{
      const cv=this.textures.createCanvas(key,size,size); const ctx=cv.getContext();
      const g=ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
      stops.forEach(s=>g.addColorStop(s[0],s[1])); ctx.fillStyle=g; ctx.fillRect(0,0,size,size); cv.refresh();
    };
    rad('glow',128,[[0,'rgba(255,255,255,1)'],[0.35,'rgba(255,255,255,0.55)'],[1,'rgba(255,255,255,0)']]);
    rad('vignette',512,[[0,'rgba(0,0,0,0)'],[0.62,'rgba(0,0,0,0)'],[1,'rgba(4,2,12,0.85)']]);
    rad('redvig',512,[[0,'rgba(255,0,45,0)'],[0.5,'rgba(255,0,45,0)'],[1,'rgba(255,10,55,0.6)']]);

    const g=this.make.graphics({x:0,y:0,add:false});
    // px for wall bodies
    g.clear(); g.fillStyle(0xffffff,1); g.fillRect(0,0,8,8); g.generateTexture('px',8,8);
    // bullet dot
    g.clear(); g.fillStyle(0xffffff,1); g.fillCircle(8,8,8); g.generateTexture('dot',16,16);
    g.clear(); g.fillStyle(0xffffff,1); g.fillCircle(6,6,6); g.generateTexture('spark',12,12);

    // asphalt tile (GTA-style road surface)
    g.clear(); g.fillStyle(0x15151d,1); g.fillRect(0,0,128,128);
    for(let i=0;i<70;i++){ g.fillStyle(Phaser.Utils.Array.GetRandom([0x1c1c26,0x101018,0x22222e]),0.7);
      const s=Phaser.Math.Between(1,3); g.fillRect(Phaser.Math.Between(0,127),Phaser.Math.Between(0,127),s,s); }
    g.lineStyle(1,0x0b0b12,0.5); g.strokeRect(0,0,128,128);
    g.generateTexture('asphalt',128,128);

    // sidewalk tile
    g.clear(); g.fillStyle(0x2a2a38,1); g.fillRect(0,0,64,64);
    g.lineStyle(1,0x1a1a26,0.9); g.strokeRect(0,0,32,32); g.strokeRect(32,0,32,32); g.strokeRect(0,32,32,32); g.strokeRect(32,32,32,32);
    for(let i=0;i<10;i++){ g.fillStyle(0x33333f,0.6); g.fillRect(Phaser.Math.Between(0,62),Phaser.Math.Between(0,62),2,2); }
    g.generateTexture('sidewalk',64,64);

    // rooftop tile (dark, gravel)
    g.clear(); g.fillStyle(0x191627,1); g.fillRect(0,0,64,64);
    for(let i=0;i<26;i++){ g.fillStyle(Phaser.Utils.Array.GetRandom([0x221f34,0x14121f]),0.8);
      g.fillRect(Phaser.Math.Between(0,62),Phaser.Math.Between(0,62),2,2); }
    g.generateTexture('roof',64,64);

    // floor tile
    g.clear(); g.fillStyle(C.floor,1); g.fillRect(0,0,128,128);
    g.lineStyle(1,C.grid,0.55); g.strokeRect(0,0,128,128);
    g.lineStyle(1,C.grid,0.28); g.beginPath(); g.moveTo(64,0);g.lineTo(64,128);g.moveTo(0,64);g.lineTo(128,64); g.strokePath();
    g.fillStyle(C.grid,0.5); g.fillCircle(0,0,2); g.fillCircle(128,0,2); g.fillCircle(0,128,2); g.fillCircle(128,128,2);
    g.generateTexture('floor',128,128);

    // ---- top-down operator body (facing +x), no gun ----
    const body=(key,col,accent)=>{
      g.clear();
      g.fillStyle(0x000000,0.32); g.fillEllipse(32,42,42,20);              // shadow
      g.fillStyle(0x0b0918,1); g.fillRoundedRect(18,24,12,16,3);          // backpack (rear)
      g.fillStyle(0x14122a,1); g.fillEllipse(31,32,30,36);                // shoulders/torso
      g.lineStyle(3,col,0.95); g.strokeEllipse(31,32,30,36);              // rim
      g.fillStyle(accent,0.9); g.fillCircle(22,20,3); g.fillCircle(22,44,3); // shoulder lights
      g.fillStyle(0x090714,1); g.fillCircle(35,32,10);                    // helmet
      g.lineStyle(2,col,0.9); g.strokeCircle(35,32,10);
      g.fillStyle(col,1); g.fillRoundedRect(41,29,5,6,2);                 // visor (front)
      g.generateTexture(key,64,64);
    };
    body('p_m',C.player,C.gold);
    body('p_f',C.playerF,C.magenta);
    body('bot',C.enemy,C.orange);
    body('p_base',0xffffff,0xffffff); // tinted per operator at runtime
    // NEON skin: double bright outline
    g.clear();
    g.fillStyle(0x000000,0.32); g.fillEllipse(32,42,42,20);
    g.fillStyle(0x0b0918,1); g.fillRoundedRect(18,24,12,16,3);
    g.fillStyle(0x14122a,1); g.fillEllipse(31,32,30,36);
    g.lineStyle(4,0xffffff,1); g.strokeEllipse(31,32,30,36);
    g.lineStyle(2,0xffffff,0.5); g.strokeEllipse(31,32,34,40);
    g.fillStyle(0x090714,1); g.fillCircle(35,32,10); g.lineStyle(3,0xffffff,1); g.strokeCircle(35,32,10);
    g.fillStyle(0xffffff,1); g.fillRoundedRect(41,29,5,6,2);
    g.generateTexture('p_neon',64,64);
    // CHROME skin: metallic light body
    g.clear();
    g.fillStyle(0x000000,0.32); g.fillEllipse(32,42,42,20);
    g.fillStyle(0x2a2c40,1); g.fillRoundedRect(18,24,12,16,3);
    g.fillStyle(0x5a5f78,1); g.fillEllipse(31,32,30,36);
    g.fillStyle(0x9aa0c0,0.6); g.fillEllipse(27,28,16,20);
    g.lineStyle(3,0xffffff,1); g.strokeEllipse(31,32,30,36);
    g.fillStyle(0x1a1c2a,1); g.fillCircle(35,32,10); g.lineStyle(2,0xffffff,1); g.strokeCircle(35,32,10);
    g.fillStyle(0xffffff,1); g.fillRoundedRect(41,29,5,6,2);
    g.generateTexture('p_chrome',64,64);

    // ---- guns (facing +x, grip at local x=16) ----
    const gun=(key,draw)=>{ g.clear(); draw(); g.generateTexture(key,64,24); };
    gun('gun_small',()=>{ g.fillStyle(0x0c0a1a,1); g.fillRoundedRect(10,8,14,9,2);
      g.fillStyle(0xd7ddff,1); g.fillRect(22,10,14,4); g.fillStyle(0x9aa4d6,1); g.fillRect(34,10,3,4); });
    gun('gun_wide',()=>{ g.fillStyle(0x0c0a1a,1); g.fillRoundedRect(8,6,16,12,2);
      g.fillStyle(0xd7ddff,1); g.fillRect(22,8,16,3); g.fillRect(22,13,16,3); });
    gun('gun_long',()=>{ g.fillStyle(0x0c0a1a,1); g.fillRoundedRect(8,8,16,9,2);
      g.fillStyle(0xc9cff2,1); g.fillRect(22,10,32,4); g.fillStyle(0x8891c9,1); g.fillRect(20,7,6,10); });
    gun('gun_heavy',()=>{ g.fillStyle(0x0c0a1a,1); g.fillRoundedRect(8,5,18,14,3);
      g.fillStyle(0x2a2550,1); g.fillRect(24,7,20,10); g.lineStyle(2,C.gold,0.9); g.strokeRect(24,7,20,10);
      g.fillStyle(C.gold,0.4); g.fillRect(26,9,16,6); });

    // ---- crates / pickups ----
    const crate=(key,col,inner)=>{ g.clear();
      g.fillStyle(0x000000,0.3); g.fillEllipse(20,32,34,12);
      g.fillStyle(0x0d0b1c,1); g.fillRoundedRect(4,6,32,26,3);
      g.lineStyle(3,col,1); g.strokeRoundedRect(4,6,32,26,3);
      g.fillStyle(inner!==undefined?inner:col,0.25); g.fillRoundedRect(7,9,26,20,2);
      g.lineStyle(2,col,0.9); g.beginPath(); g.moveTo(4,19);g.lineTo(36,19);g.moveTo(20,6);g.lineTo(20,32); g.strokePath();
      g.generateTexture(key,40,40); };
    crate('lootW',C.magenta); crate('lootA',C.gold);
    // neutral white crate so weapon-colour tint shows true
    g.clear(); g.fillStyle(0x000000,0.3); g.fillEllipse(20,32,34,12);
    g.fillStyle(0x0d0b1c,1); g.fillRoundedRect(4,6,32,26,3);
    g.lineStyle(3,0xffffff,1); g.strokeRoundedRect(4,6,32,26,3);
    g.fillStyle(0xffffff,0.22); g.fillRoundedRect(7,9,26,20,2);
    g.lineStyle(2,0xffffff,0.9); g.beginPath(); g.moveTo(4,19);g.lineTo(36,19);g.moveTo(20,6);g.lineTo(20,32); g.strokePath();
    g.generateTexture('crateN',40,40);
    g.clear(); g.fillStyle(0x0d0b1c,1); g.fillRoundedRect(4,6,32,28,3); g.lineStyle(3,C.green,1); g.strokeRoundedRect(4,6,32,28,3);
    g.fillStyle(C.green,1); g.fillRect(18,12,6,16); g.fillRect(12,18,18,4); g.generateTexture('lootH',40,40);
    g.clear(); g.fillStyle(0x0d0b1c,1); g.fillRoundedRect(8,4,24,32,3); g.lineStyle(3,C.shield,1); g.strokeRoundedRect(8,4,24,32,3);
    g.fillStyle(C.shield,0.55); g.fillRect(12,8,16,11); g.fillStyle(C.shield,1); g.fillRect(12,8,16,3); g.generateTexture('lootS',40,40);

    // dropship
    g.clear(); g.fillStyle(0x0c0a1a,1); g.fillEllipse(64,28,120,34);
    g.lineStyle(3,C.cyan,0.95); g.strokeEllipse(64,28,120,34);
    g.fillStyle(C.cyan,0.25); g.fillEllipse(64,26,90,20);
    g.fillStyle(C.gold,0.9); g.fillCircle(14,28,5); g.fillCircle(114,28,5);
    g.fillStyle(C.magenta,0.9); g.fillRect(40,20,48,4);
    g.generateTexture('ship',128,56);
    // parachute canopy
    g.clear(); g.fillStyle(0x1a1740,1); g.beginPath(); g.arc(28,26,22,Math.PI,0,false); g.closePath(); g.fillPath();
    g.lineStyle(3,C.cyan,0.9); g.beginPath(); g.arc(28,26,22,Math.PI,0,false); g.strokePath();
    g.lineStyle(2,0x8891c9,0.8); g.beginPath(); g.moveTo(8,26);g.lineTo(28,48);g.moveTo(48,26);g.lineTo(28,48);g.moveTo(28,26);g.lineTo(28,48); g.strokePath();
    g.generateTexture('chute',56,56);

    // ---- weapon silhouettes (used on ground loot + HUD) ----
    const drawWpn=(key,col,kind)=>{
      g.clear();
      const M=0xd7ddff, D=0x0c0a1c;
      if(kind==='pistol'){ g.fillStyle(D,1); g.fillRoundedRect(10,14,10,12,2); g.fillStyle(M,1); g.fillRect(18,14,14,5); g.fillStyle(col,1); g.fillRect(29,13,5,7); }
      else if(kind==='smg'){ g.fillStyle(D,1); g.fillRoundedRect(8,13,12,12,2); g.fillStyle(M,1); g.fillRect(18,12,18,5); g.fillStyle(D,1); g.fillRect(14,20,5,10); g.fillStyle(col,1); g.fillRect(33,11,5,7); }
      else if(kind==='shotgun'){ g.fillStyle(D,1); g.fillRoundedRect(6,14,14,10,2); g.fillStyle(M,1); g.fillRect(18,13,22,4); g.fillRect(18,18,22,4); g.fillStyle(col,1); g.fillRect(37,12,5,11); }
      else if(kind==='rifle'){ g.fillStyle(D,1); g.fillRoundedRect(6,14,10,10,2); g.fillStyle(M,1); g.fillRect(14,15,28,4); g.fillStyle(D,1); g.fillRect(20,10,10,4); g.fillStyle(col,1); g.fillRect(39,13,5,7); }
      else if(kind==='plasma'){ g.fillStyle(D,1); g.fillRoundedRect(8,11,16,16,3); g.fillStyle(col,0.55); g.fillRect(11,14,10,10); g.fillStyle(M,1); g.fillRect(23,15,15,7); g.fillStyle(col,1); g.fillCircle(40,18,4); }
      else if(kind==='launcher'){ g.fillStyle(D,1); g.fillRoundedRect(7,12,12,14,3); g.fillStyle(M,1); g.fillRect(18,14,20,10); g.lineStyle(2,col,1); g.strokeCircle(38,19,6); g.fillStyle(col,0.6); g.fillCircle(38,19,4); }
      else if(kind==='seeker'){ g.fillStyle(D,1); g.fillRoundedRect(8,13,12,12,2); g.fillStyle(M,1); g.fillRect(19,15,16,6); g.fillStyle(col,1); g.fillTriangle(35,13,44,18,35,23); }
      else if(kind==='ricochet'){ g.fillStyle(D,1); g.fillRoundedRect(9,13,11,12,2); g.fillStyle(M,1); g.fillRect(19,15,14,5); g.fillStyle(col,1); g.fillTriangle(33,14,40,18,33,22); g.fillCircle(43,18,2.5); }
      else { /* railgun */ g.fillStyle(D,1); g.fillRoundedRect(5,14,10,10,2); g.fillStyle(M,1); g.fillRect(13,16,30,3); g.fillStyle(D,1); g.fillRect(18,11,8,4); g.fillStyle(col,1); g.fillRect(40,12,4,11); }
      g.generateTexture(key,48,36);
    };
    Object.keys(WEAPONS).forEach(k=> drawWpn('wpn_'+k, WEAPONS[k].col, k));

    // ---- procedural TOP-DOWN animated characters (facing +x): frame 0 idle, 1-4 walk ----
    const CHAR_STYLE={vyre:'op',nova:'hood',aegis:'op',oracle:'hood',wraith:'hood'};
    const drawChar=(cx,cy,style,col,f)=>{
      const dark=0x1a1738, dark2=0x0c0a1c, metal=0xc9cff2, boot=0x3a3560, skin=0x2a2650;
      const swing=[0,6,0,-6,0][f], bob=[0,-1,0,-1,0][f];
      g.fillStyle(0x000000,0.28); g.fillEllipse(cx,cy+17,32,9);            // shadow
      const by=cy+bob;
      // legs (swing along facing, offset sideways)
      for(const sgn of [-1,1]){
        const lx=cx-2+(sgn>0?swing:-swing), ly=cy+sgn*7;
        g.fillStyle(dark2,1); g.fillRoundedRect(lx-4,ly-3,11,6,3);
        g.fillStyle(boot,1);  g.fillEllipse(lx+6.5,ly,5,6);
      }
      // backpack
      g.fillStyle(dark2,1); g.fillRoundedRect(cx-13,by-7,9,14,3);
      if(style==='hood'){ g.fillStyle(col,0.55); g.fillTriangle(cx-2,by-11,cx-2,by+11,cx-17,by); }
      // torso (narrow along facing, shoulders across)
      g.fillStyle(dark,1); g.fillEllipse(cx,by,18,22); g.lineStyle(2,col,0.95); g.strokeEllipse(cx,by,18,22);
      for(const sgn of [-1,1]){ g.fillStyle(dark,1); g.fillEllipse(cx+1,by+sgn*11,8,8); g.lineStyle(1.5,col,0.8); g.strokeEllipse(cx+1,by+sgn*11,8,8); }
      // arms forward
      g.fillStyle(dark,1); g.fillRoundedRect(cx+3,by-6,10,5,2); g.fillRoundedRect(cx+3,by+1,10,5,2);
      // head
      const hx=cx+3;
      if(style==='bot'){ g.fillStyle(dark2,1); g.fillRoundedRect(hx-6,by-6,13,12,3); g.lineStyle(2,col,1); g.strokeRoundedRect(hx-6,by-6,13,12,3);
        g.fillStyle(col,1); g.fillEllipse(hx+3.5,by,5,5); }
      else if(style==='hood'){ g.fillStyle(col,0.92); g.fillCircle(hx,by,7); g.lineStyle(1.5,dark2,1); g.strokeCircle(hx,by,7);
        g.fillStyle(dark2,1); g.fillEllipse(hx+1.5,by,9,8); g.fillStyle(col,1); g.fillEllipse(hx+3.5,by,3,3); }
      else { g.fillStyle(skin,1); g.fillCircle(hx,by,6); g.lineStyle(1.5,dark2,1); g.strokeCircle(hx,by,6);
        g.fillStyle(col,1); g.fillTriangle(hx-6,by-6,hx+1,by-7,hx-2,by-2); g.fillTriangle(hx-6,by+6,hx+1,by+7,hx-2,by+2);
        g.fillStyle(col,1); g.fillRoundedRect(hx+2,by-2,4,4,1); }
      // gun
      g.fillStyle(dark2,1); g.fillRoundedRect(cx+11,by-2.5,5,5,1);
      if(style==='bot'){ g.fillStyle(metal,1); for(let k=-1;k<=1;k++) g.fillRect(cx+15,by-2.5+k*2.4,12,1.6);
        g.fillStyle(col,1); g.fillRect(cx+25,by-3,3,6); }
      else { g.fillStyle(metal,1); g.fillRect(cx+15,by-1.6,11,3.2); g.fillStyle(col,1); g.fillRect(cx+23,by-2.2,3,4.4); }
    };
    const mkChar=(key,style,col)=>{
      for(let f=0;f<5;f++){ g.clear(); drawChar(32,32,style,col,f); g.generateTexture(key+'_'+f,64,64); }
      // frame 5 = firing pose (recoil: body back, arms extended, muzzle flare)
      g.clear(); drawChar(30,32,style,col,0);
      g.fillStyle(0xffd23f,0.95); g.fillTriangle(54,32,45,28,45,36);
      g.fillStyle(0xffffff,0.9); g.fillEllipse(47,32,7,5);
      g.generateTexture(key+'_5',64,64);
      // death: d0 hit (staggered) / d1 collapsing / d2 prone body
      const dark2=0x0c0a1c, boot2=0x3a3560, metal2=0xc9cff2;
      g.clear(); drawChar(29,33,style,col,0); g.fillStyle(0xff3b6b,0.30); g.fillCircle(32,32,20);
      g.generateTexture(key+'_d0',64,64);

      // d1: on knees, folding forward
      g.clear();
      g.fillStyle(0x000000,0.24); g.fillEllipse(32,42,34,10);
      g.fillStyle(dark2,1); g.fillRoundedRect(24,34,9,7,3); g.fillRoundedRect(24,23,9,7,3);   // legs folded
      g.fillStyle(0x1a1738,1); g.fillEllipse(30,32,17,20); g.lineStyle(2,col,0.8); g.strokeEllipse(30,32,17,20);
      g.fillStyle(dark2,1); g.fillRoundedRect(33,29,10,5,2);                                   // arm down
      if(style==='hood'){ g.fillStyle(col,0.85); g.fillCircle(39,32,6); g.fillStyle(dark2,1); g.fillEllipse(40,32,7,6); }
      else if(style==='bot'){ g.fillStyle(dark2,1); g.fillRoundedRect(34,27,11,10,3); g.fillStyle(col,0.7); g.fillEllipse(41,32,4,4); }
      else { g.fillStyle(0x2a2650,1); g.fillCircle(39,32,5.5); g.fillStyle(col,0.8); g.fillRect(41,30,3,3); }
      g.fillStyle(metal2,0.55); g.fillRect(42,38,10,2);                                         // gun slipping
      g.generateTexture(key+'_d1',64,64);

      // d2: lying prone — legs, torso, arms, head silhouette
      g.clear();
      g.fillStyle(0x000000,0.20); g.fillEllipse(32,38,44,13);
      if(style==='hood'){ g.fillStyle(col,0.42); g.fillTriangle(24,30,24,44,7,37); }            // cape spread
      // legs (splayed)
      g.fillStyle(dark2,1); g.fillRoundedRect(16,30,15,6,3); g.fillRoundedRect(16,38,15,6,3);
      g.fillStyle(boot2,1); g.fillEllipse(15,33,5,5); g.fillEllipse(15,41,5,5);
      // torso
      g.fillStyle(0x1a1738,1); g.fillEllipse(34,37,22,15); g.lineStyle(2,col,0.65); g.strokeEllipse(34,37,22,15);
      // arms out
      g.fillStyle(dark2,1); g.fillRoundedRect(34,26,6,10,3); g.fillRoundedRect(36,40,11,5,2);
      // head
      const hx2=45;
      if(style==='hood'){ g.fillStyle(col,0.8); g.fillCircle(hx2,36,6.5); g.fillStyle(dark2,1); g.fillEllipse(hx2+1,36,7,6); }
      else if(style==='bot'){ g.fillStyle(dark2,1); g.fillRoundedRect(hx2-6,31,12,10,3); g.fillStyle(col,0.55); g.fillEllipse(hx2+2,36,4,4); }
      else { g.fillStyle(0x2a2650,1); g.fillCircle(hx2,36,5.5); g.fillStyle(col,0.7); g.fillTriangle(hx2-5,31,hx2+1,30,hx2-2,34); }
      // dropped gun + blood/oil pool
      g.fillStyle(metal2,0.6); g.fillRect(38,45,13,2); g.fillStyle(0x0c0a1c,1); g.fillRoundedRect(35,44,5,4,1);
      g.fillStyle(style==='bot'?0x1b1b28:0x4a0d1e,0.45); g.fillEllipse(38,40,20,7);
      g.generateTexture(key+'_d2',64,64);
    };
    OPERATORS.forEach(o=> mkChar('ch_'+o.id, CHAR_STYLE[o.id]||'op', o.col));
    mkChar('ch_bot','bot',C.enemy);

    g.destroy();
    this.scene.start('Splash');
  }
}

/* ============================ SPLASH (intro) ============================ */
class Splash extends Phaser.Scene{
  constructor(){ super('Splash'); }
  create(){
    const W=this.scale.width,H=this.scale.height,cx=W/2,cy=H/2;
    this.add.rectangle(0,0,W,H,0x04030c).setOrigin(0);
    this.skipped=false;
    const done=()=>{ if(this.skipped) return; this.skipped=true; SFX.resume(); SFX.ui();
      if(this.introVideo){ try{ this.introVideo.stop(); }catch(e){} }
      this.cameras.main.fadeOut(280,4,3,12);
      this.time.delayedCall(300,()=>this.scene.start(SEEN_TUTORIAL?'Menu':'Tutorial')); };
    this.input.on('pointerdown',(p)=>{ if(this.introVideo && p.x>W-70 && p.y<80) return; done(); });

    // --- intro video (if available) ---
    if(this.cache.video && this.cache.video.exists('intro_video')){
      const v=this.add.video(cx,cy,'intro_video').setDepth(0);
      v.on('play',()=>{ const sc=Math.max(W/v.width,H/v.height); v.setScale(sc); });
      v.setMute(true);            // i browser bloccano l'autoplay con audio
      v.play(false);
      v.on('complete',()=>{ if(!this.skipped) done(); });
      this.introVideo=v;
      // speaker button (44x44 touch target) — tap to enable sound, doesn't skip
      const bx=W-38, by=44;
      const ring=this.add.circle(bx,by,22,0x061018,0.75).setStrokeStyle(2,C.cyan,0.9).setDepth(8);
      const icon=this.add.text(bx,by,'🔇',{fontSize:'18px'}).setOrigin(0.5).setDepth(9);
      const hint=this.add.text(bx,by+30,'AUDIO',{fontFamily:TITLE_FONT,fontSize:'9px',color:'#8a86c8',fontStyle:'900'}).setOrigin(0.5).setDepth(9);
      const hit=this.add.zone(bx,by,52,52).setOrigin(0.5).setDepth(10).setInteractive({useHandCursor:true});
      hit.on('pointerdown',(p,lx,ly,ev)=>{ if(ev&&ev.stopPropagation) ev.stopPropagation();
        const m=!v.isMuted(); v.setMute(m); icon.setText(m?'🔇':'🔊'); SFX.resume(); });
      this.tweens.add({targets:[ring,icon],alpha:{from:1,to:0.55},duration:1200,yoyo:true,repeat:-1});
    }
    // --- key art background, cover-fit + slow zoom (Ken Burns) ---
    if(!this.textures.exists('art_splash')){ // fallback skyline if the image is missing
      const sky=this.add.graphics().setDepth(0);
      for(let i=0;i<26;i++){ const bw=Phaser.Math.Between(24,70), bx=Phaser.Math.Between(-20,W), bh=Phaser.Math.Between(60,H*0.42);
        sky.fillStyle(0x0a0820,1); sky.fillRect(bx,H-bh,bw,bh);
        sky.lineStyle(1,Phaser.Utils.Array.GetRandom([C.cyan,C.magenta,C.purple]),0.35); sky.strokeRect(bx,H-bh,bw,bh); }
    }
    const art=this.add.image(cx,cy,this.textures.exists('art_splash')?'art_splash':'glow').setDepth(0);
    if(!this.textures.exists('art_splash') || this.introVideo) art.setVisible(false);
    const sc=Math.max(W/art.width,H/art.height)*1.02;
    art.setScale(sc).setAlpha(0);
    this.tweens.add({targets:art,alpha:1,duration:900});
    this.tweens.add({targets:art,scale:sc*1.09,y:cy-H*0.02,duration:11000,ease:'Sine.inOut'});
    // vignette + bottom fade so text reads
    this.add.image(cx,cy,'vignette').setDisplaySize(W*1.6,H*1.6).setAlpha(0.85).setDepth(1);
    const grad=this.add.graphics().setDepth(1);
    for(let i=0;i<40;i++){ grad.fillStyle(0x04030c, i/40); grad.fillRect(0,H*0.55+i*(H*0.45/40),W,H*0.45/40+1); }

    // --- neon flicker overlay (signs breathing) ---
    const flick=this.add.rectangle(0,0,W,H,C.magenta,0.05).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.tweens.add({targets:flick,alpha:{from:0.02,to:0.10},duration:1500,yoyo:true,repeat:-1});
    const flick2=this.add.rectangle(0,0,W,H,C.cyan,0.04).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.tweens.add({targets:flick2,alpha:{from:0.01,to:0.07},duration:2300,yoyo:true,repeat:-1,delay:400});

    // --- rain ---
    this.rain=[];
    for(let i=0;i<70;i++){
      const r=this.add.rectangle(Phaser.Math.Between(0,W),Phaser.Math.Between(-H,H),1,Phaser.Math.Between(10,26),0x9fd8ff,0.35).setOrigin(0).setDepth(3);
      r.sp=Phaser.Math.Between(420,900); this.rain.push(r);
    }
    // --- scanlines ---
    const sl=this.add.graphics().setDepth(4); sl.fillStyle(0x000000,0.16);
    for(let y=0;y<H;y+=3) sl.fillRect(0,y,W,1);

    // --- passing drone ---
    this.time.delayedCall(600,()=>{
      const d=this.add.image(-60,H*0.16,'ship').setDepth(3).setScale(0.42).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({targets:d,x:W+80,y:H*0.13,duration:5200,ease:'Sine.inOut'});
    });

    // --- logo slam ---
    const glow=this.add.image(cx,H*0.70,'glow').setTint(C.magenta).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(700,260).setAlpha(0).setDepth(5);
    const t1=this.add.text(cx+4,H*0.70+4,'NEXUS ROYALE',{fontFamily:TITLE_FONT,fontSize:Math.min(46,W*0.088)+'px',fontStyle:'900',color:'#ff2ea6'}).setOrigin(0.5).setAlpha(0).setDepth(5);
    const t2=this.add.text(cx,H*0.70,'NEXUS ROYALE',{fontFamily:TITLE_FONT,fontSize:Math.min(46,W*0.088)+'px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5).setAlpha(0).setDepth(6).setShadow(0,0,'#0af',22);
    if(t2.setLetterSpacing) t2.setLetterSpacing(5);
    [t1,t2].forEach(t=>t.setScale(2.4));
    this.time.delayedCall(1500,()=>{
      SFX.resume(); SFX.tone(90,0.4,'sawtooth',0.18,45); SFX.noise(0.3,0.16,900);
      this.tweens.add({targets:[t1,t2],alpha:1,scale:1,duration:360,ease:'Back.out'});
      this.tweens.add({targets:glow,alpha:0.30,duration:420,yoyo:true,repeat:-1});
      this.cameras.main.shake(240,0.006);
      const line=this.add.rectangle(cx,H*0.70+30,Math.min(300,W*0.72),2,C.cyan,0.9).setDepth(6).setScale(0.02,1);
      this.tweens.add({targets:line,scaleX:1,duration:520,ease:'Quad.out'});
      const sub=this.add.text(cx,H*0.70+48,'INKANIMUS',{fontFamily:TITLE_FONT,fontSize:'12px',color:'#8a86c8',fontStyle:'800'}).setOrigin(0.5).setDepth(6).setAlpha(0);
      this.tweens.add({targets:sub,alpha:1,duration:600,delay:200});
    });

    this.time.delayedCall(2500,()=>{
      const tap=this.add.text(cx,H*0.90,'TOCCA PER INIZIARE',{fontFamily:TITLE_FONT,fontSize:'13px',color:'#c9c6ea',fontStyle:'900'}).setOrigin(0.5).setDepth(7).setAlpha(0);
      this.tweens.add({targets:tap,alpha:1,duration:400});
      this.tweens.add({targets:tap,alpha:0.35,duration:800,yoyo:true,repeat:-1,delay:400});
    });
    this.time.delayedCall(11000,done);
  }
  update(t,dt){
    const H=this.scale.height,W=this.scale.width;
    if(!this.rain) return;
    this.rain.forEach(r=>{ r.y+=r.sp*(dt/1000); if(r.y>H){ r.y=-30; r.x=Phaser.Math.Between(0,W); } });
  }
}

/* ============================ TUTORIAL ============================ */
class Tutorial extends Phaser.Scene{
  constructor(){ super('Tutorial'); }
  create(){
    const W=this.scale.width,H=this.scale.height,cx=W/2;
    this.add.rectangle(0,0,W,H,C.bg).setOrigin(0);
    this.add.image(cx,H/2,'vignette').setDisplaySize(W*1.5,H*1.5).setAlpha(0.7);
    for(let i=0;i<20;i++) this.add.rectangle(0,Phaser.Math.Between(0,H),W,1,Phaser.Utils.Array.GetRandom([C.cyan,C.magenta,C.purple]),0.05).setOrigin(0);
    this.slides=[
      {c:'#33e1ff',t:'NEXUS ROYALE',b:['100 operatori, un solo vincitore.','Sopravvivi, elimina i nemici e guadagni CREDITI','da spendere nei premi dello studio.']},
      {c:'#ffd23f',t:'IL LANCIO',b:['A inizio partita scegli DOVE atterrare','toccando la mappa.','Zone ricche = loot migliore ma più nemici.']},
      {c:'#35e06a',t:'MUOVI & SPARA',b:['Stick sinistro per muoverti.','Auto-aim spara da solo a chi vedi a schermo.','In mira manuale usi lo stick destro.']},
      {c:'#ff2ea6',t:'LOOT & ARMI',b:['Raccogli cure, scudi e armi.','Su un\u2019arma a terra appare PRENDI: tocca per equipaggiarla.','Le casse dorate (airdrop) hanno armi potenti.']},
      {c:'#a25bff',t:'ZONA & ABILIT\u00c0',b:['Resta dentro il cerchio: fuori perdi vita.','Ogni operatore ha un\u2019ABILIT\u00c0 unica,','usala col tasto in basso a destra.']},
    ];
    this.i=0; this.slideEls=[];
    const cardW=Math.min(360,W*0.88), cardH=Math.min(300,H*0.42), cardY=H*0.40;
    this.cardW=cardW; this.cardTop=cardY-cardH/2;
    cyberFrame(this,cx-cardW/2,cardY-cardH/2,cardW,cardH,C.cyan,0);
    this.add.rectangle(cx,cardY-cardH/2+2,cardW*0.55,2,C.magenta,0.8).setDepth(1);
    this.skip=this.add.text(W-12,26,'SALTA ›',{fontFamily:TITLE_FONT,fontSize:T.fXs,color:T.txt,fontStyle:'900',backgroundColor:'#0b0918',padding:{x:14,y:12}}).setOrigin(1,0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.finish());
    this.dots=this.add.text(cx,cardY+cardH/2+26,'',{fontSize:'18px',color:'#3a3470'}).setOrigin(0.5);
    this.nextBtn=this.add.rectangle(cx,H-54,Math.min(300,W*0.7),52,0x14102b).setStrokeStyle(3,C.player).setInteractive({useHandCursor:true}).on('pointerdown',()=>{ SFX.resume(); SFX.ui(); this.next(); });
    this.nextTxt=this.add.text(cx,H-54,'',{fontSize:'18px',color:'#33e1ff',fontStyle:'900'}).setOrigin(0.5);
    this.show(0);
  }
  show(i){ const W=this.scale.width,cx=W/2, top=this.cardTop;
    this.slideEls.forEach(o=>o.destroy()); this.slideEls=[];
    const s=this.slides[i];
    this.slideEls.push(this.add.image(cx,top+50,'glow').setTint(Phaser.Display.Color.HexStringToColor(s.c).color).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(this.cardW*0.9,150).setAlpha(0.16));
    const tt=this.add.text(cx,top+48,s.t,{fontFamily:TITLE_FONT,fontSize:Math.min(24,W*0.058)+'px',fontStyle:'900',color:s.c,align:'center',wordWrap:{width:this.cardW-30}}).setOrigin(0.5).setShadow(0,0,'#000',8);
    this.slideEls.push(tt);
    this.slideEls.push(this.add.text(cx,top+128,s.b.join(' '),{fontSize:'15px',color:'#c9c6ea',align:'center',wordWrap:{width:this.cardW-44},lineSpacing:6}).setOrigin(0.5,0));
    this.dots.setText(this.slides.map((_,k)=>k===i?'●':'○').join(' '));
    this.nextTxt.setText(i===this.slides.length-1?'▶  INIZIA':'AVANTI  ›');
  }
  next(){ if(this.i>=this.slides.length-1){ this.finish(); return; } this.i++; this.show(this.i); }
  finish(){ SEEN_TUTORIAL=true; this.scene.start('Menu'); }
}

/* ============================ MENU HELPERS ============================ */
function hexStr(c){ return '#'+(c>>>0).toString(16).padStart(6,'0').slice(-6); }
// cyberpunk frame: dark fill, neon border, clipped corners + corner ticks
function cyberFrame(sc,x,y,w,h,col,depth){
  const d=depth||0, g=sc.add.graphics().setDepth(d);
  const c=14; // corner cut
  g.fillStyle(0x0b0918,0.94);
  g.beginPath(); g.moveTo(x+c,y); g.lineTo(x+w-c,y); g.lineTo(x+w,y+c); g.lineTo(x+w,y+h-c);
  g.lineTo(x+w-c,y+h); g.lineTo(x+c,y+h); g.lineTo(x,y+h-c); g.lineTo(x,y+c); g.closePath(); g.fillPath();
  g.lineStyle(2,col,0.95); g.strokePath();
  g.lineStyle(1,col,0.25); g.strokeRect(x+5,y+5,w-10,h-10);
  g.fillStyle(col,0.035);
  for(let yy=y+8;yy<y+h-6;yy+=4) g.fillRect(x+6,yy,w-12,1);
  return g;
}
function cyberBtn(sc,x,y,w,h,col,label,sub,cb,depth){
  const d=depth||0;
  cyberFrame(sc,x-w/2,y-h/2,w,h,col,d);
  const gl=sc.add.image(x,y,'glow').setTint(col).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(w*1.15,h*2).setAlpha(0.10).setDepth(d);
  sc.tweens.add({targets:gl,alpha:0.22,duration:1300,yoyo:true,repeat:-1});
  const t=sc.add.text(x,sub?y-9:y,label,{fontFamily:TITLE_FONT,fontSize:(sub?15:17)+'px',fontStyle:'900',color:hexStr(col)}).setOrigin(0.5).setDepth(d+1);
  if(sub) sc.add.text(x,y+12,sub,{fontSize:'11px',color:'#8a86c8'}).setOrigin(0.5).setDepth(d+1);
  const hit=sc.add.rectangle(x,y,w,h,0xffffff,0.001).setDepth(d+2).setInteractive({useHandCursor:true});
  hit.on('pointerdown',()=>{ SFX.ui(); cb(); });
  return {hit,t,gl};
}
function menuBg(sc){ const W=sc.scale.width,H=sc.scale.height;
  sc.add.rectangle(0,0,W,H,C.bg).setOrigin(0);
  for(let i=0;i<14;i++){ const y=Phaser.Math.Between(0,H), col=Phaser.Utils.Array.GetRandom([C.cyan,C.magenta,C.purple]);
    const r=sc.add.rectangle(Phaser.Math.Between(0,W),y,Phaser.Math.Between(40,160),2,col,0.10).setOrigin(0);
    sc.tweens.add({targets:r,x:{from:-160,to:W},duration:Phaser.Math.Between(6000,12000),repeat:-1,delay:Phaser.Math.Between(0,6000)}); }
  sc.add.image(W/2,H/2,'vignette').setDisplaySize(W*1.5,H*1.5).setAlpha(0.7);
}
function menuTitle(sc,y){ const W=sc.scale.width,cx=W/2;
  const tG=sc.add.image(cx,y,'glow').setTint(C.magenta).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(560,190).setAlpha(0.20);
  sc.tweens.add({targets:tG,alpha:0.32,duration:1600,yoyo:true,repeat:-1});
  sc.add.text(cx+3,y+3,'NEXUS ROYALE',{fontFamily:TITLE_FONT,fontSize:Math.min(42,W*0.082)+'px',fontStyle:'900',color:'#ff2ea6'}).setOrigin(0.5).setAlpha(0.55);
  const t=sc.add.text(cx,y,'NEXUS ROYALE',{fontFamily:TITLE_FONT,fontSize:Math.min(42,W*0.082)+'px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5).setShadow(0,0,'#0af',18);
  if(t.setLetterSpacing) t.setLetterSpacing(4);
  sc.add.rectangle(cx,y+Math.min(34,W*0.066),Math.min(280,W*0.66),2,C.cyan,0.6);
}
function overlayPanel(sc,title,build){ const W=sc.scale.width,H=sc.scale.height,cx=W/2; const els=[];
  els.push(sc.add.rectangle(0,0,W,H,0x05040d,0.93).setOrigin(0).setDepth(400).setInteractive());
  const pw=Math.min(360,W*0.92), ph=H*0.62, py=H*0.44;
  els.push(cyberFrame(sc,cx-pw/2,py-ph/2,pw,ph,C.cyan,401));
  els.push(sc.add.text(cx,py-ph/2+26,title,{fontFamily:TITLE_FONT,fontSize:'17px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5).setDepth(402));
  els.push(sc.add.rectangle(cx,py-ph/2+44,pw*0.7,1,C.cyan,0.5).setDepth(402));
  const add=(o)=>{ o.setDepth(402); els.push(o); return o; };
  build(cx,py-ph/2+80,pw,add);
  const close=sc.add.rectangle(cx,py+ph/2-30,Math.min(200,W*0.6),44,0x14102b).setStrokeStyle(2,C.player).setDepth(402).setInteractive({useHandCursor:true});
  els.push(close); els.push(sc.add.text(cx,py+ph/2-30,'CHIUDI',{fontFamily:TITLE_FONT,fontSize:'14px',color:'#33e1ff',fontStyle:'900'}).setOrigin(0.5).setDepth(403));
  close.on('pointerdown',()=>{ SFX.ui(); els.forEach(o=>o.destroy()); });
}

/* ============================ HOME ============================ */
class Menu extends Phaser.Scene{
  constructor(){ super('Menu'); }
  create(){
    const W=this.scale.width,H=this.scale.height,cx=W/2;
    menuBg(this); menuTitle(this,H*0.13);
    if(!Profile.unlockedOp(GAME.char)) GAME.char='vyre';
    cyberFrame(this,cx-95,H*0.215-17,190,34,C.gold,0);
    this.credTxt=this.add.text(cx,H*0.215,'',{fontFamily:TITLE_FONT,fontSize:'14px',fontStyle:'900',color:'#ffd23f'}).setOrigin(0.5).setDepth(2);

    this.add.text(cx,H*0.30,'◤ MODALITÀ PARTITA ◢',{fontFamily:TITLE_FONT,fontSize:'11px',color:'#8a86c8',fontStyle:'900'}).setOrigin(0.5);
    const mt=[{k:'royale',t:'ROYALE',s:'100 · lungo'},{k:'blitz',t:'BLITZ',s:'30 · veloce'}];
    this.mtBtns=[]; mt.forEach((m,i)=>{ const bw=Math.min(162,W*0.42), x=cx+(i===0?-1:1)*(bw/2+6), y=H*0.35;
      const f=cyberFrame(this,x-bw/2,y-26,bw,52,0x2a2550,0);
      this.add.text(x,y-9,m.t,{fontFamily:TITLE_FONT,fontSize:'15px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0.5).setDepth(2);
      this.add.text(x,y+12,m.s,{fontSize:'11px',color:'#8a86c8'}).setOrigin(0.5).setDepth(2);
      const hit=this.add.rectangle(x,y,bw,52,0xffffff,0.001).setDepth(3).setInteractive({useHandCursor:true});
      hit.on('pointerdown',()=>{ SFX.ui(); GAME.match=m.k; this.scene.restart(); });
      this.mtBtns.push({f,k:m.k,x,y,bw}); });
    // highlight selected match mode
    this.mtBtns.forEach(b=>{ if(GAME.match===b.k) cyberFrame(this,b.x-b.bw/2,b.y-26,b.bw,52,C.cyan,1); });

    this.add.text(cx,H*0.47,'◤ SCEGLI LA MIRA ◢',{fontFamily:TITLE_FONT,fontSize:'11px',color:'#8a86c8',fontStyle:'900'}).setOrigin(0.5);
    const md=[{k:'auto',t:'AUTO-AIM',s:'assistita · punti ×1.0',col:C.green},{k:'manual',t:'MIRA MANUALE',s:'skill · punti ×1.5',col:C.gold}];
    md.forEach((m,i)=>{ const y=H*0.53+i*78, bw=Math.min(340,W*0.88);
      cyberFrame(this,cx-bw/2,y-33,bw,66,m.col,0);
      this.add.text(cx-bw/2+20,y-11,m.t,{fontFamily:TITLE_FONT,fontSize:'16px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0,0.5).setDepth(2);
      this.add.text(cx-bw/2+20,y+13,m.s,{fontSize:'11px',color:'#8a86c8'}).setOrigin(0,0.5).setDepth(2);
      this.add.text(cx+bw/2-20,y,'›',{fontFamily:TITLE_FONT,fontSize:'26px',color:hexStr(m.col),fontStyle:'900'}).setOrigin(1,0.5).setDepth(2);
      const hit=this.add.rectangle(cx,y,bw,66,0xffffff,0.001).setDepth(3).setInteractive({useHandCursor:true});
      hit.on('pointerdown',()=>{ SFX.resume(); SFX.ui(); GAME.mode=m.k; this.scene.start('Loadout'); });
    });

    const bb=(x,y,label,cb)=>this.add.text(x,y,label,{fontFamily:TITLE_FONT,fontSize:T.fXs,color:T.txt,fontStyle:'900',backgroundColor:'#0b0918',padding:{x:14,y:14}}).setOrigin(0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>{ SFX.ui(); cb(); });
    bb(cx-Math.min(78,W*0.2),H*0.845,'◈ SFIDE',()=>this.openChallenges());
    bb(cx+Math.min(78,W*0.2),H*0.845,'PROFILO',()=>this.openProfile());
    bb(cx,H*0.905,'◆ INVIA CREDITI A INKANIMUS',()=>this.openTransfer());
    bb(cx-Math.min(78,W*0.2),H*0.96,'⚙ OPZIONI',()=>this.openSettings());
    bb(cx+Math.min(78,W*0.2),H*0.96,'? GUIDA',()=>this.scene.start('Tutorial'));
    this.refresh();
  }
  refresh(){ this.credTxt.setText('◆ '+Profile.data.credits+' CREDITI'); }
  openChallenges(){ overlayPanel(this,'SFIDE GIORNALIERE',(cx,y,W,add)=>{
    Profile.data.daily.list.forEach((c,i)=>{ const yy=y+i*58;
      add(this.add.text(cx-W*0.4,yy-10,c.t,{fontSize:'14px',color:c.done?'#35e06a':'#e8e6ff',fontStyle:'800'}).setOrigin(0,0.5));
      add(this.add.text(cx+W*0.4,yy-10,(c.done?'✓ ':'')+'+'+c.reward+'◆',{fontSize:'13px',color:'#ffd23f',fontStyle:'800'}).setOrigin(1,0.5));
      const bw=W*0.8; add(this.add.rectangle(cx-bw/2,yy+12,bw,8,0x1a1533).setOrigin(0,0.5));
      add(this.add.rectangle(cx-bw/2,yy+12,Math.max(1,bw*Phaser.Math.Clamp(c.prog/c.goal,0,1)),8,c.done?C.green:C.cyan).setOrigin(0,0.5));
      add(this.add.text(cx,yy+12,Math.min(c.prog,c.goal)+' / '+c.goal,{fontSize:'9px',color:'#c9c6ea',fontStyle:'800'}).setOrigin(0.5));
    });
  }); }
  openProfile(){ overlayPanel(this,'PROFILO',(cx,y,W,add)=>{ const d=Profile.data;
    const fmt=t=>{ const m=Math.floor(t/60), sec=t%60; return m?(m+'m '+sec+'s'):(sec+'s'); };
    const favOp=(()=>{ const o=d.ops||{}; let b=null,n=0; Object.keys(o).forEach(k=>{ if(o[k]>n){n=o[k];b=k;} }); return b?OP(b).name:'—'; })();
    const avgPl=d.matches? (d.placeSum/d.matches).toFixed(1):'—';
    const kd=d.matches? (d.kills/d.matches).toFixed(1):'0';
    const rows=[
      ['Partite giocate',d.matches],
      ['Vittorie',d.wins+(d.matches?'  ('+Math.round(d.wins/d.matches*100)+'%)':'')],
      ['Serie vittorie record',d.bestStreak||0],
      ['Eliminazioni totali',d.kills],
      ['Record kill in partita',d.bestKills||0],
      ['Media kill/partita',kd],
      ['Danni totali',(d.totalDmg||0).toLocaleString('it')],
      ['Record danni in partita',(d.maxDmg||0).toLocaleString('it')],
      ['Miglior piazzamento',d.best>=99?'—':'#'+d.best],
      ['Piazzamento medio',avgPl==='—'?'—':'#'+avgPl],
      ['Partita più lunga',fmt(d.bestTime||0)],
      ['Tempo totale in gioco',fmt(d.totalTime||0)],
      ['Punteggio record',(d.topScore||0).toLocaleString('it')],
      ['Operatore preferito',favOp],
      ['Crediti disponibili','◆ '+d.credits],
      ['Crediti totali guadagnati','◆ '+(d.lifetime||0)],
      ['Crediti trasferiti','◆ '+(d.transferred||0)],
    ];
    rows.forEach((r,i)=>{ const yy=y+i*22;
      add(this.add.text(cx-W*0.42,yy,r[0],{fontSize:'11px',color:'#a8a4d0'}).setOrigin(0,0.5));
      add(this.add.text(cx+W*0.42,yy,''+r[1],{fontFamily:TITLE_FONT,fontSize:'11px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(1,0.5)); });
  }); }

  openTransfer(){ overlayPanel(this,'INVIA A INKANIMUS',(cx,y,W,add)=>{
    let amt=Math.min(100,Profile.data.credits);
    add(this.add.text(cx,y-6,'Scegli quanti crediti spostare\nnel tuo profilo InkAnimus.',{fontSize:'11px',color:'#c9c6ea',align:'center',lineSpacing:3}).setOrigin(0.5));
    const amtTxt=add(this.add.text(cx,y+40,'',{fontFamily:TITLE_FONT,fontSize:'26px',color:'#ffd23f',fontStyle:'900'}).setOrigin(0.5));
    const avail=add(this.add.text(cx,y+66,'',{fontSize:'10px',color:'#8a86c8'}).setOrigin(0.5));
    const refresh=()=>{ amtTxt.setText('◆ '+amt); avail.setText('disponibili: '+Profile.data.credits); };
    const chips=[['-100',-100],['-10',-10],['+10',10],['+100',100]];
    chips.forEach((c,i)=>{ const bw=W*0.20, x=cx+(i-1.5)*(bw+6), yy=y+104;
      const b=add(this.add.rectangle(x,yy,bw,T.tap,0x0d0b1c).setStrokeStyle(2,C.cyan).setInteractive({useHandCursor:true}));
      add(this.add.text(x,yy,c[0],{fontFamily:TITLE_FONT,fontSize:'11px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0.5));
      b.on('pointerdown',()=>{ SFX.ui(); amt=Phaser.Math.Clamp(amt+c[1],0,Profile.data.credits); refresh(); }); });
    const allB=add(this.add.rectangle(cx,y+152,W*0.5,T.tap,0x0d0b1c).setStrokeStyle(2,C.gold).setInteractive({useHandCursor:true}));
    add(this.add.text(cx,y+152,'TUTTI I CREDITI',{fontFamily:TITLE_FONT,fontSize:'11px',color:'#ffd23f',fontStyle:'900'}).setOrigin(0.5));
    allB.on('pointerdown',()=>{ SFX.ui(); amt=Profile.data.credits; refresh(); });

    const out=add(this.add.text(cx,y+232,'',{fontSize:'9px',color:'#ffd23f',fontFamily:'monospace',align:'center',wordWrap:{width:W*0.84},backgroundColor:'#0b0918',padding:{x:8,y:6}}).setOrigin(0.5).setVisible(false));
    const genB=add(this.add.rectangle(cx,y+196,W*0.72,T.tap+4,0x14102b).setStrokeStyle(3,C.player).setInteractive({useHandCursor:true}));
    const genT=add(this.add.text(cx,y+196,'GENERA CODICE',{fontFamily:TITLE_FONT,fontSize:'13px',color:'#33e1ff',fontStyle:'900'}).setOrigin(0.5));
    genB.on('pointerdown',()=>{
      if(amt<=0||amt>Profile.data.credits){ SFX.ui(); return; }
      const code=makeTransferCode(amt);
      if(!code){ SFX.ui(); return; }
      SFX.pickup(); out.setText(code).setVisible(true);
      genT.setText('COPIA IL CODICE ↓'); refresh();
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(code).catch(()=>{}); }
    });
    out.setInteractive({useHandCursor:true}).on('pointerdown',()=>{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(out.text).catch(()=>{}); });
    refresh();
  }); }

  openSettings(){ overlayPanel(this,'OPZIONI',(cx,y,W,add)=>{
    add(this.add.text(cx,y,'EFFETTI GRAFICI',{fontFamily:TITLE_FONT,fontSize:'12px',color:'#8a86c8',fontStyle:'900'}).setOrigin(0.5));
    add(this.add.text(cx,y+18,'i giocatori restano sempre 100',{fontSize:'10px',color:'#8a86c8'}).setOrigin(0.5));
    const qs=[['low','BASSI','max fluidità'],['med','MEDI','bilanciato'],['high','ALTI','massima resa']], btns=[];
    qs.forEach((q,i)=>{ const bw=W*0.27, x=cx+(i-1)*(bw+4), yy=y+62;
      const box=add(this.add.rectangle(x,yy,bw,58,0x0d0b1c).setStrokeStyle(3,GAME.quality===q[0]?C.cyan:0x2a2550).setInteractive({useHandCursor:true}));
      add(this.add.text(x,yy-10,q[1],{fontFamily:TITLE_FONT,fontSize:'12px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0.5));
      add(this.add.text(x,yy+12,q[2],{fontSize:'10px',color:'#a8a4d0'}).setOrigin(0.5));
      box.on('pointerdown',()=>{ SFX.ui(); GAME.quality=q[0]; try{localStorage.setItem('nexusQuality',q[0]);}catch(e){}
        btns.forEach((b,j)=>b.setStrokeStyle(3,qs[j][0]===GAME.quality?C.cyan:0x2a2550)); });
      btns.push(box); });
    add(this.add.text(cx,y+118,'Se il ROYALE a 100 giocatori scatta, scegli EFFETTI BASSI:\nvengono ridotte particelle, bagliori e scosse camera.',
      {fontSize:'11px',color:'#c9c6ea',align:'center',wordWrap:{width:W*0.84},lineSpacing:3}).setOrigin(0.5));
    // --- minimap opacity slider ---
    add(this.add.text(cx,y+150,'OPACITÀ MINIMAPPA',{fontFamily:TITLE_FONT,fontSize:'11px',color:'#8a86c8',fontStyle:'900'}).setOrigin(0.5));
    const sw=W*0.62, sx=cx-sw/2, sy=y+180;
    add(this.add.rectangle(sx,sy,sw,6,0x1a1533).setOrigin(0,0.5));
    const fill=add(this.add.rectangle(sx,sy,sw*GAME.mmAlpha,6,C.cyan).setOrigin(0,0.5));
    const knob=add(this.add.circle(sx+sw*GAME.mmAlpha,sy,11,0x0b0918).setStrokeStyle(3,C.cyan));
    const pct=add(this.add.text(cx,sy+22,Math.round(GAME.mmAlpha*100)+'%',{fontFamily:TITLE_FONT,fontSize:'11px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0.5));
    const track=add(this.add.rectangle(cx,sy,sw+40,T.tap,0xffffff,0.001).setInteractive({useHandCursor:true,draggable:true}));
    const setA=(px)=>{ const f=Phaser.Math.Clamp((px-sx)/sw,0.15,1);
      GAME.mmAlpha=f; fill.width=sw*f; knob.x=sx+sw*f; pct.setText(Math.round(f*100)+'%');
      try{ localStorage.setItem('nexusMmAlpha',String(f)); }catch(e){} };
    track.on('pointerdown',p=>setA(p.x)); track.on('drag',(p)=>setA(p.x));

    const aBox=add(this.add.rectangle(cx,y+228,W*0.5,T.tap,0x14102b).setStrokeStyle(2,C.player).setInteractive({useHandCursor:true}));
    const aTxt=add(this.add.text(cx,y+228,SFX.on?'AUDIO: ON':'AUDIO: OFF',{fontFamily:TITLE_FONT,fontSize:'12px',color:'#33e1ff',fontStyle:'900'}).setOrigin(0.5));
    aBox.on('pointerdown',()=>{ const on=SFX.toggle(); aTxt.setText(on?'AUDIO: ON':'AUDIO: OFF'); });
  }); }
}

/* ============================ LOADOUT ============================ */
class Loadout extends Phaser.Scene{
  constructor(){ super('Loadout'); }
  create(){
    const W=this.scale.width,H=this.scale.height,cx=W/2;
    menuBg(this);
    this.add.text(16,26,'‹ INDIETRO',{fontSize:'14px',color:'#8a86c8',fontStyle:'800'}).setOrigin(0,0.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>{ SFX.ui(); this.scene.start('Menu'); });
    this.add.text(W-16,26,'◆ '+Profile.data.credits,{fontSize:'14px',color:'#ffd23f',fontStyle:'900'}).setOrigin(1,0.5);
    this.add.text(cx,H*0.075,'SCEGLI OPERATORE',{fontSize:'18px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5);

    this.opRows=[]; const rh=H*0.083, ry0=H*0.135, bw=Math.min(360,W*0.9);
    const PORT={vyre:'port_vyre',nova:'port_nova',oracle:'port_oracle',aegis:'port_aegis',wraith:'port_wraith'};
    OPERATORS.forEach((o,i)=>{ const y=ry0+i*rh;
      const box=cyberFrame(this,cx-bw/2,y-(rh-8)/2,bw,rh-8,0x2a2550,0);
      const dot=this.add.circle(cx-bw/2+26,y,17,0x0b0918).setStrokeStyle(2,o.col,0.9).setDepth(2);
      const pk=PORT[o.id];
      if(this.textures.exists(pk)) this.add.image(cx-bw/2+26,y,pk).setDisplaySize(26,42).setDepth(2);
      this.add.text(cx-bw/2+56,y-9,o.name,{fontFamily:TITLE_FONT,fontSize:'14px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0,0.5).setDepth(2);
      this.add.text(cx-bw/2+56,y+11,o.icon+' '+o.abName,{fontSize:'12px',color:'#8a86c8'}).setOrigin(0,0.5).setDepth(2);
      const right=this.add.text(cx+bw/2-16,y,'',{fontFamily:TITLE_FONT,fontSize:'12px',fontStyle:'900'}).setOrigin(1,0.5).setDepth(2);
      const sel=this.add.graphics().setDepth(1);
      const hit=this.add.rectangle(cx,y,bw,rh-8,0xffffff,0.001).setDepth(3).setInteractive({useHandCursor:true});
      hit.on('pointerdown',()=>{ SFX.ui(); GAME.char=o.id; this.refresh(); });
      this.opRows.push({box,dot,right,o,sel,y,bw,rh}); });

    this.descTxt=this.add.text(cx,H*0.585,'',{fontSize:'12px',color:'#a8a4d0',align:'center',wordWrap:{width:W*0.86}}).setOrigin(0.5);
    this.preview=this.add.image(cx-W*0.36,H*0.585,'ch_vyre_0').setScale(1.5).setAngle(-90);
    this.previewF=0;
    this.time.addEvent({delay:130,loop:true,callback:()=>{ this.previewF=(this.previewF+1)%4; const k='ch_'+GAME.char+'_'+(1+this.previewF); if(this.textures.exists(k)) this.preview.setTexture(k); }});
    this.unlockBtn=this.add.rectangle(cx,H*0.635,Math.min(240,W*0.7),34,0x241a00).setStrokeStyle(2,C.gold).setInteractive({useHandCursor:true}).setVisible(false);
    this.unlockTxt=this.add.text(cx,H*0.635,'',{fontSize:'13px',fontStyle:'900',color:'#ffd23f'}).setOrigin(0.5).setVisible(false);
    this.unlockBtn.on('pointerdown',()=>{ const o=OP(GAME.char); if(Profile.unlock(o.id,o.cost)) SFX.pickup(); else { SFX.ui(); this.flash('SERVONO '+o.cost+' CREDITI'); } this.refresh(); });

    this.add.text(cx,H*0.685,'SKIN',{fontSize:'12px',color:'#8a86c8',fontStyle:'800'}).setOrigin(0.5);
    this.skinBtns=[]; const sg=Math.min(84,W*0.22), sx0=cx-(SKINS.length-1)*sg/2;
    SKINS.forEach((s,i)=>{ const x=sx0+i*sg, y=H*0.725;
      const box=this.add.rectangle(x,y,sg-8,T.tap+4,0x0d0b1c).setStrokeStyle(3,0x2a2550).setInteractive({useHandCursor:true});
      this.add.text(x,y-8,s.name,{fontFamily:TITLE_FONT,fontSize:'9px',color:'#e8e6ff',fontStyle:'900'}).setOrigin(0.5);
      const sub=this.add.text(x,y+11,'',{fontSize:'10px',color:'#a8a4d0'}).setOrigin(0.5);
      box.on('pointerdown',()=>{ SFX.ui(); if(Profile.unlockedSkin(s.id)) GAME.skin=s.id; else if(Profile.unlockSkin(s.id,s.cost)){ GAME.skin=s.id; SFX.pickup(); } else this.flash('SERVONO '+s.cost+' CREDITI'); this.refresh(); });
      this.skinBtns.push({box,sub,s}); });

    const ry=H*0.80; this.add.text(cx,ry-14,STUDIO_REWARD.name,{fontSize:'10px',color:'#8a86c8',fontStyle:'800'}).setOrigin(0.5);
    const rbw=Math.min(300,W*0.78); this.add.rectangle(cx,ry+2,rbw,10,0x1a1533).setStrokeStyle(1,0x2a2550);
    this.rewardFill=this.add.rectangle(cx-rbw/2,ry+2,1,10,C.gold).setOrigin(0,0.5); this.rewardBw=rbw;

    const start=this.add.rectangle(cx,H*0.90,Math.min(320,W*0.84),54,0x14102b).setStrokeStyle(3,C.player);
    const sgl=this.add.image(cx,H*0.90,'glow').setTint(C.cyan).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(360,110).setAlpha(0.12);
    this.tweens.add({targets:sgl,alpha:0.24,duration:1200,yoyo:true,repeat:-1});
    this.startTxt=this.add.text(cx,H*0.90,'',{fontSize:'19px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5); this.startBox=start;
    start.setInteractive({useHandCursor:true}).on('pointerdown',()=>{ if(!Profile.unlockedOp(GAME.char)){ SFX.ui(); this.flash('OPERATORE BLOCCATO'); return; } SFX.resume(); SFX.ui(); this.scene.start('Game'); });
    this.flashTxt=this.add.text(cx,H*0.855,'',{fontSize:'12px',fontStyle:'900',color:'#ff6b8a'}).setOrigin(0.5).setAlpha(0);
    this.refresh();
  }
  flash(m){ this.flashTxt.setText(m).setAlpha(1); this.tweens.add({targets:this.flashTxt,alpha:0,duration:1400}); }
  refresh(){ const sel=OP(GAME.char), unlocked=Profile.unlockedOp(sel.id);
    this.opRows.forEach(r=>{ const u=Profile.unlockedOp(r.o.id);
      r.sel.clear();
      if(GAME.char===r.o.id){ const cx2=this.scale.width/2;
        r.sel.lineStyle(2,r.o.col,1); r.sel.strokeRect(cx2-r.bw/2+2,r.y-(r.rh-8)/2+2,r.bw-4,r.rh-12);
        r.sel.fillStyle(r.o.col,0.07); r.sel.fillRect(cx2-r.bw/2+2,r.y-(r.rh-8)/2+2,r.bw-4,r.rh-12); }
      r.dot.setStrokeStyle(2,u?r.o.col:0x33314f,0.9); r.right.setText(u?'✓':(r.o.cost+' ◆')).setColor(u?'#35e06a':'#ffd23f'); });
    this.descTxt.setText(sel.desc);
    if(!unlocked){ this.unlockBtn.setVisible(true); this.unlockTxt.setVisible(true).setText('SBLOCCA · '+sel.cost+' ◆'); } else { this.unlockBtn.setVisible(false); this.unlockTxt.setVisible(false); }
    this.skinBtns.forEach(b=>{ const u=Profile.unlockedSkin(b.s.id); b.box.setStrokeStyle(3,GAME.skin===b.s.id?C.cyan:0x2a2550);
      b.sub.setText(u?(GAME.skin===b.s.id?'attiva':'ok'):(b.s.cost+'◆')).setColor(u?'#8a86c8':'#ffd23f'); });
    if(this.preview) this.preview.setTint(SKIN(GAME.skin).tint);
    this.startTxt.setText(unlocked?'▶  ENTRA IN PARTITA':'🔒  BLOCCATO').setColor(unlocked?'#33e1ff':'#8a86c8'); this.startBox.setStrokeStyle(3,unlocked?C.player:0x3a3470);
    this.rewardFill.width=Math.max(1,this.rewardBw*Phaser.Math.Clamp(Profile.data.credits/STUDIO_REWARD.cost,0,1));
  }
}

/* ============================ GAME ============================ */
class Game extends Phaser.Scene{
  constructor(){ super('Game'); }
  create(){
    this.cfg=matchCfg(); WORLD_W=this.cfg.w; WORLD_H=this.cfg.h;
    TOTAL_PLAYERS=this.cfg.total; this.FX=fxq(); this.fx=this.FX.glow;
    this.over=false; this.startTime=this.time.now; this.kills=0; this.damageDealt=0;
    this.physics.world.setBounds(0,0,WORLD_W,WORLD_H);

    // floor + district tints + roads
    this.GC=11; this.GR=8; // city grid (shared by roads + buildings)
    this.add.tileSprite(0,0,WORLD_W,WORLD_H,'asphalt').setOrigin(0).setDepth(-20);
    if(this.FX.glow){ const dg=this.add.graphics().setDepth(-19);
      DISTRICTS.forEach(d=>{ dg.fillStyle(d.c,0.035); dg.fillEllipse(d.x*WORLD_W,d.y*WORLD_H,1400,1100); }); }
    this.gDecor=this.add.graphics().setDepth(-16);   // street clutter (static)
    this.gCity =this.add.graphics().setDepth(0);     // buildings + props (static)
    this.animCount=0;                                 // budget for infinite tweens
    this.drawRoads();

    this.walls=this.physics.add.staticGroup(); this.wallRects=[];
    this.bullets=this.physics.add.group(); this.loot=this.physics.add.group({allowGravity:false});
    this.units=[];
    this.buildCity();
    this.buildMinimapTexture();
    this.spawnLoot(this.cfg.loot);
    this.dash=null; this.dome=null;
    this.markGfx=this.add.graphics().setDepth(40);

    this.player=this.spawnUnit(true);
    for(let i=0;i<TOTAL_PLAYERS-1;i++) this.spawnUnit(false);
    this.aliveCount=TOTAL_PLAYERS;

    // player halo
    this.halo=this.add.image(0,0,'glow').setTint(OP(GAME.char).col).setAlpha(0.4).setDepth(3).setDisplaySize(90,90).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({targets:this.halo,alpha:0.18,duration:900,yoyo:true,repeat:-1});

    this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H);
    this.cameras.main.startFollow(this.player.s,true,0.12,0.12);
    this.cameras.main.setBackgroundColor(C.bg);

    this.physics.add.overlap(this.bullets,this.walls,(b,w)=>this.onBulletWall(b,w));
    this.physics.add.overlap(this.player.s,this.loot,(s,l)=>this.pickup(this.player,l));

    // vignette (screen space)
    this.vig=this.add.image(0,0,'vignette').setScrollFactor(0).setDepth(120).setOrigin(0.5);
    this.vig.setPosition(this.scale.width/2,this.scale.height/2).setDisplaySize(this.scale.width*1.5,this.scale.height*1.5);
    this.redvig=this.add.image(this.scale.width/2,this.scale.height/2,'redvig').setScrollFactor(0).setDepth(125).setOrigin(0.5).setDisplaySize(this.scale.width*1.5,this.scale.height*1.5).setAlpha(0);

    this._wprompt=null; this.landMarker=null; this.markerRing=null;
    this.initZone();
    this.setupInput();
    this.buildHUD();
    this.setupCameras();
    this.zoneRot=0;
    this.phase='deploy'; this.launched=false;
    this.time.addEvent({delay:500,loop:true,callback:()=>this.zoneTick()});
    this.enterDeploy();
  }

  /* ------------- deploy / drop phase ------------- */
  enterDeploy(){
    this.landMarker=null; this.markerRing=null;
    this.units.forEach(u=>{ u.landing={x:u.s.x,y:u.s.y}; u.invuln=true;
      u.s.setVisible(false); if(u.s.body) u.s.body.enable=false; if(u.gun) u.gun.setVisible(false); });
    this.player.landing=null; this.halo.setVisible(false); this.setHUD(false);

    const cam=this.cameras.main; cam.stopFollow(); this.tweens.killTweensOf(cam); cam.setZoom(1); cam.centerOn(WORLD_W/2,WORLD_H/2);

    const W=this.scale.width,H=this.scale.height;
    this.dUI=[];
    // backdrop hides the world behind a clean deploy screen
    this.dUI.push(this.add.rectangle(0,0,W,H,C.bg,1).setOrigin(0).setScrollFactor(0).setDepth(56));
    this.dUI.push(this.add.image(W/2,H/2,'vignette').setScrollFactor(0).setDepth(56).setDisplaySize(W*1.6,H*1.6).setAlpha(0.6));
    this.dUI.push(this.add.text(W/2,42,'SCEGLI DOVE ATTERRARE',{fontSize:Math.min(23,W*0.056)+'px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5).setScrollFactor(0).setDepth(62).setShadow(0,0,'#ff2ea6',14));
    this.dUI.push(this.add.text(W/2,70,'tocca la mappa per scegliere la zona',{fontSize:'12px',color:'#8a86c8'}).setOrigin(0.5).setScrollFactor(0).setDepth(62));

    // map panel: fit world aspect into the available screen area
    const topY=92, botY=H-118, pad=14;
    let pw=W-2*pad, ph=pw*(WORLD_H/WORLD_W); const availH=botY-topY;
    if(ph>availH){ ph=availH; pw=ph*(WORLD_W/WORLD_H); }
    const px=(W-pw)/2, py=topY+(availH-ph)/2;
    this.dmap={x:px,y:py,w:pw,h:ph};
    this.drawDeployMap();

    // dropship crossing the panel
    this.ship=this.add.image(px-40,py+ph*0.3,'ship').setScrollFactor(0).setDepth(61).setBlendMode(Phaser.BlendModes.ADD).setScale(0.7);
    this.dUI.push(this.ship);
    this.deploySecs=this.cfg.deploy;
    this.tweens.add({targets:this.ship,x:px+pw+40,y:py+ph*0.7,duration:this.deploySecs*1000,ease:'Linear'});

    this.countTxt=this.add.text(W/2,H-92,'',{fontSize:'13px',color:'#ff8ac0',fontStyle:'800'}).setOrigin(0.5).setScrollFactor(0).setDepth(62);
    this.dUI.push(this.countTxt);
    this.launchBtn=this.add.rectangle(W/2,H-52,Math.min(300,W*0.8),50,0x14102b).setStrokeStyle(3,C.gold).setScrollFactor(0).setDepth(62).setInteractive({useHandCursor:true}).setVisible(false);
    this.launchTxt=this.add.text(W/2,H-52,'▼  LANCIATI QUI',{fontSize:'18px',color:'#ffd23f',fontStyle:'900'}).setOrigin(0.5).setScrollFactor(0).setDepth(63).setVisible(false);
    this.launchBtn.on('pointerdown',()=>this.startDescent());
    this.dUI.push(this.launchBtn,this.launchTxt);
    this.deployTimer=this.time.addEvent({delay:1000,repeat:this.deploySecs,callback:()=>{
      this.deploySecs--; this.countTxt.setText('lancio automatico in '+this.deploySecs+'s');
      if(this.deploySecs<=0&&!this.launched) this.startDescent(); }});
    this.countTxt.setText('lancio automatico in '+this.deploySecs+'s');
  }

  drawDeployMap(){
    const {x,y,w,h}=this.dmap, sx=w/WORLD_W, sy=h/WORLD_H;
    const g=this.add.graphics().setScrollFactor(0).setDepth(58); this.dUI.push(g);
    g.fillStyle(0x0a0818,1); g.fillRect(x,y,w,h);
    DISTRICTS.forEach(d=>{ g.fillStyle(d.c,0.13); g.fillCircle(x+d.x*w,y+d.y*h,Math.min(w,h)*0.10); });
    this.wallRects.forEach(r=>{ if(r.type==='border') return;
      if(r.type==='water'){ g.fillStyle(C.water,0.95); g.fillRect(x+r.x*sx,y+r.y*sy,Math.max(1,r.w*sx),Math.max(1,r.h*sy)); }
      else if(r.type==='cover'){ g.fillStyle(r.dc,0.28); g.fillRect(x+r.x*sx,y+r.y*sy,Math.max(1,r.w*sx),Math.max(1,r.h*sy)); }
      else { g.fillStyle(r.dc,0.30); g.fillRect(x+r.x*sx,y+r.y*sy,Math.max(2,r.w*sx),Math.max(2,r.h*sy));
        g.lineStyle(1.5,r.dc,0.95); g.strokeRect(x+r.x*sx,y+r.y*sy,Math.max(2,r.w*sx),Math.max(2,r.h*sy)); } });
    g.lineStyle(2,C.cyan,0.85); g.strokeRect(x,y,w,h);
    // corner ticks
    g.lineStyle(3,C.cyan,1); const t=14;
    [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(c=>{ g.beginPath(); g.moveTo(c[0],c[1]+c[3]*t); g.lineTo(c[0],c[1]); g.lineTo(c[0]+c[2]*t,c[1]); g.strokePath(); });
    DISTRICTS.forEach(d=>{ const col='#'+(d.c>>>0).toString(16).padStart(6,'0').slice(-6);
      const tx=this.add.text(x+d.x*w,y+d.y*h,d.n,{fontSize:Math.max(8,Math.min(13,w*0.028))+'px',fontStyle:'900',color:col}).setOrigin(0.5).setScrollFactor(0).setDepth(59).setShadow(0,0,'#000',4);
      this.dUI.push(tx); });
  }

  pickLanding(sx,sy){
    if(this.phase!=='deploy'||!this.dmap) return;
    const m=this.dmap; if(sx<m.x||sx>m.x+m.w||sy<m.y||sy>m.y+m.h) return;
    const wx=(sx-m.x)/m.w*WORLD_W, wy=(sy-m.y)/m.h*WORLD_H;
    const sp=this.freeSpotNear(wx,wy); this.player.landing=sp;
    const mx=m.x+sp.x/WORLD_W*m.w, my=m.y+sp.y/WORLD_H*m.h;
    if(!this.landMarker){
      this.landMarker=this.add.image(mx,my,'glow').setScrollFactor(0).setTint(C.gold).setBlendMode(Phaser.BlendModes.ADD).setDepth(60).setDisplaySize(64,64);
      this.tweens.add({targets:this.landMarker,scale:{from:0.8,to:1.2},alpha:{from:0.85,to:0.4},duration:600,yoyo:true,repeat:-1});
      this.markerRing=this.add.circle(mx,my,16,0,0).setScrollFactor(0).setStrokeStyle(3,C.gold,1).setDepth(60);
    } else { this.landMarker.setPosition(mx,my); this.markerRing.setPosition(mx,my); }
    this.launchBtn.setVisible(true); this.launchTxt.setVisible(true);
  }

  startDescent(){
    if(this.launched) return; this.launched=true; this.phase='descent';
    if(this.deployTimer) this.deployTimer.remove();
    if(!this.player.landing) this.player.landing=this.freeSpot(Phaser.Utils.Array.GetRandom(DISTRICTS));
    // clean deploy visuals
    this.dUI.forEach(o=>o.destroy()); if(this.ship) this.ship.destroy();
    if(this.landMarker){ this.landMarker.destroy(); this.markerRing.destroy(); this.landMarker=null; this.markerRing=null; }

    const DROP=760;
    this.cameras.main.startFollow(this.player.s,true,0.12,0.12);
    this.tweens.add({targets:this.cameras.main,zoom:LIVE_ZOOM,duration:900,ease:'Sine.inOut'});

    this.units.forEach(u=>{ const L=u.landing;
      u.s.setVisible(true).setPosition(L.x,L.y-DROP).setScale(0.4);
      // target ring
      const ring=this.add.circle(L.x,L.y,26,0,0).setStrokeStyle(3,u.isPlayer?C.player:0x5a5a88,0.8).setDepth(4); if(this.toWorld) this.toWorld(ring);
      this.tweens.add({targets:ring,alpha:0,scale:1.4,duration:1200,onComplete:()=>ring.destroy()});
      // parachute
      const chute=this.add.image(L.x,L.y-DROP-30,'chute').setDepth(9).setTint(u.isPlayer?C.player:C.enemy); if(this.toWorld) this.toWorld(chute);
      const dur=1050+Phaser.Math.Between(-120,220);
      this.tweens.add({targets:chute,y:L.y-34,duration:dur,ease:'Sine.in'});
      this.tweens.add({targets:chute,alpha:0,duration:200,delay:dur-160,onComplete:()=>chute.destroy()});
      this.tweens.add({targets:u.s,y:L.y,scale:1,duration:dur,ease:'Sine.in',
        onComplete:()=>{ if(u.s.body){ u.s.body.enable=true; u.s.body.reset(L.x,L.y); }
          if(u.isPlayer) this.goLive(); }});
    });
  }

  goLive(){
    this.phase='live';
    this.units.forEach(u=>{ u.invuln=false; if(u.gun) u.gun.setVisible(true);
      if(u.s.body && !u.s.body.enable){ u.s.body.enable=true; u.s.body.reset(u.landing.x,u.landing.y); } });
    this.halo.setVisible(true); this.setHUD(true);
    this.zone.timer=this.cfg.first; this.toast('ZONA ATTIVA',C.zone); this.setPlayerZoom(); SFX.music(true);
  }

  setHUD(v){ if(this.hudEls) this.hudEls.forEach(o=>o.setVisible(v)); }

  // ---- sci-fi HUD primitives ----
  hudPanel(g,x,y,w,h,col,fillA){
    const c=10;
    g.fillStyle(0x061018,fillA===undefined?0.55:fillA);
    g.beginPath(); g.moveTo(x+c,y); g.lineTo(x+w-c,y); g.lineTo(x+w,y+c); g.lineTo(x+w,y+h-c);
    g.lineTo(x+w-c,y+h); g.lineTo(x+c,y+h); g.lineTo(x,y+h-c); g.lineTo(x,y+c); g.closePath(); g.fillPath();
    g.lineStyle(1.5,col,0.9); g.strokePath();
  }
  hudBrackets(g,x,y,w,h,col,len){
    const L=len||14; g.lineStyle(2.5,col,1);
    g.beginPath(); g.moveTo(x,y+L); g.lineTo(x,y); g.lineTo(x+L,y);
    g.moveTo(x+w-L,y); g.lineTo(x+w,y); g.lineTo(x+w,y+L);
    g.moveTo(x,y+h-L); g.lineTo(x,y+h); g.lineTo(x+L,y+h);
    g.moveTo(x+w-L,y+h); g.lineTo(x+w,y+h); g.lineTo(x+w,y+h-L); g.strokePath();
  }
  hudTicks(g,x,y,w,col,n){
    g.lineStyle(1.5,col,0.55);
    for(let i=0;i<(n||6);i++){ const tx=x+4+i*6; g.beginPath(); g.moveTo(tx,y); g.lineTo(tx+3,y-4); g.strokePath(); }
  }
  hudBar(g,x,y,w,h,frac,col,bgcol){
    const sk=4; // skewed (parallelogram) bar = sci-fi look
    g.fillStyle(bgcol||0x10202c,0.85);
    g.beginPath(); g.moveTo(x+sk,y); g.lineTo(x+w,y); g.lineTo(x+w-sk,y+h); g.lineTo(x,y+h); g.closePath(); g.fillPath();
    const fw=Math.max(0,(w-sk)*Phaser.Math.Clamp(frac,0,1));
    if(fw>2){ g.fillStyle(col,1);
      g.beginPath(); g.moveTo(x+sk,y+1); g.lineTo(x+sk+fw,y+1); g.lineTo(x+fw,y+h-1); g.lineTo(x+1,y+h-1); g.closePath(); g.fillPath(); }
    g.lineStyle(1,col,0.75);
    g.beginPath(); g.moveTo(x+sk,y); g.lineTo(x+w,y); g.lineTo(x+w-sk,y+h); g.lineTo(x,y+h); g.closePath(); g.strokePath();
    // segment notches
    g.lineStyle(1,0x061018,0.7);
    for(let i=1;i<8;i++){ const px=x+sk+(w-sk)*i/8; g.beginPath(); g.moveTo(px,y+1); g.lineTo(px-sk*(h-2)/h,y+h-1); g.strokePath(); }
  }

  setupCameras(){
    const ui=[this.vig,this.redvig,this.hud.bars,this.hud.hpTxt,this.hud.shTxt,this.hud.wpn,this.hud.alive,this.hud.kills,this.hud.zone,this.hud.toast,this.hud.killfeed,
      this.mmImg,this.mmGfx,this.muteBtn,this.swapG,this.swapIcon,this.swapTxt,this.abG,this.abIcon,this.abLbl];
    if(this.stickG) ui.push(this.stickG);
    this.uiCam=this.cameras.add(0,0,this.scale.width,this.scale.height);
    this.cameras.main.ignore(ui);
    this.uiCam.ignore(this.children.list.filter(o=>ui.indexOf(o)<0));
    this.toWorld=(o)=>{ if(this.uiCam) this.uiCam.ignore(o); return o; };
    const rz=(gs)=>{ if(this.uiCam) this.uiCam.setSize(gs.width,gs.height); };
    this.scale.on('resize',rz); this.events.once('shutdown',()=>this.scale.off('resize',rz));
  }

  drawRoads(){
    const cols=this.GC, rows=this.GR, cw=WORLD_W/cols, ch=WORLD_H/rows;
    const ROAD=110;               // street width between blocks
    const SW=this.add.graphics().setDepth(-18);
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const bx=i*cw+ROAD/2, by=j*ch+ROAD/2, bw=cw-ROAD, bh=ch-ROAD;
      if(bw<40||bh<40) continue;
      SW.fillStyle(0x2a2a38,1); SW.fillRect(bx,by,bw,bh);
      SW.lineStyle(1,0x1a1a26,0.55);
      for(let gx=bx;gx<bx+bw;gx+=32) SW.strokeRect(gx,by,32,32);
      SW.lineStyle(2,0x3c3c50,0.9); SW.strokeRect(bx,by,bw,bh);
    }
    const g=this.add.graphics().setDepth(-17);
    // lane dashes down the middle of every street
    g.fillStyle(0xd8c14a,0.55);
    for(let i=1;i<cols;i++){ const x=i*cw-2;
      for(let y=20;y<WORLD_H;y+=110) g.fillRect(x,y,4,52); }
    for(let j=1;j<rows;j++){ const y=j*ch-2;
      for(let x=20;x<WORLD_W;x+=110) g.fillRect(x,y,52,4); }
    // crosswalks at intersections
    g.fillStyle(0xd7ddff,0.35);
    for(let i=1;i<cols;i++)for(let j=1;j<rows;j++){
      const x=i*cw, y=j*ch;
      for(let k=-2;k<=2;k++){ g.fillRect(x-58,y+k*14-3,26,7); g.fillRect(x+32,y+k*14-3,26,7);
                              g.fillRect(x+k*14-3,y-58,7,26); g.fillRect(x+k*14-3,y+32,7,26); }
    }
    // streetlights: only a limited number of glow images (they are the costly part)
    let lights=0;
    for(let i=1;i<cols;i++)for(let j=0;j<rows;j++){
      if(Math.random()<0.55) continue;
      const x=i*cw+(Math.random()<0.5?-ROAD/2+12:ROAD/2-12), y=j*ch+ch/2;
      const col=Phaser.Utils.Array.GetRandom([C.cyan,C.magenta,C.gold]);
      if(lights<this.FX.lights){ lights++;
        this.add.image(x,y,'glow').setDisplaySize(150,150).setTint(col).setAlpha(0.10).setBlendMode(Phaser.BlendModes.ADD).setDepth(-16); }
      g.fillStyle(col,0.9); g.fillCircle(x,y,3);
    }
    // street clutter (static, single graphics)
    const D=this.gDecor;
    for(let i=0;i<60;i++){
      const x=Phaser.Math.Between(60,WORLD_W-60), y=Phaser.Math.Between(60,WORLD_H-60);
      const r=Math.random();
      if(r<0.42){ const col=Phaser.Utils.Array.GetRandom([C.cyan,C.magenta,C.purple]);
        D.fillStyle(col,0.08); D.fillEllipse(x,y,Phaser.Math.Between(50,120),Phaser.Math.Between(24,56));
      } else if(r<0.68){ D.fillStyle(0x24242f,1); D.fillCircle(x,y,11); D.lineStyle(2,0x14141c,1); D.strokeCircle(x,y,11);
        D.fillStyle(0x1c1c26,1); D.fillCircle(x,y,5);
      } else if(r<0.86){ D.fillStyle(0x1a1a24,1); D.fillRect(x-14,y-9,28,18);
        D.fillStyle(0x2b2b38,1); for(let k=0;k<5;k++) D.fillRect(x-12+k*5,y-7,3,14);
      } else { const col=Phaser.Utils.Array.GetRandom([C.magenta,C.green,C.gold]);
        D.fillStyle(col,0.10); D.fillEllipse(x,y,Phaser.Math.Between(26,54),Phaser.Math.Between(14,26)); }
    }
  }

  buildCity(){
    const ndCol=(cx,cy)=>{ let best=DISTRICTS[0],bd=1e18; DISTRICTS.forEach(d=>{ const dx=cx-d.x*WORLD_W,dy=cy-d.y*WORLD_H,dd=dx*dx+dy*dy; if(dd<bd){bd=dd;best=d;} }); return best.c; };
    const addWall=(x,y,w,h,edge,type)=>{
      const G=this.gCity;
      if(type==='water'){
        G.fillStyle(C.water,0.92); G.fillRect(x,y,w,h);
        G.lineStyle(3,C.waterEdge,0.7); G.strokeRect(x,y,w,h);
        G.fillStyle(C.waterEdge,0.10); G.fillRect(x+4,y+4,w-8,h-8);
      } else if(type==='cover'){
        const car = w>h;
        G.fillStyle(0x000000,0.32); G.fillRect(x+2,y+3,w,h);
        G.fillStyle(0x1e1b30,1); G.fillRect(x,y,w,h);
        G.lineStyle(2,edge,0.85); G.strokeRect(x,y,w,h);
        if(car){ G.fillStyle(0x2b2742,1); G.fillRect(x+w*0.24,y+3,w*0.5,h-6);
          G.fillStyle(edge,0.85); G.fillRect(x+3,y+h*0.32,4,h*0.36);
          G.fillStyle(0xff3b6b,0.7); G.fillRect(x+w-7,y+h*0.32,4,h*0.36);
        } else { G.fillStyle(edge,0.5); G.fillRect(x+4,y+4,w-8,5); }
      } else if(type==='building'){
        // rooftop mass + parapet + neon trim (all static, one graphics)
        G.fillStyle(0x191627,1); G.fillRect(x,y,w,h);
        G.fillStyle(0x221f34,0.5);
        for(let i=0;i<Math.min(14,Math.floor(w*h/9000));i++) G.fillRect(x+Phaser.Math.Between(4,w-6),y+Phaser.Math.Between(4,h-6),3,3);
        G.lineStyle(7,0x241f3c,1); G.strokeRect(x,y,w,h);
        G.lineStyle(2,edge,0.95); G.strokeRect(x+4,y+4,w-8,h-8);
        G.lineStyle(1,edge,0.4);  G.strokeRect(x+7,y+7,w-14,h-14);
        G.fillStyle(C.gold,0.9);
        [[x+7,y+7],[x+w-7,y+7],[x+7,y+h-7],[x+w-7,y+h-7]].forEach(p=>G.fillCircle(p[0],p[1],2.5));
        // rooftop machinery
        const n=Math.min(6,Math.floor((w*h)/24000));
        for(let i=0;i<n;i++){
          const pw=Phaser.Math.Between(16,32), ph=Phaser.Math.Between(14,24);
          const px=x+Phaser.Math.Between(14,Math.max(15,w-pw-14)), py=y+Phaser.Math.Between(14,Math.max(15,h-ph-14));
          const kind=Math.random();
          if(kind<0.45){ G.fillStyle(0x232036,1); G.fillRect(px,py,pw,ph); G.lineStyle(1,0x453f6b,1); G.strokeRect(px,py,pw,ph);
            G.lineStyle(1,0x5b5590,0.9); G.strokeCircle(px+pw/2,py+ph/2,Math.min(pw,ph)*0.3);
          } else if(kind<0.72){ G.fillStyle(0x2c2745,1); G.fillRect(px,py,pw,6);
            G.fillStyle(0x3a3560,1); G.fillCircle(px,py+3,4); G.fillCircle(px+pw,py+3,4);
          } else if(kind<0.9){ G.fillStyle(0x4a4470,1); G.fillRect(px+pw/2-1,py,2,ph+8);
            G.fillStyle(C.magenta,1); G.fillCircle(px+pw/2,py-2,3);
          } else { G.fillStyle(edge,0.18); G.fillRect(px,py,pw,ph); G.lineStyle(1,edge,0.9); G.strokeRect(px,py,pw,ph);
            G.fillStyle(edge,0.5); for(let k=1;k<4;k++) G.fillRect(px+3,py+k*(ph/4),pw-6,1); }
        }
        // neon rooftop sign (only a few get an animated glow)
        if(w>190&&h>110&&Math.random()<0.55){
          const sw2=Math.min(w-40,Phaser.Math.Between(70,140)), sh2=16;
          const sx=x+(w-sw2)/2, sy=y+Phaser.Math.Between(14,Math.max(15,h-sh2-14));
          const scol=Phaser.Utils.Array.GetRandom([C.magenta,C.cyan,C.gold,C.purple]);
          G.fillStyle(0x0d0b1c,1); G.fillRect(sx,sy,sw2,sh2); G.lineStyle(2,scol,1); G.strokeRect(sx,sy,sw2,sh2);
          G.fillStyle(scol,0.85); for(let k=0;k<Math.floor(sw2/16);k++) G.fillRect(sx+6+k*16,sy+4,8,8);
          if(this.FX.glow && this.animCount<this.FX.signs){ this.animCount++;
            const sg=this.add.image(sx+sw2/2,sy+sh2/2,'glow').setDisplaySize(sw2*1.7,sh2*4).setTint(scol).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(0);
            this.tweens.add({targets:sg,alpha:{from:0.10,to:0.30},duration:Phaser.Math.Between(1100,2000),yoyo:true,repeat:-1});
          }
        }
      } else { // border
        G.fillStyle(0x0f0c22,1); G.fillRect(x,y,w,h); G.lineStyle(3,edge,0.9); G.strokeRect(x,y,w,h);
      }
      const body=this.walls.create(x+w/2,y+h/2,'px').setVisible(false); body.setDisplaySize(w,h); body.refreshBody();
      this.wallRects.push({x,y,w,h,type,dc:(edge||C.waterEdge)});
    };

    const t=40;
    addWall(0,0,WORLD_W,t,C.cyan,'border'); addWall(0,WORLD_H-t,WORLD_W,t,C.cyan,'border');
    addWall(0,0,t,WORLD_H,C.cyan,'border'); addWall(WORLD_W-t,0,t,WORLD_H,C.cyan,'border');

    // water channels (Sky-Train canals)
    addWall(WORLD_W*0.44,80,90,WORLD_H*0.34,0,'water');
    addWall(WORLD_W*0.60,WORLD_H*0.55,WORLD_W*0.30,90,0,'water');

    const cols=this.GC,rows=this.GR,cw=WORLD_W/cols,ch=WORLD_H/rows;
    const ROAD=110, PAD=26; // keep buildings inside the sidewalk pad
    for(let cxr=0;cxr<cols;cxr++)for(let cyr=0;cyr<rows;cyr++){
      if(Math.random()<0.26) continue;
      const px=cxr*cw+ROAD/2+PAD, py=cyr*ch+ROAD/2+PAD;
      const maxW=cw-ROAD-PAD*2, maxH=ch-ROAD-PAD*2;
      if(maxW<110||maxH<110) continue;
      const bw=maxW-Phaser.Math.Between(0,Math.floor(maxW*0.18)), bh=maxH-Phaser.Math.Between(0,Math.floor(maxH*0.18));
      const bx=px+Phaser.Math.Between(0,Math.max(0,maxW-bw)), by=py+Phaser.Math.Between(0,Math.max(0,maxH-bh));
      const edge=ndCol(bx+bw/2,by+bh/2);
      if(Math.random()<0.42 && bw>230 && bh>190){
        const wth=34, gap=Phaser.Math.Between(90,150), gy=by+Phaser.Math.Between(40,bh-gap-40);
        addWall(bx,by,bw,wth,edge,'building'); addWall(bx,by+bh-wth,bw,wth,edge,'building');
        addWall(bx,by,wth,bh,edge,'building');
        addWall(bx+bw-wth,by,wth,gy-by,edge,'building');
        addWall(bx+bw-wth,gy+gap,wth,by+bh-(gy+gap),edge,'building');
      } else addWall(bx,by,bw,bh,edge,'building');
    }
    for(let i=0;i<56;i++){
      const horiz=Math.random()<0.5;
      const w=horiz?Phaser.Math.Between(90,130):Phaser.Math.Between(44,58);
      const h=horiz?Phaser.Math.Between(44,58):Phaser.Math.Between(90,130);
      const x=Phaser.Math.Between(80,WORLD_W-80-w), y=Phaser.Math.Between(80,WORLD_H-80-h);
      if(this.wallRects.some(r=>x<r.x+r.w+20&&x+w>r.x-20&&y<r.y+r.h+20&&y+h>r.y-20)) continue;
      addWall(x,y,w,h,ndCol(x+w/2,y+h/2),'cover');
    }
    DISTRICTS.forEach(d=>{ this.add.text(d.x*WORLD_W,d.y*WORLD_H,d.n,{fontSize:'40px',color:'#ffffff',fontStyle:'900'})
      .setOrigin(0.5).setDepth(-2).setAlpha(0.10).setTint(d.c); });
  }

  freeSpot(nd){
    for(let k=0;k<60;k++){ let x,y;
      if(nd){ x=Phaser.Math.Clamp(nd.x*WORLD_W+Phaser.Math.Between(-480,480),80,WORLD_W-80);
              y=Phaser.Math.Clamp(nd.y*WORLD_H+Phaser.Math.Between(-480,480),80,WORLD_H-80); }
      else { x=Phaser.Math.Between(120,WORLD_W-120); y=Phaser.Math.Between(120,WORLD_H-120); }
      if(!this.wallRects.some(r=>x>r.x-30&&x<r.x+r.w+30&&y>r.y-30&&y<r.y+r.h+30)) return {x,y};
    } return {x:WORLD_W/2,y:WORLD_H/2};
  }

  spawnLoot(n){
    for(let i=0;i<n;i++){ const d=Phaser.Utils.Array.GetRandom(DISTRICTS); const p=this.freeSpot(d);
      const roll=Math.random(); let type,payload;
      if(roll<0.22){ type='heal'; }
      else if(roll<0.38){ type='shield'; }
      else { type='weapon'; const pool=LOOT_TABLE.slice();
        if(d.tier>=2) pool.push('rifle','rifle'); if(d.tier>=3) pool.push('rifle','shotgun','ricochet');
        payload=Phaser.Utils.Array.GetRandom(pool); }
      this.mkLoot(p.x,p.y,type,payload);
    }
  }
  mkLoot(x,y,type,payload,tex,airdrop){
    let l;
    if(type==='weapon'){
      const w=WEAPONS[payload];
      // ground weapon = its own silhouette on a faint pad
      l=this.loot.create(x,y,'wpn_'+payload).setDepth(2);
      l.setScale(airdrop?1.25:1);
      const pad=this.add.ellipse(x,y+9,airdrop?48:38,airdrop?18:14, airdrop?C.gold:w.col, 0.16).setDepth(1);
      if(this.toWorld) this.toWorld(pad);
      l.pad=pad; l.on('destroy',()=>pad.destroy());
    } else {
      l=this.loot.create(x,y,type==='heal'?'lootH':'lootS').setDepth(2);
    }
    l.dataType=type; l.payload=payload; l.airdrop=!!airdrop;
    if(this.toWorld) this.toWorld(l);
    if(airdrop){
      const label=this.add.text(x,y-24,'★ '+WEAPONS[payload].name.toUpperCase(),{fontFamily:TITLE_FONT,fontSize:'12px',fontStyle:'900',color:'#ffd23f'}).setOrigin(0.5).setDepth(3).setShadow(0,1,'#000',4);
      if(this.toWorld) this.toWorld(label);
      l.label=label; l.on('destroy',()=>label.destroy());
      if(this.FX.glow){
        const halo=this.add.image(x,y,'glow').setTint(C.gold).setAlpha(0.5).setDisplaySize(130,130).setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
        this.tweens.add({targets:halo,alpha:0.2,scale:1.2,duration:800,yoyo:true,repeat:-1}); l.halo=halo;
        if(this.toWorld) this.toWorld(halo);
        l.on('destroy',()=>halo.destroy());
      }
    }
    return l;
  }

  spawnUnit(isPlayer){
    const d=Phaser.Utils.Array.GetRandom(DISTRICTS); const p=this.freeSpot(d);
    const op=isPlayer?OP(GAME.char):null;
    const charKey=isPlayer?('ch_'+GAME.char):'ch_bot';
    const s=this.physics.add.image(p.x,p.y,charKey+'_0').setDepth(6); s.body.setCircle(15,17,17); s.setCollideWorldBounds(true);
    const gun=this.add.image(p.x,p.y,'gun_small').setOrigin(16/64,0.5).setDepth(7).setVisible(false);
    const u={ s,gun,isPlayer,charKey,frame:0, alive:true, hp:100,maxhp:100, shield:isPlayer?0:Phaser.Math.Between(0,50),maxshield:100,
      weapon:isPlayer?'pistol':Phaser.Utils.Array.GetRandom(['pistol','pistol','smg']),
      lastShot:0, aim:0, outside:false, iframe:0, cloak:0, scan:0,
      op, abReady:0,
      ai:{state:'wander',tx:p.x,ty:p.y,retarget:0,strafe:1,think:0,tgt:null,lt:null} };
    s.unit=u; this.physics.add.collider(s,this.walls);
    if(isPlayer){ const sk=SKIN(GAME.skin); u.skin=sk; s.setTint(sk.tint);
      if(sk.halo>0 && fxq().glow){ const hl=this.add.image(p.x,p.y,'glow').setTint(op.col).setBlendMode(Phaser.BlendModes.ADD)
          .setDisplaySize(64,64).setAlpha(0.30*sk.halo).setDepth(5);
        this.tweens.add({targets:hl,alpha:0.55*sk.halo,duration:700,yoyo:true,repeat:-1}); u.skinHalo=hl; } }
    this.units.push(u); return u;
  }

  /* ------------- combat ------------- */
  shoot(u,angle){
    const w=WEAPONS[u.weapon]; if(this.time.now-u.lastShot<w.rate) return; u.lastShot=this.time.now; u.fireT=this.time.now+110;
    for(let i=0;i<w.pellets;i++){
      const a=angle+Phaser.Math.FloatBetween(-w.spread,w.spread);
      const b=this.bullets.create(u.s.x+Math.cos(angle)*24,u.s.y+Math.sin(angle)*24,'dot').setDepth(8);
      b.owner=u; b.dmg=w.dmg; b.behavior=w.b; b.setTint(w.col); if(this.FX.glow) b.setBlendMode(Phaser.BlendModes.ADD);
      b.pierce=w.pierce||0; b.bounces=w.bounces||0; b.splashR=w.splashR||0; b.splashDmg=w.splashDmg||0; b.turn=w.turn||0;
      b.setRotation(a);
      const big=(w.b==='explosive'); b.setScale(big?1.1:0.55, big?1.1:0.4);
      this.physics.velocityFromRotation(a,w.speed,b.body.velocity);
      b.maxDist=w.range; b.sx=b.x; b.sy=b.y; b.hitSet=null;
      if(this.toWorld) this.toWorld(b);
    }
    if(this.FX.glow && this.inView(u.s.x,u.s.y,60)){
      const f=this.add.image(u.s.x+Math.cos(angle)*30,u.s.y+Math.sin(angle)*30,'glow').setTint(w.col).setBlendMode(Phaser.BlendModes.ADD).setDepth(9).setDisplaySize(46,46);
      if(this.toWorld) this.toWorld(f);
      this.tweens.add({targets:f,alpha:0,scale:0.3,duration:110,onComplete:()=>f.destroy()});
    }
    if(u.isPlayer && this.FX.shake) this.cameras.main.shake(w.b==='explosive'?90:40,0.0022);
    if(u.isPlayer) SFX.shoot(w.tier);
  }
  onBulletWall(b,wall){
    if(!b.active) return;
    if(b.behavior==='explosive'){ this.explode(b.x,b.y,b.splashDmg,b.splashR,b.owner); b.destroy(); return; }
    if(b.behavior==='bounce'){
      const bx=wall.body.left, br=wall.body.right, bt=wall.body.top, bb=wall.body.bottom;
      const penX=Math.min(Math.abs(b.x-bx),Math.abs(br-b.x)), penY=Math.min(Math.abs(b.y-bt),Math.abs(bb-b.y));
      if(penX<penY) b.body.velocity.x*=-1; else b.body.velocity.y*=-1;
      b.setRotation(Math.atan2(b.body.velocity.y,b.body.velocity.x));
      b.bounces--; if(b.bounces<0) b.destroy(); return;
    }
    b.destroy(); // normal + pierce stop on walls
  }
  explode(x,y,dmg,r,owner){
    if(this.inView(x,y,r)){
      const e=this.add.image(x,y,'glow').setTint(C.orange).setBlendMode(Phaser.BlendModes.ADD).setDepth(10).setDisplaySize(40,40);
      if(this.toWorld) this.toWorld(e);
      this.tweens.add({targets:e,displayWidth:r*2.4,displayHeight:r*2.4,alpha:0,duration:340,onComplete:()=>e.destroy()});
      const np=Math.round(12*this.FX.particles);
      for(let i=0;i<np;i++){ const p=this.add.image(x,y,'spark').setTint(C.gold).setBlendMode(Phaser.BlendModes.ADD).setDepth(11); if(this.toWorld) this.toWorld(p);
        const a=Math.random()*6.28,sp=Phaser.Math.Between(60,r); this.tweens.add({targets:p,x:x+Math.cos(a)*sp,y:y+Math.sin(a)*sp,scale:0,duration:360,onComplete:()=>p.destroy()}); }
      if(this.FX.shake) this.cameras.main.shake(120,0.004);
    }
    if(owner&&owner.isPlayer) SFX.explode();
    this.units.forEach(u=>{ if(!u.alive) return; const d=Phaser.Math.Distance.Between(x,y,u.s.x,u.s.y);
      if(d<r){ const fall=1-d/r; this.applyDamage(u,dmg*fall,owner); } });
  }
  applyDamage(u,dmg,owner){
    if(u.invuln||this.time.now<(u.iframe||0)) return;
    const shown=Math.round(dmg);
    if(u.shield>0){ const a=Math.min(u.shield,dmg); u.shield-=a; dmg-=a; }
    u.hp-=dmg; if(owner&&owner.isPlayer) this.damageDealt+=dmg;
    if(owner&&owner.isPlayer&&shown>0) this.dmgNum(u.s.x+Phaser.Math.Between(-8,8),u.s.y-18,shown);
    if(u.hp<=0){ this.killUnit(u,owner); return; }
    if(owner&&owner.isPlayer&&shown>0) this.tweens.add({targets:u.s,scale:1.16,duration:55,yoyo:true});
    if(u.isPlayer&&shown>0) this.cameras.main.shake(70,0.004);
  }
  bulletHitUnit(b,u){
    if(!b.active||!u.alive||b.owner===u) return false;
    if(b.behavior==='explosive'){ this.explode(b.x,b.y,b.splashDmg,b.splashR,b.owner); b.destroy(); return true; }
    if(b.behavior==='pierce'){ if(!b.hitSet) b.hitSet=new Set(); if(b.hitSet.has(u)) return false; b.hitSet.add(u);
      if(b.owner.isPlayer) SFX.hit(); this.hitSpark(u.s.x,u.s.y); this.applyDamage(u,b.dmg,b.owner); b.pierce--; if(b.pierce<0) b.destroy(); return true; }
    if(b.owner.isPlayer) SFX.hit(); this.hitSpark(u.s.x,u.s.y); this.applyDamage(u,b.dmg,b.owner); b.destroy(); return true;
  }
  hitSpark(x,y){ if(!this.FX.glow || !this.inView(x,y,40)) return;
    const s=this.add.image(x,y,'glow').setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(12).setDisplaySize(30,30); if(this.toWorld) this.toWorld(s);
    this.tweens.add({targets:s,alpha:0,scale:0.2,duration:130,onComplete:()=>s.destroy()}); }

  killUnit(u,by){
    if(!u.alive) return; u.alive=false; this.aliveCount--;
    const visible = u.isPlayer || this.inView(u.s.x,u.s.y,80);
    // PERF: off-screen deaths are silent (no particles, no corpse, no tweens)
    if(!visible){
      this.mkLoot(u.s.x,u.s.y,'weapon',u.weapon,'lootW');
      if(u.gun) u.gun.destroy(); if(u.skinHalo) u.skinHalo.destroy(); u.s.destroy();
      if(by&&by.isPlayer&&!u.isPlayer){ this.kills++; this.flashKill(); SFX.kill(); }
      if(this.aliveCount===1&&this.player.alive) this.endMatch(true);
      return;
    }
    const nb=Math.round(12*this.FX.particles);
    for(let i=0;i<nb;i++){ const p=this.add.image(u.s.x,u.s.y,'spark').setTint(u.isPlayer?C.player:C.enemy).setBlendMode(Phaser.BlendModes.ADD).setDepth(12); if(this.toWorld) this.toWorld(p);
      const a=Math.random()*6.28,sp=Phaser.Math.Between(40,150); this.tweens.add({targets:p,x:u.s.x+Math.cos(a)*sp,y:u.s.y+Math.sin(a)*sp,scale:0,duration:420,onComplete:()=>p.destroy()}); }
    this.mkLoot(u.s.x,u.s.y,'weapon',u.weapon,'lootW');
    if(u.gun) u.gun.destroy();
    if(u.skinHalo) u.skinHalo.destroy();
    // death animation: hit -> falling -> down (corpse stays)
    const dx=u.s.x, dy=u.s.y, rot=u.s.rotation, key=u.charKey;
    if(u.s.body) u.s.body.enable=false;
    u.s.setVelocity && u.s.setVelocity(0,0);
    const corpse=this.add.image(dx,dy,key+'_d0').setDepth(4).setRotation(rot); if(this.toWorld) this.toWorld(corpse);
    const kb=(by&&by.s)?Phaser.Math.Angle.Between(by.s.x,by.s.y,dx,dy):rot;
    this.tweens.add({targets:corpse,x:dx+Math.cos(kb)*26,y:dy+Math.sin(kb)*26,duration:360,ease:'Quad.out'});
    this.tweens.add({targets:corpse,scale:{from:1.14,to:1},duration:260,ease:'Quad.out'});
    u.s.destroy();
    // hit -> falling -> down (slower, readable)
    this.time.delayedCall(360,()=>{ if(corpse.active){ corpse.setTexture(key+'_d1');
      this.tweens.add({targets:corpse,scale:{from:1,to:0.96},duration:320,ease:'Sine.in'}); } });
    this.time.delayedCall(760,()=>{ if(corpse.active){ corpse.setTexture(key+'_d2'); corpse.setScale(1);
      this.tweens.add({targets:corpse,alpha:0.5,duration:9000,delay:7000,onComplete:()=>corpse.destroy()}); } });
    if(by&&by.isPlayer&&!u.isPlayer){ this.kills++; this.flashKill(); SFX.kill();
      this.time.timeScale=0.55; this.time.delayedCall(60,()=>{ this.time.timeScale=1; }); }
    if(u.isPlayer){ SFX.kill(); this.cameras.main.shake(320,0.008);
      this.tweens.add({targets:this.cameras.main,zoom:this.cameras.main.zoom*1.35,duration:1400,ease:'Sine.inOut'});
      this.time.delayedCall(1700,()=>this.endMatch(false)); }
    else if(this.aliveCount===1&&this.player.alive) this.endMatch(true);
  }

  pickup(u,l){
    if(!l.active) return;
    if(l.dataType==='heal'){ if(u.hp>=u.maxhp) return; u.hp=Math.min(u.maxhp,u.hp+40); if(u.isPlayer) SFX.pickup(); l.destroy(); return; }
    if(l.dataType==='shield'){ if(u.shield>=u.maxshield) return; u.shield=Math.min(u.maxshield,u.shield+40); if(u.isPlayer) SFX.pickup(); l.destroy(); return; }
    // weapon
    if(u.isPlayer){ this._wprompt={loot:l,t:this.time.now}; return; } // player chooses via swap prompt
    if(!l.airdrop && WEAPONS[l.payload].tier<=WEAPONS[u.weapon].tier) return;
    u.weapon=l.payload; l.destroy();
  }
  doSwap(){
    if(!this._wprompt||!this._wprompt.loot.active) return; const l=this._wprompt.loot, P=this.player, old=P.weapon;
    P.weapon=l.payload; l.destroy(); this._wprompt=null;
    this.mkLoot(P.s.x+Phaser.Math.Between(-14,14),P.s.y+Phaser.Math.Between(20,34),'weapon',old);
    SFX.pickup(); this.toast('▲ '+WEAPONS[P.weapon].name.toUpperCase(),WEAPONS[P.weapon].col); this.setPlayerZoom();
    this.swapBtn.setVisible(false); this.swapTxt.setVisible(false); this.swapIcon.setVisible(false); this.swapG.clear(); this.swapG.setVisible(false);
  }

  /* ------------- zone ------------- */
  initZone(){
    const R=Math.hypot(WORLD_W,WORLD_H)/2;
    this.zone={cx:WORLD_W/2,cy:WORLD_H/2,r:R,tcx:WORLD_W/2,tcy:WORLD_H/2,tr:R,phase:0,state:'wait',timer:6000,dmg:1};
    this.zoneGfx=this.add.graphics().setDepth(55);
    this.phaseRadii=this.cfg.pr.map(f=>R*f);
    this.phaseDmg=this.cfg.pd;
  }
  zoneTick(){ if(this.over||this.phase!=='live') return;
    this.units.forEach(u=>{ if(!u.alive) return; const d=Phaser.Math.Distance.Between(u.s.x,u.s.y,this.zone.cx,this.zone.cy);
      u.outside=d>this.zone.r; if(u.outside){ this.applyDamage(u,this.zone.dmg,null); } }); }
  advanceZone(){
    if(this.zone.phase>=this.phaseRadii.length) return;
    const nr=this.phaseRadii[this.zone.phase];
    const ang=Math.random()*6.28, off=(this.zone.r-nr)*0.6*Math.random();
    this.zone.tcx=Phaser.Math.Clamp(this.zone.cx+Math.cos(ang)*off,nr,WORLD_W-nr);
    this.zone.tcy=Phaser.Math.Clamp(this.zone.cy+Math.sin(ang)*off,nr,WORLD_H-nr);
    this.zone.tr=nr; this.zone.dmg=this.phaseDmg[Math.min(this.zone.phase,this.phaseDmg.length-1)];
    const drops=this.zone.phase>=2?2:1;
    for(let i=0;i<drops;i++){
      const dr=Math.random()*nr*0.7, da=Math.random()*6.28;
      let ax=Phaser.Math.Clamp(this.zone.tcx+Math.cos(da)*dr,120,WORLD_W-120);
      let ay=Phaser.Math.Clamp(this.zone.tcy+Math.sin(da)*dr,120,WORLD_H-120);
      const sp=this.freeSpotNear(ax,ay); ax=sp.x; ay=sp.y;
      const wpn=Phaser.Utils.Array.GetRandom(AIRDROP_POOL);
      this.mkLoot(ax,ay,'weapon',wpn,'lootA',true);
      const beam=this.add.rectangle(ax,ay-420,12,840,C.gold,0.22).setDepth(3).setBlendMode(Phaser.BlendModes.ADD); if(this.toWorld) this.toWorld(beam);
      this.tweens.add({targets:beam,alpha:0,duration:2600,onComplete:()=>beam.destroy()});
    }
    this.toast('AIRDROP IN ARRIVO',C.gold); SFX.zone(); this.zone.phase++;
  }
  freeSpotNear(x,y){ for(let k=0;k<30;k++){ const tx=Phaser.Math.Clamp(x+Phaser.Math.Between(-160,160),120,WORLD_W-120),
    ty=Phaser.Math.Clamp(y+Phaser.Math.Between(-160,160),120,WORLD_H-120);
    if(!this.wallRects.some(r=>tx>r.x-40&&tx<r.x+r.w+40&&ty>r.y-40&&ty<r.y+r.h+40)) return {x:tx,y:ty}; } return {x,y}; }

  buildMinimapTexture(){
    const S=240, g=this.make.graphics({add:false}); const sx=S/WORLD_W, sy=S/WORLD_H;
    g.fillStyle(0x070512,1); g.fillRect(0,0,S,S);
    DISTRICTS.forEach(d=>{ g.fillStyle(d.c,0.12); g.fillCircle(d.x*S,d.y*S,24); });
    this.wallRects.forEach(r=>{ if(r.type==='border') return;
      g.fillStyle(r.type==='water'?C.water:r.dc, r.type==='cover'?0.4:0.6);
      g.fillRect(r.x*sx,r.y*sy,Math.max(1.5,r.w*sx),Math.max(1.5,r.h*sy)); });
    g.generateTexture('mmTex',S,S); g.destroy();
  }

  buildDeploySchematic(){
    const g=this.add.graphics().setDepth(58).setVisible(false); this.schemEls=[g];
    this.wallRects.forEach(r=>{ if(r.type==='border') return;
      if(r.type==='water'){ g.fillStyle(C.water,0.95); g.fillRect(r.x,r.y,r.w,r.h); g.lineStyle(3,C.waterEdge,0.8); g.strokeRect(r.x,r.y,r.w,r.h); }
      else if(r.type==='cover'){ g.fillStyle(0x272552,0.95); g.fillRect(r.x,r.y,r.w,r.h); }
      else { g.fillStyle(0x2e2c62,1); g.fillRect(r.x,r.y,r.w,r.h); g.lineStyle(4,0x6a7ce0,0.95); g.strokeRect(r.x,r.y,r.w,r.h); } });
    DISTRICTS.forEach(d=>{ const col='#'+(d.c>>>0).toString(16).padStart(6,'0').slice(-6);
      const t=this.add.text(d.x*WORLD_W,d.y*WORLD_H,d.n,{fontSize:'54px',fontStyle:'900',color:col}).setOrigin(0.5).setDepth(59).setVisible(false).setShadow(0,0,'#000',8);
      this.schemEls.push(t); });
  }
  showSchem(v){ if(this.schemEls) this.schemEls.forEach(o=>o.setVisible(v)); }

  throwGrenade(ang){ const P=this.player, range=440, tx=P.s.x+Math.cos(ang)*range, ty=P.s.y+Math.sin(ang)*range;
    const g=this.add.image(P.s.x,P.s.y,'lootA').setDepth(9).setScale(0.5).setTint(C.orange); if(this.toWorld) this.toWorld(g);
    this.tweens.add({targets:g,x:tx,y:ty,rotation:6,duration:520,ease:'Quad.out',onComplete:()=>{ this.explode(tx,ty,55,150,P); g.destroy(); }});
    SFX.tone(320,0.1,'square',0.1,180); }

  activateAbility(){
    const P=this.player; if(!P.alive||this.phase!=='live') return; if(this.time.now<P.abReady) return;
    const op=P.op; P.abReady=this.time.now+op.cd; SFX.ui();
    if(op.ab==='DASH'){ let ang=P.aim, mvx=this._mvx||0, mvy=this._mvy||0; if(Math.hypot(mvx,mvy)>0.2) ang=Math.atan2(mvy,mvx);
      this.dash={until:this.time.now+220,vx:Math.cos(ang),vy:Math.sin(ang)}; P.iframe=this.time.now+280; SFX.tone(600,0.12,'square',0.12,900); }
    else if(op.ab==='GRENADE'){ this.throwGrenade(P.aim); }
    else if(op.ab==='DOME'){ if(this.dome&&this.dome.gfx) this.dome.gfx.destroy();
      const c=this.add.circle(P.s.x,P.s.y,160,C.shield,0.10).setStrokeStyle(3,C.shield,0.85).setDepth(50); if(this.toWorld) this.toWorld(c);
      this.tweens.add({targets:c,alpha:{from:0.22,to:0.10},duration:600,yoyo:true,repeat:-1});
      this.dome={x:P.s.x,y:P.s.y,r:160,until:this.time.now+6000,owner:P,gfx:c};
      this.time.delayedCall(6000,()=>{ if(c&&c.active) c.destroy(); }); SFX.tone(300,0.3,'sine',0.14); this.toast('CUPOLA ATTIVA',C.shield); }
    else if(op.ab==='SCAN'){ let n=0; this.units.forEach(u=>{ if(u===P||!u.alive) return;
        if(Phaser.Math.Distance.Between(P.s.x,P.s.y,u.s.x,u.s.y)<1000){ u.scan=this.time.now+3500; n++; } });
      SFX.tone(880,0.18,'sine',0.12,1400); this.toast('SCAN · '+n+' NEMICI',C.green); }
    else if(op.ab==='CLOAK'){ P.cloak=this.time.now+3800; SFX.tone(200,0.3,'sine',0.12,600); this.toast('INVISIBILE',C.purple); }
  }

  dmgNum(x,y,amt,col){ const t=this.add.text(x,y,''+amt,{fontSize:'18px',fontStyle:'900',color:col||'#ffd23f'}).setOrigin(0.5).setDepth(30).setScrollFactor(1).setShadow(0,1,'#000',3); if(this.toWorld) this.toWorld(t);
    this.tweens.add({targets:t,y:y-34,alpha:0,duration:640,ease:'Quad.out',onComplete:()=>t.destroy()}); }

  setPlayerZoom(){ const cam=this.cameras.main; const z=SCOPED[this.player.weapon]?0.62:LIVE_ZOOM;
    this.tweens.killTweensOf(cam); this.tweens.add({targets:cam,zoom:z,duration:400,ease:'Sine.inOut'}); }

  /* ------------- input ------------- */
  setupInput(){
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,F,Q');
    this.pointerAim={x:0,y:0,down:false};
    this.input.on('pointermove',p=>{ this.pointerAim.x=p.worldX; this.pointerAim.y=p.worldY; });
    this.input.on('pointerdown',p=>{ if(!this.isTouch) this.pointerAim.down=true; });
    this.input.on('pointerup',()=>{ this.pointerAim.down=false; });
    this.input.on('pointerdown',p=>{ if(this.phase==='deploy') this.pickLanding(p.x,p.y); });
    this.isTouch=this.sys.game.device.input.touch;
    this.moveStick={active:false,id:-1,ox:0,oy:0,dx:0,dy:0};
    this.aimStick ={active:false,id:-1,ox:0,oy:0,dx:0,dy:0};
    if(this.isTouch){ this.stickG=this.add.graphics().setScrollFactor(0).setDepth(200); this.input.addPointer(3);
      this.input.on('pointerdown',p=>this.onTouchDown(p));
      this.input.on('pointermove',p=>this.onTouchMove(p));
      this.input.on('pointerup',p=>this.onTouchUp(p)); }
  }
  onTouchDown(p){ if(this.phase!=='live') return;
    if(this.abBtn && Math.hypot(p.x-this.abBtn.x,p.y-this.abBtn.y)<this.abBtn.r+10){ this.activateAbility(); return; }
    if(this.swapBtn&&this.swapBtn.visible && Math.hypot(p.x-this.swapPos.x,p.y-this.swapPos.y)<this.swapPos.r+12){ this.doSwap(); return; }
    const W=this.scale.width;
    if(GAME.mode==='auto'){ if(!this.moveStick.active) Object.assign(this.moveStick,{active:true,id:p.id,ox:p.x,oy:p.y,dx:0,dy:0}); return; }
    if(p.x<W/2&&!this.moveStick.active) Object.assign(this.moveStick,{active:true,id:p.id,ox:p.x,oy:p.y,dx:0,dy:0});
    else if(p.x>=W/2&&!this.aimStick.active) Object.assign(this.aimStick,{active:true,id:p.id,ox:p.x,oy:p.y,dx:0,dy:0}); }
  onTouchMove(p){ const cl=(st)=>{ let dx=p.x-st.ox,dy=p.y-st.oy; const m=Math.hypot(dx,dy),mx=60; if(m>mx){dx=dx/m*mx;dy=dy/m*mx;} st.dx=dx/mx; st.dy=dy/mx; };
    if(p.id===this.moveStick.id&&this.moveStick.active) cl(this.moveStick);
    if(p.id===this.aimStick.id&&this.aimStick.active) cl(this.aimStick); }
  onTouchUp(p){ if(p.id===this.moveStick.id) Object.assign(this.moveStick,{active:false,id:-1,dx:0,dy:0});
    if(p.id===this.aimStick.id) Object.assign(this.aimStick,{active:false,id:-1,dx:0,dy:0}); }
  drawSticks(){ if(!this.isTouch) return; const g=this.stickG; g.clear();
    const ring=(st,col)=>{ if(!st.active) return; g.lineStyle(3,col,0.5); g.strokeCircle(st.ox,st.oy,60);
      g.fillStyle(col,0.35); g.fillCircle(st.ox+st.dx*60,st.oy+st.dy*60,26); };
    ring(this.moveStick,C.player); if(GAME.mode==='manual') ring(this.aimStick,C.gold); }

  /* ------------- HUD ------------- */
  buildHUD(){
    const W=this.scale.width;
    this.hud={};
    this.hud.bars=this.add.graphics().setScrollFactor(0).setDepth(150);
    this.hud.hpTxt=this.add.text(0,0,'',{fontFamily:TITLE_FONT,fontSize:'11px',color:'#8be3ff',fontStyle:'900'}).setScrollFactor(0).setDepth(152);
    this.hud.shTxt=this.add.text(0,0,'',{fontFamily:TITLE_FONT,fontSize:'10px',color:'#38b6ff',fontStyle:'900'}).setScrollFactor(0).setDepth(152);
    this.hud.wpn=this.add.text(20,80,'',{fontFamily:TITLE_FONT,fontSize:'13px',color:'#8be3ff',fontStyle:'900'}).setScrollFactor(0).setDepth(151);
    this.hud.alive=this.add.text(W-14,14,'',{fontFamily:TITLE_FONT,fontSize:'18px',color:'#33e1ff',fontStyle:'900'}).setOrigin(1,0).setScrollFactor(0).setDepth(151);
    this.hud.kills=this.add.text(W-14,38,'',{fontFamily:TITLE_FONT,fontSize:'12px',color:'#8a86c8',fontStyle:'900'}).setOrigin(1,0).setScrollFactor(0).setDepth(151);
    this.mm={size:Math.min(150,W*0.32)}; this.mm.x=W-this.mm.size-12; this.mm.y=66;
    this.hud.zone=this.add.text(W-this.mm.size/2-12,this.mm.y+this.mm.size+14,'',{fontSize:'12px',color:'#ff8ac0',fontStyle:'800'}).setOrigin(0.5,0).setScrollFactor(0).setDepth(151);
    this.mmImg=this.add.image(this.mm.x,this.mm.y,'mmTex').setOrigin(0).setDisplaySize(this.mm.size,this.mm.size).setScrollFactor(0).setDepth(149).setAlpha(GAME.mmAlpha);
    this.mmGfx=this.add.graphics().setScrollFactor(0).setDepth(150).setAlpha(GAME.mmAlpha);
    this.muteBtn=this.add.text(16,96,SFX.on?'♪ ON':'♪ OFF',{fontFamily:TITLE_FONT,fontSize:T.fXs,color:T.txtMute,fontStyle:'900',backgroundColor:'#0b0918',padding:{x:12,y:12}}).setScrollFactor(0).setDepth(151).setInteractive({useHandCursor:true});
    this.muteBtn.on('pointerdown',()=>{ const on=SFX.toggle(); this.muteBtn.setText(on?'AUDIO ON':'AUDIO OFF'); if(on&&this.phase==='live') SFX.music(true); });
    // weapon swap: round button right above the ability button
    const swx=W-54, swy=this.scale.height-148;
    this.swapPos={x:swx,y:swy,r:36};
    this.swapG=this.add.graphics().setScrollFactor(0).setDepth(179).setVisible(false);
    this.swapIcon=this.add.image(swx,swy,'wpn_pistol').setScrollFactor(0).setDepth(181).setScale(0.95).setVisible(false);
    this.swapTxt=this.add.text(swx,swy+46,'',{fontFamily:TITLE_FONT,fontSize:'10px',color:'#ffe08a',fontStyle:'900'}).setOrigin(0.5).setScrollFactor(0).setDepth(181).setVisible(false);
    this.swapBtn=this.add.zone(swx,swy,84,84).setOrigin(0.5).setScrollFactor(0).setDepth(182).setInteractive({useHandCursor:true}).setVisible(false);
    this.swapBtn.on('pointerdown',()=>this.doSwap());
    this.swapGlow={setVisible(){},setAlpha(){}}; // legacy no-op
    // ability button
    const ax=W-54, ay=this.scale.height-58; this.abBtn={x:ax,y:ay,r:40};
    this.abG=this.add.graphics().setScrollFactor(0).setDepth(182);
    this.abIcon=this.add.text(ax,ay,OP(GAME.char).icon,{fontSize:'28px',fontStyle:'900',color:'#fff'}).setOrigin(0.5).setScrollFactor(0).setDepth(183);
    this.abLbl=this.add.text(ax,ay+46,OP(GAME.char).abName.toUpperCase(),{fontSize:'10px',fontStyle:'800',color:'#c9c6ea'}).setOrigin(0.5).setScrollFactor(0).setDepth(183);
    this.hud.toast=this.add.text(W/2,this.scale.height*0.34,'',{fontSize:'22px',fontStyle:'900',color:'#fff'}).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
    this.hud.killfeed=this.add.text(W/2,this.scale.height*0.42,'',{fontSize:'26px',fontStyle:'900',color:'#ff3b6b'}).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
    this.hudEls=[this.hud.bars,this.hud.hpTxt,this.hud.shTxt,this.hud.wpn,this.hud.alive,this.hud.kills,this.hud.zone,this.mmGfx,this.mmImg,this.muteBtn,this.abG,this.abIcon,this.abLbl];
  }
  toast(msg,col){ this.hud.toast.setText(msg).setTint(col||0xffffff).setAlpha(1); this.hud.toast.setY(this.scale.height*0.34);
    this.tweens.add({targets:this.hud.toast,alpha:0,y:this.scale.height*0.30,duration:900,delay:500}); }
  flashKill(){ this.hud.killfeed.setText('ELIMINATO').setAlpha(1).setScale(1.2); this.tweens.add({targets:this.hud.killfeed,alpha:0,scale:1,duration:300,delay:400}); }
  updateHUD(){
    const g=this.hud.bars; g.clear();
    const W=this.scale.width;
    // ---- status panel (top-left) ----
    const px=12,py=10,pw=Math.min(252,W*0.56),ph=62;
    this.hudPanel(g,px,py,pw,ph,C.cyan,0.5);
    this.hudBrackets(g,px,py,pw,ph,C.cyan,12);
    this.hudTicks(g,px+8,py+ph-2,pw,C.cyan,8);
    this.hudBar(g,px+10,py+12,pw-52,11,this.player.shield/this.player.maxshield,C.shield);
    this.hudBar(g,px+10,py+30,pw-52,13,this.player.hp/this.player.maxhp,this.player.hp>30?C.green:0xff3b6b);
    // numeric readouts
    this.hud.shTxt.setPosition(px+pw-38,py+12).setText(Math.round(this.player.shield));
    this.hud.hpTxt.setPosition(px+pw-38,py+30).setText(Math.round(this.player.hp));
    this.hud.wpn.setText(WEAPONS[this.player.weapon].name.toUpperCase()+'  ·  '+(GAME.mode==='auto'?'AUTO':'MANUAL'));
    this.hud.alive.setText(this.aliveCount+' VIVI'); this.hud.kills.setText('KILL '+this.kills);
    const z=this.zone; this.hud.zone.setText(z.state==='wait'?'⚠ ZONA SI RESTRINGE':(z.state==='shrink'?'▼ ZONA IN MOVIMENTO':'ZONA STABILE'));

    // ---- minimap with bracket frame ----
    const mg=this.mmGfx; mg.clear(); const {x,y,size}=this.mm, sx=size/WORLD_W, sy=size/WORLD_H;
    this.hudBrackets(mg,x-3,y-3,size+6,size+6,C.cyan,13);
    mg.lineStyle(1,C.cyan,0.35); mg.strokeRect(x,y,size,size);
    mg.lineStyle(2,C.safe,0.9); mg.strokeCircle(x+z.cx*sx,y+z.cy*sy,z.r*sx);
    mg.lineStyle(1,C.zone,0.9); mg.strokeCircle(x+z.tcx*sx,y+z.tcy*sy,z.tr*sx);
    this.loot.getChildren().forEach(l=>{ if(l.airdrop){ mg.fillStyle(C.gold,1); mg.fillCircle(x+l.x*sx,y+l.y*sy,3); }});
    const tnow=this.time.now;
    this.units.forEach(u=>{ if(!u.isPlayer&&u.alive&&u.scan>tnow){ mg.fillStyle(C.green,1); mg.fillCircle(x+u.s.x*sx,y+u.s.y*sy,2.5); }});
    // player arrow
    const pxm=x+this.player.s.x*sx, pym=y+this.player.s.y*sy, a=this.player.aim;
    mg.fillStyle(C.player,1);
    mg.fillTriangle(pxm+Math.cos(a)*6,pym+Math.sin(a)*6, pxm+Math.cos(a+2.5)*4,pym+Math.sin(a+2.5)*4, pxm+Math.cos(a-2.5)*4,pym+Math.sin(a-2.5)*4);
    this.redvig.setAlpha(this.player.hp<35?(1-this.player.hp/35)*0.55:0);

    // ---- ability: reticle ring ----
    const op=this.player.op, aax=this.abBtn.x, aay=this.abBtn.y, ar=this.abBtn.r, ready=tnow>=this.player.abReady;
    const ag=this.abG; ag.clear();
    ag.fillStyle(0x061018,0.75); ag.fillCircle(aax,aay,ar);
    ag.lineStyle(1.5,op.col,ready?0.9:0.35); ag.strokeCircle(aax,aay,ar);
    ag.lineStyle(1,op.col,ready?0.5:0.2); ag.strokeCircle(aax,aay,ar-7);
    // reticle ticks
    for(let i=0;i<8;i++){ const aa=i*Math.PI/4; ag.lineStyle(2,op.col,ready?0.85:0.3);
      ag.beginPath(); ag.moveTo(aax+Math.cos(aa)*(ar-4),aay+Math.sin(aa)*(ar-4)); ag.lineTo(aax+Math.cos(aa)*(ar+4),aay+Math.sin(aa)*(ar+4)); ag.strokePath(); }
    if(!ready){ const frac=Phaser.Math.Clamp(1-(this.player.abReady-tnow)/op.cd,0,1);
      ag.lineStyle(5,op.col,0.95); ag.beginPath(); ag.arc(aax,aay,ar-3,-Math.PI/2,-Math.PI/2+frac*Math.PI*2); ag.strokePath(); }
    else { ag.lineStyle(3,op.col,0.30); ag.strokeCircle(aax,aay,ar+6); }
    this.abIcon.setColor(ready?'#ffffff':'#6a6a9a');
  }
  drawZone(){
    const g=this.zoneGfx; g.clear(); const z=this.zone;
    g.lineStyle(10,C.zone,0.25); g.strokeCircle(z.cx,z.cy,z.r+22);
    g.lineStyle(6,C.zone,0.5); g.strokeCircle(z.cx,z.cy,z.r+8);
    g.lineStyle(3,C.zone,1); g.strokeCircle(z.cx,z.cy,z.r);
    // energy dots rotating on the boundary
    for(let i=0;i<48;i++){ const a=this.zoneRot+i/48*6.283; g.fillStyle(C.zone,0.8); g.fillCircle(z.cx+Math.cos(a)*z.r,z.cy+Math.sin(a)*z.r,2); }
    g.lineStyle(2,C.safe,0.5); g.strokeCircle(z.tcx,z.tcy,z.tr);
  }

  /* ------------- loop ------------- */
  update(time,delta){
    if(this.over) return;
    if(this.phase!=='live') return; // deploy & descent are driven by tweens
    if(!this.player.alive){ this.drawZone(); this.updateZoneState(delta); this.drawSticks(); return; }
    this.zoneRot+=0.01;
    const P=this.player, spd=210; let mvx=0,mvy=0;
    if(this.isTouch){ mvx=this.moveStick.dx; mvy=this.moveStick.dy; }
    if(this.keys.A.isDown||this.keys.LEFT.isDown) mvx=-1; if(this.keys.D.isDown||this.keys.RIGHT.isDown) mvx=1;
    if(this.keys.W.isDown||this.keys.UP.isDown) mvy=-1; if(this.keys.S.isDown||this.keys.DOWN.isDown) mvy=1;
    const ml=Math.hypot(mvx,mvy); if(ml>1){ mvx/=ml; mvy/=ml; }
    this._mvx=mvx; this._mvy=mvy;
    if(this.dash && time<this.dash.until){ P.s.body.setVelocity(this.dash.vx*720,this.dash.vy*720);
      if(!this._dashT||time-this._dashT>32){ this._dashT=time; const gh=this.add.image(P.s.x,P.s.y,P.charKey+'_'+P.frame).setAlpha(0.4).setDepth(5).setRotation(P.s.rotation); if(this.toWorld) this.toWorld(gh); this.tweens.add({targets:gh,alpha:0,duration:220,onComplete:()=>gh.destroy()}); }
    } else P.s.body.setVelocity(mvx*spd,mvy*spd);

    let aimAng=P.aim, firing=false;
    if(GAME.mode==='manual'){
      if(this.isTouch){ if(this.aimStick.active&&(Math.abs(this.aimStick.dx)+Math.abs(this.aimStick.dy))>0.25){ aimAng=Math.atan2(this.aimStick.dy,this.aimStick.dx); firing=true; } }
      else { aimAng=Phaser.Math.Angle.Between(P.s.x,P.s.y,this.pointerAim.x,this.pointerAim.y); firing=this.pointerAim.down; }
      if(!firing&&ml>0.1) aimAng=Math.atan2(mvy,mvx);
    } else {
      const w=WEAPONS[P.weapon]; const view=this.cameras.main.worldView; let best=null,bd=w.range;
      this.units.forEach(u=>{ if(u===P||!u.alive) return; if(!view.contains(u.s.x,u.s.y)) return;
        const d=Phaser.Math.Distance.Between(P.s.x,P.s.y,u.s.x,u.s.y); if(d<bd){bd=d;best=u;} });
      if(best){ aimAng=Phaser.Math.Angle.Between(P.s.x,P.s.y,best.s.x,best.s.y); firing=true; } else if(ml>0.1) aimAng=Math.atan2(mvy,mvx);
    }
    P.aim=aimAng; P.s.setRotation(aimAng); if(firing) this.shoot(P,aimAng);

    // bullets
    this.bullets.getChildren().forEach(b=>{ if(!b.active) return;
      if(this.dome && time<this.dome.until && b.owner!==this.dome.owner && Phaser.Math.Distance.Between(b.x,b.y,this.dome.x,this.dome.y)<this.dome.r){ this.hitSpark(b.x,b.y); b.destroy(); return; }
      if(b.behavior==='homing'&&b.turn){ let tgt=null,td=520; this.units.forEach(u=>{ if(!u.alive||u===b.owner) return;
          const d=Phaser.Math.Distance.Between(b.x,b.y,u.s.x,u.s.y); if(d<td){td=d;tgt=u;} });
        if(tgt){ const cur=Math.atan2(b.body.velocity.y,b.body.velocity.x), want=Phaser.Math.Angle.Between(b.x,b.y,tgt.s.x,tgt.s.y);
          const na=Phaser.Math.Angle.RotateTo(cur,want,b.turn); const sp=b.body.velocity.length();
          b.body.velocity.x=Math.cos(na)*sp; b.body.velocity.y=Math.sin(na)*sp; b.setRotation(na); } }
      if(Phaser.Math.Distance.Between(b.x,b.y,b.sx,b.sy)>b.maxDist){ b.destroy(); return; }
      for(let k=0;k<this.units.length;k++){ const u=this.units[k];
        if(!u.alive||b.owner===u) continue;
        const dx=b.x-u.s.x; if(dx>18||dx<-18) continue;      // cheap broad-phase
        const dy=b.y-u.s.y; if(dy>18||dy<-18) continue;
        if(dx*dx+dy*dy<324){ if(this.bulletHitUnit(b,u)) break; } }
    });

    this.updateBots(time);
    this.syncGuns();
    this.halo.setPosition(P.s.x,P.s.y);
    // cloak visual
    const cloaked=P.cloak>time; P.s.setAlpha(cloaked?0.28:1); P.gun.setAlpha(cloaked?0.28:1); this.halo.setVisible(!cloaked);
    // scan markers (world)
    this.markGfx.clear();
    this.units.forEach(u=>{ if(u.isPlayer||!u.alive||!(u.scan>time)) return;
      this.markGfx.lineStyle(2,C.green,0.9); this.markGfx.strokeCircle(u.s.x,u.s.y,24);
      this.markGfx.fillStyle(C.green,0.95); this.markGfx.fillTriangle(u.s.x-6,u.s.y-36,u.s.x+6,u.s.y-36,u.s.x,u.s.y-26); });
    // weapon swap prompt (player standing on a ground weapon)
    if(this._wprompt&&this._wprompt.loot.active&&time-this._wprompt.t<140){
      const wk=this._wprompt.loot.payload, wc=WEAPONS[wk].col;
      this.swapIcon.setTexture('wpn_'+wk);
      this.swapTxt.setText(WEAPONS[wk].name.toUpperCase());
      const g=this.swapG; g.clear();
      g.fillStyle(0x061018,0.8); g.fillCircle(this.swapPos.x,this.swapPos.y,this.swapPos.r);
      g.lineStyle(2.5,wc,0.95); g.strokeCircle(this.swapPos.x,this.swapPos.y,this.swapPos.r);
      g.lineStyle(2,wc,0.25+0.2*Math.sin(time/160)); g.strokeCircle(this.swapPos.x,this.swapPos.y,this.swapPos.r+5);
      this.swapG.setVisible(true); this.swapIcon.setVisible(true); this.swapTxt.setVisible(true).setColor(hexStr(wc)); this.swapBtn.setVisible(true);
    } else if(this.swapBtn.visible){ this.swapG.clear(); this.swapG.setVisible(false); this.swapIcon.setVisible(false); this.swapTxt.setVisible(false); this.swapBtn.setVisible(false); this._wprompt=null; }
    if(Phaser.Input.Keyboard.JustDown(this.keys.F)) this.doSwap();
    if(Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.activateAbility();
    this.drawZone(); this.updateZoneState(delta); this.updateHUD(); this.drawSticks();
  }

  syncGuns(){ const t=this.time.now; this.units.forEach(u=>{ if(!u.alive) return;
    const b=u.s.body, moving = b && (Math.abs(b.velocity.x)+Math.abs(b.velocity.y))>25;
    let fr;
    if(u.fireT>t) fr=5;
    else fr = moving ? (1+Math.floor(t/110)%4) : 0;
    if(fr!==u.frame){ u.frame=fr; u.s.setTexture(u.charKey+'_'+fr); }
    const base = u.isPlayer && u.skin ? u.skin.tint : 0xffffff;
    u.s.setTint(u.outside?0xff6688:base);
    if(u.skinHalo){ u.skinHalo.setPosition(u.s.x,u.s.y); } }); }

  updateZoneState(delta){ const z=this.zone; z.timer-=delta;
    if(z.state==='wait'){ if(z.timer<=0){ this.advanceZone(); z.state='shrink'; z.timer=this.cfg.shrink; z.sr=z.r; z.scx=z.cx; z.scy=z.cy; } }
    else if(z.state==='shrink'){ const p=1-Phaser.Math.Clamp(z.timer/this.cfg.shrink,0,1);
      z.r=Phaser.Math.Linear(z.sr,z.tr,p); z.cx=Phaser.Math.Linear(z.scx,z.tcx,p); z.cy=Phaser.Math.Linear(z.scy,z.tcy,p);
      if(z.timer<=0){ z.state=z.phase>=this.phaseRadii.length?'final':'wait'; z.timer=this.cfg.wait; } } }

  updateBots(time){
    this.units.forEach(u=>{ if(u.isPlayer||!u.alive) return; const ai=u.ai,s=u.s,w=WEAPONS[u.weapon];
      const dz=Phaser.Math.Distance.Between(s.x,s.y,this.zone.cx,this.zone.cy);
      if(dz>this.zone.r-140) ai.state='flee';
      // heavy scans only a few times per second (staggered)
      if(time>ai.think){ ai.think=time+280+Phaser.Math.Between(0,140);
        let tgt=null,td=(SCOPED[u.weapon]?w.range:Math.min(w.range,600))*1.05; this.units.forEach(o=>{ if(o===u||!o.alive) return; if(o.cloak>time) return; const d=Phaser.Math.Distance.Between(s.x,s.y,o.s.x,o.s.y); if(d<td){td=d;tgt=o;} });
        ai.tgt=tgt;
        let lt=null,ld=300; if(w.tier<2||u.hp<60){ this.loot.getChildren().forEach(l=>{ if(!l.active) return; const d=Phaser.Math.Distance.Between(s.x,s.y,l.x,l.y); if(d<ld){ld=d;lt=l;} }); }
        ai.lt=lt;
        if(ai.state==='flee'&&dz<this.zone.r-220) ai.state='wander';
      }
      let tgt=ai.tgt; if(tgt&&!tgt.alive){ tgt=ai.tgt=null; }
      let lt=ai.lt; if(lt&&!lt.active){ lt=ai.lt=null; }
      let vx=0,vy=0; const spd=150;
      if(ai.state==='flee'){ const a=Phaser.Math.Angle.Between(s.x,s.y,this.zone.cx,this.zone.cy); vx=Math.cos(a); vy=Math.sin(a);
        if(tgt){ s.setRotation(Phaser.Math.Angle.Between(s.x,s.y,tgt.s.x,tgt.s.y)); this.botShoot(u,tgt); } }
      else if(tgt){ const a=Phaser.Math.Angle.Between(s.x,s.y,tgt.s.x,tgt.s.y); s.setRotation(a);
        const dist=Phaser.Math.Distance.Between(s.x,s.y,tgt.s.x,tgt.s.y), ideal=w.range*0.6;
        if(dist>ideal+40){ vx=Math.cos(a); vy=Math.sin(a); } else if(dist<ideal-40){ vx=-Math.cos(a); vy=-Math.sin(a); }
        if(time>ai.retarget){ ai.strafe*=-1; ai.retarget=time+Phaser.Math.Between(600,1400); }
        vx+=Math.cos(a+Math.PI/2)*ai.strafe*0.7; vy+=Math.sin(a+Math.PI/2)*ai.strafe*0.7; this.botShoot(u,tgt); }
      else if(lt){ const a=Phaser.Math.Angle.Between(s.x,s.y,lt.x,lt.y); vx=Math.cos(a); vy=Math.sin(a); s.setRotation(a);
        if(Phaser.Math.Distance.Between(s.x,s.y,lt.x,lt.y)<28){ this.pickup(u,lt); ai.lt=null; } }
      else { if(time>ai.retarget||Phaser.Math.Distance.Between(s.x,s.y,ai.tx,ai.ty)<40){ const sp=this.freeSpot(); ai.tx=sp.x; ai.ty=sp.y; ai.retarget=time+Phaser.Math.Between(1500,3500); }
        const a=Phaser.Math.Angle.Between(s.x,s.y,ai.tx,ai.ty); vx=Math.cos(a); vy=Math.sin(a); s.setRotation(a); }
      const l=Math.hypot(vx,vy)||1; s.body.setVelocity(vx/l*spd,vy/l*spd);
    });
  }
  inView(x,y,pad){ const v=this.cameras.main.worldView, m=pad||120;
    return x>v.x-m && x<v.right+m && y>v.y-m && y<v.bottom+m; }

  botShoot(u,tgt){ const w=WEAPONS[u.weapon]; const d=Phaser.Math.Distance.Between(u.s.x,u.s.y,tgt.s.x,tgt.s.y); if(d>w.range) return;
    // fairness: a non-scoped bot can only fire at the player if it's on the player's screen
    if(tgt.isPlayer && !SCOPED[u.weapon] && !this.inView(u.s.x,u.s.y,0)) return;
    // PERF: bot-vs-bot fights off screen are resolved abstractly (no bullets, no particles)
    if(!tgt.isPlayer && !this.inView(u.s.x,u.s.y) && !this.inView(tgt.s.x,tgt.s.y)){
      if(this.time.now-u.lastShot < w.rate) return; u.lastShot=this.time.now;
      if(Math.random()<0.35) this.applyDamage(tgt, w.dmg*w.pellets*0.8, u);
      return;
    }
    const a=Phaser.Math.Angle.Between(u.s.x,u.s.y,tgt.s.x,tgt.s.y)+Phaser.Math.FloatBetween(-0.08,0.08); this.shoot(u,a); }

  /* ------------- end ------------- */
  endMatch(win){
    if(this.over) return; this.over=true; this.physics.pause(); SFX.music(false);
    this.tweens.killTweensOf(this.cameras.main); this.cameras.main.setZoom(1);
    if(this.swapBtn){ this.swapBtn.setVisible(false); this.swapTxt.setVisible(false); this.swapIcon.setVisible(false); this.swapG.clear(); this.swapG.setVisible(false); } if(this.redvig) this.redvig.setAlpha(0);
    const place=win?1:Math.max(1,this.aliveCount+(this.player.alive?0:1));
    const durationSec=Math.round((this.time.now-this.startTime)/1000);
    const mult=GAME.mode==='manual'?1.5:1.0;
    const placePts=Math.round(250*(TOTAL_PLAYERS-place)/(TOTAL_PLAYERS-1));
    const killPts=this.kills*100;
    const score=Math.round((placePts+killPts)*mult);
    const credits=Math.round(score/5);
    const matchId=(Date.now().toString(36)+Math.random().toString(36).slice(2,8)).toUpperCase();
    const payload={v:1,app:'nexus-royale',matchId,ts:Date.now(),char:GAME.char,mode:GAME.mode,kills:this.kills,placement:place,durationSec,score,credits};
    let code=''; try{ code=btoa(JSON.stringify(payload)); }catch(e){ code=JSON.stringify(payload); }
    const rec=Profile.record({kills:this.kills,win,placement:place,credits,mode:GAME.mode,damage:this.damageDealt,durationSec,score,op:GAME.char});
    this.showResults(win,{place,kills:this.kills,durationSec,score,credits,mult,placePts,killPts,code,earned:rec.earned,bonus:rec.bonus,total:Profile.data.credits});
  }
  showResults(win,r){
    const W=this.scale.width,H=this.scale.height,cx=W/2;
    this.add.rectangle(0,0,W,H,0x05040d,0.88).setOrigin(0).setScrollFactor(0).setDepth(300);
    this.add.text(cx,H*0.12,win?'#1 · VITTORIA':'ELIMINATO',{fontFamily:TITLE_FONT,fontSize:Math.min(34,W*0.08)+'px',fontStyle:'900',color:win?'#ffd23f':'#ff3b6b'}).setOrigin(0.5).setScrollFactor(0).setDepth(301).setShadow(0,0,win?'#ff2ea6':'#000',20);
    const rows=[['Piazzamento','#'+r.place+' / '+TOTAL_PLAYERS],['Eliminazioni',r.kills],['Punti piazzamento',r.placePts],['Punti uccisioni',r.killPts],['Moltiplicatore','×'+r.mult+(GAME.mode==='manual'?' (manuale)':' (auto)')]];
    rows.forEach((row,i)=>{ const y=H*0.25+i*30;
      this.add.text(cx-Math.min(150,W*0.4),y,row[0],{fontSize:'16px',color:'#8a86c8'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(301);
      this.add.text(cx+Math.min(150,W*0.4),y,''+row[1],{fontSize:'16px',color:'#e8e6ff',fontStyle:'800'}).setOrigin(1,0.5).setScrollFactor(0).setDepth(301); });
    this.add.text(cx,H*0.45,r.score.toLocaleString('it')+' PUNTI',{fontFamily:TITLE_FONT,fontSize:Math.min(26,W*0.064)+'px',fontStyle:'900',color:'#33e1ff'}).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(cx,H*0.505,'+'+r.earned+' CREDITI',{fontSize:'16px',fontStyle:'800',color:'#35e06a'}).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    if(r.bonus>0) this.add.text(cx,H*0.54,'+'+r.bonus+' bonus sfide!',{fontSize:'14px',fontStyle:'800',color:'#ffd23f'}).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(cx,H*0.57,'totale ◆ '+r.total,{fontSize:'12px',color:'#a8a4d0',fontStyle:'700'}).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(cx,H*0.625,'crediti accumulati nel profilo\nusali per skin/operatori oppure inviali a InkAnimus',{fontSize:'10px',color:'#8a86c8',align:'center',lineSpacing:3}).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    const copy=this.add.rectangle(cx,H*0.78,Math.min(300,W*0.7),46,0x14102b).setStrokeStyle(2,C.gold).setScrollFactor(0).setDepth(301).setInteractive({useHandCursor:true});
    const copyT=this.add.text(cx,H*0.78,'⧉  COPIA CODICE',{fontSize:'16px',color:'#ffd23f',fontStyle:'800'}).setOrigin(0.5).setScrollFactor(0).setDepth(302);
    copy.on('pointerdown',()=>{ try{ navigator.clipboard.writeText(r.code); copyT.setText('✓ COPIATO'); }catch(e){ copyT.setText('✓ (seleziona il codice)'); } });
    const again=this.add.rectangle(cx-Math.min(78,W*0.2),H*0.87,Math.min(150,W*0.4),50,0x14102b).setStrokeStyle(2,C.player).setScrollFactor(0).setDepth(301).setInteractive({useHandCursor:true});
    this.add.text(cx-Math.min(78,W*0.2),H*0.87,'↻ RIGIOCA',{fontSize:'16px',color:'#33e1ff',fontStyle:'900'}).setOrigin(0.5).setScrollFactor(0).setDepth(302);
    again.on('pointerdown',()=>{ SFX.ui(); this.scene.start('Game'); });
    const menuB=this.add.rectangle(cx+Math.min(78,W*0.2),H*0.87,Math.min(150,W*0.4),50,0x14102b).setStrokeStyle(2,0x3a3470).setScrollFactor(0).setDepth(301).setInteractive({useHandCursor:true});
    this.add.text(cx+Math.min(78,W*0.2),H*0.87,'MENU',{fontSize:'16px',color:'#c9c6ea',fontStyle:'900'}).setOrigin(0.5).setScrollFactor(0).setDepth(302);
    menuB.on('pointerdown',()=>{ SFX.ui(); this.scene.start('Menu'); });
  }
  wrap(str,n){ let out=''; for(let i=0;i<str.length;i+=n) out+=str.slice(i,i+n)+'\n'; return out.trim(); }
}

const config={ type:Phaser.AUTO, parent:'game', backgroundColor:'#060410',
  scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},
  physics:{default:'arcade',arcade:{gravity:{y:0},debug:false}},
  scene:[Boot,Splash,Tutorial,Menu,Loadout,Game], render:{pixelArt:false,antialias:true} };
function startGame(){ new Phaser.Game(config); }
if(document.fonts && document.fonts.load){
  Promise.race([ document.fonts.load('900 40px Orbitron').then(()=>document.fonts.ready), new Promise(r=>setTimeout(r,2500)) ]).then(startGame).catch(startGame);
} else startGame();
