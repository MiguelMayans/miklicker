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
    info: 'text-[#8a8a8a]',
    success: 'text-[#22d3ee]',
    warning: 'text-[#ef4444]',
    event: 'text-[#e8e4dc]',
  };

  entry.className = `text-sm font-mono ${colorMap[type] ?? colorMap.info}`;
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
