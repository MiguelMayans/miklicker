/**
 * Colonia Estelar — arranque.
 */

import './style.css';
import { G, load, save } from './core/state.js';
import { recompute, applyStartBonuses } from './game/engine.js';
import { mountApp } from './ui/app.js';
import { forceAnomaly } from './game/anomalies.js';
import { addEntry } from './game/life.js';

const { loaded, offlineSeconds } = load();
if (!loaded) {
  applyStartBonuses();
  addEntry('Aterrizas en una luna del gigante gaseoso. Solo tienes un planeta enorme delante y muchas ganas.', 'milestone');
}
recompute();
mountApp({ offlineSeconds: loaded ? offlineSeconds : 0, isNew: !loaded });

addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});

// Útil para depurar desde la consola.
window.colonia = { G, forceAnomaly };
