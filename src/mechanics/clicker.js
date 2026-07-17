/**
 * Lógica del clic central — Cámara de Ignición Estelar.
 * Crit hits, combo system, intensidad escalada con poder.
 */

import { getState, updateState } from '../state.js';
import {
  calculateClickPower,
  calculateCritChance,
  calculateCritMultiplier,
  calculateComboMultiplier,
} from '../engine/formulas.js';
import { consumeEnergizeCharge, getEnergizeCharges } from '../engine/abilities.js';
import { emit } from '../utils/eventBus.js';
import { spawnFloatingNumber, shakeElement } from '../ui/animations.js';
import { spawnClickSparks } from '../ui/particles.js';
import { playClickPop, playCritChime } from '../audio/audioEngine.js';

// ─── COMBO TRACKING (transient, sin persistir en state) ───
let lastClickTime = 0;
let comboCount = 0;
let comboTimer = null;
const COMBO_WINDOW_MS = 600; // tiempo máximo entre clics para mantener combo

/**
 * Procesa un clic en el reactor.
 * @param {MouseEvent} event
 */
export function handleReactorClick(event) {
  try {
    event.preventDefault();

    const state = getState();
    let power = calculateClickPower(state);

    // ─── ENERGIZE — consume carga si hay, ×10 ───
    const isEnergized = consumeEnergizeCharge();
    if (isEnergized) {
      power *= 10;
    }

    // ─── CRIT HIT ───
    const critChance = calculateCritChance(state);
    const isCrit = Math.random() < critChance;
    if (isCrit) {
      power *= calculateCritMultiplier(state);
    }

    // ─── COMBO ───
    const now = Date.now();
    if (now - lastClickTime < COMBO_WINDOW_MS) {
      comboCount++;
    } else {
      comboCount = 1;
    }
    lastClickTime = now;
    const comboMult = calculateComboMultiplier(state, comboCount);
    power *= comboMult;

    // Reset del combo tras inactividad
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      comboCount = 0;
      emit('comboChanged', { comboCount: 0, comboMult: 1 });
    }, COMBO_WINDOW_MS);

    const newEnergy = state.energy + power;
    const newTotal = state.totalEnergyEarned + power;
    const newClicks = state.totalClicks + 1;

    updateState({
      energy: newEnergy,
      totalEnergyEarned: newTotal,
      totalClicks: newClicks,
    });

    // ─── INTENSIDAD derivada del poder ───
    const intensity = Math.min(2.5, Math.log10(power + 10) / 3);

    // ─── Feedback visual ───
    const x = event.clientX ?? 0;
    const y = event.clientY ?? 0;
    spawnFloatingNumber(power, x, y, 'text-[#06b6d4]', { isCrit });
    spawnClickSparks(x, y, power, { isCrit, intensity });

    // ─── Audio ───
    playClickPop(intensity, comboCount);
    if (isCrit) playCritChime();

    // ─── Shake del contenedor principal del reactor ───
    const reactorEl = document.getElementById('star-chamber-v2');
    if (reactorEl) {
      shakeElement(reactorEl, intensity + (isCrit ? 4 : 0));
    }

    // ─── Haptics (mobile) ───
    if (navigator.vibrate) {
      navigator.vibrate(isCrit ? 30 : Math.min(20, 5 + Math.floor(intensity * 5)));
    }

    // ─── Eventos ───
    emit('energyClicked', { amount: power, totalClicks: newClicks, isCrit, isEnergized, comboCount, comboMult });
    emit('comboChanged', { comboCount, comboMult });
    emit('stateUpdated', { energy: newEnergy, totalEnergyEarned: newTotal });
  } catch (err) {
    console.error('[CLICK ERROR]', err);
  }
}

export function getComboCount() {
  return comboCount;
}