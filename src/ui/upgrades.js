/**
 * Renderizado del panel de mejoras (upgrades) completamente funcional.
 */

import { getState, updateState } from '../state.js';
import { UPGRADES, UPGRADES_BY_ID } from '../data/upgrades.js';
import { BUILDINGS_BY_ID } from '../data/buildings.js';
import { isUpgradeAvailable } from '../engine/formulas.js';
import { formatNumber } from '../utils/numbers.js';
import { emit } from '../utils/eventBus.js';
import { addRandomLog } from './log.js';
import { showTooltip, hideTooltip } from './tooltip.js';
import { spawnPurchaseRain } from './particles.js';

/** @type {HTMLElement|null} */
let upgradesContainer = null;

const upgradeCards = new Map();

export function initUpgrades(container) {
  upgradesContainer = container;
  renderUpgrades();
}

export function refreshUpgrades() {
  const state = getState();
  let needsRender = false;

  for (const upgrade of UPGRADES) {
    const wasAvailable = upgradeCards.has(upgrade.id);
    const nowAvailable = isUpgradeAvailable(upgrade, state);
    const isPurchased = state.upgrades.includes(upgrade.id);

    if (isPurchased) {
      if (wasAvailable) {
        const refs = upgradeCards.get(upgrade.id);
        if (refs?.card) {
          // Animación de desaparición
          refs.card.style.opacity = '0';
          refs.card.style.transform = 'scale(0.95)';
          setTimeout(() => refs.card.remove(), 200);
          upgradeCards.delete(upgrade.id);
        }
      }
      continue;
    }

    if (!wasAvailable && nowAvailable) {
      needsRender = true;
      continue;
    }

    if (!nowAvailable) continue;

    const refs = upgradeCards.get(upgrade.id);
    if (!refs) continue;

    const canAfford = state.energy >= upgrade.cost;

    refs.card.className = getUpgradeCardClasses(canAfford);
    refs.card.dataset.canAfford = String(canAfford);

    refs.costEl.textContent = `⚡ ${formatNumber(upgrade.cost)}`;
    refs.costEl.className = `text-[10px] font-bold ${canAfford ? 'text-energy' : 'text-mars'}`;

    if (canAfford && refs.card.dataset.hasClick !== 'true') {
      refs.card.addEventListener('click', refs.clickHandler);
      refs.card.dataset.hasClick = 'true';
    } else if (!canAfford && refs.card.dataset.hasClick === 'true') {
      refs.card.removeEventListener('click', refs.clickHandler);
      refs.card.dataset.hasClick = 'false';
    }
  }

  if (needsRender) renderUpgrades();
}

function renderUpgrades() {
  if (!upgradesContainer) return;

  const state = getState();
  upgradesContainer.innerHTML = '';
  upgradeCards.clear();

  const fragment = document.createDocumentFragment();
  let visibleCount = 0;

  for (const upgrade of UPGRADES) {
    if (!isUpgradeAvailable(upgrade, state)) continue;
    visibleCount++;

    const canAfford = state.energy >= upgrade.cost;
    const clickHandler = () => purchaseUpgrade(upgrade.id);

    const card = document.createElement('div');
    card.className = getUpgradeCardClasses(canAfford);
    card.dataset.canAfford = String(canAfford);
    card.dataset.hasClick = canAfford ? 'true' : 'false';

    if (canAfford) card.addEventListener('click', clickHandler);

    card.addEventListener('mouseenter', (e) => showUpgradeTooltip(e, upgrade));
    card.addEventListener('mouseleave', hideTooltip);

    const info = document.createElement('div');
    info.className = 'flex-1 min-w-0';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between';

    const name = document.createElement('span');
    name.className = 'font-pixel text-[11px] text-cyan-pale truncate';
    name.textContent = upgrade.name;

    const costEl = document.createElement('span');
    costEl.className = `text-[11px] font-bold ${canAfford ? 'text-energy' : 'text-mars'}`;
    costEl.textContent = `⚡ ${formatNumber(upgrade.cost)}`;

    titleRow.appendChild(name);
    titleRow.appendChild(costEl);

    const desc = document.createElement('p');
    desc.className = 'text-[11px] text-slate-400 mt-1 leading-relaxed';
    desc.textContent = upgrade.description;

    info.appendChild(titleRow);
    info.appendChild(desc);
    card.appendChild(info);
    fragment.appendChild(card);

    upgradeCards.set(upgrade.id, { card, costEl, clickHandler });
  }

  if (visibleCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-center text-[10px] text-cosmic-500 py-8';
    empty.textContent = 'No hay mejoras disponibles por ahora...';
    fragment.appendChild(empty);
  }

  upgradesContainer.appendChild(fragment);
}

