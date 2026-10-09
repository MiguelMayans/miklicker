/**
 * Motor: producción, compras, clics, buffs, logros y prestigio.
 * Todo lo derivado se cachea en `C` y solo se recalcula cuando algo lo invalida.
 */

import { G, resetRun } from '../core/state.js';
import { emit } from '../core/bus.js';
import { BUILDINGS, BUILDINGS_BY_ID, COST_GROWTH, SELL_REFUND } from '../data/buildings.js';
import { UPGRADES, UPGRADES_BY_ID } from '../data/upgrades.js';
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID, MORALE_PER_ACHIEVEMENT } from '../data/achievements.js';
import { POWERS, POWERS_BY_ID } from '../data/powers.js';
import { popMult, updateLife, onBuildingBought, onNewColony, colonyDay } from './life.js';

/** Energía total (de siempre) necesaria para cada nivel de prestigio: nivel = ∛(total / BASE). */
export const PRESTIGE_BASE = 1e10;
const PRESTIGE_PER_LEVEL = 0.02;
const BASE_OFFLINE_RATE = 0.1;
const BASE_OFFLINE_CAP_H = 8;

/** Caché de valores derivados. */
export const C = {
  eps: 0,            // producción por segundo efectiva (con buffs)
  baseEps: 0,        // sin buffs temporales
  click: 1,
  globalMult: 1,
  morale: 0,
  perUnit: {},       // id → producción por unidad (con multiplicadores globales, sin buffs)
  total: {},         // id → producción total de ese módulo (sin buffs)
  buffProd: 1,
  buffClick: 1,
  bCost: 1,
  uCost: 1,
  anomFreq: 1,
  anomLife: 1,
  anomDur: 1,
  offlineRate: BASE_OFFLINE_RATE,
  offlineCapH: BASE_OFFLINE_CAP_H,
  available: [],     // mejoras desbloqueadas y no compradas, ordenadas por coste
};

let dirty = true;
export function markDirty() { dirty = true; }

function powerEffects() {
  const e = { prod: 0, prodMult: 1, anomFreq: 1, anomDur: 1, anomLife: 1, bCost: 1, uCost: 1,
    morale: 1, click: 1, clickPct: 0, offline: BASE_OFFLINE_RATE, offlineCap: BASE_OFFLINE_CAP_H,
    startDrones: 0, startCrew: 0 };
  for (const id of G.powers) {
    const p = POWERS_BY_ID.get(id)?.effect;
    if (!p) continue;
    if (p.prod) e.prod += p.prod;
    if (p.prodMult) e.prodMult *= p.prodMult;
    if (p.anomFreq) e.anomFreq *= p.anomFreq;
    if (p.anomDur) e.anomDur *= p.anomDur;
    if (p.anomLife) e.anomLife *= p.anomLife;
    if (p.bCost) e.bCost *= p.bCost;
    if (p.uCost) e.uCost *= p.uCost;
    if (p.morale) e.morale *= p.morale;
    if (p.click) e.click *= p.click;
    if (p.clickPct) e.clickPct += p.clickPct;
    if (p.offline) e.offline = Math.max(e.offline, p.offline);
    if (p.offlineCap) e.offlineCap = Math.max(e.offlineCap, p.offlineCap);
    if (p.startDrones) e.startDrones += p.startDrones;
    if (p.startCrew) e.startCrew += p.startCrew;
  }
  return e;
}

