/**
 * Utilidades para formatear números grandes.
 * Sufijos estándar hasta 1e66, luego notación científica limpia.
 * Maneja Infinity con gracia.
 */

const SUFFIXES = [
  '', 'K', 'M', 'B', 'T',
  'Qa', 'Qi', 'Sx', 'Sp', 'Oc',
  'No', 'Dc', 'Ud', 'Dd', 'Td',
  'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd',
  'Nod', 'Vg', 'Uvg',
];

/**
 * Formatea un número con sufijos o notación científica.
 * @param {number} value
 * @param {number} decimals - Decimales a mostrar
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  if (value === 0) return '0';
  if (!Number.isFinite(value)) return '∞';
  if (value < 0) return '-' + formatNumber(-value, decimals);

  const exponent = Math.floor(Math.log10(value));
  const tier = Math.floor(exponent / 3);

  // Pequeños: sin sufijo, siempre con decimales fijos para evitar saltos visuales
  if (tier === 0) {
    return value.toFixed(decimals);
  }

  // Sufijos hasta 1e66 (22 tiers)
  if (tier < SUFFIXES.length) {
    const suffix = SUFFIXES[tier];
    const scaled = value / Math.pow(10, tier * 3);
    return scaled.toFixed(decimals).replace(/\.?0+$/, '') + suffix;
  }

  // Notación científica limpia: 1.23e45
  const mantissa = value / Math.pow(10, exponent);
  return `${mantissa.toFixed(Math.max(0, decimals - 1))}e${exponent}`;
}

/**
 * Versión compacta para displays pequeños.
 * @param {number} value
 * @returns {string}
 */
export function formatCompact(value) {
  return formatNumber(value, 1);
}

/**
 * Formatea una tasa (kW).
 * @param {number} value
 * @returns {string}
 */
export function formatRate(value) {
  const sign = value >= 0 ? '' : '-';
  return `${sign}${formatNumber(Math.abs(value), 2)} kW`;
}
