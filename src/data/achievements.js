/**
 * Logros. Cada logro suma un 4% de moral, que potencian los Oficiales.
 * `check(G, eps)` se evalúa periódicamente; los `secret` se otorgan a mano por id.
 */

import { BUILDINGS } from './buildings.js';
import { fmt } from '../core/format.js';

const list = [];
const add = (a) => list.push(a);

const ENERGY = [
  [1, 'Primer crédito', 'Gana tu primer crédito.'],
  [1e3, 'Calderilla', null], [1e5, 'Hucha llena', null], [1e6, 'Primer millón', null],
  [1e7, 'Cuenta corriente', null], [1e8, 'Colonia solvente', null], [1e9, 'Mil millones', null],
  [1e10, 'Exportador', null], [1e11, 'Potencia sistémica', null], [1e12, 'Billón brillante', null],
  [1e13, 'Banco del sector', null], [1e14, 'Rival de las corporaciones', null], [1e15, 'Kardashev I', null],
  [1e16, 'Hambre de estrellas', null], [1e18, 'Kardashev II', null], [1e20, 'Rumor galáctico', null],
  [1e22, 'Kardashev III', null], [1e24, 'Más allá de la escala', null], [1e27, 'Fin de la entropía', null],
];
ENERGY.forEach(([n, name, desc], i) => add({
  id: `energy_${i}`, name, icon: 'bolt',
  desc: desc ?? `Gana ₡${fmt(n)} en una misma colonia.`,
  check: (G) => G.earnedRun >= n,
}));

const EPS = [
  [1, 'Goteo'], [10, 'Flujo constante'], [100, 'Corriente'], [1e3, 'Torrente'], [1e4, 'Catarata'],
  [1e5, 'Tormenta solar'], [1e6, 'Erupción'], [1e7, 'Nova'], [1e8, 'Supernova'], [1e9, 'Hipernova'],
  [1e10, 'Púlsar'], [1e11, 'Quásar'], [1e12, 'Núcleo galáctico'], [1e14, 'Big Bang en miniatura'],
];
EPS.forEach(([n, name], i) => add({
  id: `eps_${i}`, name, icon: 'gauge',
  desc: `Ingresa ₡${fmt(n)} por segundo.`,
  check: (G, eps) => eps >= n,
}));

const CLICKS = [[1, 'Primer contacto'], [100, 'Dedo inquieto'], [1000, 'Tendinitis'], [1e4, 'Martillo neumático'], [5e4, 'Dedo de neutronio']];
CLICKS.forEach(([n, name], i) => add({
  id: `clicks_${i}`, name, icon: 'gauntlet',
  desc: `Haz clic en el planeta ${fmt(n)} ${n === 1 ? 'vez' : 'veces'}.`,
  check: (G) => G.clicksAll >= n,
}));

const HANDMADE = [[1e3, 'Trabajo artesanal'], [1e5, 'Callos en los dedos'], [1e7, 'Puño de hierro'],
  [1e9, 'Mano de obra'], [1e11, 'Golpe sísmico'], [1e13, 'Mano de dios'], [1e15, 'El clic definitivo']];
HANDMADE.forEach(([n, name], i) => add({
  id: `hand_${i}`, name, icon: 'gauntlet',
  desc: `Gana ₡${fmt(n)} recogiendo gas a mano.`,
  check: (G) => G.handmadeAll >= n,
}));

const B_TIERS = [[1, 'Pionero'], [50, 'Escuadrón'], [100, 'Flotilla'], [150, 'Armada'], [200, 'Hegemonía']];
for (const b of BUILDINGS) {
  B_TIERS.forEach(([n, label], i) => add({
    id: `b_${b.id}_${i}`, name: `${label}: ${b.plural}`, icon: b.id,
    desc: n === 1 ? `Construye tu primer ${b.name.toLowerCase()}.` : `Ten ${n} ${b.plural}.`,
    check: (G) => (G.buildings[b.id] ?? 0) >= n,
  }));
}

