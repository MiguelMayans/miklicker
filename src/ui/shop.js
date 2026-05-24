/**
 * Shop — Tarjetas compactas con info integrada (sin tooltip flotante).
 */

import { getState, updateState } from '../state.js';
import { BUILDINGS, BUILDINGS_BY_ID } from '../data/buildings.js';
import { calculateBuildingCost, isBuildingUnlocked } from '../engine/formulas.js';
import { BUILDING_COST_GROWTH_RATE } from '../config.js';
import { formatNumber } from '../utils/numbers.js';
import { emit } from '../utils/eventBus.js';
import { addRandomLog } from './log.js';
import { spawnPurchaseRain } from './particles.js';
import { playPurchaseDing } from '../audio/audioEngine.js';
import { initAutoClickers } from '../engine/autoClicker.js';

let shopContainer = null;
const buildingCards = new Map();
const unlockedBuildings = new Set();

let buyQuantity = 1;

export function setBuyQuantity(qty) {
  buyQuantity = qty;
  renderShop(); // re-render para actualizar costes
}

export function getBuyQuantity() {
  return buyQuantity;
}

export function initShop(container) {
  shopContainer = container;
  renderShop();
}

export function refreshShopAffordability() {
  const state = getState();
  let newUnlock = false;

  for (const building of BUILDINGS) {
    const owned = state.buildings[building.id] ?? 0;
    const wasUnlocked = unlockedBuildings.has(building.id);
    const nowUnlocked = isBuildingUnlocked(building, state) || owned > 0;

    if (!wasUnlocked && nowUnlocked) {
      unlockedBuildings.add(building.id);
      newUnlock = true;
      continue;
    }

    if (!nowUnlocked) continue;

    const refs = buildingCards.get(building.id);
    if (!refs) continue;

    const qty = buyQuantity === -1 ? calculateMaxBuy(building.baseCost, owned, state.energy) || 1 : buyQuantity;
    const cost = calculateBulkCost(building.baseCost, owned, qty);
    const canAfford = state.energy >= cost;

    refs.card.className = getCardClasses(canAfford);
    refs.card.dataset.canAfford = String(canAfford);

    const qtyLabel = buyQuantity === -1 ? (qty > 1 ? `×${qty} ` : '') : `×${qty} `;
    refs.costEl.textContent = `${qtyLabel}${formatNumber(cost, 0)} kWh`;
    refs.costEl.className = `text-sm font-extrabold ${canAfford ? 'text-[#06b6d4]' : 'text-[#dc2626]'}`;
    refs.countEl.textContent = String(owned);
    if (building.isAutoClicker) {
      refs.totalProdEl.textContent = `+${formatNumber(owned)} clics`;
    } else {
      refs.totalProdEl.textContent = `+${formatNumber(building.baseProduction * owned, 1)} kW`;
    }
    refs.nextCostEl.textContent = `prox: ${formatNumber(calculateBuildingCost(building.baseCost, owned + 1), 0)} kWh`;

    if (canAfford && refs.card.dataset.hasClick !== 'true') {
      refs.card.addEventListener('click', refs.clickHandler);
      refs.card.dataset.hasClick = 'true';
    } else if (!canAfford && refs.card.dataset.hasClick === 'true') {
      refs.card.removeEventListener('click', refs.clickHandler);
      refs.card.dataset.hasClick = 'false';
    }
  }

  if (newUnlock) renderShop();
}

