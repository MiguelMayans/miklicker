/**
 * Definición de mejoras (upgrades).
 * Cada mejora puede afectar a un edificio específico, al clic global, o al cursor.
 */

export const UPGRADES = [
  // --- CURSOR ---
  { id: 'cursor_tier_1', name: 'Actuadores Hidráulicos', description: 'Los actuadores aceleran su ciclo de extracción al doble.', cost: 100, costResource: 'energy', effect: { type: 'cursor_interval', multiplier: 0.5 }, requires: { building: 'cursor', count: 1 } },
  { id: 'cursor_tier_2', name: 'Servomotores de Precisión', description: 'Motores de alta velocidad duplican la cadencia de extracción.', cost: 500, costResource: 'energy', effect: { type: 'cursor_interval', multiplier: 0.5 }, requires: { building: 'cursor', count: 10 } },
  { id: 'cursor_power_1', name: 'Conductores Superconductores', description: 'Circuitos superconductores duplican la potencia por extracción.', cost: 300, costResource: 'energy', effect: { type: 'cursor_multiplier', multiplier: 2.15 }, requires: { building: 'cursor', count: 5 } },
  { id: 'cursor_power_2', name: 'Nanocircuitos Cuánticos', description: 'Arquitectura cuántica duplica la eficiencia energética.', cost: 3000, costResource: 'energy', effect: { type: 'cursor_multiplier', multiplier: 2.35 }, requires: { building: 'cursor', count: 25 } },

  // --- SOLAR PANEL ---
  { id: 'solar_tier_1', name: 'Celdas Fotovoltaicas Avanzadas', description: 'Silicio multicristalino de tercera generación. Eficiencia fotovoltaica duplicada.', cost: 200, costResource: 'energy', effect: { type: 'building_multiplier', target: 'solar_panel', multiplier: 2.1 }, requires: { building: 'solar_panel', count: 1 } },
  { id: 'solar_tier_2', name: 'Concentradores Estelares', description: 'Lentes de Fresnel orbitales. Captación de radiación duplicada.', cost: 1000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'solar_panel', multiplier: 2.25 }, requires: { building: 'solar_panel', count: 10 } },
  { id: 'solar_tier_3', name: 'Espejos Orbitales', description: 'Red de espejos desplegables. Rendimiento fotovoltaico triplicado.', cost: 5000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'solar_panel', multiplier: 3.2 }, requires: { building: 'solar_panel', count: 50 } },

  // --- LUNAR MINE ---
  { id: 'mine_tier_1', name: 'Taladros de Plasma', description: 'Broca de plasma ionizado. Velocidad de perforación duplicada.', cost: 1200, costResource: 'energy', effect: { type: 'building_multiplier', target: 'lunar_mine', multiplier: 2.05 }, requires: { building: 'lunar_mine', count: 1 } },
  { id: 'mine_tier_2', name: 'Excavadoras Automatizadas', description: 'Flota de vehículos autónomos. Producción minera duplicada.', cost: 6000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'lunar_mine', multiplier: 2.2 }, requires: { building: 'lunar_mine', count: 10 } },
  { id: 'mine_tier_3', name: 'Núcleo Lunar Fragmentado', description: 'Acceso al manto lunar. Rendimiento de extracción triplicado.', cost: 30000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'lunar_mine', multiplier: 3.15 }, requires: { building: 'lunar_mine', count: 50 } },

  // --- HYDRO FARM ---
  { id: 'hydro_tier_1', name: 'Nutrientes Genéticos', description: 'Secuenciación CRISPR de cianobacterias. Producción biológica duplicada.', cost: 6000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'hydro_farm', multiplier: 2.1 }, requires: { building: 'hydro_farm', count: 1 } },
  { id: 'hydro_tier_2', name: 'Bioluminiscencia Potenciada', description: 'Ingeniería de proteínas luciferasa. Output luminoso duplicado.', cost: 30000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'hydro_farm', multiplier: 2.3 }, requires: { building: 'hydro_farm', count: 10 } },

  // --- DRONE FACTORY ---
  { id: 'drone_tier_1', name: 'Enjambre Inteligente', description: 'Algoritmos de optimización de ruta. Eficiencia de flota duplicada.', cost: 30000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'drone_factory', multiplier: 2.15 }, requires: { building: 'drone_factory', count: 1 } },
  { id: 'drone_tier_2', name: 'Red Neuronal Colectiva', description: 'Interconexión neuronal entre drones. Salida de fábrica duplicada.', cost: 150000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'drone_factory', multiplier: 2.25 }, requires: { building: 'drone_factory', count: 10 } },

  // --- FUSION REACTOR ---
  { id: 'fusion_tier_1', name: 'Plasma Estelar Refinado', description: 'Purificación de isótopos de helio-3. Reactividad del plasma duplicada.', cost: 150000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'fusion_reactor', multiplier: 2.05 }, requires: { building: 'fusion_reactor', count: 1 } },
  { id: 'fusion_tier_2', name: 'Confinamiento Cuántico', description: 'Campos magnéticos de contención cuántica. Salida del tokamak duplicada.', cost: 750000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'fusion_reactor', multiplier: 2.2 }, requires: { building: 'fusion_reactor', count: 10 } },

  // --- CLICK ---
  { id: 'click_tier_1', name: 'Guantes Dieléctricos', description: 'Protección mejorada. Extracción manual duplica su potencia.', cost: 50, costResource: 'energy', effect: { type: 'click_multiplier', multiplier: 2.1 }, requires: { totalClicks: 10 } },
  { id: 'click_tier_2', name: 'Acumuladores de Mano', description: 'Almacenamiento portátil. Extracción manual duplica su potencia.', cost: 500, costResource: 'energy', effect: { type: 'click_multiplier', multiplier: 2.25 }, requires: { totalClicks: 100 } },
  { id: 'click_tier_3', name: 'Guanteletes de Plasma', description: 'Inductores de plasma. Extracción manual triplica su potencia.', cost: 5000, costResource: 'energy', effect: { type: 'click_multiplier', multiplier: 3.15 }, requires: { totalClicks: 1000 } },
  { id: 'click_tier_4', name: 'Interfaz Neural Directa', description: 'Control cerebral directo. Extracción manual triplica su potencia.', cost: 50000, costResource: 'energy', effect: { type: 'click_multiplier', multiplier: 3.4 }, requires: { totalClicks: 10000 } },

  // --- GLOBAL / SYNERGY ---
  { id: 'global_tier_1', name: 'Red de Distribución Planetaria', description: 'Optimización de la red eléctrica. Salida total de módulos +20%.', cost: 5000, costResource: 'energy', effect: { type: 'global_multiplier', multiplier: 1.22 }, requires: { building: 'solar_panel', count: 50 } },
  { id: 'global_tier_2', name: 'Matriz Energética Interestelar', description: 'Interconexión de subsistemas. Salida total de módulos +50%.', cost: 500000, costResource: 'energy', effect: { type: 'global_multiplier', multiplier: 1.55 }, requires: { building: 'fusion_reactor', count: 10 } },
  { id: 'global_tier_3', name: 'Red Cósmica Infinita', description: 'Sincronización perfecta de todos los subsistemas. Salida total ×2.', cost: 50000000, costResource: 'energy', effect: { type: 'global_multiplier', multiplier: 2.08 }, requires: { building: 'singularity', count: 1 } },

  // --- SYNERGY: Solar boosts Mine ---
  { id: 'synergy_solar_mine', name: 'Reflejo Solar Lunar', description: 'Cada matriz solar aporta +1.15% de eficiencia a las perforadoras lunares.', cost: 2500, costResource: 'energy', effect: { type: 'synergy', source: 'solar_panel', target: 'lunar_mine', bonusPerSource: 0.0115 }, requires: { building: 'solar_panel', count: 25 } },

  // --- SYNERGY: Mine boosts Hydro ---
  { id: 'synergy_mine_hydro', name: 'Reciclaje de Minerales', description: 'Cada perforadora lunar aporta +1.2% de nutrientes a los biodomos.', cost: 12000, costResource: 'energy', effect: { type: 'synergy', source: 'lunar_mine', target: 'hydro_farm', bonusPerSource: 0.012 }, requires: { building: 'lunar_mine', count: 25 } },
];

export const UPGRADES_BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));
