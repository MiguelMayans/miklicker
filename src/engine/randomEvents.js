/**
 * Sistema de Eventos Aleatorios (Anomalías Energéticas).
 * Golden-cookie style: aparece un elemento flotante que al clickear otorga bonus.
 */

import { getState, updateState } from '../state.js';
import { emit } from '../utils/eventBus.js';
import { formatNumber } from '../utils/numbers.js';
import { playMilestoneChime } from '../audio/audioEngine.js';

const EVENT_TYPES = [
  {
    id: 'stellar_surge',
    name: 'Sobrecarga Estelar',
    description: 'Radiación solar intensificada. Salida del reactor ×2 durante 30s.',
    duration: 30000,
    color: '#facc15',
    icon: '⚡',
    negative: false,
    apply: () => applyGlobalMultiplier(2, 30000),
  },
  {
    id: 'quantum_pulse',
    name: 'Pulso Cuántico',
    description: 'Fluctuación del vacío. Extracción manual ×5 durante 15s.',
    duration: 15000,
    color: '#06b6d4',
    icon: '◉',
    negative: false,
    apply: () => applyClickMultiplier(5, 15000),
  },
  {
    id: 'energy_rain',
    name: 'Lluvia de Energía',
    description: 'Chorro de partículas cargadas. +15% de la reserva actual.',
    duration: 0,
    color: '#16a34a',
    icon: '☄',
    negative: false,
    apply: () => applyInstantEnergy(0.15),
  },
  {
    id: 'cooling_flush',
    name: 'Purga de Refrigerante',
    description: 'Sistema de enfriamiento sobrecargado. Temperatura reducida.',
    duration: 0,
    color: '#60a5fa',
    icon: '❄',
    negative: false,
    apply: () => applyCoolingBonus(),
  },
  {
    id: 'magnetic_storm',
    name: 'Tormenta Magnética',
    description: 'Disturbio de campos electromagnéticos. Salida del reactor ×0.5 durante 20s.',
    duration: 20000,
    color: '#dc2626',
    icon: '⛈',
    negative: true,
    apply: () => applyGlobalMultiplier(0.5, 20000),
  },
  {
    id: 'solar_flare',
    name: 'Fulgor Solar',
    description: 'Estallido de radiación estelar. +7 cursors temporales durante 45s.',
    duration: 45000,
    color: '#fb923c',
    icon: '☀',
    negative: false,
    apply: () => applyTempCursors(7, 45000),
  },
  {
    id: 'void_whisper',
    name: 'Susurro del Vacío',
    description: 'Ecos de dimensiones paralelas. Generación pasiva ×3 durante 10s.',
    duration: 10000,
    color: '#a855f7',
    icon: '◈',
    negative: false,
    apply: () => applyGlobalMultiplier(3, 10000),
  },
  {
    id: 'nebula_gold',
    name: 'Oro de Nebulosa',
    description: 'Condensación rica en elementos pesados. +25% de la reserva actual.',
    duration: 0,
    color: '#fbbf24',
    icon: '◆',
    negative: false,
    apply: () => applyInstantEnergy(0.25),
  },
];

let eventTimer = null;
let activeEventElement = null;
let eventTimeout = null;
let cleanupMultiplier = null;
let cleanupClickMultiplier = null;

/**
 * Inicia el sistema de eventos aleatorios.
 */
export function initRandomEvents() {
  scheduleNextEvent();
}

function scheduleNextEvent() {
  // Entre 90 y 180 segundos (1.5 - 3 minutos)
  const delay = 90000 + Math.random() * 90000;
  eventTimer = setTimeout(spawnEvent, delay);
}

function spawnEvent() {
  if (activeEventElement) return; // Ya hay uno activo

  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const el = document.createElement('div');

  // Posición aleatoria (evitando bordes)
  const pad = 60;
  const x = pad + Math.random() * (window.innerWidth - pad * 2);
  const y = pad + Math.random() * (window.innerHeight - pad * 2);

  el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${type.color};
    border: 3px solid #111111;
    box-shadow: 0 0 20px ${type.color}, 4px 4px 0 #111111;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    z-index: 9999;
    animation: eventFloat 3s ease-in-out infinite;
    user-select: none;
  `;
  el.textContent = type.icon;

  // Tooltip flotante
  const tooltip = document.createElement('div');
  tooltip.textContent = type.name;
  tooltip.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #111111;
    color: ${type.color};
    padding: 4px 8px;
    font-size: 10px;
    font-weight: bold;
    white-space: nowrap;
    pointer-events: none;
    margin-bottom: 4px;
    border: 2px solid ${type.color};
  `;
  el.appendChild(tooltip);

  el.addEventListener('click', () => {
    activateEvent(type);
    el.remove();
    activeEventElement = null;
    clearTimeout(eventTimeout);
    scheduleNextEvent();
  });

  document.body.appendChild(el);
  activeEventElement = el;

  // Desaparece en 12 segundos si no se clickea
  eventTimeout = setTimeout(() => {
    if (activeEventElement === el) {
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(() => {
        el.remove();
        activeEventElement = null;
        scheduleNextEvent();
      }, 500);
    }
  }, 12000);
}

