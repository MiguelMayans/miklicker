/**
 * Renderizado de la tienda de edificios con paleta por tier y tooltips.
 */

import { getState, updateState } from '../state.js';
import { BUILDINGS, BUILDINGS_BY_ID } from '../data/buildings.js';
import { calculateBuildingCost, isBuildingUnlocked } from '../engine/formulas.js';
import { formatNumber } from '../utils/numbers.js';
import { emit } from '../utils/eventBus.js';
import { addRandomLog } from './log.js';
import { showTooltip, hideTooltip } from './tooltip.js';
import { spawnPurchaseRain, spawnUnlockConfetti } from './particles.js';

/** @type {HTMLElement|null} */
let shopContainer = null;

const buildingCards = new Map();
const unlockedBuildings = new Set();

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

    const cost = calculateBuildingCost(building.baseCost, owned);
    const canAfford = state.energy >= cost;

    refs.card.className = getCardClasses(canAfford, building.tierColor);
    refs.card.dataset.canAfford = String(canAfford);

    refs.costEl.textContent = `⚡ ${formatNumber(cost)}`;
    refs.costEl.className = `text-[10px] font-bold ${canAfford ? 'text-energy' : 'text-mars'}`;
    refs.countEl.textContent = `x${owned}`;

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

    const cost = calculateBuildingCost(building.baseCost, owned);
    const canAfford = state.energy >= cost;
    const clickHandler = () => purchaseBuilding(building.id);

    const card = document.createElement('div');
    card.className = getCardClasses(canAfford, building.tierColor);
    card.dataset.canAfford = String(canAfford);
    card.dataset.hasClick = canAfford ? 'true' : 'false';

    if (canAfford) card.addEventListener('click', clickHandler);

    card.addEventListener('mouseenter', (e) => showBuildingTooltip(e, building, owned, cost));
    card.addEventListener('mouseleave', hideTooltip);

    // Glow border on hover
    card.style.borderColor = canAfford ? `${building.tierColor}30` : 'rgba(255,255,255,0.05)';

    const img = document.createElement('img');
    img.src = `sprites/${building.sprite}`;
    img.alt = building.name;
    img.className = 'w-11 h-11 pixelated flex-shrink-0';
    img.width = 64;
    img.height = 64;

    const info = document.createElement('div');
    info.className = 'flex-1 min-w-0';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between';

    const name = document.createElement('span');
    name.className = 'font-pixel text-[11px] truncate';
    name.style.color = building.tierColor;
    name.textContent = building.name;

    const countEl = document.createElement('span');
    countEl.className = 'font-pixel text-[10px] text-cosmic-500 ml-2';
    countEl.textContent = `x${owned}`;

    titleRow.appendChild(name);
    titleRow.appendChild(countEl);

    const desc = document.createElement('p');
    desc.className = 'text-[11px] text-slate-400 mt-1 leading-relaxed';
    desc.textContent = building.description;

    // Precio prominente
    const costRow = document.createElement('div');
    costRow.className = 'mt-3';

    const costEl = document.createElement('span');
    costEl.className = `inline-flex items-center gap-1.5 text-sm font-bold ${canAfford ? 'text-energy' : 'text-mars'}`;
    costEl.innerHTML = `<span class="text-base">⚡</span> ${formatNumber(cost)}`;

    costRow.appendChild(costEl);

    // Producción secundaria (más pequeña)
    const prodRow = document.createElement('div');
    prodRow.className = 'flex items-center gap-1.5 mt-1';

    const prodDot = document.createElement('span');
    prodDot.className = 'w-1.5 h-1.5 rounded-full';
    prodDot.style.backgroundColor = building.tierColor;

    const prodEl = document.createElement('span');
    prodEl.className = 'text-[10px] text-slate-400';
    prodEl.textContent = `+${formatNumber(building.baseProduction)}/s`;

    prodRow.appendChild(prodDot);
    prodRow.appendChild(prodEl);

    info.appendChild(titleRow);
    info.appendChild(desc);
    info.appendChild(costRow);
    info.appendChild(prodRow);

    card.appendChild(img);
    card.appendChild(info);
    fragment.appendChild(card);

    buildingCards.set(building.id, { card, costEl, countEl, clickHandler });
  }

  shopContainer.appendChild(fragment);
}

