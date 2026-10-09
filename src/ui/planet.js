/**
 * El planeta: el objeto clicable central (nuestra galleta).
 * Un gigante gaseoso en SVG con anillo de franjas, drones orbitando y
 * dos lienzos: detrás (lluvia de energía) y delante (drones, chispas, números).
 */

import { G } from '../core/state.js';
import { fmt } from '../core/format.js';
import { C } from '../game/engine.js';
import { spriteCanvas } from './doodle.js';

const STRIPES = ['#c8452f', '#e2792f', '#ebb23c', '#4a86c8'];

let stage, back, front, bctx, fctx, button, svg, bandsAnim;
let W = 0, H = 0, DPR = 1, R = 100, cx = 0, cy = 0;
const sparks = [];
const floats = [];
const motes = [];
const waves = [];
const flashes = [];
const twinkles = [];
let shooting = null;
let nextShootingAt = 4;
let droneAngle = 0;
let rainDebt = 0;
let clock = 0;

// Física de muelle del planeta: escala (aplastamiento) e inclinación hacia el clic.
const spring = { s: 1, v: 0, rot: 0, rv: 0 };
let hovered = false;
let shake = 0;
// "Calor": sube con cada clic y se enfría solo. Acelera la rotación, el brillo y los drones.
let heat = 0;
let boosted = false;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function bandsTile(offset) {
  const bands = [
    [-110, 26, '#e9d6b0'], [-84, 14, '#c99a62'], [-70, 22, '#efdfbf'], [-48, 10, '#b7774a'],
    [-38, 24, '#dcbf8f'], [-14, 8, '#a9683f'], [-6, 30, '#ead9b8'], [24, 12, '#c48b55'],
    [36, 20, '#e2c99c'], [56, 9, '#b0703f'], [65, 24, '#d8b682'], [89, 21, '#c08850'],
  ];
  const rects = bands.map(([y, h, c]) => `<rect x="${offset - 220}" y="${y}" width="440" height="${h}" fill="${c}"/>`).join('');
  const storms = `
    <ellipse cx="${offset - 60}" cy="31" rx="26" ry="11" fill="#b4532f"/>
    <ellipse cx="${offset - 60}" cy="31" rx="15" ry="5.5" fill="#d9774a"/>
    <ellipse cx="${offset + 110}" cy="-42" rx="14" ry="4" fill="#f4e6c8" opacity=".8"/>
    <ellipse cx="${offset + 30}" cy="72" rx="20" ry="4" fill="#9c5c35" opacity=".6"/>
    <path d="M${offset - 200} -20 q 40 -8 80 0 t 80 0 t 80 0 t 80 0 t 80 0" stroke="#f6ead0" stroke-width="2" fill="none" opacity=".35"/>`;
  return rects + storms;
}

function ring(half) {
  const radii = [190, 181, 172, 163];
  const ellipses = radii.map((r, i) =>
    `<ellipse rx="${r}" ry="${(r * 0.2).toFixed(1)}" fill="none" stroke="${STRIPES[i]}" stroke-width="6.5"/>`).join('');
  return `<g clip-path="url(#ring-${half})" opacity="${half === 'back' ? 0.75 : 1}">
    ${ellipses}
    <ellipse rx="154" ry="30.8" fill="none" stroke="#ece6d3" stroke-width="1" opacity=".45"/>
  </g>`;
}

