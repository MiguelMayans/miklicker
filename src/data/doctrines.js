/**
 * Doctrinas de Prestigio.
 * Elecciones permanentes que moldean el estilo de progresión de la colonia.
 * Solo se puede poseer una doctrina a la vez; cambiarla requiere un nuevo reset cósmico.
 */

export const DOCTRINES = [
  {
    id: 'engineer',
    name: 'Doctrina del Ingeniero',
    description: 'Optimización de subsistemas. +20% de producción pasiva total.',
    icon: '🔧',
    effects: { productionMultiplier: 1.2, clickMultiplier: 1, globalMultiplier: 1 },
  },
  {
    id: 'gauntlet',
    name: 'Doctrina del Guantelete',
    description: 'Interfaz cimética mejorada. +30% de poder de clic manual.',
    icon: '✊',
    effects: { productionMultiplier: 1, clickMultiplier: 1.3, globalMultiplier: 1 },
  },
  {
    id: 'equilibrium',
    name: 'Doctrina del Equilibrio',
    description: 'Balance perfecto entre máquina y operario. +10% producción y +15% clic.',
    icon: '⚖️',
    effects: { productionMultiplier: 1.1, clickMultiplier: 1.15, globalMultiplier: 1 },
  },
  {
    id: 'void',
    name: 'Doctrina del Vacío',
    description: 'La colonia extrae potencia de lo inexistente. +15% multiplicador global.',
    icon: '🌌',
    effects: { productionMultiplier: 1, clickMultiplier: 1, globalMultiplier: 1.15 },
  },
];

export const DOCTRINES_BY_ID = new Map(DOCTRINES.map((d) => [d.id, d]));

/**
 * Devuelve los efectos base (neutros) cuando no hay doctrina activa.
 */
export function getNeutralDoctrineEffects() {
  return { productionMultiplier: 1, clickMultiplier: 1, globalMultiplier: 1 };
}
