/** Avisos apilados abajo a la derecha (logros, anomalías, guardado…). */

import { icon } from './icons.js';

let box;
const MAX = 4;

export function initToasts() {
  box = document.createElement('div');
  box.className = 'toasts';
  box.setAttribute('aria-live', 'polite');
  document.body.appendChild(box);
}

/**
 * @param {object} o
 * @param {string} o.title
 * @param {string} [o.text]
 * @param {string} [o.icon]
 * @param {'achievement'|'anomaly'|'info'} [o.kind]
 * @param {number} [o.ms]
 */
export function toast({ title, text = '', icon: ic = 'bolt', kind = 'info', ms = 6000 }) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `toast toast-${kind}`;
  el.innerHTML = `
    <span class="toast-icon">${icon(ic)}</span>
    <span class="toast-body">
      ${kind === 'achievement' && !title.endsWith('logros nuevos') ? '<span class="toast-kicker">Logro desbloqueado</span>' : ''}
      <span class="toast-title">${title}</span>
      ${text ? `<span class="toast-text">${text}</span>` : ''}
    </span>`;
  const close = () => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 250);
  };
  el.addEventListener('click', close);
  box.appendChild(el);
  while (box.children.length > MAX) box.firstChild.remove();
  setTimeout(close, ms);
}
