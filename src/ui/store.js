/**
 * Almacén: mejoras (rejilla de iconos) y módulos (lista), al estilo Cookie Clicker.
 * Mayús = ×10 y Ctrl = ×100 al hacer clic, como en el original.
 */

import { G } from '../core/state.js';
import { on } from '../core/bus.js';
import { fmt, fmtTime, pct } from '../core/format.js';
import { BUILDINGS } from '../data/buildings.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';
import {
  C, buildingCost, maxAffordable, sellValue, buyBuilding, sellBuilding,
  upgradeCost, buyUpgrade, ensureFresh,
} from '../game/engine.js';
import { icon } from './icons.js';
import { bindTip, showTip, isTipFor, hideTip } from './tooltip.js';
import { flyToPlanet } from './planet.js';

export const TIER_COLORS = ['#f4be3e', '#5b9be0', '#4fbf8a', '#f08a2e', '#e8705a', '#a57ee0', '#3fc1d3', '#ee86b4', '#a9cf45', '#f1ead6', '#ffd86b'];

let mode = 'buy';
let qty = 1;
let root;
let upGrid;
let upMore;
let bList;
let expanded = false;
const items = new Map(); // id → { el, cost, count, name }
let visibleKey = '';
let renderedUps = new Set(); // para animar solo las mejoras recién aparecidas

export function initStore(container) {
  root = container;
  root.innerHTML = `
    <header class="panel-head">
      <h2 class="panel-title">Almacén</h2>
      <div class="store-controls">
        <div class="seg" role="group" aria-label="Modo">
          <button type="button" data-mode="buy" aria-pressed="true">Comprar</button>
          <button type="button" data-mode="sell" aria-pressed="false">Vender</button>
        </div>
        <div class="seg" role="group" aria-label="Cantidad">
          <button type="button" data-qty="1" aria-pressed="true">1</button>
          <button type="button" data-qty="10" aria-pressed="false">10</button>
          <button type="button" data-qty="100" aria-pressed="false">100</button>
          <button type="button" data-qty="-1" aria-pressed="false">Máx</button>
        </div>
      </div>
    </header>
    <div class="store-scroll">
      <section class="upgrades" aria-label="Mejoras">
        <div class="up-head">
          <h3 class="sub-title">Mejoras</h3>
          <button type="button" class="link-btn" data-buy-all>Comprar asequibles</button>
        </div>
        <div class="up-grid"></div>
        <button type="button" class="link-btn up-more" hidden></button>
        <p class="empty-note" data-up-empty>Las mejoras aparecerán aquí a medida que crezca la colonia.</p>
      </section>
      <section aria-label="Módulos">
        <h3 class="sub-title">Módulos</h3>
        <ol class="buildings"></ol>
      </section>
    </div>`;

  upGrid = root.querySelector('.up-grid');
  upMore = root.querySelector('.up-more');
  bList = root.querySelector('.buildings');

  root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    root.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    root.classList.toggle('is-selling', mode === 'sell');
    refreshStore();
  }));
  root.querySelectorAll('[data-qty]').forEach((b) => b.addEventListener('click', () => {
    qty = Number(b.dataset.qty);
    root.querySelectorAll('[data-qty]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    refreshStore();
  }));
  upMore.addEventListener('click', () => { expanded = !expanded; renderUpgrades(); });
  root.querySelector('[data-buy-all]').addEventListener('click', buyAllAffordable);

  on('upgradesChanged', renderUpgrades);
  renderUpgrades();
  renderBuildings();
}

function effectiveQty(e) {
  if (e?.ctrlKey || e?.metaKey) return 100;
  if (e?.shiftKey) return 10;
  return qty;
}

// ─── Mejoras ───
const COLLAPSED_COUNT = 12;

