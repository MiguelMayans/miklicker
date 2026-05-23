/**
 * Popups de milestones con GSAP.
 * Banners que entran desde abajo con animaciones fluidas.
 */

import gsap from 'gsap';

/** @type {HTMLElement|null} */
let container = null;

/** Cola de milestones pendientes */
const queue = [];
let isShowing = false;

/**
 * Inicializa el contenedor de popups.
 * @param {HTMLElement} parent
 */
export function initMilestonePopup(parent) {
  container = document.createElement('div');
  container.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none';
  container.style.maxWidth = '400px';
  parent.appendChild(container);
}

/**
 * Muestra un popup de milestone (o lo encola si hay otro activo).
 * @param {object} milestone
 */
export function showMilestonePopup(milestone) {
  queue.push(milestone);
  if (!isShowing) {
    processQueue();
  }
}

function processQueue() {
  if (queue.length === 0) {
    isShowing = false;
    return;
  }

  isShowing = true;
  const milestone = queue.shift();
  createPopup(milestone);
}

function createPopup(milestone) {
  if (!container) return;

  const popup = document.createElement('div');
  popup.className = `
    pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
    bg-cosmic-800/90 backdrop-blur-md border border-energy/30
    shadow-[0_0_20px_rgba(250,204,21,0.15)]
  `;

  // Icono
  const icon = document.createElement('div');
  icon.className = 'flex-shrink-0 w-10 h-10 rounded-lg bg-energy/20 flex items-center justify-center text-lg';
  icon.textContent = '🏆';

  // Info
  const info = document.createElement('div');
  info.className = 'flex-1 min-w-0';

  const title = document.createElement('div');
  title.className = 'font-pixel text-xs text-energy';
  title.textContent = milestone.name;

  const desc = document.createElement('div');
  desc.className = 'text-xs text-slate-300 mt-0.5';
  desc.textContent = milestone.description;

  const reward = document.createElement('div');
  reward.className = 'text-xs text-cyan-glow mt-1';
  if (milestone.reward.amount > 0) {
    reward.textContent = `+${milestone.reward.amount} ⚡`;
  }

  info.appendChild(title);
  info.appendChild(desc);
  if (milestone.reward.amount > 0) info.appendChild(reward);

  popup.appendChild(icon);
  popup.appendChild(info);

  container.appendChild(popup);

  // Animación de entrada con GSAP
  gsap.fromTo(popup,
    { y: 50, opacity: 0, scale: 0.9 },
    {
      y: 0, opacity: 1, scale: 1,
      duration: 0.5,
      ease: 'back.out(1.4)',
    }
  );

  // Auto-destruir después de 4 segundos
  gsap.to(popup, {
    y: -30,
    opacity: 0,
    scale: 0.9,
    duration: 0.4,
    delay: 4,
    ease: 'power2.in',
    onComplete: () => {
      popup.remove();
      processQueue();
    },
  });

  // Permitir cerrar al clicar
  popup.addEventListener('click', () => {
    gsap.killTweensOf(popup);
    gsap.to(popup, {
      y: -30, opacity: 0, scale: 0.9, duration: 0.3,
      onComplete: () => {
        popup.remove();
        processQueue();
      },
    });
  });
}
