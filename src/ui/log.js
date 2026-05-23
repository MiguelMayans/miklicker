/**
 * Feed de noticias de la colonia.
 * Muestra mensajes estilo log en la interfaz.
 */

import { getRandomMessage } from '../data/messages.js';

const MAX_LOG_ENTRIES = 50;

/** @type {HTMLElement|null} */
let logContainer = null;

/**
 * Inicializa el contenedor del log.
 * @param {HTMLElement} container
 */
export function initLog(container) {
  logContainer = container;
}

/**
 * Añade una entrada al log.
 * @param {string} message
 * @param {string} type - 'info' | 'success' | 'warning' | 'event'
 */
export function addLogEntry(message, type = 'info') {
  if (!logContainer) return;

  const entry = document.createElement('div');
  const colorMap = {
    info: 'text-cyan-pale',
    success: 'text-success',
    warning: 'text-energy',
    event: 'text-mars',
  };

  entry.className = `text-xs font-sans opacity-80 mb-1 ${colorMap[type] ?? colorMap.info}`;
  entry.textContent = `> ${message}`;

  logContainer.appendChild(entry);

  // Auto-scroll al fondo
  logContainer.scrollTop = logContainer.scrollHeight;

  // Limitar entradas
  while (logContainer.children.length > MAX_LOG_ENTRIES) {
    logContainer.removeChild(logContainer.firstChild);
  }
}

/**
 * Añade un mensaje aleatorio de una categoría.
 * @param {string} category
 * @param {object} replacements
 * @param {string} type
 */
export function addRandomLog(category, replacements = {}, type = 'info') {
  const msg = getRandomMessage(category, replacements);
  if (msg) addLogEntry(msg, type);
}
