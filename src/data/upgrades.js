/**
 * Mejoras.
 *
 * Cada módulo tiene una línea de investigación de 10 mejoras con efectos
 * distintos: duplicadores, cadenas de suministro con el módulo anterior,
 * economía de escala, vínculos con un módulo socio, bonus por investigación…
 * Algunas exigen haber investigado antes otras (también de otros módulos).
 *
 * Cada mejora: { id, name, sub, desc, cost, icon, tier, kind, requires, unlock(G), effects[] }
 * `unlock` decide cuándo aparece en el almacén (no si se puede pagar).
 */

import { BUILDINGS, BUILDINGS_BY_ID } from './buildings.js';

const owned = (G, id) => G.buildings[id] ?? 0;
const num = (x) => String(Math.round(x * 1000) / 1000).replace('.', ',');
const pc = (x) => `${num(x * 100)}%`;
const bname = (id) => BUILDINGS_BY_ID.get(id);

/** Texto legible de un efecto, para el tooltip. */
export function describeEffect(e) {
  const b = e.b ? bname(e.b) : null;
  switch (e.type) {
    case 'bmult': return `Los ${b.plural} producen ×${num(e.mult)}.`;
    case 'self': return `Los ${b.plural} producen +${pc(e.pct)} por cada ${b.name.toLowerCase()} que tengas.`;
    case 'link': {
      const src = bname(e.src);
      return `Los ${b.plural} producen +${pc(e.pct)} por cada ${e.per > 1 ? `${e.per} ${src.plural}` : src.name.toLowerCase()}.`;
    }
    case 'research': return `Los ${b.plural} producen +${pc(e.pct)} por cada mejora comprada.`;
    case 'morale': return `Los ${b.plural} producen +${pc(e.pct)} por cada logro conseguido.`;
    case 'bank': return `Los ${b.plural} producen +${pc(e.pct)} por cada cifra de los créditos que tengas ahorrados.`;
    case 'runTime': return `${b ? `Los ${b.plural} producen` : 'Producción'} +${pc(e.pct)} por cada minuto de esta partida (máximo +${pc(e.max)}).`;
    case 'anomBonus': return `Los ${b.plural} producen +${pc(e.pct)} por cada anomalía capturada (en total).`;
    case 'cost': return `Los ${b.plural} cuestan un ${pc(1 - e.mult)} menos.`;
    case 'droneClick': return 'Los drones y el clic manual producen el doble.';
    case 'swarm': return `El clic y cada dron ganan +${num(e.add)} por cada módulo que no sea un dron.`;
    case 'swarmMult': return `El bonus de enjambre se multiplica ×${num(e.mult)}.`;
    case 'clickPct': return `Cada clic suma un ${pc(e.pct)} de tu producción por segundo.`;
    case 'clickMult': return `El clic manual produce ×${num(e.mult)}.`;
    case 'clickAdd': return `El clic gana +${num(e.add)} por cada ${bname(e.src).name.toLowerCase()}.`;
    case 'global': return `Producción total +${pc(e.pct)}.`;
    case 'perTotal': return `Producción total +${pc(e.pct)} por cada ${e.per} módulos que tengas.`;
    case 'perType': return `Producción total +${pc(e.pct)} por cada tipo de módulo con al menos ${e.min} unidades.`;
    case 'perUpgrade': return `Producción total +${pc(e.pct)} por cada mejora comprada.`;
    case 'perAnomaly': return `Producción total +${pc(e.pct)} por cada anomalía capturada (máximo +${pc(e.max)}).`;
    case 'officer': return `La moral de la tripulación aumenta la producción (×${num(e.factor)} de la moral).`;
    case 'specialist': return `Los tripulantes producen el doble. Los ${b.plural} ganan +1% por cada ${e.per === 1 ? 'tripulante' : `${e.per} tripulantes`}.`;
    case 'anomaly': {
      const parts = [];
      if (e.freq) parts.push(`las anomalías aparecen ${e.freq === 0.5 ? 'el doble de' : 'más'} a menudo`);
      if (e.life) parts.push(`duran ×${num(e.life)} en pantalla`);
      if (e.dur) parts.push(`sus efectos duran ×${num(e.dur)}`);
      const t = parts.join(', ');
      return `${t[0].toUpperCase()}${t.slice(1)}.`;
    }
    default: return '';
  }
}

