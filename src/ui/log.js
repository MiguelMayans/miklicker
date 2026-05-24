/**
 * Log — Neo-brutalist v2. Texto más grande.
 */

import { getRandomMessage } from '../data/messages.js';

const MAX_LOG_ENTRIES = 50;

let logContainer = null;

export function initLog(container) {
  logContainer = container;
}

export function addLogEntry(message, type = 'info') {
  if (!logContainer) return;

  const entry = document.createElement('div');
  const colorMap = {
    info: 'text-[#3a3a35]',
    success: 'text-[#06b6d4]',
    warning: 'text-[#dc2626]',
    event: 'text-[#0f0f0f]',
  };

  entry.className = `text-base font-mono ${colorMap[type] ?? colorMap.info}`;
  entry.textContent = `> ${message}`;

  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;

  while (logContainer.children.length > MAX_LOG_ENTRIES) {
    logContainer.removeChild(logContainer.firstChild);
  }
}

export function addRandomLog(category, replacements = {}, type = 'info') {
  const msg = getRandomMessage(category, replacements);
  if (msg) addLogEntry(msg, type);
}
