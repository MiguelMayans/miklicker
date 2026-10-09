/**
 * Upgrades — Tarjetas compactas con info integrada (sin tooltip flotante).
 */

import { getState, updateState } from '../state.js';
import { UPGRADES, UPGRADES_BY_ID } from '../data/upgrades.js';
import { BUILDINGS_BY_ID } from '../data/buildings.js';
import { isUpgradeAvailable } from '../engine/formulas.js';
import { formatNumber } from '../utils/numbers.js';
import { emit } from '../utils/eventBus.js';
import { addRandomLog } from './log.js';
import { spawnPurchaseRain } from './particles.js';
import { playPurchaseDing } from '../audio/audioEngine.js';
import { initAutoClickers } from '../engine/autoClicker.js';

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
          refs.card.style.opacity = '0';
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

    const costResource = upgrade.costResource ?? 'energy';
    const canAfford = costResource === 'cosmicData'
      ? (state.prestige?.cosmicData ?? 0) >= upgrade.cost
      : state.energy >= upgrade.cost;
    const resourceLabel = costResource === 'cosmicData' ? 'Datos' : 'kWh';

    refs.card.className = getUpgradeCardClasses(canAfford);
    refs.card.style.borderLeftColor = canAfford ? getResourceAccent(costResource) : '';
    refs.card.dataset.canAfford = String(canAfford);

    refs.costEl.textContent = `${formatNumber(upgrade.cost, 0)} ${resourceLabel}`;
    refs.costEl.className = `text-sm font-extrabold ${canAfford ? (costResource === 'cosmicData' ? 'text-[#a855f7]' : 'text-[#06b6d4]') : 'text-[#dc2626]'}`;

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

    const costResource = upgrade.costResource ?? 'energy';
    const canAfford = costResource === 'cosmicData'
      ? (state.prestige?.cosmicData ?? 0) >= upgrade.cost
      : state.energy >= upgrade.cost;
    const resourceLabel = costResource === 'cosmicData' ? 'Datos' : 'kWh';
    const clickHandler = () => purchaseUpgrade(upgrade.id);

    const card = document.createElement('div');
    card.className = getUpgradeCardClasses(canAfford);
    if (canAfford) card.style.borderLeftColor = getResourceAccent(costResource);
    card.dataset.canAfford = String(canAfford);
    card.dataset.hasClick = canAfford ? 'true' : 'false';

    if (canAfford) card.addEventListener('click', clickHandler);

    const info = document.createElement('div');
    info.className = 'flex-1 min-w-0';

    // Row 1: Name + Cost
    const row1 = document.createElement('div');
    row1.className = 'flex items-center justify-between gap-2';

    const name = document.createElement('span');
    name.className = 'text-sm font-extrabold text-[#0f0f0f] truncate';
    name.textContent = upgrade.name;

    const costEl = document.createElement('span');
    costEl.className = `text-sm font-extrabold ${canAfford ? (costResource === 'cosmicData' ? 'text-[#a855f7]' : 'text-[#06b6d4]') : 'text-[#dc2626]'}`;
    costEl.textContent = `${formatNumber(upgrade.cost, 0)} ${resourceLabel}`;

    row1.appendChild(name);
    row1.appendChild(costEl);

    // Row 2: Description
    const desc = document.createElement('p');
    desc.className = 'text-xs text-[#3a3a35] leading-tight mt-0.5 truncate';
    desc.textContent = upgrade.description;

    // Row 3: Effect
    const row3 = document.createElement('div');
    row3.className = 'text-xs font-bold text-[#06b6d4] mt-1';
    const fx = upgrade.effect;
    if (fx.type === 'building_multiplier') {
      const target = BUILDINGS_BY_ID.get(fx.target)?.name ?? fx.target;
      row3.textContent = `Efecto: producción de ${target} ×${fx.multiplier}`;
    } else if (fx.type === 'click_multiplier') {
      row3.textContent = `Efecto: poder de clic ×${fx.multiplier}`;
    } else if (fx.type === 'cursor_interval') {
      row3.textContent = `Efecto: velocidad de cursor ×${fx.multiplier}`;
    } else if (fx.type === 'cursor_multiplier') {
      row3.textContent = `Efecto: poder de cursor ×${fx.multiplier}`;
    } else if (fx.type === 'global_multiplier') {
      row3.textContent = `Efecto: producción global ×${fx.multiplier}`;
    } else if (fx.type === 'synergy') {
      const source = BUILDINGS_BY_ID.get(fx.source)?.name ?? fx.source;
      const target = BUILDINGS_BY_ID.get(fx.target)?.name ?? fx.target;
      row3.textContent = `Sinergia: ${source} potencia ${target} +${Math.round(fx.bonusPerSource * 100)}% c/u`;
    } else if (fx.type === 'crit_chance') {
      row3.textContent = `Efecto: +${Math.round(fx.value * 100)}% probabilidad de crítico`;
    } else if (fx.type === 'crit_multiplier') {
      row3.textContent = `Efecto: multiplicador de crítico ×${fx.multiplier}`;
    } else if (fx.type === 'combo_cap') {
      row3.textContent = `Efecto: combo tope ${fx.value}, +${Math.round(fx.step * 100)}%/paso`;
    } else if (fx.type === 'ability_unlock') {
      const names = { energize: 'ENERGIZE', purge: 'PURGE', overload: 'OVERLOAD' };
      row3.textContent = `Desbloquea: protocolo ${names[fx.ability] ?? fx.ability}`;
    } else if (fx.type === 'tradeoff') {
      const parts = [];
      if (fx.productionMultiplier > 1) parts.push(`producción ×${fx.productionMultiplier}`);
      else if (fx.productionMultiplier < 1) parts.push(`producción ×${fx.productionMultiplier}`);
      if (fx.clickMultiplier) parts.push(`clic ×${fx.clickMultiplier}`);
      if (fx.heatMultiplier > 1) parts.push(`calor +${Math.round((fx.heatMultiplier - 1) * 100)}%`);
      else if (fx.heatMultiplier < 1) parts.push(`calor -${Math.round((1 - fx.heatMultiplier) * 100)}%`);
      row3.textContent = `Trade-off: ${parts.join(', ')}`;
      row3.className = 'text-xs font-bold text-[#f59e0b] mt-1';
    } else if (fx.type === 'prestige_efficiency') {
      row3.textContent = `Efecto: eficiencia de Datos Cósmicos ×${fx.multiplier}`;
      row3.className = 'text-xs font-bold text-[#a855f7] mt-1';
    } else {
      row3.textContent = 'Efecto: mejora activa';
    }

    // Tooltip integrado al hover
    const tooltip = document.createElement('div');
    tooltip.className = 'hidden text-[10px] text-[#444444] mt-1.5 pt-1.5 border-t border-[#cccccc] leading-snug';
    const reqText = upgrade.requires?.building
      ? `Requiere: ${BUILDINGS_BY_ID.get(upgrade.requires.building)?.name ?? upgrade.requires.building} ×${upgrade.requires.count}`
      : upgrade.requires?.totalClicks
        ? `Requiere: ${upgrade.requires.totalClicks} clics manuales`
        : 'Sin requisitos';
    tooltip.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span>ID Protocolo:</span>
        <span class="font-mono font-bold text-[#0f0f0f]">${upgrade.id}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span>Requisito:</span>
        <span class="font-bold">${reqText}</span>
      </div>
    `;

    info.appendChild(row1);
    info.appendChild(desc);
    info.appendChild(row3);
    info.appendChild(tooltip);

    card.addEventListener('mouseenter', () => tooltip.classList.remove('hidden'));
    card.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));

    card.appendChild(info);
    fragment.appendChild(card);

    upgradeCards.set(upgrade.id, { card, costEl, clickHandler });
  }

  if (visibleCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-center text-sm text-[#6b6b64] py-8';
    empty.textContent = 'No hay mejoras disponibles.';
    fragment.appendChild(empty);
  }

  upgradesContainer.appendChild(fragment);
}

async function purchaseUpgrade(upgradeId) {
  const upgrade = UPGRADES_BY_ID.get(upgradeId);
  if (!upgrade) return;

  const state = getState();
  const costResource = upgrade.costResource ?? 'energy';
  const canAfford = costResource === 'cosmicData'
    ? (state.prestige?.cosmicData ?? 0) >= upgrade.cost
    : state.energy >= upgrade.cost;
  if (!canAfford || state.upgrades.includes(upgradeId)) return;

  const newEnergy = costResource === 'cosmicData' ? state.energy : state.energy - upgrade.cost;
  const newCosmicData = costResource === 'cosmicData'
    ? (state.prestige?.cosmicData ?? 0) - upgrade.cost
    : (state.prestige?.cosmicData ?? 0);
  const newUpgrades = [...state.upgrades, upgradeId];

  const newState = { ...state, energy: newEnergy, upgrades: newUpgrades };
  newState.prestige = { ...state.prestige, cosmicData: newCosmicData };

  const fx = upgrade.effect;
  if (fx.type === 'building_multiplier') {
    const current = newState.buildingMultipliers?.[fx.target] ?? 1;
    newState.buildingMultipliers = {
      ...newState.buildingMultipliers,
      [fx.target]: current * fx.multiplier,
    };
  } else if (fx.type === 'click_multiplier') {
    newState.clickPower = state.clickPower * fx.multiplier;
  } else if (fx.type === 'cursor_interval') {
    newState.cursorIntervalMultiplier = (state.cursorIntervalMultiplier ?? 1) * fx.multiplier;
  } else if (fx.type === 'cursor_multiplier') {
    newState.cursorMultiplier = (state.cursorMultiplier ?? 1) * fx.multiplier;
  } else if (fx.type === 'global_multiplier') {
    newState.globalMultiplier = (state.globalMultiplier ?? 1) * fx.multiplier;
  } else if (fx.type === 'crit_chance') {
    newState.critChance = (state.critChance ?? 0) + fx.value;
  } else if (fx.type === 'crit_multiplier') {
    newState.critMultiplier = (state.critMultiplier ?? 5) * fx.multiplier;
  } else if (fx.type === 'combo_cap') {
    newState.comboCap = fx.value;
    newState.comboStep = fx.step;
  } else if (fx.type === 'ability_unlock') {
    if (!newState.abilities) newState.abilities = {};
    newState.abilities[fx.ability] = { unlocked: true, cooldownUntil: 0 };
  } else if (fx.type === 'tradeoff') {
    if (fx.productionMultiplier) {
      newState.globalMultiplier = (newState.globalMultiplier ?? 1) * fx.productionMultiplier;
    }
    if (fx.clickMultiplier) {
      newState.clickPower = newState.clickPower * fx.clickMultiplier;
    }
    if (fx.heatMultiplier) {
      newState.heatMultiplier = (newState.heatMultiplier ?? 1) * fx.heatMultiplier;
    }
  } else if (fx.type === 'prestige_efficiency') {
    // Recalcular multiplicador de prestigio con la nueva eficiencia
    const { calculatePrestigeMultiplier } = await import('../engine/prestige.js');
    newState.prestige.multiplier = calculatePrestigeMultiplier(newState.prestige.totalCosmicDataEarned ?? newState.prestige.cosmicData, fx.multiplier);
  }
  // synergy se calcula dinámicamente en formulas.js, no necesita estado

  updateState(newState);

  const card = upgradeCards.get(upgradeId)?.card;
  if (card) {
    const rect = card.getBoundingClientRect();
    spawnPurchaseRain(rect.left + rect.width / 2, rect.top, '#06b6d4');
    flashUpgradeCard(card);
    spawnFloatingText(rect.left + rect.width / 2, rect.top, upgrade.name);
  }

  addRandomLog('upgrade_purchased', { name: upgrade.name }, 'success');
  emit('upgradePurchased', { id: upgradeId, name: upgrade.name });
  emit('stateUpdated', { energy: newEnergy, upgrades: newUpgrades });
}

function getUpgradeCardClasses(canAfford) {
  const base = 'p-3 border-[3px] bg-[#e8e4dc] b-interactive';
  if (canAfford) {
    return `${base} border-[#0f0f0f] border-l-[6px] cursor-pointer`;
  }
  return `${base} border-[#8a8a8a] opacity-40 cursor-not-allowed`;
}

function getResourceAccent(costResource) {
  return costResource === 'cosmicData' ? '#a855f7' : '#06b6d4';
}

function flashUpgradeCard(card) {
  card.style.transition = 'all 0.3s ease';
  card.style.backgroundColor = '#dbeafe';
  card.style.borderColor = '#06b6d4';

  setTimeout(() => {
    card.style.backgroundColor = '';
    card.style.borderColor = '';
  }, 400);
}

function spawnFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.className = 'fixed pointer-events-none text-xs font-extrabold text-[#06b6d4] animate-float-up';
  el.style.left = `${x}px`;
  el.style.top = `${y - 20}px`;
  el.style.zIndex = '100';
  el.style.whiteSpace = 'nowrap';

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
