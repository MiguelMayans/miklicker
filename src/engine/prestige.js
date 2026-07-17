/**
 * Sistema de Prestigio (Datos Cósmicos).
 * Soft reset que otorga multiplicadores permanentes.
 */

import { PRESTIGE_THRESHOLD } from '../config.js';
import { getState, setState, updateState } from '../state.js';
import { emit } from '../utils/eventBus.js';
import { DOCTRINES_BY_ID, getNeutralDoctrineEffects } from '../data/doctrines.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';

/**
 * Calcula el multiplicador de eficiencia de Datos Cósmicos activo.
 * Actualmente otorgado por mejoras del árbol cósmico.
 */
export function calculatePrestigeEfficiency(state) {
  let efficiency = 1;
  for (const upgradeId of state.upgrades ?? []) {
    const upgrade = UPGRADES_BY_ID.get(upgradeId);
    if (upgrade?.effect?.type === 'prestige_efficiency') {
      efficiency *= upgrade.effect.multiplier ?? 1;
    }
  }
  return efficiency;
}

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
 * 1 + (totalCosmicDataEarned * 0.05 * efficiencyMultiplier)
 * @param {number} totalCosmicDataEarned
 * @param {number} [efficiencyMultiplier] - Mejora de eficiencia cósmica (ej. 1.4 para +40%)
 * @returns {number}
 */
export function calculatePrestigeMultiplier(totalCosmicDataEarned, efficiencyMultiplier = 1) {
  return 1 + totalCosmicDataEarned * 0.05 * efficiencyMultiplier;
}

/**
 * Selecciona una doctrina permanente. Solo afecta al próximo reset o al estado actual.
 */
export function chooseDoctrine(doctrineId) {
  const doctrine = DOCTRINES_BY_ID.get(doctrineId);
  if (!doctrine) return false;

  const state = getState();
  const prestige = {
    ...state.prestige,
    doctrine: doctrineId,
    doctrineEffects: doctrine.effects,
  };

  updateState({ prestige });
  emit('doctrineChosen', { doctrineId, name: doctrine.name });
  return true;
}

/**
 * Ejecuta el Prestigio: reinicia todo excepto prestigio, doctrina y estadísticas acumuladas.
 */
export function doPrestige() {
  const state = getState();
  const gain = calculatePrestigeGain(state);

  if (gain <= 0) {
    emit('prestigeError', { message: 'No tienes suficiente energía acumulada para un reset cósmico.' });
    return false;
  }

  const newTotalCosmicData = (state.prestige.totalCosmicDataEarned ?? 0) + gain;
  const newCosmicData = (state.prestige.cosmicData ?? 0) + gain;
  const efficiency = calculatePrestigeEfficiency(state);
  const newMultiplier = calculatePrestigeMultiplier(newTotalCosmicData, efficiency);
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
      totalCosmicDataEarned: newTotalCosmicData,
      multiplier: newMultiplier,
      totalResets: newResets,
      doctrine: state.prestige.doctrine ?? null,
      doctrineEffects: state.prestige.doctrineEffects ?? getNeutralDoctrineEffects(),
    },
    stats: {
      ...state.stats,
      bestEnergyEarned: Math.max(state.stats?.bestEnergyEarned ?? 0, state.totalEnergyEarned),
    },
    lastTick: Date.now(),
    gameStartedAt: Date.now(),
  };

  setState(newState);
  emit('prestigeDone', { gain, newCosmicData, newMultiplier, newResets, doctrine: newState.prestige.doctrine });
  emit('stateUpdated', newState);
  return true;
}
