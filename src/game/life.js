/**
 * Vida de la colonia: colonos, calendario y diario.
 *
 * - Cada módulo da trabajo y hogar (más cuanto más avanzado es). La población
 *   crece poco a poco hacia esa capacidad y aumenta la producción.
 * - Un día de la colonia dura 2 minutos reales; cada 28 días termina un ciclo.
 * - El diario guarda lo que pasa: llegadas, nacimientos, inauguraciones, fiestas…
 *   También se escribe mientras no juegas, para que al volver haya novedades.
 */

import { G } from '../core/state.js';
import { emit } from '../core/bus.js';
import { fmt } from '../core/format.js';
import { BUILDINGS, BUILDINGS_BY_ID } from '../data/buildings.js';

export const DAY_MS = 120000;
export const DAYS_PER_CYCLE = 28;
const JOURNAL_MAX = 160;
const GROWTH = 0.012; // fracción del hueco que se cubre por segundo

// ─── Calendario ───
export function colonyDay(now = Date.now()) {
  return Math.floor((now - G.runStart) / DAY_MS) + 1;
}
/** 0 = amanecer, 0,35 = mediodía, 0,85 = medianoche */
export function dayPhase(now = Date.now()) {
  return ((now - G.runStart) % DAY_MS) / DAY_MS;
}
/** 0 a pleno día, 1 a medianoche */
export function darkness(now = Date.now()) {
  return (1 - Math.cos(2 * Math.PI * (dayPhase(now) - 0.35))) / 2;
}
export function dateLabel(now = Date.now()) {
  const day = colonyDay(now);
  const cycle = Math.floor((day - 1) / DAYS_PER_CYCLE) + 1;
  const d = ((day - 1) % DAYS_PER_CYCLE) + 1;
  const p = dayPhase(now);
  const part = p < 0.12 ? 'al amanecer' : p < 0.3 ? 'por la mañana' : p < 0.45 ? 'a mediodía' : p < 0.65 ? 'por la tarde' : p < 0.75 ? 'al anochecer' : 'de noche';
  return { day, cycle, d, part, text: `Día ${d} del ciclo ${cycle}, ${part}` };
}

// ─── Población ───
export function housing(b) { return b.index; } // los drones no viven en la colonia
export function popTarget() {
  let t = 0;
  for (const b of BUILDINGS) t += (G.buildings[b.id] ?? 0) * housing(b);
  return t;
}
/** Bonus de producción por población. */
export function popMult(pop = G.pop) {
  return 1 + Math.sqrt(Math.max(0, pop)) / 25;
}
/** Cuántos colonos trabajan en cada módulo (proporcional a su capacidad). */
export function popOf(id) {
  const target = popTarget();
  if (target <= 0) return 0;
  const b = BUILDINGS_BY_ID.get(id);
  return G.pop * ((G.buildings[id] ?? 0) * housing(b)) / target;
}