function renderUpgrades() {
  if (!upGrid) return;
  ensureFresh();
  const list = C.available;
  const shown = expanded ? list : list.slice(0, COLLAPSED_COUNT);
  upGrid.innerHTML = '';
  const firstRender = renderedUps.size === 0;
  const nextRendered = new Set();
  for (const u of shown) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = !firstRender && !renderedUps.has(u.id) ? 'up is-new' : 'up';
    if (C.locked?.has(u.id)) b.classList.add('is-locked');
    nextRendered.add(u.id);
    b.dataset.id = u.id;
    b.dataset.kind = u.kind;
    b.style.setProperty('--tier', TIER_COLORS[u.tier] ?? TIER_COLORS[0]);
    b.setAttribute('aria-label', `${u.name}. ${u.desc} Cuesta ${fmt(upgradeCost(u))}.`);
    b.innerHTML = icon(u.icon);
    b.addEventListener('click', (e) => {
      if (e.pointerType === 'touch' && !isTipFor(b)) {
        showTip(b, () => upgradeTip(u), 'auto');
        return;
      }
      const rect = b.getBoundingClientRect();
      if (buyUpgrade(u.id)) {
        hideTip();
        flyToPlanet(rect, u.icon, TIER_COLORS[u.tier] ?? TIER_COLORS[0]);
      } else deny(b);
    });
    bindTip(b, () => upgradeTip(u), 'auto');
    upGrid.appendChild(b);
  }
  renderedUps = nextRendered;
  if (renderedUps.size === 0) renderedUps.add('');
  upMore.hidden = list.length <= COLLAPSED_COUNT;
  upMore.textContent = expanded ? 'Mostrar menos' : `Mostrar todas (${list.length})`;
  root.querySelector('[data-up-empty]').hidden = list.length > 0;
  root.querySelector('[data-buy-all]').hidden = list.length === 0;
  refreshUpgradeAffordability();
}

function refreshUpgradeAffordability() {
  for (const el of upGrid.children) {
    const u = C.available.find((x) => x.id === el.dataset.id);
    if (!u) continue;
    const ok = G.energy >= upgradeCost(u) && !C.locked?.has(u.id);
    el.classList.toggle('is-affordable', ok);
    markReady(el, ok);
  }
}

function buyAllAffordable() {
  for (const u of [...C.available]) {
    if (!C.locked?.has(u.id) && G.energy >= upgradeCost(u)) buyUpgrade(u.id);
  }
}

function upgradeTip(u) {
  if (G.upgrades.has(u.id)) return '';
  const cost = upgradeCost(u);
  const missing = cost - G.energy;
  return `
    <div class="tt-head">
      <span class="tt-icon" style="--tier:${TIER_COLORS[u.tier]}">${icon(u.icon)}</span>
      <div><div class="tt-name">${u.name}</div><div class="tt-sub">${u.sub}</div></div>
      <div class="tt-cost ${missing > 0 ? 'is-short' : ''}">₡${fmt(cost)}</div>
    </div>
    <p class="tt-desc">${u.desc}</p>
    ${u.requires.length ? `<ul class="tt-req">${u.requires.map((r) => {
      const ok = G.upgrades.has(r);
      const req = UPGRADES_BY_ID.get(r);
      return `<li class="${ok ? 'is-ok' : ''}">${ok ? '✓' : '✗'} ${req.name} <span>(${req.sub})</span></li>`;
    }).join('')}</ul>` : ''}
    ${C.locked?.has(u.id) ? '<p class="tt-foot">Investiga antes lo que falta.</p>' : missing > 0 ? `<p class="tt-foot">Te faltan ${fmt(missing)}${C.eps > 0 ? `, unos ${fmtTime(missing / C.eps)}` : ''}.</p>` : '<p class="tt-foot is-ok">Puedes comprarla.</p>'}`;
}

// ─── Módulos ───
function visibleBuildings() {
  const out = [];
  let mysteryShown = false;
  for (const b of BUILDINGS) {
    const owned = G.buildings[b.id] ?? 0;
    if (b.index < 2 || owned > 0 || G.earnedRun >= b.baseCost * 0.5) out.push([b, false]);
    else if (!mysteryShown) { out.push([b, true]); mysteryShown = true; }
  }
  return out;
}

function renderBuildings() {
  const vis = visibleBuildings();
  visibleKey = vis.map(([b, m]) => b.id + (m ? '?' : '')).join(',');
  bList.innerHTML = '';
  items.clear();
  for (const [b, mystery] of vis) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `bld${mystery ? ' is-mystery' : ''}`;
    btn.style.setProperty('--hue', b.hue);
    btn.innerHTML = `
      <span class="bld-icon">${icon(b.id, '', { silhouette: mystery })}</span>
      <span class="bld-main">
        <span class="bld-name">${mystery ? 'Módulo desconocido' : b.name}</span>
        <span class="bld-cost">₡<span data-cost></span><span class="bld-qty" data-qty></span></span>
      </span>
      <span class="bld-count" data-count></span>`;
    btn.addEventListener('click', (e) => {
      if (mystery) return;
      const n = effectiveQty(e);
      if (mode === 'buy') {
        if (buyBuilding(b.id, n)) {
          kick(btn);
          flyToPlanet(btn.querySelector('.bld-icon').getBoundingClientRect(), b.id, `hsl(${b.hue} 70% 72%)`);
        } else deny(btn);
      } else if (sellBuilding(b.id, n)) kick(btn);
      else deny(btn);
      refreshStore();
    });
    bindTip(btn, () => (mystery ? mysteryTip(b) : buildingTip(b)), 'auto');
    li.appendChild(btn);
    bList.appendChild(li);
    items.set(b.id, {
      el: btn, mystery,
      cost: btn.querySelector('[data-cost]'),
      qty: btn.querySelector('[data-qty]'),
      count: btn.querySelector('[data-count]'),
    });
  }
  refreshStore();
}