const list = [];
function add(u) {
  u.requires = u.requires ?? [];
  // `reached`: ya se ve en el almacén. `unlock`: además cumple los requisitos y se puede comprar.
  u.reached = u.unlock;
  u.unlock = (G) => u.reached(G) && u.requires.every((r) => G.upgrades.has(r));
  u.desc = u.desc ?? u.effects.map(describeEffect).join(' ');
  list.push(u);
}

// ─── Líneas de investigación por módulo ───
// Cada módulo tiene un socio temático: sus mejoras VI y VII se vinculan con él.
const PARTNER = {
  crew: 'sanctuary', sanctuary: 'crew',
  hydro: 'xenolab', xenolab: 'hydro',
  helium: 'refinery', refinery: 'helium',
  factory: 'freighter', freighter: 'factory',
  outpost: 'probability', probability: 'outpost',
  gate: 'multiverse', multiverse: 'gate',
  chrono: 'reality', reality: 'chrono',
  antimatter: 'dyson', dyson: 'antimatter',
  artifact: 'drone',
};

const NAMES = {
  crew: ['Café de verdad', 'Turnos rotativos', 'Botas magnéticas', 'Camaradería', 'Ascensos internos', 'Retiro espiritual', 'Uniformes de gala', 'Moral de hierro', 'Sindicato estelar', 'Familias a bordo'],
  hydro: ['Luz de espectro completo', 'Abono de tripulante', 'Algas mutantes', 'Monocultivo masivo', 'Riego por niebla', 'Simbiosis alienígena', 'Cosecha continua', 'Agrónomos sabios', 'Fotosíntesis forzada', 'Jungla en órbita'],
  helium: ['Brocas de diamante', 'Regolito fertilizado', 'Perforación profunda', 'Minería en cadena', 'Turnos de 26 horas', 'Fundición directa', 'Núcleo lunar', 'Geólogos curiosos', 'Detonación controlada', 'Luna vaciada'],
  factory: ['Remaches de titanio', 'Piezas de helio', 'Línea de montaje', 'Producción en serie', 'Robots soldadores', 'Contratos de flete', 'Diques secos', 'Manual de ingeniería', 'Montaje en vacío', 'Astillero infinito'],
  outpost: ['Báscula trucada', 'Ofertas en naves', 'Rutas comerciales', 'Interés compuesto', 'Aranceles', 'Apuestas seguras', 'Monopolio', 'Estudio de mercado', 'Moneda propia', 'Bolsa galáctica'],
  sanctuary: ['Incienso de nebulosa', 'Diezmo comercial', 'Cánticos armónicos', 'Fe compartida', 'Peregrinaciones', 'Votos de la tripulación', 'Templo flotante', 'Textos sagrados', 'Iluminación', 'El Gran Silencio'],
  xenolab: ['Jaulas reforzadas', 'Bendición de especímenes', 'Cría selectiva', 'Ecosistema cerrado', 'Domesticación', 'Huertos alienígenas', 'Especie dominante', 'Bestiario completo', 'Mutación dirigida', 'Arca estelar'],
  freighter: ['Bodegas ampliadas', 'Muestras exóticas', 'Motores de salto', 'Convoyes', 'Seguro de carga', 'Pedidos al por mayor', 'Carguero insignia', 'Cartas de navegación', 'Salto en cadena', 'Flota infinita'],
  refinery: ['Crisoles cerámicos', 'Combustible de carguero', 'Alto horno', 'Refinado continuo', 'Catalizadores', 'Mineral directo', 'Plasma puro', 'Química avanzada', 'Fusión fría', 'Forja estelar'],
  gate: ['Anillos calibrados', 'Plasma de arranque', 'Apertura estable', 'Red de puertas', 'Peaje dimensional', 'Atajos al infinito', 'Puerta mayor', 'Topología aplicada', 'Plegado doble', 'En todas partes a la vez'],
  chrono: ['Péndulos de cuarzo', 'Viaje por la puerta', 'Bucle corto', 'Horas extra', 'Paradoja controlada', 'Ensayo de realidad', 'Eternidad portátil', 'Tiempo acumulado', 'Ayer productivo', 'Fin del tiempo'],
  antimatter: ['Botellas magnéticas', 'Partículas del pasado', 'Contención doble', 'Aniquilación en cadena', 'Escudos de positrones', 'Alimentar la esfera', 'Reactor gemelo', 'Física prohibida', 'Antisol', 'Vacío perfecto'],
  dyson: ['Paneles reflectantes', 'Chispa de antimateria', 'Anillo completo', 'Enjambre de espejos', 'Estrella domada', 'Antimateria solar', 'Cáscara total', 'Astrofísica', 'Segunda estrella', 'Galaxia encendida'],
  probability: ['Dados cargados', 'Suerte solar', 'Trébol de cuatro hojas', 'Ley de los grandes números', 'Sesgo favorable', 'La banca siempre gana', 'Improbabilidad infinita', 'Imán de anomalías', 'Gato de Schrödinger', 'Destino a medida'],
  artifact: ['Pedestales de resonancia', 'Hallazgos fortuitos', 'Cánticos de cristal', 'Colección creciente', 'Excavación profunda', 'Drones arqueólogos', 'El fragmento perdido', 'Glifos descifrados', 'Unificación', 'Mapa de la Unidad'],
  reality: ['Prismas pulidos', 'Resonancia de artefactos', 'Constantes ajustadas', 'Reescritura masiva', 'Física a la carta', 'Relojes de realidad', 'Ley propia', 'Metafísica', 'Dios en la máquina', 'Realidad perfecta'],
  multiverse: ['Burbujas estables', 'Realidades vecinas', 'Colonias espejo', 'Infinitos tú', 'Comercio entre mundos', 'Puertas al todo', 'Multiverso doble', 'Cartografía infinita', 'Yo de otro mundo', 'Todo y nada'],
};

