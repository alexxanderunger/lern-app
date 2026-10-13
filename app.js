// Buchstaben nachspuren: Das Kind malt über einen grauen Buchstaben.
// Geprüft wird per Pixelvergleich – ist jeder Teil des Buchstabens übermalt
// und wie viel wurde daneben gemalt.

const BUCHSTABEN = [
  { b: 'A', wort: 'Apfel', bild: '🍎' },
  { b: 'B', wort: 'Ball', bild: '⚽' },
  { b: 'C', wort: 'Clown', bild: '🤡' },
  { b: 'D', wort: 'Dino', bild: '🦕' },
  { b: 'E', wort: 'Elefant', bild: '🐘' },
  { b: 'F', wort: 'Fisch', bild: '🐟' },
  { b: 'G', wort: 'Giraffe', bild: '🦒' },
  { b: 'H', wort: 'Hund', bild: '🐶' },
  { b: 'I', wort: 'Igel', bild: '🦔' },
  { b: 'J', wort: 'Jacke', bild: '🧥' },
  { b: 'K', wort: 'Katze', bild: '🐱' },
  { b: 'L', wort: 'Löwe', bild: '🦁' },
  { b: 'M', wort: 'Maus', bild: '🐭' },
  { b: 'N', wort: 'Nase', bild: '👃' },
  { b: 'O', wort: 'Oma', bild: '👵' },
  { b: 'P', wort: 'Pinguin', bild: '🐧' },
  { b: 'Q', wort: 'Quadrat', bild: '🟥' },
  { b: 'R', wort: 'Rakete', bild: '🚀' },
  { b: 'S', wort: 'Sonne', bild: '☀️' },
  { b: 'T', wort: 'Tiger', bild: '🐯' },
  { b: 'U', wort: 'Uhr', bild: '⏰' },
  { b: 'V', wort: 'Vogel', bild: '🐦' },
  { b: 'W', wort: 'Wal', bild: '🐳' },
  { b: 'X', wort: 'Xylofon', bild: '🎶' },
  { b: 'Y', wort: 'Yoga', bild: '🧘' },
  { b: 'Z', wort: 'Zebra', bild: '🦓' },
];

// stamm: Strichstärke der Schrift als Anteil der Schriftgröße (im Browser gemessen).
// maxFaktor: begrenzt, wie stark kleine Buchstaben vergrößert werden.
const SCHRIFTEN = {
  druck: { name: 'Druckschrift', familie: '"Andika", "Comic Sans MS", sans-serif', stamm: 0.09, maxFaktor: 1.3 },
  grund: { name: 'Grundschrift', familie: '"Playwrite DE Grund", "Andika", sans-serif', stamm: 0.09, maxFaktor: 1.3 },
  schreib: { name: 'Schreibschrift', familie: '"Playwrite DE LA", "Andika", sans-serif', stamm: 0.09, maxFaktor: 1.3 },
};
const GROESSEN = { gross: 1, mittel: 0.75, klein: 0.55 };
const MAX_STERNE = 3;

// Alle Pixelmaße gelten für die Größe "gross" und werden mit der gewählten Größe skaliert.
const GROESSE = 600;          // interne Auflösung der Zeichenfläche
const STIFTBREITE = 50;
const LINIENBREITE = 46;      // so breit wird die graue Vorlage mindestens gezeichnet
const KERNBREITE = 22;        // Breite der Mittellinie, die getroffen werden muss
const FELD = 24;              // Kantenlänge der Prüffelder, in die die Mittellinie aufgeteilt wird
const FELD_MIN_ANTEIL = 0.05; // Felder mit weniger Mittellinie zählen nicht mit
const FELD_ZIEL = 0.35;       // so viel von der Mittellinie in einem Feld muss übermalt sein
const FELDER_OFFEN_ERLAUBT = 1;
const MAX_DANEBEN = 0.6;      // höchstens so viel der Farbe darf neben dem Buchstaben liegen
const NOCHMAL_PAUSE = 1800;   // Millisekunden bis zur nächsten Wiederholung

const SPEICHER_STERNE = 'buchstaben-sterne';
const SPEICHER_ALT = 'buchstaben-geschafft';
const SPEICHER_EINSTELLUNGEN = 'buchstaben-einstellungen';

const vorlage = document.getElementById('vorlage');
const zeichnung = document.getElementById('zeichnung');
const vctx = vorlage.getContext('2d', { willReadFrequently: true });
const zctx = zeichnung.getContext('2d', { willReadFrequently: true });
const kernCanvas = document.createElement('canvas');
kernCanvas.width = kernCanvas.height = GROESSE;
const kctx = kernCanvas.getContext('2d', { willReadFrequently: true });

