/**
 * Utilidades para formatear números grandes.
 * Sistema preparado para escalar hasta notación científica sin usar librerías externas.
 */

const SUFFIXES = [
  '', 'K', 'M', 'B', 'T',
  'Qa', 'Qi', 'Sx', 'Sp', 'Oc',
  'No', 'Dc', 'Ud', 'Dd', 'Td',
  'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd',
  'Nod', 'Vg', 'Uvg',
];

/**
 * Formatea un número con sufijos (K, M, B, T...) o notación científica si es necesario.
 * @param {number} value
 * @param {number} decimals - Decimales a mostrar (default 2)
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  if (value === 0) return '0';
  if (!Number.isFinite(value)) return '∞';
  if (value < 0) return '-' + formatNumber(-value, decimals);

  const tier = Math.floor(Math.log10(value) / 3);

  if (tier === 0) {
    // Números pequeños: mostrar enteros si no tienen decimales relevantes
    return Number.isInteger(value) ? String(value) : value.toFixed(decimals).replace(/\.?0+$/, '');
  }

  if (tier < SUFFIXES.length) {
    const suffix = SUFFIXES[tier];
    const scaled = value / Math.pow(10, tier * 3);
    return scaled.toFixed(decimals).replace(/\.?0+$/, '') + suffix;
  }

  // Muy grande: notación científica limpia
  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / Math.pow(10, exponent);
  return `${mantissa.toFixed(decimals)}e${exponent}`;
}

/**
 * Versión entera compacta para displays pequeños (ej. costes en botones).
 * @param {number} value
 * @returns {string}
 */
export function formatCompact(value) {
  return formatNumber(value, 1);
}

/**
 * Formatea una tasa por segundo (ej. "+1.23K/s").
 * @param {number} value
 * @returns {string}
 */
export function formatRate(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, 1)}/s`;
}
