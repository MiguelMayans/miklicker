/**
 * Constantes globales del juego.
 * Single source of truth para valores que no cambian en runtime.
 */

export const GAME_VERSION = 1;

export const TICK_RATE = 1000 / 60; // ~60fps para el game loop
export const SAVE_INTERVAL = 30000; // 30 segundos

export const BUILDING_COST_GROWTH_RATE = 1.15;

export const INITIAL_STATE = {
  energy: 0,
  totalEnergyEarned: 0,
  totalClicks: 0,
  clickPower: 1,
  globalMultiplier: 1,
  buildings: {},
  buildingMultipliers: {},
  upgrades: [],
  milestones: [],
  unlocked: [],
  prestige: {
    cosmicData: 0,
    multiplier: 1,
  },
  lastTick: Date.now(),
  gameStartedAt: Date.now(),
};
