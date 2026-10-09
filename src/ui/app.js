/**
 * Montaje de la interfaz y bucles de actualización.
 * Lógica a 10 Hz (sigue corriendo con la pestaña en segundo plano);
 * dibujo con requestAnimationFrame.
 */

import { G, save } from '../core/state.js';
import { on } from '../core/bus.js';
import { fmt, fmtTime, pct } from '../core/format.js';
import { BUILDINGS_BY_ID } from '../data/buildings.js';
import {
  C, tick, clickPlanet, checkUnlocks, checkAchievements, ensureFresh,
  pendingLevels, applyOffline, grantAchievement,
} from '../game/engine.js';
import { initAnomalies, updateAnomalies } from '../game/anomalies.js';
import { sfx } from '../audio.js';
import { injectIcons, icon } from './icons.js';
import { initPlanet, clickFx, drawPlanetFx, setBoosted } from './planet.js';
import { initStore, refreshStore } from './store.js';
import { initColony, refreshColony, drawColony } from './colony.js';
import { initToasts, toast } from './toasts.js';
import { initMenus, openStats, openAchievements, openOptions, openOffline, openJournal } from './menus.js';
import { dateLabel, popTarget } from '../game/life.js';
import { initUnity, openUnity } from './unity.js';
import { bindTip } from './tooltip.js';

const $ = (sel) => document.querySelector(sel);
let el = {};