export function recompute() {
  dirty = false;
  const now = Date.now();
  // Si algún efecto ha caducado aquí, la interfaz tiene que enterarse también.
  const alive = G.buffs.filter((b) => b.until > now);
  const expired = alive.length !== G.buffs.length;
  G.buffs = alive;

  const pw = powerEffects();
  const bMult = {};
  for (const b of BUILDINGS) bMult[b.id] = 1;
  const bCostMult = {};
  for (const b of BUILDINGS) bCostMult[b.id] = 1;
  let droneClick = 1;
  let clickMult = 1;
  let clickAdd = 0;
  let swarmAdd = 0;
  let swarmMult = 1;
  let clickPct = pw.clickPct;
  let supply = 1;
  const officers = [];
  const specialists = [];
  let anomFreq = pw.anomFreq;
  let anomLife = pw.anomLife;
  let anomDur = pw.anomDur;

  const own = (id) => G.buildings[id] ?? 0;
  const runMin = (now - G.runStart) / 60000;
  const bankDigits = G.energy >= 1 ? Math.floor(Math.log10(G.energy)) + 1 : 0;
  let totalOwned = 0;
  for (const b of BUILDINGS) totalOwned += own(b.id);
  // Los bonus aditivos de cada módulo (+x% por…) se suman entre sí y luego multiplican.
  const addPct = {};
  for (const b of BUILDINGS) addPct[b.id] = 0;
  let globalAdd = 0;

  for (const id of G.upgrades) {
    const effects = UPGRADES_BY_ID.get(id)?.effects;
    if (!effects) continue;
    for (const ef of effects) {
      switch (ef.type) {
        case 'bmult': bMult[ef.b] *= ef.mult; break;
        case 'self': addPct[ef.b] += ef.pct * own(ef.b); break;
        case 'link': addPct[ef.b] += ef.pct * (own(ef.src) / ef.per); break;
        case 'research': addPct[ef.b] += ef.pct * G.upgrades.size; break;
        case 'morale': addPct[ef.b] += ef.pct * G.achievements.size; break;
        case 'bank': addPct[ef.b] += ef.pct * bankDigits; break;
        case 'anomBonus': addPct[ef.b] += ef.pct * G.anomaliesAll; break;
        case 'runTime':
          if (ef.b) addPct[ef.b] += Math.min(ef.max, ef.pct * runMin);
          else globalAdd += Math.min(ef.max, ef.pct * runMin);
          break;
        case 'cost': bCostMult[ef.b] *= ef.mult; break;
        case 'droneClick': droneClick *= ef.mult; break;
        case 'clickMult': clickMult *= ef.mult; break;
        case 'clickAdd': clickAdd += ef.add * own(ef.src); break;
        case 'swarm': swarmAdd += ef.add; break;
        case 'swarmMult': swarmMult *= ef.mult; break;
        case 'clickPct': clickPct += ef.pct; break;
        case 'global': supply *= 1 + ef.pct; break;
        case 'perTotal': globalAdd += ef.pct * Math.floor(totalOwned / ef.per); break;
        case 'perType': globalAdd += ef.pct * BUILDINGS.filter((b) => own(b.id) >= ef.min).length; break;
        case 'perUpgrade': globalAdd += ef.pct * G.upgrades.size; break;
        case 'perAnomaly': globalAdd += Math.min(ef.max, ef.pct * G.anomaliesAll); break;
        case 'officer': officers.push(ef.factor); break;
        case 'specialist': specialists.push(ef); break;
        case 'anomaly':
          if (ef.freq) anomFreq *= ef.freq;
          if (ef.life) anomLife *= ef.life;
          if (ef.dur) anomDur *= ef.dur;
          break;
      }
    }
  }
  for (const b of BUILDINGS) bMult[b.id] *= 1 + addPct[b.id];
  C.bankDigits = bankDigits;

  const crew = own('crew');
  for (const s of specialists) {
    bMult.crew *= 2;
    bMult[s.b] *= 1 + 0.01 * (crew / s.per);
  }

  const nonDrone = totalOwned - own('drone');
  const swarm = swarmAdd * swarmMult * nonDrone;

  const morale = G.achievements.size * MORALE_PER_ACHIEVEMENT;
  let officerMult = 1;
  for (const f of officers) officerMult *= 1 + morale * f * pw.morale;

  const prestigeMult = 1 + G.prestige.level * PRESTIGE_PER_LEVEL;
  C.popMult = popMult(G.pop);
  const globalMult = supply * (1 + globalAdd) * prestigeMult * (1 + pw.prod) * pw.prodMult * officerMult * C.popMult;

  let buffProd = 1;
  let buffClick = 1;
  for (const b of G.buffs) {
    if (b.prod) buffProd *= b.prod;
    if (b.click) buffClick *= b.click;
  }

  let raw = 0;
  for (const b of BUILDINGS) {
    const n = G.buildings[b.id] ?? 0;
    let unit = b.id === 'drone' ? b.baseEps * droneClick + swarm : b.baseEps;
    unit *= bMult[b.id] * globalMult;
    C.perUnit[b.id] = unit;
    C.total[b.id] = unit * n;
    raw += unit * n;
  }

  C.baseEps = raw;
  C.eps = raw * buffProd;
  C.globalMult = globalMult;
  C.morale = morale;
  C.buffProd = buffProd;
  C.buffClick = buffClick;
  C.click = ((1 * droneClick + swarm + clickAdd) * clickMult * pw.click * prestigeMult + C.eps * clickPct) * buffClick;
  C.bCost = pw.bCost;
  C.bCostMult = bCostMult;
  C.uCost = pw.uCost;
  C.anomFreq = anomFreq;
  C.anomLife = anomLife;
  C.anomDur = anomDur;
  C.offlineRate = pw.offline;
  C.offlineCapH = pw.offlineCap;
  C.startDrones = pw.startDrones;
  C.startCrew = pw.startCrew;

  if (C.baseEps > G.stats.bestEps) G.stats.bestEps = C.baseEps;
  refreshAvailable();
  if (expired) emit('buffsChanged');
}