const LINE_THRESHOLDS = [1, 10, 25, 50, 100, 150, 200, 250, 300, 400];
const LINE_COST_MULT = [10, 120, 500, 5e4, 5e6, 5e8, 5e11, 5e14, 5e17, 5e23];

/** Efectos especiales que sustituyen a la plantilla en ciertos módulos. */
const SPECIAL = {
  outpost: { 3: [{ type: 'bank', b: 'outpost', pct: 0.06 }] },
  sanctuary: { 3: [{ type: 'morale', b: 'sanctuary', pct: 0.01 }] },
  crew: { 7: [{ type: 'morale', b: 'crew', pct: 0.015 }] },
  chrono: { 7: [{ type: 'runTime', b: 'chrono', pct: 0.02, max: 2 }] },
  probability: { 7: [{ type: 'anomBonus', b: 'probability', pct: 0.03 }, { type: 'anomaly', freq: 0.9 }] },
};

for (const b of BUILDINGS) {
  if (b.id === 'drone') continue;
  const id = (t) => `${b.id}_t${t}`;
  const prev = BUILDINGS[b.index - 1].id;
  const partner = PARTNER[b.id];
  const template = [
    [{ type: 'bmult', b: b.id, mult: 2 }],
    [{ type: 'link', b: b.id, src: prev, pct: 0.02, per: 1 }, { type: 'link', b: prev, src: b.id, pct: 0.004, per: 1 }],
    [{ type: 'bmult', b: b.id, mult: 2 }],
    [{ type: 'self', b: b.id, pct: 0.008 }],
    [{ type: 'bmult', b: b.id, mult: 2 }, { type: 'cost', b: b.id, mult: 0.9 }],
    [{ type: 'link', b: b.id, src: partner, pct: 0.005, per: 1 }, { type: 'link', b: partner, src: b.id, pct: 0.005, per: 1 }],
    [{ type: 'bmult', b: b.id, mult: 3 }],
    [{ type: 'research', b: b.id, pct: 0.01 }],
    [{ type: 'bmult', b: b.id, mult: 2 }],
    [{ type: 'self', b: b.id, pct: 0.006 }],
  ];
  const requires = {
    2: [id(1)],
    4: [id(3)],
    6: partner !== 'drone' ? [id(5), `${partner}_t5`] : [id(5)],
    8: [id(7)],
    9: [id(8)],
  };
  LINE_THRESHOLDS.forEach((need, t) => {
    add({
      id: id(t),
      name: NAMES[b.id][t],
      sub: b.name,
      cost: b.baseCost * LINE_COST_MULT[t],
      icon: b.id,
      tier: t,
      kind: 'building',
      requires: requires[t],
      unlock: (G) => owned(G, b.id) >= need,
      effects: SPECIAL[b.id]?.[t] ?? template[t],
    });
  });
}