function activateEvent(type) {
  playMilestoneChime();
  emit('randomEventActivated', { type: type.id, name: type.name, negative: type.negative ?? false });

  if (type.duration > 0) {
    type.apply(type.negative);
    showEventBanner(type.name, type.description, type.duration);
  } else {
    type.apply();
    showEventBanner(type.name, type.description, 3000);
  }
}

function applyGlobalMultiplier(multiplier, duration, isNegative = false) {
  if (cleanupMultiplier) cleanupMultiplier();

  const state = getState();
  updateState({ globalMultiplier: (state.globalMultiplier ?? 1) * multiplier });
  emit('stateUpdated', { globalMultiplier: state.globalMultiplier * multiplier });

  cleanupMultiplier = () => {
    const s = getState();
    updateState({ globalMultiplier: (s.globalMultiplier ?? 1) / multiplier });
    emit('stateUpdated', { globalMultiplier: (s.globalMultiplier ?? 1) / multiplier });
    cleanupMultiplier = null;
  };

  setTimeout(() => {
    if (cleanupMultiplier) cleanupMultiplier();
    emit('randomEventEnded', { negative: isNegative });
  }, duration);
}

function applyClickMultiplier(multiplier, duration, isNegative = false) {
  if (cleanupClickMultiplier) cleanupClickMultiplier();

  const state = getState();
  updateState({ clickPower: state.clickPower * multiplier });
  emit('stateUpdated', { clickPower: state.clickPower * multiplier });

  cleanupClickMultiplier = () => {
    const s = getState();
    updateState({ clickPower: (s.clickPower ?? 1) / multiplier });
    emit('stateUpdated', { clickPower: (s.clickPower ?? 1) / multiplier });
    cleanupClickMultiplier = null;
  };

  setTimeout(() => {
    if (cleanupClickMultiplier) cleanupClickMultiplier();
    emit('randomEventEnded', { negative: isNegative });
  }, duration);
}

function applyInstantEnergy(percent) {
  const state = getState();
  const bonus = Math.floor(state.energy * percent);
  if (bonus <= 0) return;

  const newEnergy = state.energy + bonus;
  const newTotal = state.totalEnergyEarned + bonus;
  updateState({ energy: newEnergy, totalEnergyEarned: newTotal });
  emit('stateUpdated', { energy: newEnergy, totalEnergyEarned: newTotal });
}

function applyCoolingBonus() {
  emit('stateUpdated', {});
}

function applyTempCursors(count, duration) {
  const state = getState();
  const current = state.buildings.cursor ?? 0;
  const newBuildings = { ...state.buildings, cursor: current + count };
  updateState({ buildings: newBuildings });
  emit('stateUpdated', { buildings: newBuildings });
  emit('buildingPurchased', { id: 'cursor', name: 'Cursor Temporal', count: current + count });

  setTimeout(() => {
    const s = getState();
    const final = Math.max(0, (s.buildings.cursor ?? 0) - count);
    const restored = { ...s.buildings, cursor: final };
    updateState({ buildings: restored });
    emit('stateUpdated', { buildings: restored });
    emit('randomEventEnded', { negative: false });
  }, duration);
}

function showEventBanner(name, description, duration) {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: #111111;
    color: #ffffff;
    border: 3px solid #06b6d4;
    padding: 12px 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    text-align: center;
    box-shadow: 6px 6px 0 #06b6d4;
    white-space: nowrap;
  `;
  banner.innerHTML = `
    <div style="color:#06b6d4; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">${name}</div>
    <div style="color:#aaaaaa; font-size:10px;">${description}</div>
  `;
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.style.transition = 'opacity 0.5s, transform 0.5s';
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => banner.remove(), 500);
  }, Math.min(duration, 5000));
}
