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

  // --- DARK MATTER HARVESTER ---
  { id: 'dark_matter_tier_1', name: 'Filtros de Radiación Exótica', description: 'Membranas de captura selectiva. Rendimiento del cosechador duplicado.', cost: 750000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'dark_matter_harvester', multiplier: 2.05 }, requires: { building: 'dark_matter_harvester', count: 1 } },
  { id: 'dark_matter_tier_2', name: 'Núcleo de Materia Exótica', description: 'Condensador de partículas WIMP. Captación de materia oscura duplicada.', cost: 3750000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'dark_matter_harvester', multiplier: 2.2 }, requires: { building: 'dark_matter_harvester', count: 10 } },

  // --- NEBULA COMPRESSOR ---
  { id: 'nebula_tier_1', name: 'Lentes Gravitacionales', description: 'Enfoque gravitatorio de nubes de hidrógeno. Compresión duplicada.', cost: 3750000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'nebula_compressor', multiplier: 2.15 }, requires: { building: 'nebula_compressor', count: 1 } },
  { id: 'nebula_tier_2', name: 'Reactor de Condensación Estelar', description: 'Ciclo termodinámico cerrado. Output del compresor nebuloso duplicado.', cost: 18750000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'nebula_compressor', multiplier: 2.3 }, requires: { building: 'nebula_compressor', count: 10 } },

  // --- QUANTUM DIMENSION ---
  { id: 'quantum_tier_1', name: 'Estabilizador de Entrelazamiento', description: 'Mantenimiento coherente del entrelazamiento. Canal interdimensional duplicado.', cost: 20000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'quantum_dimension', multiplier: 2.05 }, requires: { building: 'quantum_dimension', count: 1 } },
  { id: 'quantum_tier_2', name: 'Puente de Einstein-Rosen', description: 'Agujeros de gusano microscópicos estabilizados. Flujo entrópico duplicado.', cost: 100000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'quantum_dimension', multiplier: 2.25 }, requires: { building: 'quantum_dimension', count: 10 } },

  // --- SINGULARITY ---
  { id: 'singularity_tier_1', name: 'Anillo de Masa Negativa', description: 'Materia con masa negativa rodea la singularidad. Potencia extrema duplicada.', cost: 125000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'singularity', multiplier: 2.15 }, requires: { building: 'singularity', count: 1 } },
  { id: 'singularity_tier_2', name: 'Horizonte de Sucesos Modulado', description: 'Modulación activa del horizonte. Rendimiento singular triplicado.', cost: 625000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'singularity', multiplier: 3.15 }, requires: { building: 'singularity', count: 10 } },

  // --- DYSON SPHERE ---
  { id: 'dyson_tier_1', name: 'Revestimiento Metamaterial', description: 'Capa absorbente de espectro completo. Captación estelar duplicada.', cost: 750000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'dyson_sphere', multiplier: 2.05 }, requires: { building: 'dyson_sphere', count: 1 } },
  { id: 'dyson_tier_2', name: 'Células de Conversión Total', description: 'Conversión directa masa-energía. Salida de la esfera duplicada.', cost: 3750000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'dyson_sphere', multiplier: 2.25 }, requires: { building: 'dyson_sphere', count: 10 } },

  // --- ANTIMATTER ---
  { id: 'antimatter_tier_1', name: 'Campos Magnéticos Reforzados', description: 'Contención magnética de octupolo. Almacenamiento de antipartículas duplicado.', cost: 4500000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'antimatter', multiplier: 2.15 }, requires: { building: 'antimatter', count: 1 } },
  { id: 'antimatter_tier_2', name: 'Aniquilación Direccional', description: 'Inyección controlada de positrones. Output por aniquilación duplicado.', cost: 22500000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'antimatter', multiplier: 2.3 }, requires: { building: 'antimatter', count: 10 } },

  // --- WORMHOLE ---
  { id: 'wormhole_tier_1', name: 'Estabilizador Topológico', description: 'Sutura espaciotemporal estable. Apertura de portales duplicada.', cost: 30000000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'wormhole', multiplier: 2.05 }, requires: { building: 'wormhole', count: 1 } },
  { id: 'wormhole_tier_2', name: 'Red de Agujeros Entrelazados', description: 'Constelación de portales sincronizados. Flujo energético duplicado.', cost: 150000000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'wormhole', multiplier: 2.2 }, requires: { building: 'wormhole', count: 10 } },

  // --- TIME CRYSTAL ---
  { id: 'time_crystal_tier_1', name: 'Resonancia Temporal Sincrónica', description: 'Alineación de fases retrocausales. Generación cristalina duplicada.', cost: 200000000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'time_crystal', multiplier: 2.15 }, requires: { building: 'time_crystal', count: 1 } },
  { id: 'time_crystal_tier_2', name: 'Núcleo de Paradoja Estabilizada', description: 'Bucle causal autosostenible. Rendimiento temporal triplicado.', cost: 1000000000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'time_crystal', multiplier: 3.2 }, requires: { building: 'time_crystal', count: 10 } },

  // --- UNIVERSAL COMPUTER ---
  { id: 'universal_tier_1', name: 'Subrutinas de Optimización Galáctica', description: 'Algoritmos de asignación óptima. Cálculo galáctico duplicado.', cost: 1250000000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'universal_computer', multiplier: 2.05 }, requires: { building: 'universal_computer', count: 1 } },
  { id: 'universal_tier_2', name: 'Matriz Computacional Hipercubica', description: 'Procesamiento en 11 dimensiones. Output computacional triplicado.', cost: 6250000000000, costResource: 'energy', effect: { type: 'building_multiplier', target: 'universal_computer', multiplier: 3.15 }, requires: { building: 'universal_computer', count: 10 } },

  // --- CRIT SYSTEM (desbloqueado con clics) ---
  { id: 'crit_unlock', name: 'Puntos de Resonancia Crítica', description: 'Desbloquea golpes críticos: 5% de probabilidad de ×5 en extracción manual.', cost: 800, costResource: 'energy', effect: { type: 'crit_chance', value: 0.05 }, requires: { totalClicks: 250 } },
  { id: 'crit_chance_2', name: 'Calibrado de Frecuencia Estelar', description: 'Probabilidad de crítico +10% (total 15%).', cost: 25000, costResource: 'energy', effect: { type: 'crit_chance', value: 0.10 }, requires: { totalClicks: 2500 } },
  { id: 'crit_chance_3', name: 'Sobrecarga Armónica', description: 'Probabilidad de crítico +15% (total 30%).', cost: 1500000, costResource: 'energy', effect: { type: 'crit_chance', value: 0.15 }, requires: { totalClicks: 15000 } },
  { id: 'crit_amplifier_1', name: 'Convergencia de Plasma Puro', description: 'Multiplicador de crítico ×2 (de ×5 a ×10).', cost: 12000, costResource: 'energy', effect: { type: 'crit_multiplier', multiplier: 2 }, requires: { totalClicks: 1000 } },
  { id: 'crit_amplifier_2', name: 'Detonación Singular', description: 'Multiplicador de crítico ×2 (×10 → ×20).', cost: 850000, costResource: 'energy', effect: { type: 'crit_multiplier', multiplier: 2 }, requires: { totalClicks: 10000 } },

  // --- COMBO SYSTEM ---
  { id: 'combo_cap_1', name: 'Sinergia Cinética', description: 'Aumenta el tope de combo a 100 y sube cada paso a +7% (era +5%).', cost: 5000, costResource: 'energy', effect: { type: 'combo_cap', value: 100, step: 0.07 }, requires: { totalClicks: 500 } },
  { id: 'combo_cap_2', name: 'Ritmo de Batalla Estelar', description: 'Combo tope 200, cada paso +10%.', cost: 400000, costResource: 'energy', effect: { type: 'combo_cap', value: 200, step: 0.10 }, requires: { totalClicks: 8000 } },

  // --- ABILITY UNLOCKS ---
  { id: 'ability_energize', name: 'Protocolo ENERGIZE', description: 'Desbloquea ENERGIZE: los próximos 10 clics tras activarlo valen ×10 y reducen la temperatura del núcleo.', cost: 50000, costResource: 'energy', effect: { type: 'ability_unlock', ability: 'energize' }, requires: { totalClicks: 1000 } },
  { id: 'ability_purge', name: 'Protocolo PURGE', description: 'Desbloquea PURGE: ventila el reactor y resetea la temperatura al instante (costa: 10% de energía).', cost: 120000, costResource: 'energy', effect: { type: 'ability_unlock', ability: 'purge' }, requires: { totalClicks: 5000 } },
  { id: 'ability_overload', name: 'Protocolo OVERLOAD', description: 'Desbloquea OVERLOAD: ×3 producción durante 15s, pero la temperatura sube 3× más rápido. Riesgo extremo.', cost: 2000000, costResource: 'energy', effect: { type: 'ability_unlock', ability: 'overload' }, requires: { totalClicks: 25000 } },

  // --- TRADE-OFF SYNERGIES (sinergias con riesgo) ---
  { id: 'tradeoff_overclock', name: 'Sobrecalentamiento Controlado', description: 'Forzar el rendimiento de los subsistemas: +50% producción total, pero la temperatura sube un 30% más rápido.', cost: 250000, costResource: 'energy', effect: { type: 'tradeoff', productionMultiplier: 1.5, heatMultiplier: 1.3 }, requires: { building: 'fusion_reactor', count: 5 } },
  { id: 'tradeoff_brutal_clicks', name: 'Extracción Brutal', description: 'Prioriza la extracción manual: +100% poder de clic, pero la producción pasiva baja un 15%.', cost: 500000, costResource: 'energy', effect: { type: 'tradeoff', clickMultiplier: 2.0, productionMultiplier: 0.85 }, requires: { totalClicks: 10000 } },
  { id: 'tradeoff_forced_cooling', name: 'Refrigeración Forzada', description: 'Sistemas de enfriamiento agresivos: la temperatura sube un 40% más lento, pero la producción baja un 10%.', cost: 750000, costResource: 'energy', effect: { type: 'tradeoff', productionMultiplier: 0.9, heatMultiplier: 0.6 }, requires: { building: 'fusion_reactor', count: 10 } },

  // --- COSMIC TECH TREE (coste en Datos Cósmicos) ---
  { id: 'cosmic_click_1', name: 'Guantelete de Neutrinos', description: 'Aceleradores de partículas elementales aumentan la extracción manual un 50%.', cost: 10, costResource: 'cosmicData', effect: { type: 'click_multiplier', multiplier: 1.5 }, requires: { totalClicks: 5000 } },
  { id: 'cosmic_global_1', name: 'Red de Distribución Cósmica', description: 'Interconexión interestelar perfecta. +25% de producción total.', cost: 25, costResource: 'cosmicData', effect: { type: 'global_multiplier', multiplier: 1.25 }, requires: { building: 'dyson_sphere', count: 1 } },
  { id: 'cosmic_crit_1', name: 'Resonancia Estelar Crítica', description: 'Sintoniza el núcleo con frecuencias estelares. +10% probabilidad de crítico.', cost: 50, costResource: 'cosmicData', effect: { type: 'crit_chance', value: 0.10 }, requires: { totalClicks: 25000 } },
  { id: 'cosmic_prestige_1', name: 'Eficiencia de Datos Cósmicos', description: 'Cada Dato Cósmico otorga +7% de multiplicador en lugar de +5%.', cost: 100, costResource: 'cosmicData', effect: { type: 'prestige_efficiency', multiplier: 1.4 }, requires: { building: 'singularity', count: 1 } },
];

export const UPGRADES_BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));
