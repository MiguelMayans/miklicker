/**
 * Definición de milestones/logros del juego.
 * Cada milestone tiene una condición, recompensa, y mensaje.
 */

export const MILESTONES = [
  {
    id: 'first_click',
    name: 'Primera Chispa',
    description: 'Has generado tu primera unidad de energía.',
    condition: { type: 'totalClicks', value: 1 },
    reward: { type: 'energy', amount: 0 },
  },
  {
    id: 'ten_clicks',
    name: 'Dedos Resistentes',
    description: '10 clics en el reactor.',
    condition: { type: 'totalClicks', value: 10 },
    reward: { type: 'energy', amount: 5 },
  },
  {
    id: 'hundred_clicks',
    name: 'Pulsar es Vivir',
    description: '100 clics en el reactor.',
    condition: { type: 'totalClicks', value: 100 },
    reward: { type: 'energy', amount: 50 },
  },
  {
    id: 'first_building',
    name: 'Expansión Inicial',
    description: 'Tu primera infraestructura automatizada.',
    condition: { type: 'totalBuildings', value: 1 },
    reward: { type: 'energy', amount: 10 },
  },
  {
    id: 'ten_buildings',
    name: 'Colonia en Crecimiento',
    description: '10 edificios operativos.',
    condition: { type: 'totalBuildings', value: 10 },
    reward: { type: 'energy', amount: 100 },
  },
  {
    id: 'energy_100',
    name: 'Centenar de Energía',
    description: 'Has acumulado 100 de energía en total.',
    condition: { type: 'totalEnergyEarned', value: 100 },
    reward: { type: 'energy', amount: 20 },
  },
  {
    id: 'energy_1k',
    name: 'Kilovatio Espacial',
    description: '1,000 de energía acumulada.',
    condition: { type: 'totalEnergyEarned', value: 1000 },
    reward: { type: 'energy', amount: 100 },
  },
  {
    id: 'energy_10k',
    name: 'Megavatio Cósmico',
    description: '10,000 de energía acumulada.',
    condition: { type: 'totalEnergyEarned', value: 10000 },
    reward: { type: 'energy', amount: 500 },
  },
];

/**
 * Mapa de milestones por ID.
 * @type {Map<string, object>}
 */
export const MILESTONES_BY_ID = new Map(MILESTONES.map((m) => [m.id, m]));
