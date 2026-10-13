// Buchstaben nachspuren: Das Kind malt über einen grauen Buchstaben.
// Geprüft wird per Pixelvergleich – wie viel vom Buchstaben ist übermalt
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

const GROESSE = 600;          // interne Auflösung der Zeichenfläche
const STIFTBREITE = 44;
const ZIEL_ABDECKUNG = 0.65;  // so viel vom Buchstaben muss übermalt sein
const MAX_DANEBEN = 0.5;      // höchstens so viel der Farbe darf danebenliegen
const SCHRIFT = '"Andika", "Comic Sans MS", "Century Gothic", sans-serif';
const SPEICHER = 'buchstaben-geschafft';

const vorlage = document.getElementById('vorlage');
const zeichnung = document.getElementById('zeichnung');
const vctx = vorlage.getContext('2d', { willReadFrequently: true });
const zctx = zeichnung.getContext('2d', { willReadFrequently: true });

const tafel = document.getElementById('tafel');
const stern = document.getElementById('stern');
const fortschritt = document.getElementById('fortschritt');
const hinweis = document.getElementById('hinweis');
const weiterKnopf = document.getElementById('weiter');
const auswahl = document.getElementById('auswahl');

let index = 0;
let klein = false;
let maske = null;       // true für jeden Pixel, der zum Buchstaben gehört
let maskeGesamt = 0;
let malt = false;
let fertig = false;
let geschafft = ladeGeschafft();

function ladeGeschafft() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SPEICHER)) || []);
  } catch {
    return new Set();
  }
}

function speichereGeschafft() {
  try {
    localStorage.setItem(SPEICHER, JSON.stringify([...geschafft]));
  } catch {
    // Ohne Speicher (z. B. privates Fenster) läuft die App trotzdem.
  }
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

function zeichneVorlage() {
  const z = zeichen();
  vctx.clearRect(0, 0, GROESSE, GROESSE);

  // Erst bei fester Größe messen, dann so skalieren, dass der Buchstabe die Tafel gut füllt.
  vctx.font = `400px ${SCHRIFT}`;
  let m = vctx.measureText(z);
  const breite = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const hoehe = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const faktor = Math.min(400 / breite, 440 / hoehe, 1.3);

  vctx.font = `${Math.round(400 * faktor)}px ${SCHRIFT}`;
  m = vctx.measureText(z);
  const b = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const x = (GROESSE - b) / 2 + m.actualBoundingBoxLeft;
  const y = (GROESSE - h) / 2 + m.actualBoundingBoxAscent;

  vctx.textAlign = 'left';
  vctx.textBaseline = 'alphabetic';
  vctx.fillStyle = '#d9d9d9';
  vctx.fillText(z, x, y);

  const daten = vctx.getImageData(0, 0, GROESSE, GROESSE).data;
  maske = new Uint8Array(GROESSE * GROESSE);
  maskeGesamt = 0;
  for (let i = 0; i < maske.length; i++) {
    if (daten[i * 4 + 3] > 128) {
      maske[i] = 1;
      maskeGesamt++;
    }
  }
}

function leereZeichnung() {
  zctx.clearRect(0, 0, GROESSE, GROESSE);
  fortschritt.style.width = '0';
  hinweis.textContent = '';
  fertig = false;
  weiterKnopf.classList.remove('blinken');
  stern.classList.remove('zeigen');
}

function zeigeBuchstabe() {
  const { wort, bild } = BUCHSTABEN[index];
  document.getElementById('bild').textContent = bild;
  document.getElementById('wort').textContent = wort;
  zeichneVorlage();
  leereZeichnung();
  zeichneAuswahl();
}

function zeichneAuswahl() {
  auswahl.innerHTML = '';
  BUCHSTABEN.forEach((eintrag, i) => {
    const z = klein ? eintrag.b.toLowerCase() : eintrag.b;
    const knopf = document.createElement('button');
    knopf.textContent = z;
    if (geschafft.has(z)) knopf.classList.add('geschafft');
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
  let drin = 0;
  let daneben = 0;
  for (let i = 0; i < maske.length; i++) {
    if (daten[i * 4 + 3] > 60) {
      if (maske[i]) drin++;
      else daneben++;
    }
  }
  const abdeckung = drin / maskeGesamt;
  const anteilDaneben = daneben / Math.max(1, drin + daneben);

  fortschritt.style.width = `${Math.min(1, abdeckung / ZIEL_ABDECKUNG) * 100}%`;

  if (abdeckung < ZIEL_ABDECKUNG) return;

  if (anteilDaneben > MAX_DANEBEN) {
    hinweis.textContent = 'Bleib auf dem Buchstaben! 🧽';
    tafel.classList.remove('wackeln');
    void tafel.offsetWidth; // Animation neu starten
    tafel.classList.add('wackeln');
    sprich('Bleib auf dem Buchstaben. Versuch es noch einmal.');
    return;
  }

  fertig = true;
  geschafft.add(zeichen());
  speichereGeschafft();
  zeichneAuswahl();
  hinweis.textContent = 'Super! ⭐';
  stern.classList.remove('zeigen');
  void stern.offsetWidth;
  stern.classList.add('zeigen');
  weiterKnopf.classList.add('blinken');
  sprich('Super gemacht!');
}

zctx.lineWidth = STIFTBREITE;
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

zeigeBuchstabe();
