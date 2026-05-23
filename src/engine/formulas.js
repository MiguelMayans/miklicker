/**
 * Fórmulas puras del juego.
 * Deterministas, sin side effects, fácilmente testeables.
 */

import { BUILDING_COST_GROWTH_RATE } from '../config.js';

/**
 * Calcula el coste actual de un edificio dado su cantidad poseída.
 * @param {number} baseCost
 * @param {number} owned
 * @returns {number}
 */
export function calculateBuildingCost(baseCost, owned) {
  return Math.floor(baseCost * Math.pow(BUILDING_COST_GROWTH_RATE, owned));
}

/**
 * Calcula la producción total por segundo de un tipo de edificio.
 * @param {number} baseProduction
 * @param {number} owned
 * @param {number} buildingMultiplier - Acumulado de mejoras para este edificio.
 * @param {number} globalMultiplier - Multiplicador global (prestigio, eventos...).
 * @returns {number}
 */
export function calculateBuildingProduction(baseProduction, owned, buildingMultiplier = 1, globalMultiplier = 1) {
  return baseProduction * owned * buildingMultiplier * globalMultiplier;
}

/**
 * Calcula la producción total pasiva del estado completo.
 * @param {object} state
 * @param {Map<string, object>} buildingsById
 * @returns {number}
 */
export function calculateTotalProduction(state, buildingsById) {
  let total = 0;
  for (const [id, count] of Object.entries(state.buildings)) {
    const building = buildingsById.get(id);
    if (!building || count <= 0) continue;

    const buildingMultiplier = state.buildingMultipliers?.[id] ?? 1;
    total += calculateBuildingProduction(
      building.baseProduction,
      count,
      buildingMultiplier,
      state.globalMultiplier * state.prestige.multiplier
    );
  }
  return total;
}

/**
 * Calcula el poder de clic actual.
 * @param {object} state
 * @returns {number}
 */
export function calculateClickPower(state) {
  return state.clickPower * state.globalMultiplier * state.prestige.multiplier;
}

/**
 * Determina si un edificio está desbloqueado según el estado actual.
 * @param {object} building
 * @param {object} state
 * @returns {boolean}
 */
export function isBuildingUnlocked(building, state) {
  return state.totalEnergyEarned >= building.unlockAt;
}

/**
 * Determina si una mejora está disponible para compra.
 * @param {object} upgrade
 * @param {object} state
 * @returns {boolean}
 */
export function isUpgradeAvailable(upgrade, state) {
  if (state.upgrades.includes(upgrade.id)) return false;

  const req = upgrade.requires;
  if (!req) return true;

  if (req.building) {
    const owned = state.buildings[req.building] ?? 0;
    if (owned < req.count) return false;
  }

  if (req.totalClicks && state.totalClicks < req.totalClicks) return false;

  return true;
}
