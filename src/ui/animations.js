/**
 * Sistema de animaciones ligeras.
 * Floating numbers, shake effects.
 */

/**
 * Muestra un número flotante en una posición dada.
 * @param {number} amount
 * @param {number} x - Coordenada X en px.
 * @param {number} y - Coordenada Y en px.
 * @param {string} colorClass - Clase de color de Tailwind (ej: 'text-energy').
 */
/**
 * Pool reutilizable de elementos de números flotantes.
 * Evita crear/destruir DOM constantemente.
 */
const numberPool = [];

/**
 * Muestra un número flotante en una posición dada.
 * @param {number} amount
 * @param {number} x - Coordenada X en px (pageX).
 * @param {number} y - Coordenada Y en px (pageY).
 * @param {string} colorClass - Clase de color de Tailwind (ej: 'text-energy').
 */
export function spawnFloatingNumber(amount, x, y, colorClass = 'text-[#06b6d4]', opts = {}) {
  const isCrit = opts.isCrit ?? false;
  const tier = Math.min(4, Math.floor(Math.log10(Math.max(1, amount))));
  const sizeClasses = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
  const sizeClass = sizeClasses[Math.min(sizeClasses.length - 1, tier + (isCrit ? 1 : 0))];
  const lifetime = 1000 + tier * 120 + (isCrit ? 250 : 0);
  const driftY = -20 - tier * 6 - (isCrit ? 15 : 0);
  const driftClass = tier >= 3 ? 'animate-float-up-big' : 'animate-float-up';

  // Reutilizar del pool si hay disponibles
  let el = numberPool.pop();
  if (!el) {
    el = document.createElement('div');
  }

  el.textContent = isCrit ? `¡CRIT! +${formatNum(amount)}` : `+${formatNum(amount)}`;
  const critColor = isCrit ? 'text-[#facc15]' : colorClass;
  el.className = `fixed pointer-events-none font-mono ${sizeClass} font-extrabold ${driftClass} ${critColor}`;

  // Offset: sale ligeramente arriba del clic para que el número "suba" desde el cursor
  const offsetX = (Math.random() - 0.5) * 24;
  el.style.left = `${x + offsetX}px`;
  el.style.top = `${y - 20}px`;
  el.style.zIndex = '100';
  // Sombra potente para legibilidad
  const glow = isCrit ? '#facc15' : '#06b6d4';
  el.style.textShadow = `
    0 0 2px #000,
    0 0 4px #000,
    0 0 8px ${glow},
    0 0 16px ${glow},
    0 0 24px ${glow}
  `;
  el.style.setProperty('--drift-y', `${driftY}px`);

  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
    if (numberPool.length < 10) {
      numberPool.push(el);
    }
  }, lifetime);
}

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

/**
 * Aplica un efecto shake a un elemento.
 * @param {HTMLElement} element
 */
export function shakeElement(element, intensity = 1) {
  if (!element) return;
  element.style.setProperty('--shake-mag', String(Math.max(1, Math.round(intensity))));
  element.classList.remove('animate-shake');
  void element.offsetWidth; // force reflow
  element.classList.add('animate-shake');
}

/**
 * Aplica un efecto de glow temporal a un elemento.
 * @param {HTMLElement} element
 */
export function flashGlow(element) {
  element.classList.add('animate-glow-pulse');
  setTimeout(() => {
    element.classList.remove('animate-glow-pulse');
  }, 500);
}
