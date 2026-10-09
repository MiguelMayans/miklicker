/**
 * La Unidad: pantalla de prestigio. Reiniciar la colonia a cambio de niveles
 * permanentes (+1% de producción cada uno) y fragmentos para comprar poderes
 * Starborn, dibujados como una constelación.
 */

import { G, save } from '../core/state.js';
import { emit } from '../core/bus.js';
import { fmt } from '../core/format.js';
import { POWERS, POWERS_BY_ID } from '../data/powers.js';
import { pendingLevels, nextLevelAt, ascend, buyPower, canBuyPower } from '../game/engine.js';
import { icon } from './icons.js';

let dlg;
let selected = null;
let confirming = false;

export function initUnity() {
  dlg = document.createElement('dialog');
  dlg.className = 'unity';
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => { confirming = false; });
}

export function openUnity() {
  selected = null;
  confirming = false;
  render();
  dlg.showModal();
}

function state(p) {
  if (G.powers.has(p.id)) return 'owned';
  if (!p.req.every((r) => G.powers.has(r))) return 'locked';
  return G.prestige.fragments >= p.cost ? 'affordable' : 'available';
}

function render() {
  const pending = pendingLevels();
  const lines = POWERS.flatMap((p) => p.req.map((r) => {
    const q = POWERS_BY_ID.get(r);
    const lit = G.powers.has(p.id) && G.powers.has(r);
    return `<line x1="${q.x}" y1="${q.y}" x2="${p.x}" y2="${p.y}" class="${lit ? 'is-lit' : ''}"/>`;
  })).join('');
  const nodes = POWERS.map((p) => {
    const st = state(p);
    return `<g class="node is-${st} ${selected === p.id ? 'is-selected' : ''}" data-power="${p.id}" tabindex="0" role="button"
        aria-label="${p.name}: ${p.desc} Cuesta ${p.cost} fragmentos." transform="translate(${p.x} ${p.y})">
      <circle class="node-halo" r="4.6"/>
      <circle class="node-core" r="2.1"/>
      <text y="7.6">${p.name}</text>
    </g>`;
  }).join('');

  const sel = selected ? POWERS_BY_ID.get(selected) : null;
  const side = sel ? powerPanel(sel) : `
    <h3 class="unity-h">Poderes Starborn</h3>
    <p>Cada nivel de prestigio suma un 2% de producción para siempre. Además, gasta fragmentos en poderes permanentes que se conservan aunque vuelvas a entrar en la Unidad.</p>
    <p class="unity-hint">Selecciona una estrella de la constelación para ver su poder.</p>`;

  dlg.innerHTML = `
    <header class="unity-head">
      <h2 class="unity-title">La Unidad</h2>
      <dl class="unity-stats">
        <div><dt>Nivel</dt><dd>${fmt(G.prestige.level)}</dd></div>
        <div><dt>Fragmentos</dt><dd>${fmt(G.prestige.fragments)}</dd></div>
      </dl>
      <button type="button" class="icon-btn" data-close aria-label="Volver a la colonia">${icon('close')}</button>
    </header>
    <div class="unity-main">
      <svg class="constellation" viewBox="-10 -6 120 112" role="group" aria-label="Constelación de poderes">${lines}${nodes}</svg>
      <aside class="unity-side">
        <div class="unity-power">${side}</div>
        <div class="unity-ascend">
          <h3 class="unity-h">Entrar en la Unidad</h3>
          ${pending > 0 ? `
            <p>Fundas una colonia nueva: pierdes los créditos, los módulos, las mejoras y los colonos. Conservas logros, niveles, poderes y el diario.</p>
            <p class="unity-gain">+${fmt(pending)} ${pending === 1 ? 'nivel' : 'niveles'} y ${fmt(pending)} ${pending === 1 ? 'fragmento' : 'fragmentos'}</p>
            <button type="button" class="btn ${confirming ? 'btn-danger' : 'btn-primary'}" data-ascend>${confirming ? 'Confirmar: reiniciar la colonia' : 'Entrar en la Unidad'}</button>`
          : `<p>Todavía no ganarías ningún nivel. El siguiente llega cuando hayas ganado ₡${fmt(nextLevelAt())} en total (llevas ₡${fmt(G.earnedAll)}).</p>`}
        </div>
      </aside>
    </div>`;

  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelectorAll('[data-power]').forEach((n) => {
    const pick = () => { selected = n.dataset.power; render(); };
    n.addEventListener('click', pick);
    n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  dlg.querySelector('[data-buy]')?.addEventListener('click', () => {
    if (buyPower(selected)) { save(); render(); }
  });
  dlg.querySelector('[data-ascend]')?.addEventListener('click', () => {
    if (!confirming) { confirming = true; render(); return; }
    const gain = pendingLevels();
    if (ascend()) {
      confirming = false;
      save();
      flash();
      emit('ascendedUI', { gain });
      render();
    }
  });
}

function powerPanel(p) {
  const st = state(p);
  const missingReq = p.req.filter((r) => !G.powers.has(r)).map((r) => POWERS_BY_ID.get(r).name);
  let action = '';
  if (st === 'owned') action = '<p class="unity-owned">Ya tienes este poder.</p>';
  else if (st === 'locked') action = `<p class="unity-hint">Requiere: ${missingReq.join(', ')}.</p>`;
  else action = `<button type="button" class="btn btn-primary" data-buy ${canBuyPower(p.id) ? '' : 'disabled'}>Despertar por ${fmt(p.cost)} ${p.cost === 1 ? 'fragmento' : 'fragmentos'}</button>`;
  return `
    <h3 class="unity-h">${p.name}</h3>
    <p>${p.desc}</p>
    <p class="unity-cost">${fmt(p.cost)} ${p.cost === 1 ? 'fragmento' : 'fragmentos'}</p>
    ${action}`;
}

function flash() {
  const f = document.createElement('div');
  f.className = 'unity-flash';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1600);
}
