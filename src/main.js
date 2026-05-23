/**
 * Bootstrap de la aplicación.
 * Inicializa estado, carga partida, monta UI y arranca el game loop.
 */

import './style.css';
import { getState, updateState } from './state.js';
import { load, save, startAutoSave } from './engine/saveLoad.js';
import { start, pause, resume, processOfflineTime } from './engine/gameLoop.js';
import { initUI } from './ui/renderer.js';
import { emit } from './utils/eventBus.js';

function bootstrap() {
  const loaded = load();

  if (!loaded) {
    updateState({ lastTick: Date.now() });
    emit('newGame');
  } else {
    processOfflineTime();
    emit('gameResumed');
  }

  initUI();
  startAutoSave();
  start();

  window.addEventListener('beforeunload', () => {
    save();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
    } else {
      processOfflineTime();
      resume();
    }
  });
}

bootstrap();
