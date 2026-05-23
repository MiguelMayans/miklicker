/**
 * Plantillas de mensajes para el log de noticias de la colonia.
 */

export const MESSAGE_TEMPLATES = {
  first_click: [
    'El reactor ha despertado... la colonia comienza.',
    'Primera chispa de energía detectada.',
  ],
  building_purchased: [
    'Se ha completado la construcción de {name}.',
    'Nueva infraestructura operativa: {name}.',
    '{name} ahora genera energía para la colonia.',
  ],
  upgrade_purchased: [
    'Tecnología desbloqueada: {name}.',
    'Los ingenieros han mejorado los sistemas de {name}.',
  ],
  milestone_energy: [
    'Milestone: {amount} de energía acumulada.',
    'La red eléctrica de la colonia supera los {amount}.',
  ],
  random_event: [
    '¡Evento anómalo detectado!',
    'Sensors pick up unusual activity...',
  ],
};

/**
 * Obtiene un mensaje aleatorio de una categoría.
 * @param {string} category - Clave de MESSAGE_TEMPLATES.
 * @param {object} replacements - Valores para interpolar {key}.
 * @returns {string}
 */
export function getRandomMessage(category, replacements = {}) {
  const templates = MESSAGE_TEMPLATES[category];
  if (!templates || templates.length === 0) return '';

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
}
