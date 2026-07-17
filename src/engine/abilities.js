/**
 * Sistema de Habilidades Activas.
 * Tres protocolos con cooldowns que dan contrajuego activo:
 * - ENERGIZE: próximos 10 clics ×10, reducen temperatura del núcleo
 * - PURGE: resetea temperatura al instante, cuesta 10% de energía
 * - OVERLOAD: ×3 producción 15s, temperatura sube 3× más rápido
 */

import { getState, updateState } from '../state.js';
import { emit } from '../utils/eventBus.js';

export const ABILITIES = {
  energize: {
    id: 'energize',
    name: 'ENERGIZE',
    description: 'Próximos 10 clics ×10 y reducen T° núcleo 50K c/u',
    cooldownMs: 30000,
    duration: 0,
    color: '#facc15',
  },
  purge: {
    id: 'purge',
    name: 'PURGE',
    description: 'Vacia el reactor: T° → 300K. Cuesta 10% de energía.',
    cooldownMs: 60000,
    duration: 0,
    color: '#60a5fa',
  },
  overload: {
    id: 'overload',
    name: 'OVERLOAD',
    description: 'Producción ×3 por 15s. T° sube 3× más rápido. Riesgo.',
    cooldownMs: 90000,
    duration: 15000,
    color: '#ef4444',
  },
};

let overloadCleanupTimer = null;

/**
 * ¿La habilidad está desbloqueada?
 */
export function isAbilityUnlocked(state, id) {
  return !!(state.abilities?.[id]?.unlocked);
}

/**
 * ¿La habilidad está lista para usar (no en cooldown)?
 */
export function isAbilityReady(state, id) {
  const a = state.abilities?.[id];
  if (!a?.unlocked) return false;
  return Date.now() >= (a.cooldownUntil ?? 0);
}

/**
 * Segundos restantes de cooldown.
 */
export function getCooldownRemaining(state, id) {
  const a = state.abilities?.[id];
  if (!a?.unlocked) return 0;
  return Math.max(0, ((a.cooldownUntil ?? 0) - Date.now()) / 1000);
}

/**
 * ¿OVERLOAD está activo ahora mismo?
 */
export function isOverloadActive(state) {
  return !!(state.abilities?.overload?.activeUntil && Date.now() < state.abilities.overload.activeUntil);
}

/**
 * ¿ENERGIZE está activo (clics potenciados disponibles)?
 */
export function getEnergizeCharges(state) {
  return state.abilities?.energize?.charges ?? 0;
}

/**
 * Activa una habilidad.
 */
export function activateAbility(id) {
  const state = getState();
  const def = ABILITIES[id];
  if (!def) return false;
  if (!isAbilityUnlocked(state, id)) return false;
  if (!isAbilityReady(state, id)) return false;

  const now = Date.now();
  const abilities = { ...(state.abilities ?? {}) };
  abilities[id] = { ...abilities[id], cooldownUntil: now + def.cooldownMs };

  const patch = { abilities };

  if (id === 'energize') {
    abilities.energize.charges = 10;
  } else if (id === 'purge') {
    // Costa 10% de energía actual
    const cost = state.energy * 0.1;
    patch.energy = state.energy - cost;
    // Forzamos reseteo de temperatura: ventana de 8s sin overheating
    patch.overheated = false;
    patch.purgeUntil = Date.now() + 8000;
  } else if (id === 'overload') {
    abilities.overload.activeUntil = now + def.duration;
    abilities.overload.tempMultiplier = 3;
    patch.abilities = abilities;
    if (overloadCleanupTimer) clearTimeout(overloadCleanupTimer);
    overloadCleanupTimer = setTimeout(() => {
      emit('overloadEnded');
    }, def.duration);
  }

  updateState(patch);
  emit('abilityActivated', { id, name: def.name });
  if (def.duration > 0) {
    emit('abilityActive', { id, durationMs: def.duration, name: def.name });
  }
  return true;
}

/**
 * Consume una carga de ENERGIZE en un clic. Devuelve true si hay crit extra activo.
 */
export function consumeEnergizeCharge() {
  const state = getState();
  const charges = getEnergizeCharges(state);
  if (charges <= 0) return false;
  const abilities = { ...(state.abilities ?? {}) };
  abilities.energize = { ...abilities.energize, charges: charges - 1 };
  updateState({ abilities });
  return true;
}