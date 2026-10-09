/**
 * Formato de números. Tres modos (Opciones):
 *  - 'words': escala larga en español (millones, mil millones, billones…)
 *  - 'short': sufijos cortos internacionales (K, M, B, T…)
 *  - 'sci':   notación científica
 */

let mode = 'words';
export function setNumberMode(m) { mode = m; }
export function getNumberMode() { return mode; }

const int = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const dec3 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

// [plural, singular] cada 10^3 a partir de 10^6
const WORDS = [
  ['millones', 'millón'], ['mil millones', 'mil millones'],
  ['billones', 'billón'], ['mil billones', 'mil billones'],
  ['trillones', 'trillón'], ['mil trillones', 'mil trillones'],
  ['cuatrillones', 'cuatrillón'], ['mil cuatrillones', 'mil cuatrillones'],
  ['quintillones', 'quintillón'], ['mil quintillones', 'mil quintillones'],
  ['sextillones', 'sextillón'], ['mil sextillones', 'mil sextillones'],
  ['septillones', 'septillón'], ['mil septillones', 'mil septillones'],
  ['octillones', 'octillón'], ['mil octillones', 'mil octillones'],
];
const SHORT = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'];

/**
 * @param {number} n
 * @param {object} [o]
 * @param {boolean} [o.frac] muestra un decimal en números pequeños (útil para /s)
 */
export function fmt(n, o = {}) {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n, o);
  if (n < 1e6) {
    if (o.frac && n < 100) return dec1.format(n);
    return int.format(Math.floor(n));
  }
  const exp = Math.floor(Math.log10(n));
  if (mode === 'sci') {
    const m = n / 10 ** exp;
    return `${m.toFixed(2).replace('.', ',')}e${exp}`;
  }
  if (mode === 'short') {
    const tier = Math.floor(exp / 3);
    if (tier - 1 < SHORT.length) return `${dec3.format(n / 10 ** (tier * 3))}${SHORT[tier - 1]}`;
  } else {
    const tier = Math.floor(exp / 3) - 2;
    if (tier < WORDS.length) {
      const m = n / 10 ** ((tier + 2) * 3);
      const text = dec3.format(m);
      return `${text} ${text === '1' ? WORDS[tier][1] : WORDS[tier][0]}`;
    }
  }
  const m = n / 10 ** exp;
  return `${m.toFixed(2).replace('.', ',')}e${exp}`;
}

/** Duración legible: 1 h 4 min, 35 s… */
export function fmtTime(seconds) {
  if (!Number.isFinite(seconds)) return 'nunca';
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60 ? `${s % 60} s` : ''}`.trim();
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${m % 60 ? `${m % 60} min` : ''}`.trim();
  const d = Math.floor(h / 24);
  if (d < 365) return `${d} d ${h % 24 ? `${h % 24} h` : ''}`.trim();
  return `${fmt(Math.floor(d / 365))} años`;
}

export function pct(x, digits = 0) {
  return `${(x * 100).toFixed(digits).replace('.', ',')}%`;
}
