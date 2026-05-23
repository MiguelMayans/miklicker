/**
 * Sistema de tooltips personalizados.
 * Tooltips posicionados absolutamente cerca del elemento objetivo.
 */

/** @type {HTMLElement|null} */
let tooltipEl = null;

/**
 * Muestra un tooltip cerca de un elemento.
 * @param {HTMLElement} target - Elemento sobre el que mostrar el tooltip.
 * @param {string} htmlContent - Contenido HTML del tooltip.
 */
export function showTooltip(target, htmlContent) {
  hideTooltip();

  tooltipEl = document.createElement('div');
  tooltipEl.className = `
    fixed z-[200] max-w-[280px] p-3 rounded-lg border border-cyan-glow/30
    bg-cosmic-900/95 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)]
    pointer-events-none transition-opacity duration-150 opacity-0
  `;
  tooltipEl.innerHTML = htmlContent;

  document.body.appendChild(tooltipEl);

  // Forzar layout para calcular dimensiones
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Posicionar: a la izquierda del target si hay espacio, si no a la derecha
  const gap = 12;
  let left = targetRect.left - tooltipRect.width - gap;
  let top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;

  // Si no cabe a la izquierda, poner a la derecha
  if (left < 8) {
    left = targetRect.right + gap;
  }

  // Ajustar top para que no se salga por arriba o abajo
  if (top < 8) top = 8;
  if (top + tooltipRect.height > window.innerHeight - 8) {
    top = window.innerHeight - tooltipRect.height - 8;
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;

  // Fade in
  requestAnimationFrame(() => {
    if (tooltipEl) tooltipEl.classList.remove('opacity-0');
  });
}

/**
 * Oculta y destruye el tooltip actual.
 */
export function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}
