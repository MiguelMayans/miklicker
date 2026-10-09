/**
 * Poderes Starborn: mejoras permanentes que se compran con fragmentos
 * al entrar en la Unidad. Se dibujan como una constelación; x/y en un lienzo 0–100.
 */

export const POWERS = [
  { id: 'awaken', name: 'Despertar', cost: 1, x: 50, y: 50, req: [],
    desc: 'Producción +10%.', effect: { prod: 0.1 } },

  { id: 'antigrav', name: 'Campo antigravedad', cost: 3, x: 32, y: 34, req: ['awaken'],
    desc: 'Las anomalías aparecen un 10% más a menudo.', effect: { anomFreq: 0.9 } },
  { id: 'moonform', name: 'Forma lunar', cost: 15, x: 18, y: 20, req: ['antigrav'],
    desc: 'Los efectos de las anomalías duran un 15% más.', effect: { anomDur: 1.15 } },
  { id: 'voideye', name: 'Ojo del vacío', cost: 60, x: 8, y: 40, req: ['moonform'],
    desc: 'Las anomalías permanecen un 50% más en pantalla.', effect: { anomLife: 1.5 } },

  { id: 'starstuff', name: 'Sentir la materia', cost: 3, x: 68, y: 32, req: ['awaken'],
    desc: 'Los módulos cuestan un 5% menos.', effect: { bCost: 0.95 } },
  { id: 'guild', name: 'Contactos del gremio', cost: 15, x: 84, y: 20, req: ['starstuff'],
    desc: 'Las mejoras cuestan un 10% menos.', effect: { uCost: 0.9 } },
  { id: 'bond', name: 'Vínculo de tripulación', cost: 30, x: 92, y: 42, req: ['guild'],
    desc: 'La moral es un 15% más eficaz.', effect: { morale: 1.15 } },

  { id: 'kit', name: 'Equipo de inicio', cost: 3, x: 34, y: 68, req: ['awaken'],
    desc: 'Empiezas cada partida con 10 drones.', effect: { startDrones: 10 } },
  { id: 'veterans', name: 'Tripulación veterana', cost: 20, x: 20, y: 82, req: ['kit'],
    desc: 'Empiezas cada partida con 10 tripulantes.', effect: { startCrew: 10 } },

  { id: 'echoes', name: 'Ecos en la Unidad', cost: 5, x: 66, y: 68, req: ['awaken'],
    desc: 'La producción sin conexión sube del 10% al 50%.', effect: { offline: 0.5 } },
  { id: 'timeloop', name: 'Bucle temporal', cost: 50, x: 80, y: 82, req: ['echoes'],
    desc: 'La producción sin conexión llega al 100% y se acumula hasta 24 h.', effect: { offline: 1, offlineCap: 24 } },

  { id: 'fist', name: 'Puño Starborn', cost: 5, x: 50, y: 78, req: ['awaken'],
    desc: 'El clic manual produce el doble.', effect: { click: 2 } },
  { id: 'creator', name: 'Mano del creador', cost: 150, x: 50, y: 94, req: ['fist', 'veterans'],
    desc: 'Cada clic suma un 2% extra de tu producción por segundo.', effect: { clickPct: 0.02 } },

  { id: 'supernova', name: 'Supernova', cost: 100, x: 50, y: 22, req: ['antigrav', 'starstuff'],
    desc: 'Producción +25%.', effect: { prod: 0.25 } },
  { id: 'constellation', name: 'Constelación completa', cost: 400, x: 50, y: 6, req: ['supernova', 'moonform', 'guild'],
    desc: 'Producción +50%.', effect: { prod: 0.5 } },
  { id: 'unity', name: 'La Unidad', cost: 1500, x: 8, y: 6, req: ['constellation', 'voideye'],
    desc: 'Producción ×2. Todo es uno.', effect: { prodMult: 2 } },
];

export const POWERS_BY_ID = new Map(POWERS.map((p) => [p.id, p]));