function kick(el) {
  el.classList.remove('is-bought');
  void el.offsetWidth;
  el.classList.add('is-bought');
}

/** Pasa de no asequible a asequible: un destello para llamar la atención. */
function markReady(el, ok) {
  const was = el.dataset.ok === '1';
  el.dataset.ok = ok ? '1' : '0';
  if (ok && !was && el.dataset.seen) {
    el.classList.remove('is-ready');
    void el.offsetWidth;
    el.classList.add('is-ready');
  }
  el.dataset.seen = '1';
}

function deny(el) {
  el.classList.remove('is-denied');
  void el.offsetWidth;
  el.classList.add('is-denied');
}

function buildingTip(b) {
  const owned = G.buildings[b.id] ?? 0;
  const unit = C.perUnit[b.id] ?? 0;
  const total = C.total[b.id] ?? 0;
  const share = C.baseEps > 0 ? total / C.baseEps : 0;
  const n = qty === -1 ? Math.max(1, maxAffordable(b.id)) : qty;
  const cost = buildingCost(b.id, n);
  const missing = cost - G.energy;
  return `
    <div class="tt-head">
      <span class="tt-icon" style="--hue:${b.hue}">${icon(b.id)}</span>
      <div><div class="tt-name">${b.name}</div><div class="tt-sub">Tienes ${owned}</div></div>
      <div class="tt-cost ${missing > 0 ? 'is-short' : ''}">₡${fmt(cost)}</div>
    </div>
    <p class="tt-desc">${b.desc}</p>
    <ul class="tt-stats">
      <li>Cada uno genera <b>₡${fmt(unit, { frac: true })}</b> por segundo</li>
      ${owned ? `<li>${owned} ${owned === 1 ? b.name.toLowerCase() : b.plural} generan <b>₡${fmt(total, { frac: true })}</b> por segundo, el ${pct(share, share < 0.1 ? 1 : 0)} del total</li>` : ''}
    </ul>
    ${mode === 'sell' ? `<p class="tt-foot">Vender ${Math.min(owned, qty === -1 ? owned : qty)} devuelve ${fmt(sellValue(b.id, qty === -1 ? owned : qty))}.</p>`
      : missing > 0 && C.eps > 0 ? `<p class="tt-foot">Asequible en ${fmtTime(missing / C.eps)}.</p>` : ''}`;
}

function mysteryTip(b) {
  return `<div class="tt-head"><span class="tt-icon">${icon(b.id, '', { silhouette: true })}</span><div><div class="tt-name">Módulo desconocido</div><div class="tt-sub">Sigue ganando créditos para descubrirlo</div></div></div>
    <p class="tt-foot">Coste: ${fmt(Math.ceil(b.baseCost * C.bCost))}</p>`;
}

/** Actualiza costes, asequibilidad y contadores. Barato: se llama ~5 veces/s. */
export function refreshStore() {
  if (!bList) return;
  ensureFresh();
  const vis = visibleBuildings();
  const key = vis.map(([b, m]) => b.id + (m ? '?' : '')).join(',');
  if (key !== visibleKey) return renderBuildings();

  for (const [id, it] of items) {
    const owned = G.buildings[id] ?? 0;
    let cost;
    let label = '';
    let ok;
    if (mode === 'sell' && !it.mystery) {
      const n = qty === -1 ? owned : Math.min(qty, owned);
      cost = sellValue(id, n);
      ok = n > 0;
      label = n > 1 ? `×${n}` : '';
    } else if (qty === -1 && !it.mystery) {
      const n = maxAffordable(id);
      cost = buildingCost(id, Math.max(1, n));
      ok = n > 0;
      label = n > 1 ? `×${n}` : '';
    } else {
      const n = it.mystery ? 1 : qty;
      cost = buildingCost(id, n);
      ok = G.energy >= cost;
      label = n > 1 ? `×${n}` : '';
    }
    const text = fmt(cost);
    if (it.cost.textContent !== text) it.cost.textContent = text;
    if (it.qty.textContent !== label) it.qty.textContent = label;
    const c = owned ? String(owned) : '';
    if (it.count.textContent !== c) it.count.textContent = c;
    it.el.classList.toggle('is-affordable', ok && !it.mystery);
    if (!it.mystery && mode === 'buy') markReady(it.el, ok);
  }
  refreshUpgradeAffordability();
}