const tafel = document.getElementById('tafel');
const stern = document.getElementById('stern');
const sterneAnzeige = document.getElementById('sterne');
const fortschritt = document.getElementById('fortschritt');
const hinweis = document.getElementById('hinweis');
const weiterKnopf = document.getElementById('weiter');
const auswahl = document.getElementById('auswahl');
const dialog = document.getElementById('einstellungen');

let index = 0;
let klein = false;
let maske = null;       // 1 für jeden Pixel, der zum Buchstaben gehört
let kern = null;        // 1 für jeden Pixel der Mittellinie
let felder = null;      // Mittellinien-Pixel je Prüffeld
let feld = FELD;        // Kantenlänge der Prüffelder bei der gewählten Größe
let felderProZeile = 0;
let malt = false;
let fertig = false;
let nochmalTimer = 0;
let sterne = ladeSterne();
let einstellungen = ladeEinstellungen();

function lies(schluessel) {
  try {
    return JSON.parse(localStorage.getItem(schluessel));
  } catch {
    return null;
  }
}

function schreib(schluessel, wert) {
  try {
    localStorage.setItem(schluessel, JSON.stringify(wert));
  } catch {
    // Ohne Speicher (z. B. privates Fenster) läuft die App trotzdem.
  }
}

function ladeSterne() {
  const gespeichert = lies(SPEICHER_STERNE);
  if (gespeichert && typeof gespeichert === 'object') return gespeichert;
  // Frühere Versionen merkten sich nur "geschafft" – das zählt als ein Stern.
  const alt = lies(SPEICHER_ALT);
  const start = {};
  if (Array.isArray(alt)) alt.forEach((z) => { start[z] = 1; });
  return start;
}

function ladeEinstellungen() {
  const e = lies(SPEICHER_EINSTELLUNGEN) || {};
  return {
    schrift: SCHRIFTEN[e.schrift] ? e.schrift : 'druck',
    groesse: GROESSEN[e.groesse] ? e.groesse : 'gross',
  };
}

function zeichen() {
  const b = BUCHSTABEN[index].b;
  return klein ? b.toLowerCase() : b;
}

function sprich(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const ansage = new SpeechSynthesisUtterance(text);
  ansage.lang = 'de-DE';
  ansage.rate = 0.9;
  speechSynthesis.speak(ansage);
}

function liesVor() {
  const { b, wort } = BUCHSTABEN[index];
  sprich(`${b} wie ${wort}`);
}

// Zeichnet den Buchstaben und macht seine Linie um "delta" Pixel je Seite dicker (positiv) oder dünner (negativ).
function zeichneGlyphe(ctx, z, x, y, delta) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillText(z, x, y);
  if (Math.abs(delta) < 0.5) return;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2 * Math.abs(delta);
  if (delta < 0) ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeText(z, x, y);
  ctx.globalCompositeOperation = 'source-over';
}

function zeichneVorlage() {
  const z = zeichen();
  const schrift = SCHRIFTEN[einstellungen.schrift];
  const mass = GROESSEN[einstellungen.groesse];

  // Erst bei fester Größe messen, dann so skalieren, dass der Buchstabe die Tafel gut füllt.
  vctx.font = `400px ${schrift.familie}`;
  let m = vctx.measureText(z);
  const breite = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const hoehe = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const schriftPx = 400 * Math.min(400 / breite, 440 / hoehe, schrift.maxFaktor) * mass;
  const font = `${Math.round(schriftPx)}px ${schrift.familie}`;

  vctx.font = font;
  m = vctx.measureText(z);
  const b = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const x = (GROESSE - b) / 2 + m.actualBoundingBoxLeft;
  const y = (GROESSE - h) / 2 + m.actualBoundingBoxAscent;

  // Dünne Schriften werden zur Vorlage verdickt; die Mittellinie ist bei jeder Schrift gleich breit.
  const stammPx = schrift.stamm * schriftPx;
  const deltaVorlage = Math.max(0, (LINIENBREITE * mass - stammPx) / 2);
  const deltaKern = (KERNBREITE * mass - stammPx) / 2;

  for (const ctx of [vctx, kctx]) {
    ctx.clearRect(0, 0, GROESSE, GROESSE);
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ctx.strokeStyle = '#d9d9d9';
  }
  zeichneGlyphe(vctx, z, x, y, deltaVorlage);
  zeichneGlyphe(kctx, z, x, y, deltaKern);

  const daten = vctx.getImageData(0, 0, GROESSE, GROESSE).data;
  const kernDaten = kctx.getImageData(0, 0, GROESSE, GROESSE).data;

  feld = Math.max(10, Math.round(FELD * mass));
  felderProZeile = Math.ceil(GROESSE / feld);
  maske = new Uint8Array(GROESSE * GROESSE);
  kern = new Uint8Array(GROESSE * GROESSE);
  felder = new Uint32Array(felderProZeile * felderProZeile);
  for (let i = 0; i < maske.length; i++) {
    if (daten[i * 4 + 3] > 128) maske[i] = 1;
    if (kernDaten[i * 4 + 3] > 128) {
      kern[i] = 1;
      felder[feldVon(i)]++;
    }
  }

  zctx.lineWidth = STIFTBREITE * mass;
}

