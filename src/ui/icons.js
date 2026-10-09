/**
 * Iconos de la interfaz: son las ilustraciones propias de doodle.js
 * convertidas en imagen. Solo el fragmento de anomalía sigue siendo SVG
 * (lleva degradados y se anima con CSS).
 */

import { spriteURL } from './doodle.js';

export function injectIcons() {
  if (document.getElementById('icon-sprite')) return;
  const shard = `
    <linearGradient id="shard-a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff4d0"/><stop offset=".45" stop-color="#ebb23c"/><stop offset="1" stop-color="#a8611d"/>
    </linearGradient>
    <linearGradient id="shard-b" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe3a0"/><stop offset="1" stop-color="#c8742a"/>
    </linearGradient>
    <symbol id="i-shard" viewBox="-50 -50 100 100">
      <path d="M0-44 20-8 8 44-14 12-22-14z" fill="url(#shard-a)"/>
      <path d="M0-44 4 2 8 44 20-8z" fill="url(#shard-b)" opacity=".85"/>
      <path d="M0-44 4 2-14 12-22-14z" fill="#fff8e6" opacity=".35"/>
      <path d="M0-44 20-8 8 44-14 12-22-14z" fill="none" stroke="#fff4d6" stroke-width="1.5" stroke-linejoin="round"/>
    </symbol>`;
  const svg = `<svg id="icon-sprite" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>${shard}</defs></svg>`;
  document.body.insertAdjacentHTML('afterbegin', svg);
}

export function icon(id, cls = '', opts = {}) {
  if (id === 'close') return `<span class="ico ico-x ${cls}" aria-hidden="true">✕</span>`;
  return `<img class="ico ${cls}" src="${spriteURL(id, 56, opts)}" alt="" draggable="false">`;
}