export function mountApp({ offlineSeconds = 0, isNew = false } = {}) {
  injectIcons();

  document.getElementById('app').innerHTML = `
    <div class="shell" data-tab="store">
      <header class="topbar">
        <div class="brand">
          <span class="stripes" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <h1 class="brand-name">Colonia Estelar</h1>
        </div>
        <nav class="topnav" aria-label="Menú">
          <button type="button" class="nav-btn" data-open="stats"><span class="lbl-long">Estadísticas</span><span class="lbl-short">Datos</span></button>
          <button type="button" class="nav-btn nav-journal" data-open="journal"><span>Diario</span><span class="badge badge-gold" data-journal hidden></span></button>
          <button type="button" class="nav-btn" data-open="ach"><span>Logros</span><span class="badge" data-ach-count></span></button>
          <button type="button" class="nav-btn" data-open="options"><span class="lbl-long">Opciones</span><span class="lbl-short">Ajustes</span></button>
          <button type="button" class="nav-btn nav-unity" data-open="unity"><span class="lbl-long">La Unidad</span><span class="lbl-short">Unidad</span><span class="badge badge-gold" data-pending hidden></span></button>
        </nav>
      </header>

      <main class="layout">
        <section class="col col-planet" aria-label="Planeta">
          <div class="counter">
            <p class="counter-date" data-date></p>
            <p class="counter-value"><span class="counter-sign">₡</span><span data-energy>0</span></p>
            <p class="counter-label" data-energy-words>créditos</p>
            <p class="counter-rate">₡<span data-eps>0</span> por segundo</p>
            <p class="counter-pop" data-pop></p>
          </div>
          <div class="buffs" data-buffs></div>
          <div class="planet-stage" data-planet></div>
          <div class="horizon" data-horizon tabindex="0"><span class="horizon-label" data-morale></span></div>
        </section>
        <section class="col col-colony" data-colony aria-label="Colonia"></section>
        <section class="col col-store" data-store aria-label="Almacén"></section>
      </main>

      <nav class="tabbar" aria-label="Secciones">
        <button type="button" data-tab-btn="colony" aria-pressed="false">Colonia</button>
        <button type="button" data-tab-btn="store" aria-pressed="true">Almacén</button>
      </nav>
    </div>`;

  el = {
    shell: $('.shell'),
    energy: $('[data-energy]'),
    energyWords: $('[data-energy-words]'),
    eps: $('[data-eps]'),
    rate: $('.counter-rate'),
    buffs: $('[data-buffs]'),
    horizon: $('[data-horizon]'),
    morale: $('[data-morale]'),
    achCount: $('[data-ach-count]'),
    journal: $('[data-journal]'),
    date: $('[data-date]'),
    pop: $('[data-pop]'),
    pending: $('[data-pending]'),
  };

  initToasts();
  initMenus();
  initUnity();
  ensureFresh();
  initPlanet($('[data-planet]'), onPlanetClick);
  initColony($('[data-colony]'));
  initStore($('[data-store]'));

  // Navegación
  $('[data-open="stats"]').addEventListener('click', openStats);
  $('[data-open="ach"]').addEventListener('click', openAchievements);
  $('[data-open="journal"]').addEventListener('click', () => { openJournal(); updateBadges(); });
  $('[data-open="options"]').addEventListener('click', openOptions);
  $('[data-open="unity"]').addEventListener('click', openUnity);
  document.querySelectorAll('[data-tab-btn]').forEach((b) => b.addEventListener('click', () => {
    el.shell.dataset.tab = b.dataset.tabBtn;
    document.querySelectorAll('[data-tab-btn]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));

  bindTip(el.horizon, () => `
    <div class="tt-head"><span class="tt-icon">${icon('officer')}</span><div><div class="tt-name">Moral de la tripulación: ${pct(C.morale)}</div>
    <div class="tt-sub">${G.achievements.size} logros, ${pct(0.04)} cada uno</div></div></div>
    <p class="tt-desc">Los oficiales que contrates en el almacén convierten la moral en producción extra.</p>`, 'top');
  bindTip($('.counter'), () => `
    <ul class="tt-stats">
      <li>Por clic: <b>₡${fmt(C.click, { frac: true })}</b></li>
      <li>Multiplicador global: <b>×${fmt(C.globalMult, { frac: true })}</b></li>
      ${C.buffProd !== 1 ? `<li>Efectos activos: <b>×${fmt(C.buffProd, { frac: true })}</b> de producción</li>` : ''}
    </ul>`, 'bottom');

  wireEvents();
  renderBuffs();
  updateBadges();

  // Arranque
  if (isNew && G.hadLegacySave) {
    grantAchievement('secret_veteran');
    toast({ title: 'La colonia ha cambiado', text: 'Esta versión empieza de cero. Gracias por volver, veterano.', icon: 'officer', ms: 9000 });
  }
  if (offlineSeconds > 60) {
    const res = applyOffline(offlineSeconds);
    if (res.gained > 0 || res.arrived > 0 || res.days > 0) {
      openOffline(res);
      grantAchievement('secret_back');
    }
  }

  initAnomalies();
  startLoops();
}

function onPlanetClick(x, y) {
  const amount = clickPlanet();
  const boosted = C.buffClick > 1;
  clickFx(x, y, amount, boosted);
  sfx.click(boosted);
  counterAnim?.cancel();
  counterAnim = el.energy.parentElement.animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${boosted ? 1.1 : 1.045})` }, { transform: 'scale(1)' }],
    { duration: 180, easing: 'ease-out' },
  );
}
let counterAnim = null;

function wireEvents() {
  on('buildingBought', () => { sfx.buy(); refreshColony(); refreshStore(); });
  on('buildingSold', () => { sfx.sell(); refreshColony(); refreshStore(); });
  on('upgradeBought', () => sfx.upgrade());
  on('achievement', queueAchievement);
  on('anomalySpawned', () => sfx.anomalySpawn());
  on('anomalyCaptured', ({ title, text }) => {
    sfx.anomalyCapture();
    toast({ title, text, icon: 'anomaly', kind: 'anomaly', ms: 5000 });
  });
  on('buffsChanged', renderBuffs);
  on('journal', ({ entry, notify }) => {
    updateBadges();
    if (notify) toast({ title: `Diario, día ${((entry.d - 1) % 28) + 1}`, text: entry.t, icon: 'news', kind: 'journal', ms: 8000 });
  });
  on('floatText', ({ x, y, text }) => floatAt(x, y, text));
  on('ascendedUI', ({ gain }) => {
    sfx.ascend();
    refreshColony();
    refreshStore();
    checkUnlocks();
    renderBuffs();
    toast({ title: 'Has entrado en la Unidad', text: `+${fmt(gain)} niveles de prestigio. Todo vuelve a empezar, pero más fuerte.`, icon: 'unity', ms: 8000 });
  });
}

// Los logros que llegan juntos (por ejemplo, una compra ×100) se agrupan en un solo aviso.
let achQueue = [];
let achTimer = null;
function queueAchievement(a) {
  achQueue.push(a);
  updateBadges();
  if (achTimer) return;
  achTimer = setTimeout(() => {
    const list = achQueue;
    achQueue = [];
    achTimer = null;
    sfx.achievement();
    if (list.length === 1) {
      const [one] = list;
      toast({ title: one.name, text: one.desc, icon: one.icon, kind: 'achievement' });
    } else {
      const names = list.slice(0, 3).map((x) => x.name).join(', ');
      const rest = list.length > 3 ? ` y ${list.length - 3} más` : '';
      toast({ title: `${list.length} logros nuevos`, text: `${names}${rest}.`, icon: 'trophy', kind: 'achievement' });
    }
  }, 350);
}

function floatAt(x, y, text) {
  const f = document.createElement('div');
  f.className = 'float-text';
  f.textContent = text;
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1600);
}

// ─── Bucles ───
function startLoops() {
  let last = Date.now();
  let unlockAcc = 0;
  let achAcc = 0;
  let saveAcc = 0;

  setInterval(() => {
    const now = Date.now();
    const dt = (now - last) / 1000;
    last = now;
    if (dt > 60) {
      // El equipo estuvo suspendido: se trata como tiempo sin conexión.
      const res = applyOffline(dt);
      if (res.gained > 0 || res.arrived > 0 || res.days > 0) openOffline(res);
    } else {
      tick(dt);
    }
    updateAnomalies();

    unlockAcc += dt;
    achAcc += dt;
    saveAcc += dt;
    if (unlockAcc >= 0.5) { unlockAcc = 0; checkUnlocks(); }
    if (achAcc >= 1) { achAcc = 0; checkAchievements(); updateBadges(); updateTitle(); }
    if (saveAcc >= 30) { saveAcc = 0; save(); }
  }, 100);

  let prev = performance.now();
  let storeAcc = 0;
  let buffAcc = 0;
  const frame = (t) => {
    const dt = Math.min(0.1, (t - prev) / 1000);
    prev = t;
    drawPlanetFx(dt);
    drawColony(dt);
    updateCounter();
    storeAcc += dt;
    buffAcc += dt;
    if (storeAcc >= 0.2) { storeAcc = 0; refreshStore(); }
    if (buffAcc >= 0.25) { buffAcc = 0; updateBuffTimers(); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function updateCounter() {
  const text = fmt(G.energy);
  const space = text.indexOf(' ');
  const num = space > 0 ? text.slice(0, space) : text;
  const words = space > 0 ? `${text.slice(space + 1)} de créditos` : 'créditos';
  if (el.energy.textContent !== num) el.energy.textContent = num;
  if (el.energyWords.textContent !== words) el.energyWords.textContent = words;

  const pop = Math.floor(G.pop);
  const coming = Math.max(0, Math.floor(popTarget()) - pop);
  const popText = pop === 0 && coming === 0
    ? 'Aún no vive nadie aquí'
    : `${fmt(pop)} ${pop === 1 ? 'colono' : 'colonos'}${coming > 0 ? `, y vienen ${fmt(coming)} más` : ''}`;
  if (el.pop.textContent !== popText) el.pop.textContent = popText;
  const date = dateLabel().text;
  if (el.date.textContent !== date) el.date.textContent = date;
  const eps = fmt(C.eps, { frac: true });
  if (el.eps.textContent !== eps) el.eps.textContent = eps;
  el.rate.classList.toggle('is-boosted', C.buffProd > 1);
  setBoosted(C.buffProd > 1 || C.buffClick > 1);

  const morale = `Moral ${pct(C.morale)}`;
  if (el.morale.textContent !== morale) {
    el.morale.textContent = morale;
    el.horizon.style.setProperty('--morale', Math.min(1, C.morale / 4).toFixed(3));
  }
}

function updateTitle() {
  document.title = `₡${fmt(G.energy)} · Colonia Estelar`;
}

function updateBadges() {
  el.achCount.textContent = String(G.achievements.size);
  const unread = G.journalUnread ?? 0;
  el.journal.hidden = unread <= 0;
  el.journal.textContent = unread > 99 ? '99+' : String(unread);
  const p = pendingLevels();
  el.pending.hidden = p <= 0;
  el.pending.textContent = p > 0 ? `+${fmt(p)}` : '';
}

// ─── Efectos activos ───
function renderBuffs() {
  ensureFresh();
  el.buffs.innerHTML = G.buffs.map((b) => {
    const meta = BUILDINGS_BY_ID.get(b.icon);
    return `<div class="buff" data-buff="${b.id}" ${meta ? `style="--hue:${meta.hue}"` : ''}>
      ${icon(b.icon)}
      <span class="buff-name">${b.name}</span>
      <span class="buff-time" data-left></span>
      <span class="buff-bar"><i data-bar></i></span>
    </div>`;
  }).join('');
  updateBuffTimers();
}

function updateBuffTimers() {
  const now = Date.now();
  for (const node of [...el.buffs.children]) {
    const b = G.buffs.find((x) => x.id === node.dataset.buff);
    // Red de seguridad: si el efecto ya no existe o ha caducado, la ficha se va.
    if (!b || b.until <= now) { node.remove(); continue; }
    const left = Math.max(0, b.until - now);
    node.querySelector('[data-left]').textContent = fmtTime(left / 1000);
    node.querySelector('[data-bar]').style.transform = `scaleX(${(left / b.total).toFixed(3)})`;
  }
}