function feldVon(pixel) {
  const x = pixel % GROESSE;
  const y = (pixel - x) / GROESSE;
  return Math.floor(y / feld) * felderProZeile + Math.floor(x / feld);
}

function leereZeichnung() {
  clearTimeout(nochmalTimer);
  zctx.clearRect(0, 0, GROESSE, GROESSE);
  fortschritt.style.width = '0';
  hinweis.textContent = '';
  fertig = false;
  weiterKnopf.classList.remove('blinken');
  stern.classList.remove('zeigen');
}

function sternReihe(anzahl) {
  const reihe = document.createDocumentFragment();
  for (let i = 0; i < MAX_STERNE; i++) {
    const s = document.createElement('span');
    s.textContent = '★';
    if (i < anzahl) s.classList.add('voll');
    reihe.appendChild(s);
  }
  return reihe;
}

function zeichneSterne() {
  sterneAnzeige.replaceChildren(sternReihe(sterne[zeichen()] || 0));
}

function zeigeBuchstabe() {
  const { wort, bild } = BUCHSTABEN[index];
  document.getElementById('bild').textContent = bild;
  document.getElementById('wort').textContent = wort;
  zeichneVorlage();
  leereZeichnung();
  zeichneSterne();
  zeichneAuswahl();
}

function zeichneAuswahl() {
  auswahl.innerHTML = '';
  BUCHSTABEN.forEach((eintrag, i) => {
    const z = klein ? eintrag.b.toLowerCase() : eintrag.b;
    const knopf = document.createElement('button');
    const buchstabe = document.createElement('span');
    buchstabe.textContent = z;
    const mini = document.createElement('span');
    mini.className = 'mini';
    mini.appendChild(sternReihe(sterne[z] || 0));
    knopf.append(buchstabe, mini);
    if ((sterne[z] || 0) >= MAX_STERNE) knopf.classList.add('geschafft');
    if (i === index) knopf.classList.add('aktiv');
    knopf.addEventListener('click', () => wechsle(i));
    auswahl.appendChild(knopf);
  });
}

function wechsle(neuerIndex) {
  index = (neuerIndex + BUCHSTABEN.length) % BUCHSTABEN.length;
  zeigeBuchstabe();
  liesVor();
}

function position(ereignis) {
  const r = zeichnung.getBoundingClientRect();
  return {
    x: (ereignis.clientX - r.left) * (GROESSE / r.width),
    y: (ereignis.clientY - r.top) * (GROESSE / r.height),
  };
}

function pruefe() {
  const daten = zctx.getImageData(0, 0, GROESSE, GROESSE).data;
  const bemalt = new Uint32Array(felder.length);
  let drin = 0;
  let daneben = 0;
  for (let i = 0; i < maske.length; i++) {
    if (daten[i * 4 + 3] > 60) {
      if (maske[i]) drin++;
      else daneben++;
      if (kern[i]) bemalt[feldVon(i)]++;
    }
  }
  const anteilDaneben = daneben / Math.max(1, drin + daneben);

  // Jedes Feld der Mittellinie muss getroffen sein – so fällt auch ein kurzer fehlender Strich auf,
  // ohne dass der Buchstabe in voller Breite ausgemalt werden muss.
  let gesamt = 0;
  let erledigt = 0;
  for (let f = 0; f < felder.length; f++) {
    if (felder[f] < feld * feld * FELD_MIN_ANTEIL) continue;
    gesamt++;
    if (bemalt[f] >= felder[f] * FELD_ZIEL) erledigt++;
  }

  fortschritt.style.width = `${(erledigt / gesamt) * 100}%`;

  if (gesamt - erledigt > FELDER_OFFEN_ERLAUBT) return;

  if (anteilDaneben > MAX_DANEBEN) {
    hinweis.textContent = 'Bleib auf dem Buchstaben! 🧽';
    tafel.classList.remove('wackeln');
    void tafel.offsetWidth; // Animation neu starten
    tafel.classList.add('wackeln');
    sprich('Bleib auf dem Buchstaben. Versuch es noch einmal.');
    return;
  }

  belohne();
}