// ─── Nombres y anécdotas ───
const FIRST = ['Aiko', 'Marta', 'Teo', 'Nadia', 'Kofi', 'Lucía', 'Iker', 'Amara', 'Bruno', 'Sven', 'Leila', 'Mateo', 'Yara', 'Hugo', 'Noor', 'Inés', 'Ravi', 'Olga', 'Dani', 'Zoe', 'Emeka', 'Valentina', 'Joan', 'Mei', 'Tomás', 'Ayla', 'Pau', 'Ingrid', 'Malik', 'Elena', 'Kenji', 'Sofía', 'Bastian', 'Itzel', 'Arnau', 'Fatima', 'Lars', 'Paloma', 'Diego', 'Uma'];
const LAST = ['Rivas', 'Okafor', 'Lindqvist', 'Moreno', 'Takahashi', 'Ferrer', 'Nkemelu', 'Vidal', 'Kowalski', 'Haddad', 'Quispe', 'Bauer', 'Ortega', 'Singh', 'Lagarde', 'Mendoza', 'Ivanova', 'Costa', 'Abara', 'Navarro', 'Petrov', 'Salas', 'Yilmaz', 'Duarte'];
const QUIRKS = [
  'con una maceta de tomates', 'con su gato', 'con tres maletas y ningún plan', 'tocando la armónica',
  'con un loro robótico', 'y ya ha preguntado por el café', 'con una receta familiar de pan de esporas',
  'con un telescopio de juguete', 'con una colección de piedras de cinco planetas', 'cantando',
  'con un perro que flota en gravedad baja', 'con un huerto de bolsillo', 'con muchas ganas',
  'con una bici plegable', 'con una guitarra sin dos cuerdas', 'y saluda a todo el mundo por su nombre',
];
const PLACE = {
  drone: 'para cuidar de los drones', crew: 'para unirse a la tripulación', hydro: 'para trabajar en las granjas',
  helium: 'para trabajar en los extractores', factory: 'para trabajar en el astillero', outpost: 'para llevar el puesto comercial',
  sanctuary: 'para servir en el santuario', xenolab: 'para trabajar en el laboratorio', freighter: 'para pilotar un carguero',
  refinery: 'para trabajar en la refinería', gate: 'para vigilar la puerta gravitatoria', chrono: 'para calibrar el cronoestabilizador',
  antimatter: 'para vigilar la antimateria', dyson: 'para mantener la esfera de Dyson', probability: 'para afinar el motor de probabilidad',
  artifact: 'para estudiar los artefactos', reality: 'para reescribir la realidad', multiverse: 'para explorar el multiverso',
};
const FIRSTS = {
  drone: 'Despega el primer dron de minería. Vuelve con gas del planeta y un poco de polvo.',
  crew: 'Llega la primera tripulante. Pregunta dónde está la máquina de café. No hay máquina de café.',
  hydro: 'Se inaugura la primera granja hidropónica. Huele a tierra mojada por primera vez.',
  helium: 'El primer extractor de helio-3 empieza a perforar. Tiembla un poco el suelo.',
  factory: 'Se abre el astillero orbital. Su primera nave se llama "Por si acaso".',
  outpost: 'Abre el puesto comercial. El primer cliente compra un llavero.',
  sanctuary: 'Se levanta el santuario estelar. Por las noches se oyen cánticos suaves.',
  xenolab: 'El laboratorio xenobiológico recibe su primer espécimen. Lo llaman Bizcocho.',
  freighter: 'Zarpa el primer carguero de salto, cargado hasta los topes.',
  refinery: 'La refinería de plasma se enciende. Desde lejos parece una puesta de sol.',
  gate: 'Se abre la primera puerta gravitatoria. Del otro lado, alguien saluda.',
  chrono: 'El cronoestabilizador arranca. Todo el mundo jura que ayer ya había arrancado.',
  antimatter: 'Primer condensador de antimateria. Han puesto un cartel de "No tocar" muy grande.',
  dyson: 'Primer segmento de la esfera de Dyson. La estrella parece llevar un sombrero.',
  probability: 'El motor de probabilidad funciona a la primera. Era improbable.',
  artifact: 'Primer resonador de artefactos. Los fragmentos tararean una melodía antigua.',
  reality: 'El motor de realidad cambia el color del cielo un rato. Nadie se queja.',
  multiverse: 'Se abre el multiverso. Hay una colonia igual a esta, pero con mejor café.',
};
const POP_MILESTONES = [
  [10, 'Ya somos 10. Se organiza la primera cena todos juntos.'],
  [50, 'Ya somos 50. Alguien abre una pequeña biblioteca en un contenedor.'],
  [100, 'Ya somos 100. Se funda la liga de fútbol de gravedad baja.'],
  [250, 'Ya somos 250. Inauguran la primera escuela de la colonia.'],
  [500, 'Ya somos 500. Hay atascos en el comedor a la hora de comer.'],
  [1000, 'Mil colonos. La colonia tiene su propio periódico: "El Anillo".'],
  [2500, 'Somos 2.500. Se abre un parque con árboles de verdad.'],
  [5000, 'Somos 5.000. La colonia ya parece una pequeña ciudad.'],
  [10000, 'Diez mil colonos. Se votan los colores de la bandera: rojo, naranja, oro y azul.'],
  [25000, 'Somos 25.000. Han llegado los primeros turistas.'],
  [50000, 'Somos 50.000. La colonia sale en los mapas de otros sistemas.'],
  [100000, 'Cien mil colonos. Ya hay barrios con nombre propio.'],
];
// Pequeñas anécdotas diarias. `need`: módulo que debe existir.
const DAILY = [
  { t: 'Lluvia de meteoritos esta noche. Media colonia sale a verla con mantas.' },
  { t: 'Se rompe la máquina de café. Tres horas de pánico generalizado.' },
  { t: 'Noche de cine al aire libre: proyectan una de piratas espaciales.' },
  { t: 'Torneo de ajedrez en el comedor. Gana un dron, para sorpresa de todos.' },
  { t: '{a} enseña a cocinar a los recién llegados. Sobran croquetas.' },
  { t: '{a} ha pintado un mural con el planeta en la pared del comedor.' },
  { t: 'Hoy el anillo del planeta se ve especialmente bonito. Muchas fotos.' },
  { t: '{a} y {b} discuten sobre si el planeta tiene cara. Lleva tres días.' },
  { t: 'Llega un carguero con fruta fresca. Toda la colonia huele a mandarinas.', need: 'freighter' },
  { t: 'La cosecha de tomates de las granjas es enorme. Gazpacho para todos.', need: 'hydro' },
  { t: 'Un espécimen se escapa del laboratorio. Lo encuentran dormido en la lavandería.', need: 'xenolab' },
  { t: '{a} y {b} se casan en el santuario. Los monjes lloran de emoción.', need: 'sanctuary' },
  { t: 'Mercadillo en el puesto comercial: alguien vende sombreros para drones.', need: 'outpost' },
  { t: 'El astillero bautiza una nave con el nombre de {a}. Está muy orgullosa la familia.', need: 'factory' },
  { t: 'Los niños de la colonia bautizan una roca. Se llama Pedro.', births: true },
  { t: 'Clase de astronomía para los peques: aprenden a encontrar el planeta en el cielo.', births: true },
  { t: 'Los drones aprenden a volar en formación. Escriben "HOLA" en el cielo.', need: 'drone' },
];

