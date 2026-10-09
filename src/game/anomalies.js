/**
 * Anomalías: el equivalente a la galleta dorada. Un fragmento de artefacto
 * aparece en cualquier punto de la pantalla durante unos segundos; si lo
 * capturas, desata un efecto. Combinar efectos es donde está la gracia.
 */

import { G } from '../core/state.js';
import { emit } from '../core/bus.js';
import { fmt } from '../core/format.js';
import { BUILDINGS } from '../data/buildings.js';
import { C, addBuff, earn, ensureFresh } from './engine.js';

const BASE_MIN_S = 150;
const BASE_MAX_S = 360;
const BASE_LIFE_S = 13;

let nextAt = 0;
let current = null; // { el, expires }

function schedule(first = false) {
  ensureFresh();
  const min = first ? 45 : BASE_MIN_S;
  const max = first ? 110 : BASE_MAX_S;
  nextAt = Date.now() + (min + Math.random() * (max - min)) * 1000 * C.anomFreq;
}

export function initAnomalies() {
  schedule(G.anomaliesAll === 0);
}

/** Llamado desde el bucle lógico. */
export function updateAnomalies() {
  const now = Date.now();
  if (current) {
    if (now > current.expires) despawn(false);
    return;
  }
  if (now >= nextAt && !document.hidden) spawn();
}

function spawn() {
  ensureFresh();
  const life = BASE_LIFE_S * C.anomLife;
  const el = document.createElement('button');
  el.className = 'anomaly';
  el.type = 'button';
  el.setAttribute('aria-label', 'Anomalía: captúrala');
  el.style.setProperty('--life', `${life}s`);
  el.innerHTML = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><use href="#i-shard"/></svg>`;

  const pad = 80;
  const x = pad + Math.random() * Math.max(1, window.innerWidth - pad * 2);
  const y = pad + Math.random() * Math.max(1, window.innerHeight - pad * 2);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    capture(e.clientX, e.clientY);
  });

  document.body.appendChild(el);
  current = { el, expires: Date.now() + life * 1000 };
  emit('anomalySpawned');
}

function despawn(captured) {
  if (!current) return;
  const { el } = current;
  current = null;
  el.classList.add(captured ? 'is-captured' : 'is-fading');
  el.disabled = true;
  setTimeout(() => el.remove(), 600);
  schedule();
}

function pickEffect() {
  const big = BUILDINGS.filter((b) => (G.buildings[b.id] ?? 0) >= 10);
  const pool = [
    ['frenzy', 44],
    ['lucky', 40],
    ['clickFrenzy', 9],
  ];
  if (big.length) pool.push(['surge', 7]);
  const total = pool.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of pool) {
    if ((r -= w) <= 0) return id;
  }
  return 'lucky';
}

function capture(x, y) {
  if (!current) return;
  G.anomaliesRun++;
  G.anomaliesAll++;
  despawn(true);
  ensureFresh();

  const effect = pickEffect();
  const dur = C.anomDur;
  const now = Date.now();
  let title = '';
  let text = '';

  if (effect === 'frenzy') {
    const s = Math.round(77 * dur);
    addBuff({ id: 'frenzy', name: 'Frenesí', icon: 'bolt', prod: 7, until: now + s * 1000, total: s * 1000 });
    title = 'Frenesí';
    text = `Producción ×7 durante ${s} s`;
  } else if (effect === 'clickFrenzy') {
    const s = Math.round(13 * dur);
    addBuff({ id: 'clickFrenzy', name: 'Clic desatado', icon: 'gauntlet', click: 777, until: now + s * 1000, total: s * 1000 });
    title = 'Clic desatado';
    text = `Clic ×777 durante ${s} s. ¡Dale!`;
  } else if (effect === 'surge') {
    const big = BUILDINGS.filter((b) => (G.buildings[b.id] ?? 0) >= 10);
    const b = big[Math.floor(Math.random() * big.length)];
    const n = G.buildings[b.id];
    const mult = 1 + n * 0.1;
    const s = Math.round(30 * dur);
    addBuff({ id: 'surge', name: `Pico de ${b.plural}`, icon: b.id, prod: mult, until: now + s * 1000, total: s * 1000 });
    title = `Pico de ${b.plural}`;
    text = `Tus ${n} ${b.plural} disparan la producción ×${fmt(mult)} durante ${s} s`;
  } else {
    const gain = Math.min(G.energy * 0.15, C.eps * 900) + 13;
    earn(gain);
    title = 'Golpe de suerte';
    text = `+₡${fmt(gain)}`;
    emit('floatText', { x, y, text: `+₡${fmt(gain)}`, big: true });
  }

  emit('anomalyCaptured', { effect, title, text, x, y });
}

export function anomalyVisible() { return !!current; }

/** Para depurar desde la consola: fuerza la aparición de una anomalía. */
export function forceAnomaly() { if (!current) spawn(); }
