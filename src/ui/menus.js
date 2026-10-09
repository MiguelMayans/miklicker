/**
 * Menús en <dialog>: estadísticas, logros y opciones.
 * <dialog> nos da foco atrapado y Esc para cerrar sin código extra.
 */

import { G, save, exportString, importString, clearSave, wipeAll } from '../core/state.js';
import { fmt, fmtTime, pct, setNumberMode } from '../core/format.js';
import { ACHIEVEMENTS, MORALE_PER_ACHIEVEMENT } from '../data/achievements.js';
import { UPGRADES } from '../data/upgrades.js';
import { C, pendingLevels, nextLevelAt, ensureFresh } from '../game/engine.js';
import { icon } from './icons.js';
import { bindTip } from './tooltip.js';
import { toast } from './toasts.js';

let dialog;
let body;
let titleEl;
let refreshTimer = null;

export function initMenus() {
  dialog = document.createElement('dialog');
  dialog.className = 'menu';
  dialog.innerHTML = `
    <header class="menu-head">
      <h2 class="menu-title"></h2>
      <button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('close')}</button>
    </header>
    <div class="menu-body"></div>`;
  document.body.appendChild(dialog);
  body = dialog.querySelector('.menu-body');
  titleEl = dialog.querySelector('.menu-title');
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => clearInterval(refreshTimer));
}

function open(title, render, live = false) {
  titleEl.textContent = title;
  render();
  if (!dialog.open) dialog.showModal();
  clearInterval(refreshTimer);
  if (live) refreshTimer = setInterval(render, 1000);
}

