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
 * Con OVERLOAD activo, la temperatura escala 3× más rápido.
 */
export function calculateCoreTemp(production, state) {
  const baseHeatScale = (state?.abilities?.overload?.activeUntil && Date.now() < state.abilities.overload.activeUntil) ? 1.5 : 0.5;
  const tradeOffHeat = state?.heatMultiplier ?? 1;
  return 300 + Math.min(production * baseHeatScale * tradeOffHeat, 7500);
}

/**
 * Determina si el reactor está sobrecalentado usando hysteresis.
 * - Se activa cuando temp > OVERHEAT_THRESHOLD (4000K)
 * - Se desactiva solo cuando temp baja de OVERHEAT_COOLDOWN (3800K)
 */
export function isOverheated(state, production) {
  // PURGE: ventana de enfriamiento forzado
  if (state.purgeUntil && Date.now() < state.purgeUntil) return false;
  const temp = calculateCoreTemp(production, state);
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
 * Aplica bonus ×3 si OVERLOAD está activo.
 */
export function calculateTotalProduction(state, buildingsById) {
  const raw = calculateRawProduction(state, buildingsById);
  let result = raw;
  if (isOverheated(state, raw)) {
    result *= OVERHEAT_PENALTY;
  }
  // OVERLOAD: ×3 producción
  if (state.abilities?.overload?.activeUntil && Date.now() < state.abilities.overload.activeUntil) {
    result *= 3;
  }
  // Doctrina de prestigio: producción
  const doctrineProduction = state.prestige?.doctrineEffects?.productionMultiplier ?? 1;
  result *= doctrineProduction;
  // Doctrina de prestigio: multiplicador global
  const doctrineGlobal = state.prestige?.doctrineEffects?.globalMultiplier ?? 1;
  result *= doctrineGlobal;
  return result;
}

export function calculateClickPower(state) {
  const doctrineClick = state.prestige?.doctrineEffects?.clickMultiplier ?? 1;
  const doctrineGlobal = state.prestige?.doctrineEffects?.globalMultiplier ?? 1;
  return state.clickPower * state.globalMultiplier * state.prestige.multiplier * doctrineClick * doctrineGlobal;
}

/**
 * Probabilidad de crítico actual (0..1).
 */
export function calculateCritChance(state) {
  return Math.min(0.75, state.critChance ?? 0);
}

/**
 * Multiplicador de daño crítico (×N).
 */
export function calculateCritMultiplier(state) {
  return state.critMultiplier ?? 5;
}

/**
 * Multiplicador de combo basado en el contador actual.
 *Combo: 1 + min(combo, cap) * step. Max ~×3.5 con cap=50 step=0.05.
 */
export function calculateComboMultiplier(state, comboCount) {
  const cap = state.comboCap ?? 50;
  const step = state.comboStep ?? 0.05;
  return 1 + Math.min(comboCount, cap) * step;
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
