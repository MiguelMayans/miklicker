/**
 * Definición de todos los edificios del juego.
 * Añadir un nuevo edificio es solo añadir una entrada a este array.
 */

export const BUILDINGS = [
  {
    id: 'solar_panel',
    name: 'Panel Solar',
    description: 'Captura luz estelar y la convierte en energía.',
    baseCost: 15,
    baseProduction: 1,
    sprite: 'solar_panel.png',
    unlockAt: 0,
    tierColor: '#facc15',
    tierGlow: 'rgba(250, 204, 21, 0.3)',
  },
  {
    id: 'lunar_mine',
    name: 'Mina Lunar',
    description: 'Extrae minerales energéticos del núcleo lunar.',
    baseCost: 100,
    baseProduction: 5,
    sprite: 'lunar_mine.png',
    unlockAt: 50,
    tierColor: '#f87171',
    tierGlow: 'rgba(248, 113, 113, 0.3)',
  },
  {
    id: 'hydro_farm',
    name: 'Granja Hidropónica',
    description: 'Cultiva bioluminiscencia para generar electricidad orgánica.',
    baseCost: 500,
    baseProduction: 25,
    sprite: 'hydro_farm.png',
    unlockAt: 250,
    tierColor: '#34d399',
    tierGlow: 'rgba(52, 211, 153, 0.3)',
  },
  {
    id: 'drone_factory',
    name: 'Fábrica de Drones',
    description: 'Drones automatizados que recolectan energía a gran escala.',
    baseCost: 3000,
    baseProduction: 100,
    sprite: 'drone_factory.png',
    unlockAt: 1500,
    tierColor: '#a78bfa',
    tierGlow: 'rgba(167, 139, 250, 0.3)',
  },
];

/**
 * Mapa de edificios por ID para acceso O(1).
 * @type {Map<string, object>}
 */
export const BUILDINGS_BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]));
