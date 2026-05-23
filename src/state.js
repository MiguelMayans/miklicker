/**
 * Estado centralizado del juego.
 * Single Source of Truth. Nunca se muta directamente desde la UI.
 * Todas las actualizaciones pasan por funciones del engine.
 */

import { INITIAL_STATE } from './config.js';

let state = createInitialState();

/**
 * Crea un nuevo estado inicial limpio.
 * @returns {object}
 */
export function createInitialState() {
  return structuredClone(INITIAL_STATE);
}

/**
 * Obtiene una copia profunda del estado actual.
 * @returns {object}
 */
export function getState() {
  return structuredClone(state);
}

/**
 * Reemplaza el estado actual (usado en carga de partida).
 * @param {object} newState
 */
export function setState(newState) {
  state = structuredClone(newState);
}

/**
 * Actualiza el estado aplicando un parcial.
 * Útil para cambios simples sin reemplazar todo.
 * @param {object} partial
 */
export function updateState(partial) {
  state = { ...state, ...structuredClone(partial) };
}