const PLANET_SVG = `
<svg viewBox="-200 -200 400 400" aria-hidden="true">
  <defs>
    <clipPath id="planet-clip"><circle r="110"/></clipPath>
    <clipPath id="ring-back"><rect x="-200" y="-60" width="400" height="60"/></clipPath>
    <clipPath id="ring-front"><rect x="-200" y="0" width="400" height="60"/></clipPath>
    <radialGradient id="planet-shade" gradientUnits="userSpaceOnUse" cx="-38" cy="-44" r="175">
      <stop offset="0" stop-color="#fff6e0" stop-opacity=".3"/>
      <stop offset=".35" stop-color="#fff6e0" stop-opacity="0"/>
      <stop offset=".62" stop-color="#0d1524" stop-opacity=".25"/>
      <stop offset=".82" stop-color="#0d1524" stop-opacity=".7"/>
      <stop offset="1" stop-color="#0d1524" stop-opacity=".9"/>
    </radialGradient>
    <radialGradient id="planet-glow">
      <stop offset=".5" stop-color="#ebb23c" stop-opacity=".3"/>
      <stop offset="1" stop-color="#ebb23c" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle r="196" fill="url(#planet-glow)" class="planet-glow"/>
  <g transform="rotate(-17)">${ring('back')}</g>
  <g class="planet-body">
    <g clip-path="url(#planet-clip)">
      <rect x="-120" y="-120" width="240" height="240" fill="#d9b98a"/>
      <g class="planet-bands">${bandsTile(0)}${bandsTile(440)}</g>
      <circle r="110" fill="url(#planet-shade)"/>
    </g>
    <circle r="109.5" fill="none" stroke="#f4dfae" stroke-opacity=".35" stroke-width="1"/>
  </g>
  <g transform="rotate(-17)">${ring('front')}</g>
</svg>`;

export function initPlanet(container, onClick) {
  stage = container;
  stage.innerHTML = `
    <canvas class="fx fx-back" aria-hidden="true"></canvas>
    <button type="button" class="planet" aria-label="Planeta: haz clic para recoger gas y venderlo">${PLANET_SVG}</button>
    <canvas class="fx fx-front" aria-hidden="true"></canvas>`;
  back = stage.querySelector('.fx-back');
  front = stage.querySelector('.fx-front');
  button = stage.querySelector('.planet');
  svg = button.querySelector('svg');
  bctx = back.getContext('2d');
  fctx = front.getContext('2d');
  bandsAnim = button.querySelector('.planet-bands').getAnimations?.()[0] ?? null;

  button.addEventListener('pointerenter', () => { hovered = true; });
  button.addEventListener('pointerleave', () => { hovered = false; });
  button.addEventListener('pointerdown', () => { spring.v -= 1.2; });
  button.addEventListener('click', (e) => {
    // Teclado: el evento llega con coordenadas 0,0; usamos el centro.
    const rect = stage.getBoundingClientRect();
    const fromKeyboard = e.detail === 0;
    const x = fromKeyboard ? rect.left + cx : e.clientX;
    const y = fromKeyboard ? rect.top + cy : e.clientY;
    onClick(x, y);
  });
  button.addEventListener('keydown', (e) => {
    if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
  });

  new ResizeObserver(resize).observe(stage);
  resize();
}

function resize() {
  const rect = stage.getBoundingClientRect();
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = rect.width;
  H = rect.height;
  for (const c of [back, front]) {
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
  }
  R = Math.max(50, Math.min(W * 0.27, H * 0.3));
  cx = W / 2;
  cy = H / 2;
  stage.style.setProperty('--planet-size', `${(R * 400) / 110}px`);
  twinkles.length = 0;
  const n = Math.round((W * H) / 9000);
  for (let i = 0; i < n; i++) {
    twinkles.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.1, p: Math.random() * 6.28, f: 0.6 + Math.random() * 1.8 });
  }
}

