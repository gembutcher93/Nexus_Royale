NEXUS ROYALE — repo
===================

FILE
  index.html          carica Phaser (CDN) + assets_fallback.js + game.js
  game.js             tutto il gioco
  assets_fallback.js  copia incorporata delle immagini (serve SOLO se i file non caricano)
  assets/             immagini e video che PUOI SOSTITUIRE TU
  manifest.json       PWA
  sw.js               cache offline

APRIRE / PUBBLICARE
  - Online: carica tutta la cartella su Cloudflare Pages / Netlify / Vercel / GitHub Pages.
  - In locale (doppio clic su index.html): il browser blocca il caricamento dei file
    per sicurezza. In quel caso il gioco recupera automaticamente le immagini da
    assets_fallback.js, quindi FUNZIONA LO STESSO. Il VIDEO però non parte in locale:
    si vede l'immagine fissa. Online parte tutto.

SOSTITUIRE GLI ASSET  (mantieni gli stessi NOMI FILE)
  assets/intro.mp4     video della schermata iniziale (verticale, muto, corto)
  assets/splash.jpg    immagine iniziale, usata se il video non c'è
  assets/op_vyre.png   icona VYRE
  assets/op_nova.png   icona NOVA
  assets/op_oracle.png icona ORACLE
  assets/op_aegis.png  icona AEGIS
  assets/op_omega.png  icona OMEGA
  assets/op_bot.png    icona BOT
  Icone: PNG trasparente, personaggio intero, altezza ~200px.

  Dopo ogni modifica: alza la versione CACHE in sw.js (es. -v4).
  Nota: assets_fallback.js contiene le VECCHIE immagini; se ne cambi una e vuoi che il
  fallback locale sia aggiornato, va rigenerato (altrimenti online è comunque corretto).

FLUIDITÀ  (i giocatori restano SEMPRE 100)
  In gioco: menu > OPZIONI > EFFETTI GRAFICI: BASSI / MEDI / ALTI.
  Cambia solo particelle, bagliori e scosse camera. La scelta viene salvata.

DA FARE
  - Tileset urbani per la mappa.
  - Aggancio del CODICE PARTITA a InkAnimus (import crediti).
