/**
 * Motor de milestones/logros.
 * Comprueba condiciones y dispara recompensas + popups.
 */

import { getState, updateState } from '../state.js';
import { MILESTONES } from '../data/milestones.js';
import { emit } from '../utils/eventBus.js';
import { showMilestonePopup } from '../ui/milestonePopup.js';

/** Set de milestones ya completados en esta sesión (para no repetir) */
const completedThisSession = new Set();

/**
 * Comprueba todos los milestones y procesa los que se cumplen.
 * Se llama después de cada cambio de estado significativo.
 */
export function checkMilestones() {
  const state = getState();

  for (const milestone of MILESTONES) {
    if (state.milestones?.includes(milestone.id)) continue;
    if (completedThisSession.has(milestone.id)) continue;

    if (isMilestoneComplete(milestone, state)) {
      completeMilestone(milestone, state);
    }
  }
}

/**
 * Verifica si un milestone cumple su condición.
 * @param {object} milestone
 * @param {object} state
 * @returns {boolean}
 */
function isMilestoneComplete(milestone, state) {
  const { condition } = milestone;

  switch (condition.type) {
    case 'totalClicks':
      return state.totalClicks >= condition.value;
    case 'totalBuildings': {
      const total = Object.values(state.buildings).reduce((sum, c) => sum + (c ?? 0), 0);
      return total >= condition.value;
    }
    case 'totalEnergyEarned':
      return state.totalEnergyEarned >= condition.value;
    case 'buildingOwned':
      return (state.buildings[condition.building] ?? 0) >= condition.value;
    default:
      return false;
  }
}

/**
 * Completa un milestone: recompensa + popup + log.
 * @param {object} milestone
 * @param {object} state
 */
function completeMilestone(milestone, state) {
  completedThisSession.add(milestone.id);

  // Aplicar recompensa
  let newEnergy = state.energy;
  if (milestone.reward.type === 'energy' && milestone.reward.amount > 0) {
    newEnergy += milestone.reward.amount;
  }

  const newMilestones = [...(state.milestones ?? []), milestone.id];

  updateState({
    ...state,
    energy: newEnergy,
    milestones: newMilestones,
    totalEnergyEarned: state.totalEnergyEarned + (milestone.reward.amount || 0),
  });

  // Mostrar popup
  showMilestonePopup(milestone);

  // Emitir eventos
  emit('milestoneCompleted', { id: milestone.id, name: milestone.name });
  emit('stateUpdated', { energy: newEnergy, milestones: newMilestones });
}