// ─── Drones: duplican drones y clic; luego el "enjambre" escala con el resto de módulos ───
const DRONE_UPGRADES = [
  [1, 100, 'Brazos reforzados', [{ type: 'droneClick', mult: 2 }]],
  [1, 500, 'Servos de titanio', [{ type: 'droneClick', mult: 2 }]],
  [10, 1e4, 'Doble articulación', [{ type: 'droneClick', mult: 2 }]],
  [25, 1e5, 'Enjambre coordinado', [{ type: 'swarm', add: 0.1 }]],
  [50, 1e7, 'Mente colmena', [{ type: 'swarmMult', mult: 5 }]],
  [100, 1e8, 'Red de enjambres', [{ type: 'swarmMult', mult: 10 }]],
  [150, 1e9, 'Enjambre planetario', [{ type: 'swarmMult', mult: 20 }]],
  [200, 1e10, 'Enjambre sistémico', [{ type: 'swarmMult', mult: 20 }]],
  [250, 1e13, 'Enjambre galáctico', [{ type: 'swarmMult', mult: 20 }]],
  [300, 1e16, 'Enjambre intergaláctico', [{ type: 'swarmMult', mult: 20 }]],
  [350, 1e19, 'Enjambre multiversal', [{ type: 'swarmMult', mult: 20 }]],
];
DRONE_UPGRADES.forEach(([need, cost, name, effects], t) => {
  add({
    id: `drone_t${t}`, name, sub: 'Dron de minería', cost,
    icon: 'drone', tier: t, kind: 'building',
    requires: t >= 4 ? [`drone_t${t - 1}`] : [],
    unlock: (G) => owned(G, 'drone') >= need,
    effects,
  });
});

// ─── Guanteletes: el clic escala con la producción ───
const GAUNTLETS = [
  'Guantes de presión', 'Guantelete de hierro meteórico', 'Guantelete de titanio',
  'Guantelete de neutronio', 'Guantelete de vacío', 'Guantelete Starborn',
  'Toque de la Unidad', 'Mano del creador',
];
GAUNTLETS.forEach((name, t) => {
  const need = 1e3 * 100 ** t;
  add({
    id: `click_t${t}`, name, sub: 'Extracción manual',
    cost: 5e4 * 100 ** t, icon: 'gauntlet', tier: t, kind: 'click',
    unlock: (G) => G.handmadeRun >= need,
    effects: [{ type: 'clickPct', pct: 0.01 }],
  });
});