// Jede gelungene Wiederholung bringt einen Stern, bis zu drei je Buchstabe.
function belohne() {
  fertig = true;
  const z = zeichen();
  const vorher = sterne[z] || 0;
  const jetzt = Math.min(MAX_STERNE, vorher + 1);
  sterne[z] = jetzt;
  schreib(SPEICHER_STERNE, sterne);
  zeichneSterne();
  zeichneAuswahl();

  stern.classList.remove('zeigen');
  void stern.offsetWidth;
  stern.classList.add('zeigen');

  if (jetzt < MAX_STERNE) {
    hinweis.textContent = 'Super! Gleich noch einmal!';
    sprich(jetzt === 1 ? 'Super! Ein Stern. Gleich noch einmal!' : 'Toll! Zwei Sterne. Noch einmal!');
    nochmalTimer = setTimeout(leereZeichnung, NOCHMAL_PAUSE);
    return;
  }

  hinweis.textContent = vorher < MAX_STERNE ? 'Drei Sterne! Geschafft!' : 'Super!';
  sprich(vorher < MAX_STERNE ? 'Drei Sterne! Du hast es geschafft!' : 'Super gemacht!');
  weiterKnopf.classList.add('blinken');
}

zctx.lineCap = 'round';
zctx.lineJoin = 'round';
zctx.strokeStyle = '#2f6fed';

zeichnung.addEventListener('pointerdown', (e) => {
  if (fertig) return;
  malt = true;
  zeichnung.setPointerCapture(e.pointerId);
  const p = position(e);
  zctx.beginPath();
  zctx.moveTo(p.x, p.y);
  // Ein winziger Strich, damit auch ein Tipper einen Punkt hinterlässt.
  zctx.lineTo(p.x + 0.1, p.y);
  zctx.stroke();
});

zeichnung.addEventListener('pointermove', (e) => {
  if (!malt) return;
  const p = position(e);
  zctx.lineTo(p.x, p.y);
  zctx.stroke();
});

function beendeStrich() {
  if (!malt) return;
  malt = false;
  pruefe();
}

zeichnung.addEventListener('pointerup', beendeStrich);
zeichnung.addEventListener('pointercancel', beendeStrich);

document.getElementById('vorlesen').addEventListener('click', liesVor);
document.getElementById('loeschen').addEventListener('click', leereZeichnung);
document.getElementById('zurueck').addEventListener('click', () => wechsle(index - 1));
weiterKnopf.addEventListener('click', () => wechsle(index + 1));
document.getElementById('gross-klein').addEventListener('click', () => {
  klein = !klein;
  zeigeBuchstabe();
});

// Einstellungen: Schriftart und Buchstabengröße.
function baueWahl(behaelter, optionen, schluessel, beschrifte) {
  behaelter.innerHTML = '';
  Object.keys(optionen).forEach((wert) => {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    beschrifte(knopf, wert);
    if (einstellungen[schluessel] === wert) knopf.classList.add('aktiv');
    knopf.addEventListener('click', () => {
      einstellungen[schluessel] = wert;
      schreib(SPEICHER_EINSTELLUNGEN, einstellungen);
      wendeEinstellungenAn();
    });
    behaelter.appendChild(knopf);
  });
}

function zeichneEinstellungen() {
  baueWahl(document.getElementById('wahl-schrift'), SCHRIFTEN, 'schrift', (knopf, wert) => {
    knopf.textContent = SCHRIFTEN[wert].name;
    knopf.style.fontFamily = SCHRIFTEN[wert].familie;
  });
  const namen = { gross: 'Groß', mittel: 'Mittel', klein: 'Klein' };
  baueWahl(document.getElementById('wahl-groesse'), GROESSEN, 'groesse', (knopf, wert) => {
    knopf.textContent = namen[wert];
  });
}

function wendeEinstellungenAn() {
  const familie = SCHRIFTEN[einstellungen.schrift].familie;
  document.getElementById('wort').style.fontFamily = familie;
  zeichneEinstellungen();
  zeigeBuchstabe();
  // Die Schrift lädt bei Bedarf nach; sobald sie da ist, die Vorlage damit neu zeichnen.
  // Ein Canvas merkt sonst nicht, dass sich die Schrift geändert hat.
  if (document.fonts) {
    document.fonts.load(`400px ${familie}`).then(zeichneVorlage);
  }
}

document.getElementById('zahnrad').addEventListener('click', () => dialog.showModal());
document.getElementById('einstellungen-zu').addEventListener('click', () => dialog.close());

wendeEinstellungenAn();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
