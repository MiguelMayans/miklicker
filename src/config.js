/**
 * Constantes globales del juego.
 * Single source of truth para valores que no cambian en runtime.
 */

export const GAME_VERSION = 1;

export const TICK_RATE = 1000 / 60; // ~60fps para el game loop
export const SAVE_INTERVAL = 30000; // 30 segundos

export const BUILDING_COST_GROWTH_RATE = 1.15;

export const PRESTIGE_THRESHOLD = 1_000_000; // 1 millón de energía total para primer prestigio

export const OVERHEAT_THRESHOLD = 4000; // K
export const OVERHEAT_COOLDOWN = 3800; // K — hysteresis para evitar oscilación
export const OVERHEAT_PENALTY = 0.5; // producción ×0.5 cuando está sobrecalentado

export const INITIAL_STATE = {
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
    cosmicData: 0,
    multiplier: 1,
    totalResets: 0,
  },
  stats: {
    bestEnergyEarned: 0,
    totalBuildingsBought: 0,
    totalUpgradesBought: 0,
  },
  lastTick: Date.now(),
  gameStartedAt: Date.now(),
  overheated: false,
};