function purchaseUpgrade(upgradeId) {
  const upgrade = UPGRADES_BY_ID.get(upgradeId);
  if (!upgrade) return;

  const state = getState();
  if (state.energy < upgrade.cost || state.upgrades.includes(upgradeId)) return;

  const newEnergy = state.energy - upgrade.cost;
  const newUpgrades = [...state.upgrades, upgradeId];

  const newState = { ...state, energy: newEnergy, upgrades: newUpgrades };

  if (upgrade.effect.type === 'building_multiplier') {
    const current = newState.buildingMultipliers?.[upgrade.effect.target] ?? 1;
    newState.buildingMultipliers = {
      ...newState.buildingMultipliers,
      [upgrade.effect.target]: current * upgrade.effect.multiplier,
    };
  } else if (upgrade.effect.type === 'click_multiplier') {
    newState.clickPower = state.clickPower * upgrade.effect.multiplier;
  }

  updateState(newState);

  // Feedback visual de compra
  const card = upgradeCards.get(upgradeId)?.card;
  if (card) {
    const rect = card.getBoundingClientRect();
    // Partículas doradas
    spawnPurchaseRain(rect.left + rect.width / 2, rect.top, '#facc15');
    // Flash intenso en la tarjeta
    flashUpgradeCard(card);
    // Número flotante con el nombre de la mejora
    spawnUpgradeFloatingText(rect.left + rect.width / 2, rect.top, upgrade.name);
  }

  addRandomLog('upgrade_purchased', { name: upgrade.name }, 'success');
  emit('upgradePurchased', { id: upgradeId, name: upgrade.name });
  emit('stateUpdated', { energy: newEnergy, upgrades: newUpgrades });
}

function getUpgradeCardClasses(canAfford) {
  const base = 'p-4 rounded-2xl border transition-all duration-200 card-hover';
  if (canAfford) {
    return `${base} bg-white/[0.04] border-energy/20 cursor-pointer hover:bg-white/[0.07] hover:border-energy/50 affordable-glow`;
  }
  return `${base} bg-white/[0.02] border-white/[0.04] opacity-40 cursor-not-allowed`;
}

function showUpgradeTooltip(e, upgrade) {
  let effectText = '';
  if (upgrade.effect.type === 'building_multiplier') {
    const target = BUILDINGS_BY_ID.get(upgrade.effect.target)?.name ?? upgrade.effect.target;
    effectText = `Multiplica la producción de <b style="color:#22d3ee">${target}</b> por ${upgrade.effect.multiplier}`;
  } else if (upgrade.effect.type === 'click_multiplier') {
    effectText = `Multiplica el poder de clic por ${upgrade.effect.multiplier}`;
  }

  showTooltip(e.currentTarget, `
    <div class="font-pixel text-[10px] text-cyan-pale mb-1">${upgrade.name}</div>
    <div class="text-[10px] text-slate-300 mb-1.5">${upgrade.description}</div>
    <div class="text-[10px] text-energy">Efecto: ${effectText}</div>
    <div class="text-[10px] text-cosmic-500 mt-1">Coste: ⚡ ${formatNumber(upgrade.cost)}</div>
  `);
}

/**
 * Flash intenso en la tarjeta de mejora al comprar.
 * @param {HTMLElement} card
 */
function flashUpgradeCard(card) {
  card.style.transition = 'all 0.3s ease';
  card.style.backgroundColor = 'rgba(250, 204, 21, 0.15)';
  card.style.borderColor = 'rgba(250, 204, 21, 0.6)';
  card.style.transform = 'scale(1.02)';

  setTimeout(() => {
    card.style.backgroundColor = '';
    card.style.borderColor = '';
    card.style.transform = '';
  }, 400);
}

/**
 * Muestra texto flotante con el nombre de la mejora comprada.
 * @param {number} x
 * @param {number} y
 * @param {string} text
 */
function spawnUpgradeFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.className = 'fixed pointer-events-none font-pixel text-xs text-energy font-bold animate-float-up';
  el.style.left = `${x}px`;
  el.style.top = `${y - 20}px`;
  el.style.zIndex = '100';
  el.style.textShadow = '0 0 8px rgba(250,204,21,0.8), 0 0 16px rgba(250,204,21,0.4)';
  el.style.whiteSpace = 'nowrap';

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
