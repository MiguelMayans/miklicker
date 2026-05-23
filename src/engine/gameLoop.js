/**
 * Game loop principal.
 * Usa requestAnimationFrame con cálculo de delta time.
 * Protege contra tab inactivo: al volver, calcula el tiempo perdido.
 */

import { TICK_RATE } from '../config.js';
import { getState, updateState } from '../state.js';
import { calculateTotalProduction } from './formulas.js';
import { BUILDINGS_BY_ID } from '../data/buildings.js';
import { emit } from '../utils/eventBus.js';

let running = false;
let lastTime = 0;
let accumulator = 0;
let animationFrameId = null;

/**
 * Aplica la producción pasiva basada en el tiempo transcurrido.
 * @param {number} deltaMs - Milisegundos desde el último tick.
 */
/** Acumulador de ingreso pasivo para mostrar en UI */
let passiveAccumulator = 0;

function tick(deltaMs) {
  const state = getState();
  const productionPerSecond = calculateTotalProduction(state, BUILDINGS_BY_ID);

  if (productionPerSecond <= 0) return;

  const earned = productionPerSecond * (deltaMs / 1000);
  const newEnergy = state.energy + earned;
  const newTotal = state.totalEnergyEarned + earned;

  passiveAccumulator += earned;

  updateState({
    energy: newEnergy,
    totalEnergyEarned: newTotal,
    lastTick: Date.now(),
  });

  // Emitir ingreso pasivo cada segundo aproximadamente para el feedback visual
  if (passiveAccumulator >= 1 || deltaMs >= 900) {
    emit('passiveIncome', { amount: passiveAccumulator });
    passiveAccumulator = 0;
  }

  emit('stateUpdated', { energy: newEnergy, totalEnergyEarned: newTotal, productionPerSecond });
}

/**
 * Loop de animación.
 * @param {number} timestamp
 */
function loop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const deltaMs = timestamp - lastTime;
  lastTime = timestamp;

  // Acumulador para ticks fijos (opcional, ahora usamos delta directo)
  accumulator += deltaMs;

  // Procesar ticks acumulados
  while (accumulator >= TICK_RATE) {
    tick(TICK_RATE);
    accumulator -= TICK_RATE;
  }

  // Tick parcial para suavidad
  if (deltaMs > 0) {
    // El tick parcial no acumula recursos para evitar duplicados,
    // solo actualizamos la UI con el delta restante para animaciones.
    emit('renderFrame', { deltaMs, accumulator });
  }

  animationFrameId = requestAnimationFrame(loop);
}

/**
 * Arranca el game loop.
 */
export function start() {
  if (running) return;
  running = true;
  lastTime = 0;
  accumulator = 0;
  animationFrameId = requestAnimationFrame(loop);
}

/**
 * Detiene el game loop.
 */
export function stop() {
  running = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Pausa/Resume útil para diálogos o pestañas ocultas.
 */
export function pause() {
  running = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function resume() {
  if (!running) {
    lastTime = 0;
    running = true;
    animationFrameId = requestAnimationFrame(loop);
  }
}

/**
 * Procesa el tiempo offline (cuando el usuario vuelve de otra pestaña).
 */
export function processOfflineTime() {
  const state = getState();
  const now = Date.now();
  const offlineMs = now - state.lastTick;

  if (offlineMs > 1000) {
    // Solo procesar si han pasado más de 1 segundo
    const productionPerSecond = calculateTotalProduction(state, BUILDINGS_BY_ID);
    if (productionPerSecond > 0) {
      const earned = productionPerSecond * (offlineMs / 1000);
      const newEnergy = state.energy + earned;
      const newTotal = state.totalEnergyEarned + earned;

      updateState({
        energy: newEnergy,
        totalEnergyEarned: newTotal,
        lastTick: now,
      });

      emit('offlineProgress', { earned, offlineSeconds: offlineMs / 1000 });
      emit('stateUpdated', { energy: newEnergy, totalEnergyEarned: newTotal, productionPerSecond });
    }
  }
}