// ─── Especialistas: tripulantes ×2 y el módulo gana +1% por cada N tripulantes ───
const SPECIALISTS = [
  'agrónomos', 'mineros', 'ingenieros', 'comerciantes', 'devotos', 'xenobiólogos',
  'estibadores', 'alquimistas', 'saltadores', 'cronistas', 'de contención', 'solares',
  'afortunados', 'arqueólogos', 'demiurgos', 'infinitos',
];
BUILDINGS.slice(2).forEach((b, i) => {
  add({
    id: `spec_${b.id}`, name: `Tripulantes ${SPECIALISTS[i]}`, sub: 'Especialistas',
    cost: b.baseCost * 50, icon: 'crew', tier: Math.min(10, i), kind: 'specialist',
    unlock: (G) => owned(G, b.id) >= 15 && owned(G, 'crew') >= 1,
    effects: [{ type: 'specialist', b: b.id, per: b.index - 1 }],
  });
});

// ─── Investigación de colonia: bonus globales que dependen de cómo juegas ───
const total = (G) => Object.values(G.buildings).reduce((a, c) => a + c, 0);
const types = (G, min) => Object.values(G.buildings).filter((c) => c >= min).length;
add({ id: 'res_teach', name: 'Clases de puntería', sub: 'Investigación', cost: 6e4, icon: 'chip', tier: 0, kind: 'research',
  unlock: (G) => owned(G, 'crew') >= 15 && G.clicksRun >= 200,
  effects: [{ type: 'clickAdd', src: 'crew', add: 0.5 }] });
add({ id: 'res_urban', name: 'Planificación urbana', sub: 'Investigación', cost: 1e6, icon: 'chip', tier: 1, kind: 'research',
  unlock: (G) => total(G) >= 100,
  effects: [{ type: 'perTotal', pct: 0.01, per: 25 }] });
add({ id: 'res_diverse', name: 'Diversificación', sub: 'Investigación', cost: 5e7, icon: 'chip', tier: 2, kind: 'research',
  requires: ['res_urban'],
  unlock: (G) => types(G, 10) >= 6,
  effects: [{ type: 'perType', pct: 0.03, min: 10 }] });
add({ id: 'res_anom', name: 'Archivo de anomalías', sub: 'Investigación', cost: 3e8, icon: 'chip', tier: 3, kind: 'research',
  unlock: (G) => G.anomaliesAll >= 5,
  effects: [{ type: 'perAnomaly', pct: 0.01, max: 0.75 }] });
add({ id: 'res_watch', name: 'Turnos de guardia', sub: 'Investigación', cost: 2e8, icon: 'chip', tier: 4, kind: 'research',
  unlock: (G) => G.earnedRun >= 5e7 && Date.now() - G.runStart >= 20 * 60 * 1000,
  effects: [{ type: 'runTime', pct: 0.005, max: 0.3 }] });
add({ id: 'res_library', name: 'Biblioteca técnica', sub: 'Investigación', cost: 1e10, icon: 'chip', tier: 5, kind: 'research',
  requires: ['res_diverse'],
  unlock: (G) => G.upgrades.size >= 40,
  effects: [{ type: 'perUpgrade', pct: 0.005 }] });
add({ id: 'res_metro', name: 'Ecumenópolis', sub: 'Investigación', cost: 1e13, icon: 'chip', tier: 6, kind: 'research',
  requires: ['res_urban'],
  unlock: (G) => total(G) >= 1000,
  effects: [{ type: 'perTotal', pct: 0.02, per: 25 }] });

