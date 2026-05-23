/**
 * Lógica del área de clic central (Reactor de Fusión).
 */

import { getState, updateState } from '../state.js';
import { calculateClickPower } from '../engine/formulas.js';
import { emit } from '../utils/eventBus.js';
import { spawnFloatingNumber, shakeElement } from '../ui/animations.js';
import { spawnClickSparks } from '../ui/particles.js';

/**
 * Procesa un clic en el reactor.
 * @param {MouseEvent} event
 */
export function handleReactorClick(event) {
  try {
    event.preventDefault();

    const state = getState();
    const power = calculateClickPower(state);

    const newEnergy = state.energy + power;
    const newTotal = state.totalEnergyEarned + power;
    const newClicks = state.totalClicks + 1;

    updateState({
      energy: newEnergy,
      totalEnergyEarned: newTotal,
      totalClicks: newClicks,
    });

    // Efectos visuales
    const x = event.clientX ?? 0;
    const y = event.clientY ?? 0;
    spawnFloatingNumber(power, x, y, 'text-energy');
    spawnClickSparks(x, y, power);

    const reactorImg = document.getElementById('reactor-image');
    if (reactorImg) shakeElement(reactorImg);

    // Ripple effect desde el punto de clic
    createRipple(x, y);

    emit('energyClicked', { amount: power, totalClicks: newClicks });
    emit('stateUpdated', { energy: newEnergy, totalEnergyEarned: newTotal });
  } catch (err) {
    console.error('[CLICK ERROR]', err);
  }
}

/**
 * Crea un efecto ripple expansivo en el punto de clic.
 * @param {number} x
 * @param {number} y
 */
function createRipple(x, y) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(34, 211, 238, 0.3);
    border: 2px solid rgba(34, 211, 238, 0.5);
    transform: translate(-50%, -50%) scale(1);
    pointer-events: none;
    z-index: 100;
  `;

  document.body.appendChild(ripple);

  const anim = ripple.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
    { transform: 'translate(-50%, -50%) scale(4)', opacity: 0 },
  ], {
    duration: 500,
    easing: 'ease-out',
  });

  anim.onfinish = () => ripple.remove();
}