function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
export function randomName(r = Math.random) { return `${pick(FIRST, r)} ${pick(LAST, r)}`; }

function weightedBuilding() {
  const opts = BUILDINGS.filter((b) => (G.buildings[b.id] ?? 0) > 0 && housing(b) > 0);
  if (!opts.length) return null;
  let total = 0;
  for (const b of opts) total += G.buildings[b.id] * housing(b);
  let x = Math.random() * total;
  for (const b of opts) { x -= G.buildings[b.id] * housing(b); if (x <= 0) return b; }
  return opts[0];
}

// ─── Diario ───
export function addEntry(text, kind = 'life', { notify = false, day = colonyDay() } = {}) {
  const entry = { d: day, c: Math.floor((day - 1) / DAYS_PER_CYCLE) + 1, t: text, k: kind };
  G.journal.unshift(entry);
  if (G.journal.length > JOURNAL_MAX) G.journal.length = JOURNAL_MAX;
  G.journalUnread = (G.journalUnread ?? 0) + 1;
  emit('journal', { entry, notify });
}

let lastNamedArrival = 0;
function arrival(count) {
  for (let i = 0; i < count; i++) {
    const n = Math.floor(G.pop) - count + i + 1;
    const named = n <= 12 || (Math.random() < 0.02 && Date.now() - lastNamedArrival > 20000);
    if (!named) continue;
    const b = weightedBuilding();
    if (!b) return;
    lastNamedArrival = Date.now();
    addEntry(`Llega ${randomName()} ${PLACE[b.id]}, ${pick(QUIRKS)}.`, 'arrival');
  }
}

