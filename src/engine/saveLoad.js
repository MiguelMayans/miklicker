/**
 * Sistema de guardado y carga.
 * Usa localStorage con versionado y migración automática.
 */

import { GAME_VERSION, SAVE_INTERVAL } from '../config.js';
import { getState, setState } from '../state.js';
import { emit } from '../utils/eventBus.js';

const SAVE_KEY = 'colonia_estelar_save';

let saveTimer = null;

/**
 * Guarda el estado actual en localStorage.
 */
export function save() {
  try {
    const state = getState();
    const payload = {
      version: GAME_VERSION,
      savedAt: Date.now(),
      state,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    emit('gameSaved', { timestamp: payload.savedAt });
  } catch (err) {
    console.error('Save failed:', err);
    emit('saveError', { error: err.message });
  }
}

/**
 * Carga una partida desde localStorage.
 * @returns {boolean} - true si se cargó correctamente.
 */
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const payload = JSON.parse(raw);
    if (!payload || !payload.state) return false;

    // Migración de versiones
    const migrated = migrateSave(payload);
    setState(migrated.state);
    emit('gameLoaded', { version: migrated.version, savedAt: migrated.savedAt });
    return true;
  } catch (err) {
    console.error('Load failed:', err);
    emit('loadError', { error: err.message });
    return false;
  }
}

/**
 * Elimina la partida guardada.
 */
export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  emit('saveCleared');
}

/**
 * Exporta la partida a un archivo JSON descargable.
 */
export function exportSave() {
  const state = getState();
  const payload = {
    version: GAME_VERSION,
    exportedAt: Date.now(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `colonia_estelar_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa una partida desde un archivo JSON.
 * @param {File} file
 * @returns {Promise<boolean>}
 */
export function importSave(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        const migrated = migrateSave(payload);
        setState(migrated.state);
        save(); // Sobrescribe el localStorage inmediatamente
        emit('gameImported');
        resolve(true);
      } catch (err) {
        console.error('Import failed:', err);
        emit('importError', { error: err.message });
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

/**
 * Arranca el auto-guardado periódico.
 */
export function startAutoSave() {
  if (saveTimer) return;
  saveTimer = setInterval(() => {
    save();
  }, SAVE_INTERVAL);
}

/**
 * Detiene el auto-guardado.
 */
export function stopAutoSave() {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
}

/**
 * Migra un save de una versión antigua a la actual.
 * @param {object} payload
 * @returns {object}
 */
function migrateSave(payload) {
  const currentVersion = GAME_VERSION;
  let version = payload.version ?? 0;
  let state = payload.state;

  if (version < 1) {
    // Migraciones futuras irán aquí
    // Ejemplo: si falta un campo, se añade con valor por defecto.
    if (!state.prestige) {
      state.prestige = { cosmicData: 0, multiplier: 1 };
    }
    if (!state.buildingMultipliers) {
      state.buildingMultipliers = {};
    }
    version = 1;
  }

  return { ...payload, version: currentVersion, state };
}
