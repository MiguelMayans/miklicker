/**
 * Fórmulas puras del juego.
 * Deterministas, sin side effects, fácilmente testeables.
 */

import { BUILDING_COST_GROWTH_RATE, OVERHEAT_THRESHOLD, OVERHEAT_COOLDOWN, OVERHEAT_PENALTY } from '../config.js';
import { UPGRADES } from '../data/upgrades.js';

export function calculateBuildingCost(baseCost, owned) {
  return Math.floor(baseCost * Math.pow(BUILDING_COST_GROWTH_RATE, owned));
}

export function calculateBuildingProduction(baseProduction, owned, buildingMultiplier = 1, globalMultiplier = 1) {
  if (baseProduction <= 0 || owned <= 0) return 0;
  return baseProduction * owned * buildingMultiplier * globalMultiplier;
}

/**
 * Calcula multiplicadores de sinergia activos.
 * Cada upgrade de tipo 'synergy' añade bonusPerSource por cada edificio fuente poseído.
 */
function calculateSynergyMultiplier(state, targetBuildingId) {
  let bonus = 0;
  for (const upgradeId of state.upgrades) {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade || upgrade.effect?.type !== 'synergy') continue;
    if (upgrade.effect.target !== targetBuildingId) continue;
    const sourceCount = state.buildings[upgrade.effect.source] ?? 0;
    bonus += sourceCount * upgrade.effect.bonusPerSource;
  }
  return 1 + bonus;
}

/**
 * Calcula la temperatura base del núcleo en Kelvin (sin ruido térmico).
 * Base 300K + escalado lineal con producción hasta un máximo de 5300K.
 */
export function calculateCoreTemp(production) {
  return 300 + Math.min(production * 0.5, 5000);
}

/**
 * Determina si el reactor está sobrecalentado usando hysteresis.
 * - Se activa cuando temp > OVERHEAT_THRESHOLD (4000K)
 * - Se desactiva solo cuando temp baja de OVERHEAT_COOLDOWN (3800K)
 */
export function isOverheated(state, production) {
  const temp = calculateCoreTemp(production);
  if (state.overheated) {
    return temp > OVERHEAT_COOLDOWN;
  }
  return temp > OVERHEAT_THRESHOLD;
}

/**
 * Calcula la producción bruta /s (sin penalización de sobrecalentamiento).
 */
export function calculateRawProduction(state, buildingsById) {
  let total = 0;
  for (const [id, count] of Object.entries(state.buildings)) {
    const building = buildingsById.get(id);
    if (!building || count <= 0 || building.isAutoClicker) continue;

    const buildingMultiplier = state.buildingMultipliers?.[id] ?? 1;
    const synergyMultiplier = calculateSynergyMultiplier(state, id);
    const prod = calculateBuildingProduction(
      building.baseProduction,
      count,
      buildingMultiplier * synergyMultiplier,
      state.globalMultiplier * state.prestige.multiplier
    );
    total += prod;
  }
  return total;
}

/**
 * Calcula la producción pasiva total /s del estado completo.
 * EXCLUYE auto-clickers (cursor); esos se manejan en autoClicker.js.
 * Incluye sinergias entre edificios.
 * Aplica penalización ×0.5 si el núcleo está sobrecalentado.
 */
export function calculateTotalProduction(state, buildingsById) {
  const raw = calculateRawProduction(state, buildingsById);
  if (isOverheated(state, raw)) {
    return raw * OVERHEAT_PENALTY;
  }
  return raw;
}

export function calculateClickPower(state) {
  return state.clickPower * state.globalMultiplier * state.prestige.multiplier;
}

export function calculateAutoClickPower(state) {
  const cursorMultiplier = state.cursorMultiplier ?? 1;
  return calculateClickPower(state) * cursorMultiplier;
}

export function calculateAutoClickInterval(state) {
  const baseInterval = 10000;
  const intervalMultiplier = state.cursorIntervalMultiplier ?? 1;
  return Math.max(100, baseInterval * intervalMultiplier);
}

export function isBuildingUnlocked(building, state) {
  return state.totalEnergyEarned >= building.unlockAt;
}

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