function dailyEvents(day, quiet) {
  const r = rnd(day * 7919 + G.prestige.ascensions * 104729 + Math.floor(G.runStart / 1000));
  const inCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;
  const cycle = Math.floor((day - 1) / DAYS_PER_CYCLE) + 1;
  if (inCycle === 1 && day > 1 && G.pop >= 5) {
    addEntry(`Fiesta de fin del ciclo ${cycle - 1}: ${fmt(Math.floor(G.pop))} colonos bailan bajo el anillo del planeta.`, 'festival', { notify: !quiet, day });
  }
  if (G.pop >= 20 && r() < 0.22) {
    const name = pick(FIRST, r);
    if (!G.births) {
      addEntry(`Nace ${name}, el primer bebé nacido en la colonia. Todo el mundo pasa a saludar.`, 'birth', { notify: !quiet, day });
    } else {
      addEntry(`Nace ${name}. ${randomName(r)} reparte pastel de algas para celebrarlo.`, 'birth', { day });
    }
    G.births = (G.births ?? 0) + 1;
    G.pop += 1;
  }
  if (G.pop >= 3 && r() < 0.4) {
    const pool = DAILY.filter((e) => (!e.need || (G.buildings[e.need] ?? 0) > 0) && (!e.births || G.births > 0));
    const e = pick(pool, r);
    addEntry(e.t.replace('{a}', randomName(r)).replace('{b}', randomName(r)), 'life', { day });
  }
}

// ─── Bucle ───
let lastFloor = -1;
/**
 * Avanza la vida de la colonia. Devuelve true si la población entera cambió
 * (para que el motor recalcule la producción).
 */
export function updateLife(dt, { quiet = false } = {}) {
  const target = popTarget();
  const before = G.pop;
  const gap = target - G.pop;
  if (Math.abs(gap) > 1e-6) {
    // Se acerca de forma exponencial, con un mínimo para que siempre llegue alguien.
    let next = target - gap * Math.exp(-GROWTH * dt);
    const minStep = 0.08 * dt;
    if (gap > 0) next = Math.min(target, Math.max(next, before + minStep));
    else next = Math.max(target, Math.min(next, before - minStep));
    G.pop = next;
  }
  const f = Math.floor(G.pop);
  if (lastFloor < 0) lastFloor = Math.floor(before);
  let changed = f !== lastFloor;
  if (f > lastFloor) {
    if (!quiet) arrival(Math.min(f - lastFloor, 30));
    for (const [n, text] of POP_MILESTONES) {
      if (lastFloor < n && f >= n && !G.journal.some((e) => e.t === text)) addEntry(text, 'milestone', { notify: !quiet });
    }
  }
  lastFloor = f;
  if (G.pop > G.stats.bestPop) G.stats.bestPop = G.pop;

  const day = colonyDay();
  if (!G.lastDay) G.lastDay = day;
  if (day > G.lastDay) {
    const from = Math.max(G.lastDay + 1, day - 40);
    for (let d = from; d <= day; d++) dailyEvents(d, quiet);
    G.lastDay = day;
    changed = true;
  }
  return changed;
}

/** Primera unidad de un módulo: entrada especial en el diario. */
export function onBuildingBought(id) {
  if ((G.buildings[id] ?? 0) > 0 && !G.firsts.includes(id)) {
    G.firsts.push(id);
    addEntry(FIRSTS[id], 'first', { notify: true });
  }
}

export function onNewColony() {
  lastFloor = 0;
  G.lastDay = 1;
  addEntry('Comienza una nueva colonia. Los primeros drones despegan al amanecer.', 'milestone', { notify: false });
}