// ─── Suministros: comida para la tripulación, cada uno con su efecto ───
const SUPPLIES = [
  ['Raciones de campaña', { type: 'global', pct: 0.05 }],
  ['Café de cosecha lunar', { type: 'clickMult', mult: 1.5 }],
  ['Barritas de algas', { type: 'global', pct: 0.05 }],
  ['Té de nebulosa', { type: 'anomaly', life: 1.2 }],
  ['Fideos de gravedad cero', { type: 'global', pct: 0.08 }],
  ['Sidra de Marte', { type: 'clickMult', mult: 1.5 }],
  ['Pan de esporas', { type: 'global', pct: 0.08 }],
  ['Chocolate de asteroide', { type: 'anomaly', dur: 1.1 }],
  ['Queso de cabra marciana', { type: 'global', pct: 0.1 }],
  ['Curry de neón', { type: 'clickMult', mult: 2 }],
  ['Helado de nitrógeno', { type: 'global', pct: 0.1 }],
  ['Dumplings orbitales', { type: 'anomaly', freq: 0.9 }],
  ['Tarta de cometa', { type: 'global', pct: 0.15 }],
  ['Vino de cráter', { type: 'global', pct: 0.15 }],
  ['Galletas de la Constelación', { type: 'clickMult', mult: 2 }],
  ['Caramelos de plasma', { type: 'global', pct: 0.15 }],
  ['Mermelada de quásar', { type: 'anomaly', dur: 1.1 }],
  ['Sopa de materia oscura', { type: 'global', pct: 0.2 }],
  ['Turrón de antimateria', { type: 'global', pct: 0.2 }],
  ['Croquetas de púlsar', { type: 'clickMult', mult: 2 }],
  ['Bocadillo de agujero negro', { type: 'global', pct: 0.2 }],
  ['Paella de supernova', { type: 'global', pct: 0.25 }],
  ['Tortilla cuántica', { type: 'anomaly', freq: 0.9 }],
  ['Banquete de la Unidad', { type: 'global', pct: 0.3 }],
];
SUPPLIES.forEach(([name, effect], i) => {
  const cost = 5e4 * 6 ** i;
  add({
    id: `supply_${i}`, name, sub: 'Suministros', cost,
    icon: 'supply', tier: Math.floor(i / 2.4), kind: 'supply',
    unlock: (G) => G.earnedRun >= cost * 0.5,
    effects: [effect],
  });
});

// ─── Oficiales: multiplican la producción según la moral (logros) ───
const OFFICERS = [
  ['Contramaestre', 12, 9e6, 0.1],
  ['Sargento de cubierta', 25, 9e9, 0.125],
  ['Teniente de vuelo', 40, 9e13, 0.15],
  ['Capitán', 55, 9e17, 0.175],
  ['Comandante', 70, 9e21, 0.2],
  ['Almirante', 90, 9e25, 0.2],
  ['Almirante de flota', 110, 9e29, 0.2],
];
OFFICERS.forEach(([name, achv, cost, factor], t) => {
  add({
    id: `officer_${t}`, name, sub: 'Oficialidad', cost,
    icon: 'officer', tier: t, kind: 'officer',
    requires: t > 0 ? [`officer_${t - 1}`] : [],
    unlock: (G) => G.achievements.size >= achv,
    effects: [{ type: 'officer', factor }],
  });
});

// ─── Anomalías ───
add({ id: 'anom_0', name: 'Escáner de largo alcance', sub: 'Anomalías', cost: 777777777, icon: 'anomaly', tier: 2, kind: 'anomaly',
  unlock: (G) => G.anomaliesAll >= 7, effects: [{ type: 'anomaly', freq: 0.5, life: 2 }] });
add({ id: 'anom_1', name: 'Sintonizador de fase', sub: 'Anomalías', cost: 77777777777, icon: 'anomaly', tier: 5, kind: 'anomaly',
  requires: ['anom_0'],
  unlock: (G) => G.anomaliesAll >= 27, effects: [{ type: 'anomaly', freq: 0.5, life: 2 }] });
add({ id: 'anom_2', name: 'Estabilizador de anomalías', sub: 'Anomalías', cost: 77777777777777, icon: 'anomaly', tier: 8, kind: 'anomaly',
  requires: ['anom_1'],
  unlock: (G) => G.anomaliesAll >= 77, effects: [{ type: 'anomaly', dur: 2 }] });

export const UPGRADES = list;
export const UPGRADES_BY_ID = new Map(list.map((u) => [u.id, u]));