// ─── Estadísticas ───
export function openStats() {
  open('Estadísticas', () => {
    ensureFresh();
    const totalB = Object.values(G.buildings).reduce((a, c) => a + c, 0);
    const pending = pendingLevels();
    const rows = [
      ['Créditos disponibles', `₡${fmt(G.energy)}`],
      ['Ganados en esta colonia', `₡${fmt(G.earnedRun)}`],
      ['Ganados en total', `₡${fmt(G.earnedAll)}`],
      ['Ingresos por segundo', `₡${fmt(C.eps, { frac: true })}`],
      ['Colonos', `${fmt(Math.floor(G.pop))} (récord: ${fmt(Math.floor(G.stats.bestPop ?? 0))})`],
      ['Nacimientos', fmt(G.births ?? 0)],
      ['Mejores ingresos por segundo', `₡${fmt(G.stats.bestEps, { frac: true })}`],
      ['Ganancia por clic', `₡${fmt(C.click, { frac: true })}`],
      ['Clics en esta partida', fmt(G.clicksRun)],
      ['Clics en total', fmt(G.clicksAll)],
      ['Ganado recogiendo gas a mano', `₡${fmt(G.handmadeAll)}`],
      ['Anomalías capturadas', `${fmt(G.anomaliesRun)} en esta partida, ${fmt(G.anomaliesAll)} en total`],
      ['Módulos', fmt(totalB)],
      ['Mejoras compradas', `${G.upgrades.size} de ${UPGRADES.length}`],
      ['Duración de la partida', fmtTime((Date.now() - G.runStart) / 1000)],
      ['Desde el primer clic', fmtTime((Date.now() - G.gameStart) / 1000)],
    ];
    const mult = [
      ['Moral de la tripulación', pct(C.morale)],
      ['Bonus por colonos', `×${fmt(C.popMult ?? 1, { frac: true })}`],
      ['Nivel de prestigio', `${fmt(G.prestige.level)} (+${fmt(G.prestige.level * 2)}% de producción)`],
      ['Niveles por reclamar', pending ? `${fmt(pending)}` : `El siguiente llega al generar ${fmt(nextLevelAt())} en total`],
      ['Multiplicador global', `×${fmt(C.globalMult, { frac: true })}`],
      ['Entradas en la Unidad', fmt(G.prestige.ascensions)],
      ['Producción sin conexión', `${pct(C.offlineRate)} durante un máximo de ${C.offlineCapH} h`],
    ];
    const list = (r) => r.map(([k, v]) => `<div class="stat"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    body.innerHTML = `
      <h3 class="sub-title">Partida</h3><dl class="stats">${list(rows)}</dl>
      <h3 class="sub-title">Bonificaciones</h3><dl class="stats">${list(mult)}</dl>`;
  }, true);
}

// ─── Logros ───
export function openAchievements() {
  open('Logros', () => {
    const got = ACHIEVEMENTS.filter((a) => G.achievements.has(a.id)).length;
    const groups = [
      ['Progreso', ACHIEVEMENTS.filter((a) => !a.secret && !a.id.startsWith('b_'))],
      ['Módulos', ACHIEVEMENTS.filter((a) => a.id.startsWith('b_'))],
      ['Secretos', ACHIEVEMENTS.filter((a) => a.secret)],
    ];
    body.innerHTML = `
      <p class="menu-lead">Tienes <b>${got}</b> de ${ACHIEVEMENTS.length}. Cada logro sube la moral de la tripulación un ${pct(MORALE_PER_ACHIEVEMENT)}; los oficiales la convierten en producción.</p>
      ${groups.map(([name, arr]) => `
        <h3 class="sub-title">${name}</h3>
        <div class="ach-grid">${arr.map((a) => {
          const has = G.achievements.has(a.id);
          return `<div class="ach ${has ? 'is-got' : ''}" tabindex="0" data-ach="${a.id}">${icon(a.secret && !has ? 'question' : a.icon, '', { silhouette: !has })}</div>`;
        }).join('')}</div>`).join('')}`;
    body.querySelectorAll('[data-ach]').forEach((el) => {
      const a = ACHIEVEMENTS.find((x) => x.id === el.dataset.ach);
      bindTip(el, () => {
        const has = G.achievements.has(a.id);
        const hidden = a.secret && !has;
        return `<div class="tt-head"><span class="tt-icon">${icon(hidden ? 'question' : a.icon)}</span>
          <div><div class="tt-name">${hidden ? 'Logro secreto' : a.name}</div><div class="tt-sub">${has ? 'Conseguido' : 'Pendiente'}</div></div></div>
          <p class="tt-desc">${hidden ? 'Descúbrelo jugando.' : a.desc}</p>`;
      });
    });
  });
}

// ─── Opciones ───
export function openOptions() {
  open('Opciones', () => {
    const s = G.settings;
    body.innerHTML = `
      <div class="opts">
        <label class="opt"><span>Sonido</span><input type="checkbox" data-opt="sound" ${s.sound ? 'checked' : ''}></label>
        <label class="opt"><span>Volumen</span><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-opt="volume"></label>
        <label class="opt"><span>Partículas y efectos</span><input type="checkbox" data-opt="particles" ${s.particles ? 'checked' : ''}></label>
        <label class="opt"><span>Formato de números</span>
          <select data-opt="numbers">
            <option value="words" ${s.numbers === 'words' ? 'selected' : ''}>Palabras (1,5 millones)</option>
            <option value="short" ${s.numbers === 'short' ? 'selected' : ''}>Abreviado (1,5M)</option>
            <option value="sci" ${s.numbers === 'sci' ? 'selected' : ''}>Científico (1,50e6)</option>
          </select>
        </label>
      </div>
      <h3 class="sub-title">Partida</h3>
      <p class="menu-lead">La partida se guarda sola cada 30 segundos y al cerrar la pestaña.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="save">Guardar ahora</button>
        <button type="button" class="btn" data-act="export">Exportar partida</button>
        <button type="button" class="btn" data-act="import">Importar partida</button>
      </div>
      <textarea class="save-box" rows="4" spellcheck="false" hidden aria-label="Código de partida"></textarea>
      <div class="btn-row" data-import-row hidden>
        <button type="button" class="btn btn-primary" data-act="do-import">Cargar este código</button>
      </div>
      <h3 class="sub-title">Zona peligrosa</h3>
      <p class="menu-lead">Borrar la partida elimina todo: módulos, logros, prestigio y poderes.</p>
      <div class="btn-row"><button type="button" class="btn btn-danger" data-act="wipe">Borrar partida</button></div>`;

    body.querySelectorAll('[data-opt]').forEach((el) => {
      el.addEventListener('change', () => {
        const k = el.dataset.opt;
        s[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
        if (k === 'numbers') setNumberMode(s.numbers);
        save();
      });
    });
    const box = body.querySelector('.save-box');
    body.querySelector('[data-act="save"]').addEventListener('click', () => {
      if (save()) toast({ title: 'Partida guardada', icon: 'chip', ms: 2500 });
    });
    body.querySelector('[data-act="export"]').addEventListener('click', async () => {
      box.hidden = false;
      body.querySelector('[data-import-row]').hidden = true;
      box.value = exportString();
      box.select();
      try {
        await navigator.clipboard.writeText(box.value);
        toast({ title: 'Código copiado', text: 'Pégalo en un lugar seguro.', icon: 'chip', ms: 3000 });
      } catch { /* sin portapapeles: el texto queda seleccionado */ }
    });
    body.querySelector('[data-act="import"]').addEventListener('click', () => {
      box.hidden = false;
      box.value = '';
      box.placeholder = 'Pega aquí tu código de partida';
      body.querySelector('[data-import-row]').hidden = false;
      box.focus();
    });
    body.querySelector('[data-act="do-import"]').addEventListener('click', () => {
      if (importString(box.value)) {
        location.reload();
      } else {
        toast({ title: 'Código no válido', text: 'Comprueba que lo has copiado completo.', icon: 'close', ms: 4000 });
      }
    });
    body.querySelector('[data-act="wipe"]').addEventListener('click', () => {
      const answer = prompt('Esto no se puede deshacer. Escribe BORRAR para confirmar.');
      if (answer?.trim().toUpperCase() === 'BORRAR') {
        clearSave();
        wipeAll();
        location.reload();
      }
    });
  });
}

/** Resumen de lo que ha pasado mientras no estabas. */
export function openOffline({ gained, seconds, rate, capped, arrived = 0, days = 0, news = [] }) {
  open('Mientras no estabas', () => {
    const facts = [];
    if (days > 0) facts.push(`<li><b>${fmt(days)}</b> ${days === 1 ? 'día ha pasado' : 'días han pasado'} en la colonia</li>`);
    if (arrived > 0) facts.push(`<li>Han llegado <b>${fmt(arrived)}</b> ${arrived === 1 ? 'colono nuevo' : 'colonos nuevos'}</li>`);
    if (gained > 0) facts.push(`<li>Se han ganado <b>₡${fmt(gained)}</b> (al ${pct(rate)} de la capacidad${capped ? ', máximo acumulable' : ''})</li>`);
    body.innerHTML = `
      <p class="menu-lead">Has estado fuera ${fmtTime(seconds)}. Esto es lo que ha pasado:</p>
      <ul class="offline-facts">${facts.join('')}</ul>
      ${news.length ? `<h3 class="sub-title">Del diario</h3><ol class="journal">${news.slice(0, 6).map(entryHTML).join('')}</ol>` : ''}
      <div class="btn-row"><button type="button" class="btn btn-primary" data-close-ok autofocus>Volver a la colonia</button></div>`;
    body.querySelector('[data-close-ok]').addEventListener('click', () => dialog.close());
  });
  G.journalUnread = 0;
}

function entryHTML(e) {
  const day = ((e.d - 1) % 28) + 1;
  return `<li class="entry entry-${e.k}"><span class="entry-date">Día ${day}<small>ciclo ${e.c}</small></span><p>${e.t}</p></li>`;
}

// ─── Diario ───
export function openJournal() {
  G.journalUnread = 0;
  open('Diario de la colonia', () => {
    body.innerHTML = G.journal.length
      ? `<p class="menu-lead">Lo que ha ido pasando en la colonia, de lo más reciente a lo más antiguo.</p><ol class="journal">${G.journal.map(entryHTML).join('')}</ol>`
      : '<p class="menu-lead">El diario está en blanco. Construye algo y empezará a llenarse.</p>';
  });
}

export function closeMenu() {
  if (dialog?.open) dialog.close();
}

