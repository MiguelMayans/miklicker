/**
 * Motor de Auto-Click (Cursors).
 * Cada cursor actúa como un auto-clicker que golpea el reactor periódicamente.
 * Escalado con el poder de clic y upgrades de cursor.
 * Timers locales (no persistidos); se reconstruyen al iniciar.
 */

import { getState, updateState } from '../state.js';
import { calculateAutoClickPower, calculateAutoClickInterval } from './formulas.js';
import { emit } from '../utils/eventBus.js';

/** @type {number[]} ms restantes para cada cursor */
let timers = [];
let initialized = false;

/**
 * Inicializa/reconstruye los timers a partir del estado actual.
 * Distribuye los timers uniformemente para evitar que todos disparen a la vez.
 */
export function initAutoClickers() {
  const state = getState();
  const cursorCount = state.buildings.cursor ?? 0;
  const interval = calculateAutoClickInterval(state);

  timers = [];
  for (let i = 0; i < cursorCount; i++) {
    // Distribuir uniformemente: el cursor N tiene timer = interval * (N / count)
    // Así no explotan todos a la vez al cargar
    timers.push(interval * (i / Math.max(cursorCount, 1)));
  }
  initialized = true;
}

/**
 * Procesa el paso del tiempo para todos los cursors.
 * @param {number} deltaMs - Milisegundos transcurridos.
 */
export function processAutoClickers(deltaMs) {
  if (!initialized) initAutoClickers();

  const state = getState();
  const cursorCount = state.buildings.cursor ?? 0;
  if (cursorCount <= 0) return;

  const interval = calculateAutoClickInterval(state);
  const power = calculateAutoClickPower(state);

  // Si el número de cursors cambió (compra/venta), ajustar timers
  if (timers.length !== cursorCount) {
    adjustTimers(cursorCount, interval);
  }

  let anyFired = false;
  let totalEarned = 0;
  let totalClicksFired = 0;

  for (let i = 0; i < timers.length; i++) {
    timers[i] -= deltaMs;

    while (timers[i] <= 0) {
      timers[i] += interval;
      if (timers[i] < 0) timers[i] = interval; // evitar acumulación negativa extrema

      totalEarned += power;
      totalClicksFired++;

      emit('autoClickFired', { cursorIndex: i, power, interval });
      anyFired = true;
    }
  }

  if (anyFired) {
    const newEnergy = state.energy + totalEarned;
    const newTotal = state.totalEnergyEarned + totalEarned;
    const newClicks = state.totalClicks + totalClicksFired;

    updateState({
      energy: newEnergy,
      totalEnergyEarned: newTotal,
      totalClicks: newClicks,
    });

    emit('stateUpdated', { energy: newEnergy, totalEnergyEarned: newTotal, totalClicks: newClicks });
  }
}

/**
 * Ajusta el array de timers cuando cambia la cantidad de cursors.
 * Mantiene los timers existentes y añade/elimina los necesarios distribuidos.
 */
function adjustTimers(targetCount, interval) {
  const oldTimers = [...timers];
  timers = [];

  for (let i = 0; i < targetCount; i++) {
    if (i < oldTimers.length) {
      timers.push(oldTimers[i]);
    } else {
      // Nuevos cursors empiezan con timer distribuido
      timers.push(interval * (i / Math.max(targetCount, 1)));
    }
  }
}