/** Feedback de un clic: muelle, onda, destello, chispas, número y una mota. */
export function clickFx(clientX, clientY, amount, isBoosted) {
  const rect = stage.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const dx = (x - cx) / R;
  const dy = (y - cy) / R;

  // Muelle: se hunde y se inclina hacia el punto golpeado.
  const calm = reduceMotion.matches ? 0.35 : 1;
  spring.v -= (isBoosted ? 3.2 : 2.2) * calm;
  spring.rv += Math.max(-1, Math.min(1, dx)) * (isBoosted ? 9 : 5) * calm;
  if (isBoosted && !reduceMotion.matches) shake = Math.min(10, shake + 4);
  heat += isBoosted ? 2 : 1;

  waves.push({ life: 0, max: isBoosted ? 0.7 : 0.5, big: isBoosted });
  if (waves.length > 8) waves.shift();
  flashes.push({ x, y, life: 0, max: 0.28 });
  if (flashes.length > 8) flashes.shift();

  floats.push({
    x: x + (Math.random() - 0.5) * 24, y: y - 12, vx: (Math.random() - 0.5) * 30,
    text: `+₡${fmt(amount, { frac: true })}`, life: 0, max: isBoosted ? 1.4 : 1.1, big: isBoosted,
  });
  if (floats.length > 40) floats.shift();

  if (!G.settings.particles) return;
  // Chispas que salen despedidas en la dirección del impacto
  const out = Math.atan2(dy, dx);
  const n = isBoosted ? 22 : 10;
  for (let i = 0; i < n; i++) {
    const a = out + (Math.random() - 0.5) * 2.2;
    const sp = 140 + Math.random() * (isBoosted ? 420 : 240);
    sparks.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      life: 0, max: 0.4 + Math.random() * 0.45,
      color: STRIPES[(Math.random() * 4) | 0], size: 1.6 + Math.random() * 2,
    });
  }
  if (sparks.length > 350) sparks.splice(0, sparks.length - 350);
  spawnMote(x);
}

function spawnMote(x = Math.random() * W) {
  if (motes.length > 120) return;
  motes.push({ x, y: -10, vy: 60 + Math.random() * 70, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 3, size: 3 + Math.random() * 4, a: 0.25 + Math.random() * 0.35 });
}

/** Pulso del planeta (por ejemplo, al comprar). */
export function bump(strength = 1) {
  spring.v += 2.4 * strength;
  waves.push({ life: 0, max: 0.6, big: false, gold: true });
  heat += 0.5;
}

/** Efectos activos (frenesí, clic desatado…): el planeta arde un poco más. */
export function setBoosted(on) {
  if (on === boosted) return;
  boosted = on;
  stage.classList.toggle('is-boosted', on);
}

/**
 * Un icono sale volando desde `fromRect` (p. ej. el botón del almacén)
 * y el planeta lo absorbe con un pequeño pulso.
 */
