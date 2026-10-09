/**
 * Vista de la colonia: una escena ilustrada por módulo donde aparece cada
 * unidad que compras (como las filas de Cookie Clicker). Arriba, el teletipo.
 */

import { G } from '../core/state.js';
import { fmt, pct } from '../core/format.js';
import { BUILDINGS } from '../data/buildings.js';
import { NEWS } from '../data/news.js';
import { C, grantAchievement } from '../game/engine.js';
import { icon } from './icons.js';
import { bindTip } from './tooltip.js';
import { pen, spriteCanvas, LIVE, COL } from './doodle.js';
import { darkness, popOf } from '../game/life.js';

let rowsEl;
let tickerText;
const rows = new Map(); // id → fila (ver makeRow)
let observer;

export function initColony(container) {
  container.innerHTML = `
    <button type="button" class="ticker" aria-live="polite" title="ARCHIVO-7 comenta la actualidad">
      <span class="bot" aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <line class="bot-antenna" x1="20" y1="4" x2="20" y2="10"/>
          <circle class="bot-led" cx="20" cy="4" r="2.4"/>
          <rect class="bot-head" x="5" y="10" width="30" height="24" rx="10"/>
          <rect class="bot-visor" x="9.5" y="15" width="21" height="13" rx="6.5"/>
          <g class="bot-eyes"><circle cx="16" cy="21.5" r="2.3"/><circle cx="24" cy="21.5" r="2.3"/></g>
        </svg>
      </span>
      <span class="ticker-body">
        <span class="ticker-who">ARCHIVO-7</span>
        <span class="ticker-text"></span>
      </span>
    </button>
    <p class="empty-note colony-empty">Tu colonia está vacía. Construye un módulo en el almacén y aparecerá aquí.</p>
    <div class="colony-rows"></div>`;
  rowsEl = container.querySelector('.colony-rows');
  tickerText = container.querySelector('.ticker-text');
  container.querySelector('.ticker').addEventListener('click', () => {
    grantAchievement('secret_news');
    nextNews();
  });
  nextNews();
  setInterval(nextNews, 9000);
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const row = [...rows.values()].find((r) => r.el === e.target);
      if (row) row.visible = e.isIntersecting;
    }
  }, { root: rowsEl });
  new ResizeObserver(() => { for (const r of rows.values()) r.needsLayout = true; }).observe(rowsEl);
  refreshColony();
}

let lastNews = '';
function nextNews() {
  const pool = NEWS.filter((n) => n.when(G));
  // Las noticias genéricas son `() => true` (aridad 0); las de progreso reciben G.
  const specific = pool.filter((n) => n.when.length > 0);
  const source = specific.length && Math.random() < 0.7 ? specific : pool;
  let pick;
  for (let i = 0; i < 5; i++) {
    pick = source[Math.floor(Math.random() * source.length)];
    if (pick.t !== lastNews) break;
  }
  lastNews = pick.t;
  tickerText.classList.remove('is-in');
  void tickerText.offsetWidth;
  tickerText.textContent = pick.t;
  tickerText.classList.add('is-in');
  const ticker = tickerText.closest('.ticker');
  ticker.classList.remove('is-talking');
  void ticker.offsetWidth;
  ticker.classList.add('is-talking');
}

function rowTip(b) {
  const n = G.buildings[b.id] ?? 0;
  const total = C.total[b.id] ?? 0;
  const share = C.baseEps > 0 ? total / C.baseEps : 0;
  return `<div class="tt-head"><span class="tt-icon" style="--hue:${b.hue}">${icon(b.id)}</span>
    <div><div class="tt-name">${n} ${n === 1 ? b.name.toLowerCase() : b.plural}</div>
    <div class="tt-sub">${fmt(total, { frac: true })} por segundo, ${pct(share, share < 0.1 ? 1 : 0)} del total</div></div></div>`;
}