export function ensureFresh() {
  if (dirty) recompute();
}

// ─── Energía ───
export function earn(amount) {
  G.energy += amount;
  G.earnedRun += amount;
  G.earnedAll += amount;
}

export function spend(amount) {
  if (G.energy < amount) return false;
  G.energy -= amount;
  return true;
}

// ─── Módulos ───
export function buildingCost(id, qty = 1) {
  const b = BUILDINGS_BY_ID.get(id);
  const owned = G.buildings[id] ?? 0;
  const first = b.baseCost * COST_GROWTH ** owned;
  return Math.ceil(first * (COST_GROWTH ** qty - 1) / (COST_GROWTH - 1) * C.bCost * (C.bCostMult?.[id] ?? 1));
}

export function maxAffordable(id) {
  const b = BUILDINGS_BY_ID.get(id);
  const owned = G.buildings[id] ?? 0;
  const first = b.baseCost * COST_GROWTH ** owned * C.bCost * (C.bCostMult?.[id] ?? 1);
  if (G.energy < first) return 0;
  return Math.floor(Math.log(G.energy * (COST_GROWTH - 1) / first + 1) / Math.log(COST_GROWTH));
}

export function sellValue(id, qty = 1) {
  const owned = G.buildings[id] ?? 0;
  const n = Math.min(qty, owned);
  if (n <= 0) return 0;
  const b = BUILDINGS_BY_ID.get(id);
  const first = b.baseCost * COST_GROWTH ** (owned - n);
  return Math.floor(first * (COST_GROWTH ** n - 1) / (COST_GROWTH - 1) * C.bCost * (C.bCostMult?.[id] ?? 1) * SELL_REFUND);
}

/** qty = -1 compra el máximo asequible */
export function buyBuilding(id, qty = 1) {
  ensureFresh();
  const n = qty === -1 ? maxAffordable(id) : qty;
  if (n <= 0) return 0;
  const cost = buildingCost(id, n);
  if (!spend(cost)) return 0;
  G.buildings[id] = (G.buildings[id] ?? 0) + n;
  G.stats.buildingsBought += n;
  onBuildingBought(id);
  markDirty();
  emit('buildingBought', { id, n });
  return n;
}

export function sellBuilding(id, qty = 1) {
  const owned = G.buildings[id] ?? 0;
  const n = qty === -1 ? owned : Math.min(qty, owned);
  if (n <= 0) return 0;
  earnRefund(sellValue(id, n));
  G.buildings[id] = owned - n;
  markDirty();
  emit('buildingSold', { id, n });
  grantAchievement('secret_sell');
  return n;
}

function earnRefund(amount) {
  G.energy += amount; // devolver no cuenta como energía generada
}

// ─── Mejoras ───
export function upgradeCost(u) {
  return Math.ceil(u.cost * C.uCost);
}

function refreshAvailable() {
  const seen = UPGRADES.filter((u) => !G.upgrades.has(u.id) && u.reached(G));
  const ready = seen.filter((u) => u.requires.every((r) => G.upgrades.has(r))).sort((a, b) => a.cost - b.cost);
  const locked = seen.filter((u) => !ready.includes(u)).sort((a, b) => a.cost - b.cost);
  C.available = [...ready, ...locked];
  C.locked = new Set(locked.map((u) => u.id));
}

let lastAvailKey = '';
/** Revisa periódicamente si han aparecido mejoras nuevas. */
export function checkUnlocks() {
  refreshAvailable();
  const key = C.available.map((u) => u.id).join(',');
  if (key !== lastAvailKey) {
    lastAvailKey = key;
    emit('upgradesChanged');
  }
}

export function buyUpgrade(id) {
  ensureFresh();
  const u = UPGRADES_BY_ID.get(id);
  if (!u || G.upgrades.has(id) || !u.unlock(G)) return false;
  if (!spend(upgradeCost(u))) return false;
  G.upgrades.add(id);
  markDirty();
  recompute();
  emit('upgradeBought', { id });
  checkUnlocks();
  return true;
}

// ─── Clic ───
const recentClicks = [];
export function clickPlanet() {
  ensureFresh();
  const amount = C.click;
  earn(amount);
  G.handmadeRun += amount;
  G.handmadeAll += amount;
  G.clicksRun++;
  G.clicksAll++;

  const now = performance.now();
  recentClicks.push(now);
  while (recentClicks.length && now - recentClicks[0] > 1000) recentClicks.shift();
  if (recentClicks.length >= 15) grantAchievement('secret_fast');
  return amount;
}

