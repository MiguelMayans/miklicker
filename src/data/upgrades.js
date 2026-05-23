/**
 * Definición de mejoras (upgrades).
 * Cada mejora puede afectar a un edificio específico o al clic global.
 */

export const UPGRADES = [
  // --- Mejoras de Panel Solar ---
  {
    id: 'solar_tier_1',
    name: 'Celdas Fotovoltaicas Avanzadas',
    description: 'Los paneles solares son el doble de eficientes.',
    cost: 100,
    costResource: 'energy',
    effect: { type: 'building_multiplier', target: 'solar_panel', multiplier: 2 },
    requires: { building: 'solar_panel', count: 1 },
  },
  {
    id: 'solar_tier_2',
    name: 'Concentradores Estelares',
    description: 'Los paneles solares producen el doble.',
    cost: 500,
    costResource: 'energy',
    effect: { type: 'building_multiplier', target: 'solar_panel', multiplier: 2 },
    requires: { building: 'solar_panel', count: 10 },
  },

  // --- Mejoras de Mina Lunar ---
  {
    id: 'mine_tier_1',
    name: 'Taladros de Plasma',
    description: 'Las minas lunares duplican su producción.',
    cost: 500,
    costResource: 'energy',
    effect: { type: 'building_multiplier', target: 'lunar_mine', multiplier: 2 },
    requires: { building: 'lunar_mine', count: 1 },
  },

  // --- Mejoras de clic ---
  {
    id: 'click_tier_1',
    name: 'Guantes Aislantes',
    description: 'Clicar el reactor genera el doble de energía.',
    cost: 50,
    costResource: 'energy',
    effect: { type: 'click_multiplier', multiplier: 2 },
    requires: { totalClicks: 10 },
  },
  {
    id: 'click_tier_2',
    name: 'Baterías de Mano',
    description: 'Clicar el reactor genera el doble de energía.',
    cost: 500,
    costResource: 'energy',
    effect: { type: 'click_multiplier', multiplier: 2 },
    requires: { totalClicks: 100 },
  },
];

/**
 * Mapa de mejoras por ID.
 * @type {Map<string, object>}
 */
export const UPGRADES_BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));
