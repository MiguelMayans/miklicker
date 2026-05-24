/**
 * Sistema de Prestigio (Datos Cósmicos).
 * Soft reset que otorga multiplicadores permanentes.
 */

import { PRESTIGE_THRESHOLD } from '../config.js';
import { getState, setState } from '../state.js';
import { emit } from '../utils/eventBus.js';

/**
 * Calcula cuántos Datos Cósmicos se ganarían al resetear ahora.
 * Fórmula: sqrt(totalEnergyEarned / 1_000_000)
 * Cada dato otorga +5% de multiplicador permanente.
 * @param {object} state
 * @returns {number}
 */
export function calculatePrestigeGain(state) {
  const earned = state.totalEnergyEarned ?? 0;
  if (earned < PRESTIGE_THRESHOLD) return 0;
  return Math.floor(Math.sqrt(earned / PRESTIGE_THRESHOLD));
}

/**
 * Calcula el multiplicador de prestigio total basado en Datos Cósmicos.
 * 1 + (cosmicData * 0.05)
 * @param {number} cosmicData
 * @returns {number}
 */
export function calculatePrestigeMultiplier(cosmicData) {
  return 1 + cosmicData * 0.05;
}

/**
 * Ejecuta el Prestigio: reinicia todo excepto prestigio y estadísticas acumuladas.
 */
export function doPrestige() {
  const state = getState();
  const gain = calculatePrestigeGain(state);

  if (gain <= 0) {
    emit('prestigeError', { message: 'No tienes suficiente energía acumulada para un reset cósmico.' });
    return false;
  }

  const newCosmicData = state.prestige.cosmicData + gain;
  const newMultiplier = calculatePrestigeMultiplier(newCosmicData);
  const newResets = (state.prestige.totalResets ?? 0) + 1;

  const newState = {
    energy: 0,
    totalEnergyEarned: 0,
    totalClicks: 0,
    clickPower: 1,
    globalMultiplier: 1,
    cursorMultiplier: 1,
    cursorIntervalMultiplier: 1,
    buildings: {},
    buildingMultipliers: {},
    upgrades: [],
    milestones: [],
    unlocked: [],
    prestige: {
      cosmicData: newCosmicData,
      multiplier: newMultiplier,
      totalResets: newResets,
    },
    stats: {
      ...state.stats,
      bestEnergyEarned: Math.max(state.stats?.bestEnergyEarned ?? 0, state.totalEnergyEarned),
    },
    lastTick: Date.now(),
    gameStartedAt: Date.now(),
  };

  setState(newState);
  emit('prestigeDone', { gain, newCosmicData, newMultiplier, newResets });
  emit('stateUpdated', newState);
  return true;
}