export function flyToPlanet(fromRect, iconId, color) {
  if (!stage || !fromRect) return;
  const rect = stage.getBoundingClientRect();
  const tx = rect.left + cx;
  const ty = rect.top + cy;
  const sx = fromRect.left + fromRect.width / 2;
  const sy = fromRect.top + fromRect.height / 2;
  if (reduceMotion.matches || rect.width === 0) { bump(0.6); return; }

  const el = document.createElement('div');
  el.className = 'flyer';
  el.style.color = color;
  el.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-${iconId}"/></svg>`;
  document.body.appendChild(el);
  // Arco: punto medio levantado por encima de la recta
  const mx = (sx + tx) / 2;
  const my = Math.min(sy, ty) - 80;
  const kf = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * mx + t * t * tx;
    const y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * my + t * t * ty;
    kf.push({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1.2 - t * 0.7}) rotate(${t * 220}deg)`, opacity: t > 0.9 ? 0.4 : 1 });
  }
  el.animate(kf, { duration: 620, easing: 'cubic-bezier(.5,0,.8,.6)' }).finished.then(() => {
    el.remove();
    bump(0.7);
    if (G.settings.particles) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        sparks.push({ x: cx + Math.cos(a) * R * 0.9, y: cy + Math.sin(a) * R * 0.9, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: 0, max: 0.5, color, size: 2 });
      }
    }
  });
}

function updateSpring(dt) {
  const target = hovered ? 1.025 : 1;
  // Muelle subamortiguado: rebota un par de veces y se asienta.
  const k = 380;
  const d = 15;
  spring.v += (-k * (spring.s - target) - d * spring.v) * dt;
  spring.s += spring.v * dt;
  spring.rv += (-200 * spring.rot - 12 * spring.rv) * dt;
  spring.rot += spring.rv * dt;
  spring.s = Math.max(0.8, Math.min(1.2, spring.s));

  // Aplastar y estirar: cuando se comprime en vertical se ensancha un poco.
  const sy = spring.s;
  const sx = 1 + (spring.s - 1) * -0.35 + (spring.s - 1);
  let tx = 0;
  let ty = 0;
  if (shake > 0.05) {
    tx = (Math.random() - 0.5) * shake;
    ty = (Math.random() - 0.5) * shake;
    shake *= Math.exp(-dt * 12);
  }
  svg.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${spring.rot.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
}

function updateHeat(dt) {
  heat *= Math.exp(-dt * 1.4);
  const h = Math.min(1, heat / 10) + (boosted ? 0.35 : 0);
  stage.style.setProperty('--heat', Math.min(1, h).toFixed(3));
  if (bandsAnim) bandsAnim.playbackRate = 1 + h * 30;
  return h;
}

export function drawPlanetFx(dt) {
  if (!W) return;
  clock += dt;
  updateSpring(dt);
  const h = updateHeat(dt);

  // ─── Fondo: estrellas que titilan, estrellas fugaces y lluvia de energía ───
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bctx.clearRect(0, 0, W, H);
  bctx.fillStyle = '#ece6d3';
  for (const t of twinkles) {
    bctx.globalAlpha = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(clock * t.f + t.p));
    bctx.beginPath();
    bctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    bctx.fill();
  }
  bctx.globalAlpha = 1;

  if (!reduceMotion.matches) {
    nextShootingAt -= dt;
    if (!shooting && nextShootingAt <= 0) {
      const fromLeft = Math.random() < 0.5;
      shooting = { x: fromLeft ? -20 : W + 20, y: Math.random() * H * 0.5, vx: (fromLeft ? 1 : -1) * (500 + Math.random() * 300), vy: 140 + Math.random() * 120, life: 0 };
      nextShootingAt = 6 + Math.random() * 10;
    }
    if (shooting) {
      const s = shooting;
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const g = bctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      g.addColorStop(0, 'rgba(255,244,214,.9)');
      g.addColorStop(1, 'rgba(255,244,214,0)');
      bctx.strokeStyle = g;
      bctx.lineWidth = 1.6;
      bctx.beginPath();
      bctx.moveTo(s.x, s.y);
      bctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      bctx.stroke();
      if (s.life > 2 || s.y > H + 40) shooting = null;
    }
  }

  if (G.settings.particles) {
    const rate = C.eps > 0 ? Math.min(14, Math.log10(C.eps + 1) * 1.6) : 0;
    rainDebt += rate * dt;
    while (rainDebt >= 1) { spawnMote(); rainDebt--; }
  }
  bctx.fillStyle = '#ebb23c';
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.y += m.vy * dt;
    m.rot += m.vr * dt;
    if (m.y > H + 10) { motes.splice(i, 1); continue; }
    bctx.globalAlpha = m.a;
    bctx.save();
    bctx.translate(m.x, m.y);
    bctx.rotate(m.rot);
    bctx.fillRect(-m.size / 2, -m.size / 2, m.size, m.size * 0.6);
    bctx.restore();
  }
  bctx.globalAlpha = 1;

  // ─── Frente ───
  fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  fctx.clearRect(0, 0, W, H);

  // Ondas expansivas desde el borde del planeta
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.life += dt;
    if (w.life >= w.max) { waves.splice(i, 1); continue; }
    const p = w.life / w.max;
    const ease = 1 - (1 - p) ** 3;
    fctx.globalAlpha = (1 - p) * (w.big ? 0.75 : 0.5);
    fctx.strokeStyle = w.gold || w.big ? '#ebb23c' : '#ece6d3';
    fctx.lineWidth = (w.big ? 5 : 3) * (1 - p) + 0.5;
    fctx.beginPath();
    fctx.arc(cx, cy, R * (1 + ease * (w.big ? 0.95 : 0.6)), 0, Math.PI * 2);
    fctx.stroke();
  }
  fctx.globalAlpha = 1;

  // Destello en el punto de impacto
  fctx.globalCompositeOperation = 'lighter';
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.life += dt;
    if (f.life >= f.max) { flashes.splice(i, 1); continue; }
    const p = f.life / f.max;
    const r = 18 + p * 36;
    const g = fctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    g.addColorStop(0, `rgba(255,236,190,${0.55 * (1 - p)})`);
    g.addColorStop(1, 'rgba(255,236,190,0)');
    fctx.fillStyle = g;
    fctx.fillRect(f.x - r, f.y - r, r * 2, r * 2);
  }
  fctx.globalCompositeOperation = 'source-over';

  // Drones en órbita: más rápidos cuanto más "calor"
  const drones = Math.min(G.buildings.drone ?? 0, 96);
  if (drones > 0) {
    droneAngle += dt * (0.12 + h * 1.4);
    for (let i = 0; i < drones; i++) {
      const row = Math.floor(i / 32);
      const inRow = Math.min(32, drones - row * 32);
      const a = droneAngle * (row % 2 ? -1 : 1) + ((i % 32) / inRow) * Math.PI * 2;
      const phase = (clock / 6 + i / Math.max(drones, 1)) % 1;
      const poke = phase < 0.05 ? Math.sin((phase / 0.05) * Math.PI) * 10 : 0;
      const breathe = (spring.s - 1) * R * 1.2;
      const r = R * 1.42 + row * 16 - poke + breathe;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      fctx.save();
      fctx.translate(x, y);
      // El dron mira hacia el planeta; su "pie" apunta al centro
      fctx.rotate(a - Math.PI / 2);
      const spr = spriteCanvas('drone', 22, { variant: i % 3 });
      fctx.drawImage(spr, -spr.ax, -spr.ay + 8, spr.cssW, spr.cssH);
      if (boosted || poke > 1) {
        fctx.fillStyle = '#f4be3e';
        fctx.beginPath(); fctx.arc(0, 10, 2.5, 0, Math.PI * 2); fctx.fill();
      }
      fctx.restore();
    }
  }

  // Chispas con estela
  fctx.lineCap = 'round';
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life += dt;
    if (s.life >= s.max) { sparks.splice(i, 1); continue; }
    s.vx *= Math.exp(-dt * 2.5);
    s.vy = s.vy * Math.exp(-dt * 2.5) + 380 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    fctx.globalAlpha = 1 - s.life / s.max;
    fctx.strokeStyle = s.color;
    fctx.lineWidth = s.size;
    fctx.beginPath();
    fctx.moveTo(s.x, s.y);
    fctx.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
    fctx.stroke();
  }

  // Números flotantes: aparecen con un pequeño "pop" y suben frenando
  fctx.textAlign = 'center';
  fctx.textBaseline = 'middle';
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.life += dt;
    if (f.life >= f.max) { floats.splice(i, 1); continue; }
    const p = f.life / f.max;
    const pop = p < 0.12 ? 1.5 - (p / 0.12) * 0.5 : 1;
    const rise = 1 - (1 - p) ** 2;
    fctx.globalAlpha = p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35;
    const size = (f.big ? 26 : 18) * pop;
    fctx.font = `${f.big ? 700 : 600} ${size.toFixed(1)}px Barlow, sans-serif`;
    const x = f.x + f.vx * p;
    const y = f.y - rise * 80;
    fctx.shadowColor = 'rgba(9,16,32,.95)';
    fctx.shadowBlur = 6;
    fctx.shadowOffsetY = 2;
    fctx.fillStyle = f.big ? '#ebb23c' : '#ece6d3';
    fctx.fillText(f.text, x, y);
  }
  fctx.shadowColor = 'transparent';
  fctx.shadowBlur = 0;
  fctx.shadowOffsetY = 0;
  fctx.globalAlpha = 1;
}