// ─── Escenarios ───
// sky: degradado superior; ground: suelo (null = espacio abierto); mode: cómo se colocan las unidades.
const SCENES = {
  drone:       { sky: ['#0e1830', '#1b2a4c'], ground: null, mode: 'fly', deco: 'stars' },
  crew:        { sky: ['#33415f', '#3e4d6e'], ground: '#c9b993', mode: 'walk', deco: 'deck' },
  hydro:       { sky: ['#123c3a', '#1f5a4c'], ground: '#5b3d2a', mode: 'ground', deco: 'grass' },
  helium:      { sky: ['#0f1628', '#1c2640'], ground: '#9aa3b5', mode: 'ground', deco: 'craters' },
  factory:     { sky: ['#141f36', '#22304f'], ground: '#59627a', mode: 'ground', deco: 'hazard' },
  outpost:     { sky: ['#e3793f', '#f4be3e'], ground: '#c98b55', mode: 'ground', deco: 'dunes' },
  sanctuary:   { sky: ['#2b1f4c', '#4a3478'], ground: '#2a1f40', mode: 'ground', deco: 'stars' },
  xenolab:     { sky: ['#1b4a55', '#24606b'], ground: '#cfe3e0', mode: 'ground', deco: 'tiles' },
  freighter:   { sky: ['#0b1224', '#17223d'], ground: null, mode: 'cruise', deco: 'lanes' },
  refinery:    { sky: ['#3a1916', '#5a271d'], ground: '#4a2219', mode: 'ground', deco: 'lava' },
  gate:        { sky: ['#1e1338', '#33205c'], ground: '#3a2e5c', mode: 'ground', deco: 'stars' },
  chrono:      { sky: ['#0d2d38', '#14485a'], ground: '#1d5260', mode: 'ground', deco: 'grid' },
  antimatter:  { sky: ['#240d2b', '#3d1446'], ground: '#40194a', mode: 'ground', deco: 'stars' },
  dyson:       { sky: ['#07080f', '#1a1430'], ground: null, mode: 'float', deco: 'stars' },
  probability: { sky: ['#1a4d33', '#22603f'], ground: '#7a4b2a', mode: 'ground', deco: 'felt' },
  artifact:    { sky: ['#2c2010', '#463216'], ground: '#5a4020', mode: 'ground', deco: 'crystals' },
  reality:     { sky: ['#3b1f4a', '#1f3b4a'], ground: '#2a2a4a', mode: 'ground', deco: 'checker' },
  multiverse:  { sky: ['#0b0b24', '#1c1240'], ground: null, mode: 'float', deco: 'stars' },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintBackground(row) {
  const { canvas, scene, W, H, dpr } = row;
  const bg = document.createElement('canvas');
  bg.width = canvas.width;
  bg.height = canvas.height;
  const ctx = bg.getContext('2d');
  ctx.scale(dpr, dpr);
  const r = rng(row.index * 977 + 13);
  const groundY = H - row.groundH;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, scene.sky[0]);
  g.addColorStop(1, scene.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const d = pen(ctx, row.index + 3, 2);
  switch (scene.deco) {
    case 'stars':
    case 'lanes':
      for (let i = 0; i < W / 9; i++) {
        ctx.fillStyle = `rgba(241, 234, 214, ${0.2 + r() * 0.6})`;
        ctx.fillRect(r() * W, r() * (scene.ground ? groundY : H), r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1);
      }
      if (scene.deco === 'lanes') {
        ctx.setLineDash([10, 14]);
        ctx.strokeStyle = 'rgba(244, 190, 62, .25)';
        ctx.lineWidth = 2;
        for (const y of [H * 0.38, H * 0.72]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.setLineDash([]);
      }
      break;
    case 'deck':
      for (let x = 30; x < W; x += 120) {
        d.box(x, 14, 46, 26, '#0e1830', 8);
        ctx.fillStyle = 'rgba(241,234,214,.7)';
        ctx.fillRect(x + 10 + r() * 20, 22 + r() * 10, 1.5, 1.5);
      }
      break;
    case 'craters':
      d.blob(W - 60, 26, 13, 13, '#7aa7d8');
      ctx.fillStyle = '#c9e0f3';
      ctx.fillRect(W - 66, 20, 6, 3);
      break;
    case 'dunes':
      d.blob(W * 0.8, 30, 16, 16, '#fff3c4');
      ctx.fillStyle = '#d9a066';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= W; x += 40) ctx.quadraticCurveTo(x + 20, groundY - 12 - r() * 10, x + 40, groundY);
      ctx.fill();
      break;
    case 'grid':
      ctx.strokeStyle = 'rgba(63, 193, 211, .2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }
      for (let y = 0; y < groundY; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      break;
    case 'tiles':
      ctx.strokeStyle = 'rgba(255, 255, 255, .08)';
      for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }
      break;
    case 'felt':
      ctx.strokeStyle = 'rgba(255, 255, 255, .08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, W - 20, groundY - 16);
      break;
    case 'checker':
      for (let x = 0; x < W; x += 20) {
        for (let y = 0; y < groundY; y += 20) {
          if (((x + y) / 20) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(x, y, 20, 20); }
        }
      }
      break;
    default: break;
  }

  if (scene.ground) {
    ctx.fillStyle = scene.ground;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = '#1e2539';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    // Detalles del suelo
    for (let i = 0; i < W / 26; i++) {
      const x = r() * W;
      const y = groundY + 5 + r() * (H - groundY - 8);
      if (scene.deco === 'grass') { ctx.strokeStyle = COL.green; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x - 2, groundY - 5); ctx.moveTo(x + 2, groundY); ctx.lineTo(x + 3, groundY - 6); ctx.stroke(); }
      else if (scene.deco === 'craters') { ctx.fillStyle = 'rgba(30,37,57,.18)'; ctx.beginPath(); ctx.ellipse(x, y, 6 + r() * 6, 2 + r() * 2, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (scene.deco === 'lava') { ctx.strokeStyle = 'rgba(240,138,46,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 3); ctx.lineTo(x + 14, y); ctx.stroke(); }
      else if (scene.deco === 'crystals') { d.poly([[x, groundY], [x + 3, groundY - 9 - r() * 6], [x + 6, groundY]], r() < 0.5 ? COL.gold : COL.orange); }
      else if (scene.deco === 'hazard') { if (i === 0) { for (let k = 0; k < W; k += 16) { ctx.fillStyle = COL.gold; ctx.beginPath(); ctx.moveTo(k, groundY + 2); ctx.lineTo(k + 8, groundY + 2); ctx.lineTo(k + 4, groundY + 7); ctx.lineTo(k - 4, groundY + 7); ctx.fill(); } } }
      else { ctx.fillStyle = 'rgba(30,37,57,.15)'; ctx.fillRect(x, y, 3, 2); }
    }
  }
  row.bg = bg;
}

function makeRow(b) {
  const el = document.createElement('div');
  el.className = 'crow';
  el.style.setProperty('--hue', b.hue);
  el.tabIndex = 0;
  el.innerHTML = `
    <canvas class="crow-scene" aria-hidden="true"></canvas>
    <div class="crow-tag"><span class="crow-name">${b.plural}</span><span class="crow-count"></span></div>`;
  bindTip(el, () => rowTip(b), 'bottom');
  const row = {
    id: b.id, index: b.index, el,
    canvas: el.querySelector('canvas'),
    count: el.querySelector('.crow-count'),
    scene: SCENES[b.id],
    n: 0, shown: 0, born: [], visible: true, needsLayout: true,
    W: 0, H: 0, dpr: 1, slots: [],
  };
  observer?.observe(el);
  return row;
}

function layout(row) {
  const rect = row.canvas.getBoundingClientRect();
  row.dpr = Math.min(2, window.devicePixelRatio || 1);
  row.W = Math.max(1, rect.width);
  row.H = Math.max(1, rect.height);
  row.canvas.width = Math.round(row.W * row.dpr);
  row.canvas.height = Math.round(row.H * row.dpr);
  row.groundH = row.scene.ground ? Math.round(row.H * 0.2) : 0;
  // Tres planos: delante (grande), detrás y al fondo. Se llenan en ese orden,
  // así la colonia "crece hacia el horizonte" a medida que compras.
  const front = Math.round(row.H * 0.44);
  const r = rng(row.index * 31 + 7);
  const lanes = [
    { lane: 0, px: front, yOff: 2, alpha: 1 },
    { lane: 1, px: Math.round(front * 0.78), yOff: -row.groundH * 0.45, alpha: 0.93 },
    { lane: 2, px: Math.round(front * 0.58), yOff: -row.groundH * 0.9, alpha: 0.8 },
  ];
  row.px = front;
  row.slots = [];
  for (const L of lanes) {
    const spacing = L.px * 1.02;
    const per = Math.max(1, Math.floor((row.W - 16) / spacing));
    const offset = L.lane === 1 ? spacing / 2 : L.lane === 2 ? spacing / 3 : 0;
    for (let k = 0; k < per; k++) {
      row.slots.push({
        x: 8 + spacing / 2 + k * spacing + offset + (r() - 0.5) * 6,
        lane: L.lane, px: L.px, yOff: L.yOff, alpha: L.alpha,
        variant: Math.floor(r() * 5),
        phase: r() * 10,
        speed: 0.6 + r() * 0.8,
        height: r(),
      });
    }
  }
  // Las de delante, ordenadas de izquierda a derecha, se rellenan primero
  row.capacity = row.slots.length;
  paintBackground(row);
  row.needsLayout = false;
}

export function refreshColony() {
  if (!rowsEl) return;
  let any = false;
  for (const b of BUILDINGS) {
    const n = G.buildings[b.id] ?? 0;
    let row = rows.get(b.id);
    if (n <= 0) {
      if (row) { observer?.unobserve(row.el); row.el.remove(); rows.delete(b.id); }
      continue;
    }
    any = true;
    if (!row) {
      row = makeRow(b);
      const after = [...rows.values()].filter((r) => r.index < b.index).sort((a, c) => a.index - c.index).pop();
      if (after) after.el.after(row.el); else rowsEl.prepend(row.el);
      rows.set(b.id, row);
    }
    if (n > row.n) {
      const now = performance.now() / 1000;
      for (let i = row.n; i < n; i++) row.born[i] = now + (i - row.n) * 0.04;
    }
    row.n = n;
    const c = fmt(n);
    if (row.count.textContent !== c) row.count.textContent = c;
  }
  rowsEl.parentElement.querySelector('.colony-empty').hidden = any;
}

// ─── Dibujo ───
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let acc = 0;

/** Llamado desde el bucle de animación. Dibuja a ~30 fps las filas visibles. */
export function drawColony(dt) {
  acc += dt;
  if (acc < 1 / 30) return;
  acc = 0;
  const t = performance.now() / 1000;
  for (const row of rows.values()) {
    if (!row.visible || row.el.offsetParent === null) continue;
    if (row.needsLayout) layout(row);
    drawRow(row, reduceMotion.matches ? 0 : t);
  }
}

function drawRow(row, t) {
  const { canvas, dpr, W, H, scene } = row;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(row.bg, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(row.n, row.capacity);
  const groundY = H - row.groundH;
  const now = performance.now() / 1000;
  const lights = [];

  // Del fondo hacia delante
  for (const lane of [2, 1, 0]) {
    for (let i = 0; i < count; i++) {
      const s = row.slots[i];
      if (s.lane !== lane) continue;
      const px = s.px;
      const sprite = spriteCanvas(row.id, px, { variant: s.variant });

      let x = s.x;
      let y = groundY + s.yOff;
      let flip = 1;
      let rot = 0;
      let bob = 0;

      switch (scene.mode) {
        case 'walk': {
          // Ida y vuelta por la cubierta
          const span = W - 30;
          const p = (s.phase * 40 + t * 18 * s.speed) % (span * 2);
          const fwd = p < span;
          x = 15 + (fwd ? p : span * 2 - p);
          flip = fwd ? 1 : -1;
          bob = Math.abs(Math.sin(t * 8 * s.speed + s.phase)) * -1.5;
          break;
        }
        case 'fly':
          y = 10 + s.height * (H - 24) + px * 0.45;
          x += Math.sin(t * 0.7 * s.speed + s.phase) * 10;
          bob = Math.sin(t * 3 + s.phase) * 3;
          rot = Math.sin(t * 2 + s.phase) * 0.08;
          break;
        case 'cruise': {
          y = 12 + s.height * (H - 30) + px * 0.35;
          const span = W + 80;
          x = ((s.phase * 60 + t * 22 * s.speed) % span) - 40;
          bob = Math.sin(t * 1.5 + s.phase) * 1.5;
          break;
        }
        case 'float':
          y = 6 + s.height * (H - 16) + px * 0.5;
          bob = Math.sin(t * 1.2 + s.phase) * 4;
          break;
        default:
          if (row.id === 'helium') bob = Math.max(0, Math.sin(t * 4 + s.phase)) * -1.2;
          if (row.id === 'xenolab') bob = Math.max(0, Math.sin(t * 5 + s.phase)) * -2;
          if (row.id === 'probability' && Math.sin(t * 0.8 + s.phase) > 0.97) rot = Math.sin(t * 30) * 0.2;
          if (row.id === 'artifact') bob = Math.sin(t * 2 + s.phase) * 1.5;
      }

      // Aparición: crece con un pequeño rebote al comprar
      const age = now - (row.born[i] ?? 0);
      const pop = age < 0 ? 0 : age < 0.45 ? 1 + Math.sin((age / 0.45) * Math.PI) * 0.35 - (1 - age / 0.45) * 0.6 : 1;
      if (pop <= 0) continue;

      // Sombra en el suelo
      if (scene.ground && scene.mode !== 'fly') {
        ctx.fillStyle = 'rgba(15, 20, 35, .28)';
        ctx.beginPath();
        ctx.ellipse(x, y, px * 0.38 * pop, px * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(x, y + bob);
      ctx.rotate(rot);
      ctx.scale(flip * pop, pop);
      ctx.globalAlpha = s.alpha;
      // Piernas de los tripulantes (detrás del cuerpo)
      if (row.id === 'crew') {
        const k = px / 40;
        const sw = Math.sin(t * 8 * s.speed + s.phase) * 3;
        ctx.strokeStyle = '#1e2539';
        ctx.lineWidth = 3 * k;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3 * k, -10 * k); ctx.lineTo((-3 + sw) * k, 0);
        ctx.moveTo(3 * k, -10 * k); ctx.lineTo((3 - sw) * k, 0);
        ctx.stroke();
      }
      ctx.drawImage(sprite, -sprite.ax, -sprite.ay, sprite.cssW, sprite.cssH);
      if (lights.length < 40 && row.id !== 'crew') lights.push([x, y + bob - px * 0.5, px]);
      const live = LIVE[row.id];
      if (live) {
        const k = px / 40;
        ctx.scale(k, k);
        live(ctx, t, i);
      }
      ctx.restore();
    }
  }

  // Colonos paseando por delante: más cuantos más trabajan aquí
  if (scene.ground && row.id !== 'crew') {
    const walkers = Math.min(7, Math.ceil(popOf(row.id) / 12));
    const wpx = Math.round(row.px * 0.5);
    for (let i = 0; i < walkers; i++) {
      const speed = 0.5 + ((i * 37) % 10) / 14;
      const span = W - 20;
      const p = (i * 97 + t * 14 * speed) % (span * 2);
      const fwd = p < span;
      const x = 10 + (fwd ? p : span * 2 - p);
      const y = groundY + 4 + (i % 2) * 3;
      const k = wpx / 40;
      ctx.save();
      ctx.translate(x, y - Math.abs(Math.sin(t * 7 * speed + i)) * 1.2);
      ctx.scale(fwd ? 1 : -1, 1);
      const sw = Math.sin(t * 7 * speed + i) * 3;
      ctx.strokeStyle = '#1e2539';
      ctx.lineWidth = 3 * k;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3 * k, -10 * k); ctx.lineTo((-3 + sw) * k, 0);
      ctx.moveTo(3 * k, -10 * k); ctx.lineTo((3 - sw) * k, 0);
      ctx.stroke();
      const spr = spriteCanvas('crew', wpx, { variant: i + row.index });
      ctx.drawImage(spr, -spr.ax, -spr.ay, spr.cssW, spr.cssH);
      ctx.restore();
    }
  }

  // Día y noche: de noche se oscurece y se encienden luces cálidas
  const dark = darkness();
  if (dark > 0.05) {
    ctx.fillStyle = `rgba(8, 12, 32, ${(dark * 0.42).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    if (dark > 0.45 && scene.ground) {
      ctx.globalCompositeOperation = 'lighter';
      const a = (dark - 0.45) / 0.55;
      for (const [lx, ly, lpx] of lights) {
        const rad = lpx * 0.55;
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, rad);
        g.addColorStop(0, `rgba(255, 190, 90, ${(0.22 * a).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255, 190, 90, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(lx - rad, ly - rad, rad * 2, rad * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
