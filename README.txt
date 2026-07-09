NEXUS ROYALE — repo
===================

FILE
  index.html    carica Phaser (CDN) + game.js
  game.js       tutto il gioco
  assets/       immagini che PUOI SOSTITUIRE TU
  manifest.json PWA
  sw.js         cache offline

PUBBLICARE
  Carica tutta la cartella su Cloudflare Pages / Netlify / Vercel / GitHub Pages
  e apri l'URL. (Aperto come file:// le immagini non caricano: il gioco usa
  automaticamente i disegni di riserva e non si rompe.)

SOSTITUIRE LE IMMAGINI  (mantieni gli stessi NOMI FILE)
  assets/splash.jpg    -> immagine della schermata iniziale (verticale, es. 900px di altezza)
  assets/op_vyre.png   -> icona operatore VYRE
  assets/op_nova.png   -> icona operatore NOVA
  assets/op_oracle.png -> icona operatore ORACLE
  assets/op_aegis.png  -> icona operatore AEGIS
  assets/op_omega.png  -> icona operatore OMEGA
  assets/op_bot.png    -> icona bot (per usi futuri)

  Icone: PNG con sfondo trasparente, personaggio intero, altezza ~140px.
  Dopo ogni modifica: alza la versione CACHE in sw.js (es. -v3) per forzare l'aggiornamento.

PRESTAZIONI
  In gioco: menu > OPZIONI > QUALITÀ (BASSA / MEDIA / ALTA).
  BASSA riduce bot ed effetti. Se il telefono scatta, parti da lì.
  Nel codice: TOTAL_PLAYERS e matchCfg() in cima a game.js.

DA FARE
  - Video al posto di splash.jpg per l'intro.
  - Tileset urbani per la mappa.
  - Aggancio del CODICE PARTITA a InkAnimus (import crediti).