const TOTAL_B = [[100, 'Colonia'], [500, 'Ciudad'], [1000, 'Metrópolis'], [2000, 'Ecumenópolis'], [4000, 'Esfera habitada']];
TOTAL_B.forEach(([n, name], i) => add({
  id: `totalb_${i}`, name, icon: 'colony',
  desc: `Ten ${fmt(n)} módulos en total.`,
  check: (G) => Object.values(G.buildings).reduce((a, c) => a + c, 0) >= n,
}));

const UPG = [[20, 'Mejora continua'], [50, 'Ingeniería'], [100, 'Investigación'], [150, 'Vanguardia'], [200, 'Singularidad técnica']];
UPG.forEach(([n, name], i) => add({
  id: `upg_${i}`, name, icon: 'chip',
  desc: `Compra ${n} mejoras.`,
  check: (G) => G.upgrades.size >= n,
}));

const ANOM = [[1, 'Señal en el ruido'], [7, 'Cazador de anomalías'], [27, 'Sintonizado'], [77, 'Imán de artefactos'], [777, 'El vacío te observa']];
ANOM.forEach(([n, name], i) => add({
  id: `anom_${i}`, name, icon: 'anomaly',
  desc: `Captura ${n} ${n === 1 ? 'anomalía' : 'anomalías'}.`,
  check: (G) => G.anomaliesAll >= n,
}));

const ASC = [[1, 'Renacido'], [5, 'Viajero de la Unidad'], [10, 'Eterno retorno'], [25, 'Starborn']];
ASC.forEach(([n, name], i) => add({
  id: `asc_${i}`, name, icon: 'unity',
  desc: `Entra en la Unidad ${n === 1 ? 'una vez' : `${n} veces`}.`,
  check: (G) => G.prestige.ascensions >= n,
}));

const POP = [[10, 'Vecindario'], [100, 'Pueblo'], [1000, 'Villa'], [10000, 'Ciudad'], [100000, 'Metrópolis estelar']];
POP.forEach(([n, name], i) => add({
  id: `pop_${i}`, name, icon: 'crew',
  desc: `Llega a ${fmt(n)} colonos.`,
  check: (G) => G.pop >= n,
}));

const DAYS = [[7, 'Primera semana', 7], [28, 'Un ciclo completo', 28], [100, 'Cien días', 100], [365, 'Aniversario', 365]];
DAYS.forEach(([n, name], i) => add({
  id: `days_${i}`, name, icon: 'news',
  desc: `Mantén una colonia durante ${n} días.`,
  check: (G) => (Date.now() - G.runStart) / 120000 >= n,
}));

// Secretos: se otorgan por eventos concretos
add({ id: 'secret_news', name: 'Lector de noticias', icon: 'news', secret: true, desc: 'Haz clic en el teletipo de noticias.' });
add({ id: 'secret_sell', name: 'Arrepentimiento', icon: 'colony', secret: true, desc: 'Vende un módulo.' });
add({ id: 'secret_veteran', name: 'Veterano de la vieja colonia', icon: 'officer', secret: true, desc: 'Tenías una partida de la versión anterior.' });
add({ id: 'secret_back', name: 'Bienvenido de vuelta', icon: 'bolt', secret: true, desc: 'Vuelve tras estar fuera y recoge la producción acumulada.' });
add({ id: 'secret_frenzy', name: 'Tormenta perfecta', icon: 'anomaly', secret: true, desc: 'Ten dos efectos de anomalía activos a la vez.' });
add({ id: 'secret_fast', name: 'Dedos de pianista', icon: 'gauntlet', secret: true, desc: 'Haz 15 clics en un solo segundo.' });

export const ACHIEVEMENTS = list;
export const ACHIEVEMENTS_BY_ID = new Map(list.map((a) => [a.id, a]));
export const MORALE_PER_ACHIEVEMENT = 0.04;
