/**
 * Tooltips — Neo-brutalist v2. Sombra offset, texto grande.
 */

let tooltipEl = null;

export function showTooltip(target, htmlContent) {
  hideTooltip();

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'fixed z-[200] max-w-[320px] p-4 border-[3px] bg-[#f7f5f0] pointer-events-none';
  tooltipEl.style.borderColor = '#0f0f0f';
  tooltipEl.style.boxShadow = '8px 8px 0 0 #0f0f0f';
  tooltipEl.innerHTML = htmlContent;

  document.body.appendChild(tooltipEl);

  const tooltipRect = tooltipEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const gap = 20;
  let left = targetRect.left - tooltipRect.width - gap;
  let top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;

  if (left < 8) {
    left = targetRect.right + gap;
  }

  if (top < 8) top = 8;
  if (top + tooltipRect.height > window.innerHeight - 8) {
    top = window.innerHeight - tooltipRect.height - 8;
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

export function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}