function renderShop() {
  if (!shopContainer) return;

  const state = getState();
  shopContainer.innerHTML = '';
  buildingCards.clear();

  const fragment = document.createDocumentFragment();
  let nextLockedShown = false;

  for (const building of BUILDINGS) {
    const owned = state.buildings[building.id] ?? 0;
    const unlocked = isBuildingUnlocked(building, state);

    if (!unlocked && owned === 0) {
      if (!nextLockedShown) {
        nextLockedShown = true;
        const progress = Math.min(100, (state.totalEnergyEarned / building.unlockAt) * 100);
        fragment.appendChild(createLockedCard(building, progress));
      }
      continue;
    }
    unlockedBuildings.add(building.id);

    const qty = buyQuantity === -1 ? calculateMaxBuy(building.baseCost, owned, state.energy) || 1 : buyQuantity;
    const cost = calculateBulkCost(building.baseCost, owned, qty);
    const canAfford = state.energy >= cost;
    const clickHandler = () => purchaseBuilding(building.id);

    const card = document.createElement('div');
    card.className = getCardClasses(canAfford);
    card.dataset.canAfford = String(canAfford);
    card.dataset.hasClick = canAfford ? 'true' : 'false';

    if (canAfford) card.addEventListener('click', clickHandler);

    const img = document.createElement('img');
    img.src = `sprites/${building.sprite}`;
    img.alt = building.name;
    img.className = 'w-10 h-10 pixelated flex-shrink-0';

    const info = document.createElement('div');
    info.className = 'flex-1 min-w-0';

    // Row 1: Name + Count + Cost
    const row1 = document.createElement('div');
    row1.className = 'flex items-center justify-between gap-2';

    const nameWrap = document.createElement('div');
    nameWrap.className = 'flex items-center gap-1.5 min-w-0';

    const name = document.createElement('span');
    name.className = 'text-sm font-extrabold text-[#0f0f0f] truncate';
    name.textContent = building.name;

    const countEl = document.createElement('span');
    countEl.className = 'text-xs font-bold text-[#6b6b64] bg-[#d4d0c8] px-1.5 border border-[#a09c94]';
    countEl.textContent = String(owned);

    nameWrap.appendChild(name);
    nameWrap.appendChild(countEl);

    const costEl = document.createElement('span');
    costEl.className = `text-sm font-extrabold ${canAfford ? 'text-[#06b6d4]' : 'text-[#dc2626]'}`;
    const qtyLabel = buyQuantity === -1 ? (qty > 1 ? `×${qty} ` : '') : `×${qty} `;
    costEl.textContent = `${qtyLabel}${formatNumber(cost, 0)} kWh`;

    row1.appendChild(nameWrap);
    row1.appendChild(costEl);

    // Row 2: Description
    const desc = document.createElement('p');
    desc.className = 'text-xs text-[#3a3a35] leading-tight mt-0.5 truncate';
    desc.textContent = building.description;

    // Row 3: Stats line (cursor especial)
    const row3 = document.createElement('div');
    row3.className = 'flex items-center gap-3 mt-1 text-xs font-medium text-[#6b6b64]';

    let totalProdEl;

    if (building.isAutoClicker) {
      const interval = (building.autoClickInterval ?? 10000) / 1000;
      const perUnit = document.createElement('span');
      perUnit.textContent = `Cada ${formatNumber(interval)}s`;

      totalProdEl = document.createElement('span');
      totalProdEl.className = 'text-[#0f0f0f] font-bold';
      totalProdEl.textContent = `+${formatNumber(owned)} clics`;

      row3.appendChild(perUnit);
      row3.appendChild(totalProdEl);
    } else {
      const perUnit = document.createElement('span');
      perUnit.textContent = `+${formatNumber(building.baseProduction, 1)} kW/u`;

      totalProdEl = document.createElement('span');
      totalProdEl.className = 'text-[#0f0f0f] font-bold';
      totalProdEl.textContent = `+${formatNumber(building.baseProduction * owned, 1)} kW`;

      row3.appendChild(perUnit);
      row3.appendChild(totalProdEl);
    }

    const nextCostEl = document.createElement('span');
    nextCostEl.textContent = `prox: ${formatNumber(calculateBuildingCost(building.baseCost, owned + 1), 0)} kWh`;
    row3.appendChild(nextCostEl);

    // Tooltip integrado (se expande al hover)
    const tooltip = document.createElement('div');
    tooltip.className = 'hidden text-[10px] text-[#444444] mt-1.5 pt-1.5 border-t border-[#cccccc] leading-snug';
    tooltip.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span>Producción base:</span>
        <span class="font-bold text-[#0f0f0f]">${building.isAutoClicker ? 'Auto-clicker' : `+${formatNumber(building.baseProduction, 1)} kW`}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span>Desbloqueo:</span>
        <span class="font-bold">${formatNumber(building.unlockAt, 0)} kWh</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span>Crecimiento coste:</span>
        <span class="font-bold">×${BUILDING_COST_GROWTH_RATE}</span>
      </div>
    `;

    info.appendChild(row1);
    info.appendChild(desc);
    info.appendChild(row3);
    info.appendChild(tooltip);

    // Hover para mostrar tooltip
    card.addEventListener('mouseenter', () => {
      tooltip.classList.remove('hidden');
    });
    card.addEventListener('mouseleave', () => {
      tooltip.classList.add('hidden');
    });

    card.appendChild(img);
    card.appendChild(info);
    fragment.appendChild(card);

    buildingCards.set(building.id, { card, costEl, countEl, totalProdEl, nextCostEl, clickHandler });
  }

  shopContainer.appendChild(fragment);
}

/**
 * Calcula el coste total de comprar `qty` edificios adicionales.
 * Serie geométrica: cost = baseCost * r^owned * (r^qty - 1) / (r - 1)
 */
function calculateBulkCost(baseCost, owned, qty) {
  if (qty <= 1) return calculateBuildingCost(baseCost, owned);
  const r = BUILDING_COST_GROWTH_RATE;
  const first = calculateBuildingCost(baseCost, owned);
  return Math.floor(first * (Math.pow(r, qty) - 1) / (r - 1));
}

function purchaseBuilding(buildingId) {
  const building = BUILDINGS_BY_ID.get(buildingId);
  if (!building) return;

  const state = getState();
  const owned = state.buildings[buildingId] ?? 0;

  // Determinar cantidad real a comprar (MAX = todo lo que se pueda)
  let qty = buyQuantity;
  if (qty === -1) { // MAX
    qty = calculateMaxBuy(building.baseCost, owned, state.energy);
    if (qty <= 0) return;
  }

  const cost = calculateBulkCost(building.baseCost, owned, qty);
  if (state.energy < cost) return;

  const newBuildings = { ...state.buildings, [buildingId]: owned + qty };
  const newEnergy = state.energy - cost;

  updateState({ energy: newEnergy, buildings: newBuildings });

  const card = buildingCards.get(buildingId)?.card;
  if (card) {
    const rect = card.getBoundingClientRect();
    spawnPurchaseRain(rect.left + rect.width / 2, rect.top, '#06b6d4');
    flashCard(card);
    spawnFloatingText(rect.left + rect.width / 2, rect.top, `${building.name} ×${qty}`);
  }

  playPurchaseDing();

  if (building.isAutoClicker) {
    initAutoClickers();
  }

  addRandomLog('building_purchased', { name: building.name, qty }, 'success');
  emit('buildingPurchased', { id: buildingId, name: building.name, count: owned + qty });
  emit('stateUpdated', { energy: newEnergy, buildings: newBuildings });
}

/**
 * Calcula cuántos edificios se pueden comprar con la energía disponible.
 */
function calculateMaxBuy(baseCost, owned, energy) {
  const r = BUILDING_COST_GROWTH_RATE;
  const first = calculateBuildingCost(baseCost, owned);
  // Serie geométrica: energy >= first * (r^N - 1) / (r - 1)
  // r^N <= 1 + energy * (r - 1) / first
  // N <= log(1 + energy * (r - 1) / first) / log(r)
  const maxN = Math.floor(Math.log(1 + energy * (r - 1) / first) / Math.log(r));
  return Math.max(0, maxN);
}

function getCardClasses(canAfford) {
  const base = 'flex items-start gap-3 p-3 border-[3px] bg-[#eae7e0] block-interactive';
  if (canAfford) {
    return `${base} border-[#0f0f0f] border-l-[5px] border-l-[#06b6d4] cursor-pointer`;
  }
  return `${base} border-[#a09c94] opacity-50 cursor-not-allowed`;
}

function createLockedCard(building, progress) {
  const card = document.createElement('div');
  card.className = 'flex items-center gap-3 p-3 border-[3px] border-[#a09c94] bg-[#d8d5ce] opacity-40';

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'w-10 h-10 flex-shrink-0 border-[3px] border-[#a09c94] bg-[#eae7e0] flex items-center justify-center';
  const img = document.createElement('img');
  img.src = `sprites/${building.sprite}`;
  img.alt = building.name;
  img.className = 'w-6 h-6 pixelated opacity-30';
  imgWrapper.appendChild(img);

  const info = document.createElement('div');
  info.className = 'flex-1 min-w-0';

  const name = document.createElement('span');
  name.className = 'text-sm font-extrabold text-[#6b6b64] block';
  name.textContent = '???';

  const desc = document.createElement('p');
  desc.className = 'text-xs text-[#6b6b64] mt-0.5';
  desc.textContent = `Requiere ${formatNumber(building.unlockAt, 0)} kWh acumulados`;

  const barContainer = document.createElement('div');
  barContainer.className = 'w-full h-2 bg-[#ddd9d2] mt-2';
  const barFill = document.createElement('div');
  barFill.className = 'h-full bg-[#06b6d4] transition-all duration-700';
  barFill.style.width = `${progress}%`;
  barFill.style.opacity = '0.7';
  barContainer.appendChild(barFill);

  info.appendChild(name);
  info.appendChild(desc);
  info.appendChild(barContainer);

  card.appendChild(imgWrapper);
  card.appendChild(info);

  return card;
}

function flashCard(card) {
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
