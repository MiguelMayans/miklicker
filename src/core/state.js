/**
 * Estado del juego: un único objeto mutable `G`.
 * Mutarlo directamente es intencionado (rendimiento); quien cambie algo que
 * afecte a la producción debe llamar a markDirty() del motor.
 */

import { setNumberMode } from './format.js';

export const SAVE_KEY = 'colonia_estelar_v3';
const LEGACY_KEY = 'colonia_estelar_save';
const VERSION = 3;

function freshRun() {
  return {
    energy: 0,
    earnedRun: 0,
    handmadeRun: 0,
    clicksRun: 0,
    anomaliesRun: 0,
    buildings: {},
    upgrades: new Set(),
    buffs: [],
    runStart: Date.now(),
    pop: 0,          // colonos (decimal: crece poco a poco)
    lastDay: 0,      // último día de la colonia ya procesado por el diario
    births: 0,
    firsts: [],      // módulos ya inaugurados en esta colonia
  };
}

export function defaultState() {
  return {
    v: VERSION,
    ...freshRun(),
    earnedAll: 0,
    handmadeAll: 0,
    clicksAll: 0,
    anomaliesAll: 0,
    achievements: new Set(),
    powers: new Set(),
    prestige: { level: 0, fragments: 0, ascensions: 0 },
    gameStart: Date.now(),
    lastSave: Date.now(),
    stats: { bestEps: 0, buildingsBought: 0, bestPop: 0 },
    journal: [],
    journalUnread: 0,
    settings: { sound: true, volume: 0.7, particles: true, numbers: 'words' },
    hadLegacySave: false,
  };
}

/** Estado global vivo. */
export const G = defaultState();

/** Reinicia la partida conservando lo permanente (prestigio, logros, poderes, ajustes). */
export function resetRun() {
  Object.assign(G, freshRun());
}

export function wipeAll() {
  const keepSettings = G.settings;
  for (const k of Object.keys(G)) delete G[k];
  Object.assign(G, defaultState(), { settings: keepSettings });
}

// ─── Serialización ───
function toJSON() {
  return JSON.stringify({
    ...G,
    upgrades: [...G.upgrades],
    achievements: [...G.achievements],
    powers: [...G.powers],
    lastSave: Date.now(),
  });
}

function fromObject(obj) {
  const base = defaultState();
  const merged = {
    ...base,
    ...obj,
    prestige: { ...base.prestige, ...(obj.prestige ?? {}) },
    stats: { ...base.stats, ...(obj.stats ?? {}) },
    settings: { ...base.settings, ...(obj.settings ?? {}) },
    upgrades: new Set(obj.upgrades ?? []),
    achievements: new Set(obj.achievements ?? []),
    powers: new Set(obj.powers ?? []),
    buffs: (obj.buffs ?? []).filter((b) => b.until > Date.now()),
  };
  for (const k of Object.keys(G)) delete G[k];
  Object.assign(G, merged);
  setNumberMode(G.settings.numbers);
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, toJSON());
    G.lastSave = Date.now();
    return true;
  } catch (err) {
    console.error('Guardado fallido', err);
    return false;
  }
}

/** @returns {{loaded: boolean, offlineSeconds: number}} */
export function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch { /* almacenamiento bloqueado */ }
  if (!raw) {
    let legacy = null;
    try { legacy = localStorage.getItem(LEGACY_KEY); } catch { /* idem */ }
    if (legacy) G.hadLegacySave = true;
    setNumberMode(G.settings.numbers);
    return { loaded: false, offlineSeconds: 0 };
  }
  try {
    const obj = JSON.parse(raw);
    const lastSave = obj.lastSave ?? Date.now();
    fromObject(obj);
    return { loaded: true, offlineSeconds: Math.max(0, (Date.now() - lastSave) / 1000) };
  } catch (err) {
    console.error('Partida corrupta, empezando de cero', err);
    return { loaded: false, offlineSeconds: 0 };
  }
}

export function exportString() {
  return btoa(unescape(encodeURIComponent(toJSON())));
}

/** @returns {boolean} */
export function importString(str) {
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (typeof obj !== 'object' || obj === null || !('energy' in obj)) return false;
    fromObject(obj);
    save();
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* nada que borrar */ }
}