function purchaseBuilding(buildingId) {
  const building = BUILDINGS_BY_ID.get(buildingId);
  if (!building) return;

  const state = getState();
  const owned = state.buildings[buildingId] ?? 0;
  const cost = calculateBuildingCost(building.baseCost, owned);

  if (state.energy < cost) return;

  const newBuildings = { ...state.buildings, [buildingId]: owned + 1 };
  const newEnergy = state.energy - cost;

  updateState({ energy: newEnergy, buildings: newBuildings });

  // Feedback visual de compra
  const card = buildingCards.get(buildingId)?.card;
  if (card) {
    const rect = card.getBoundingClientRect();
    // Partículas del color del tier
    spawnPurchaseRain(rect.left + rect.width / 2, rect.top, building.tierColor);
    // Flash con el color del edificio
    flashBuildingCard(card, building.tierColor);
    // Nombre flotante
    spawnBuildingFloatingText(rect.left + rect.width / 2, rect.top, building.name);
  }

  addRandomLog('building_purchased', { name: building.name }, 'success');
  emit('buildingPurchased', { id: buildingId, name: building.name, count: owned + 1 });
  emit('stateUpdated', { energy: newEnergy, buildings: newBuildings });
}

function getCardClasses(canAfford, tierColor) {
  const base = 'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 card-hover';
  if (canAfford) {
    return `${base} bg-white/[0.04] border-white/[0.08] cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.15] affordable-glow`;
  }
  return `${base} bg-white/[0.02] border-white/[0.04] opacity-40 cursor-not-allowed`;
}

function showBuildingTooltip(e, building, owned, cost) {
  const nextCost = calculateBuildingCost(building.baseCost, owned + 1);
  const totalProd = building.baseProduction * owned;

  showTooltip(e.currentTarget, `
    <div class="font-pixel text-[10px] mb-1" style="color:${building.tierColor}">${building.name}</div>
    <div class="text-[10px] text-slate-300 mb-1.5">${building.description}</div>
    <div class="text-[10px]" style="color:${building.tierColor}">Producción: +${formatNumber(building.baseProduction)}/s cada uno</div>
    <div class="text-[10px] text-cosmic-500">Poseídos: ${owned} | Total: +${formatNumber(totalProd)}/s</div>
    <div class="text-[10px] text-energy mt-1">Coste: ⚡ ${formatNumber(cost)}</div>
    <div class="text-[10px] text-cosmic-500">Siguiente: ⚡ ${formatNumber(nextCost)}</div>
  `);
}

function createLockedCard(building, progress) {
  const card = document.createElement('div');
  card.className = 'flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] opacity-40';

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'w-10 h-10 flex-shrink-0 rounded-lg bg-white/[0.05] flex items-center justify-center';
  const img = document.createElement('img');
  img.src = `sprites/${building.sprite}`;
  img.alt = building.name;
  img.className = 'w-7 h-7 pixelated opacity-30';
  img.width = 28;
  img.height = 28;
  imgWrapper.appendChild(img);

  const info = document.createElement('div');
  info.className = 'flex-1 min-w-0';

  const name = document.createElement('span');
  name.className = 'font-pixel text-[10px] text-cosmic-600 truncate block';
  name.textContent = '???';

  const desc = document.createElement('p');
  desc.className = 'text-[10px] text-cosmic-600 mt-0.5';
  desc.textContent = `Desbloquea a ${formatNumber(building.unlockAt)} energía`;

  const barContainer = document.createElement('div');
  barContainer.className = 'w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden';
  const barFill = document.createElement('div');
  barFill.className = 'h-full rounded-full transition-all duration-700';
  barFill.style.width = `${progress}%`;
  barFill.style.backgroundColor = building.tierColor;
  barFill.style.opacity = '0.6';
  barContainer.appendChild(barFill);

  info.appendChild(name);
  info.appendChild(desc);
  info.appendChild(barContainer);

  card.appendChild(imgWrapper);
  card.appendChild(info);

  return card;
}

/**
 * Flash intenso en la tarjeta de edificio al comprar.
 * Usa el color del tier del edificio.
 * @param {HTMLElement} card
 * @param {string} color - Color hex del tier.
 */
function flashBuildingCard(card, color) {
  card.style.transition = 'all 0.3s ease';
  card.style.backgroundColor = `${color}20`; // 20 = ~12% opacity en hex
  card.style.borderColor = `${color}90`;   // 90 = ~56% opacity
  card.style.transform = 'scale(1.02)';
  card.style.boxShadow = `0 0 20px ${color}30`;

  setTimeout(() => {
    card.style.backgroundColor = '';
    card.style.borderColor = '';
    card.style.transform = '';
    card.style.boxShadow = '';
  }, 400);
}

/**
 * Muestra texto flotante con el nombre del edificio comprado.
 * @param {number} x
 * @param {number} y
 * @param {string} text
 */
function spawnBuildingFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.className = 'fixed pointer-events-none font-pixel text-[10px] text-energy font-bold animate-float-up';
  el.style.left = `${x}px`;
  el.style.top = `${y - 20}px`;
  el.style.zIndex = '100';
  el.style.textShadow = '0 0 8px rgba(250,204,21,0.8), 0 0 16px rgba(250,204,21,0.4)';
  el.style.whiteSpace = 'nowrap';

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