// ─── Buffs ───
export function addBuff(buff) {
  G.buffs = G.buffs.filter((b) => b.id !== buff.id);
  G.buffs.push(buff);
  if (G.buffs.length >= 2) grantAchievement('secret_frenzy');
  markDirty();
  emit('buffsChanged');
}

let buffCount = 0;
function expireBuffs() {
  const now = Date.now();
  const before = G.buffs.length;
  if (before && G.buffs.some((b) => b.until <= now)) {
    G.buffs = G.buffs.filter((b) => b.until > now);
    markDirty();
    emit('buffsChanged');
  }
  buffCount = G.buffs.length;
}

// ─── Logros ───
export function grantAchievement(id) {
  if (G.achievements.has(id)) return;
  const a = ACHIEVEMENTS_BY_ID.get(id);
  if (!a) return;
  G.achievements.add(id);
  markDirty();
  emit('achievement', a);
}

export function checkAchievements() {
  ensureFresh();
  for (const a of ACHIEVEMENTS) {
    if (a.secret || G.achievements.has(a.id)) continue;
    if (a.check(G, C.baseEps)) grantAchievement(a.id);
  }
}

// ─── Prestigio ───
export function levelFor(total) {
  return Math.floor(Math.cbrt(total / PRESTIGE_BASE));
}

export function pendingLevels() {
  return Math.max(0, levelFor(G.earnedAll) - G.prestige.level);
}

/** Energía total necesaria para el siguiente nivel. */
export function nextLevelAt() {
  const next = Math.max(levelFor(G.earnedAll), G.prestige.level) + 1;
  return next ** 3 * PRESTIGE_BASE;
}

export function ascend() {
  const gain = pendingLevels();
  if (gain <= 0) return false;
  G.prestige.level += gain;
  G.prestige.fragments += gain;
  G.prestige.ascensions++;
  resetRun();
  applyStartBonuses();
  onNewColony();
  markDirty();
  recompute();
  emit('ascended', { gain });
  return true;
}

export function applyStartBonuses() {
  const pw = powerEffects();
  if (pw.startDrones) G.buildings.drone = Math.max(G.buildings.drone ?? 0, pw.startDrones);
  if (pw.startCrew) G.buildings.crew = Math.max(G.buildings.crew ?? 0, pw.startCrew);
}

export function canBuyPower(id) {
  const p = POWERS_BY_ID.get(id);
  if (!p || G.powers.has(id)) return false;
  if (!p.req.every((r) => G.powers.has(r))) return false;
  return G.prestige.fragments >= p.cost;
}

export function buyPower(id) {
  if (!canBuyPower(id)) return false;
  const p = POWERS_BY_ID.get(id);
  G.prestige.fragments -= p.cost;
  G.powers.add(id);
  markDirty();
  emit('powerBought', { id });
  return true;
}

export { POWERS };

// ─── Bucle lógico ───
let lastMinute = 0;
export function tick(dtSeconds) {
  expireBuffs();
  ensureFresh();
  if (C.eps > 0) earn(C.eps * dtSeconds);
  if (updateLife(dtSeconds)) markDirty();
  // Algunas mejoras dependen de la energía guardada o del tiempo de partida.
  const digits = G.energy >= 1 ? Math.floor(Math.log10(G.energy)) + 1 : 0;
  const minute = Math.floor((Date.now() - G.runStart) / 60000);
  if (digits !== C.bankDigits || minute !== lastMinute) {
    lastMinute = minute;
    markDirty();
  }
}

/** Producción acumulada mientras no se jugaba. Devuelve lo ganado. */
export function applyOffline(seconds) {
  ensureFresh();
  const capped = Math.min(seconds, C.offlineCapH * 3600);
  const gained = C.baseEps * capped * C.offlineRate;
  if (gained > 0) earn(gained);
  // La colonia sigue viviendo: llegan colonos y pasan días aunque no juegues.
  const popBefore = Math.floor(G.pop);
  const dayBefore = G.lastDay || colonyDay();
  const entriesBefore = G.journal.length ? G.journal[0] : null;
  updateLife(seconds, { quiet: true });
  markDirty();
  const arrived = Math.max(0, Math.floor(G.pop) - popBefore);
  const days = Math.max(0, colonyDay() - dayBefore);
  const news = [];
  for (const e of G.journal) { if (e === entriesBefore) break; news.push(e); }
  return { gained, seconds: capped, rate: C.offlineRate, capped: seconds > capped, arrived, days, news };
}

export function activeBuffCount() { return buffCount; }
