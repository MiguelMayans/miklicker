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
export function spawnFloatingNumber(amount, x, y, colorClass = 'text-energy') {
  // Reutilizar del pool si hay disponibles
  let el = numberPool.pop();
  if (!el) {
    el = document.createElement('div');
    el.className = 'fixed pointer-events-none font-pixel font-bold animate-float-up';
  }

  el.textContent = `+${amount}`;
  el.className = `fixed pointer-events-none font-pixel text-2xl font-bold animate-float-up ${colorClass}`;

  // Offset: sale ligeramente arriba del clic para que el número "suba" desde el cursor
  const offsetX = (Math.random() - 0.5) * 24;
  const offsetY = -20; // 20px arriba del clic

  el.style.left = `${x + offsetX}px`;
  el.style.top = `${y + offsetY}px`;
  el.style.zIndex = '100';
  // Sombra potente para legibilidad sobre cualquier fondo oscuro
  el.style.textShadow = `
    0 0 2px #000,
    0 0 4px #000,
    0 0 8px currentColor,
    0 0 16px currentColor,
    0 0 24px currentColor
  `;

  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
    // Guardar en pool para reutilizar (limitado)
    if (numberPool.length < 10) {
      numberPool.push(el);
    }
  }, 1000);
}

/**
 * Aplica un efecto shake a un elemento.
 * @param {HTMLElement} element
 */
export function shakeElement(element) {
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
