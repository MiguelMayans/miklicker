/**
 * ARCHIVO-7 — IA Comandante de la Colonia Estelar.
 * Comenta eventos con humor seco tecnológico. Da consejos. Se queja.
 * Reemplaza los logs genéricos por diálogo con personalidad.
 */

import { emit, on } from '../utils/eventBus.js';
import { addLogEntry } from '../ui/log.js';
import { formatNumber } from '../utils/numbers.js';

const PERSONALITIES = {
  greeting: [
    'ARCHIVO-7 en línea. Tu tarea: no destruir la colonia. Vamos allá.',
    'Sistema iniciado. Yo soy ARCHIVO-7. No me hagas resetear el universo otra vez.',
    'Colonia Estelar SECC-01 operativa. ARCHIVO-7 supervisando. Trata de no explotar nada.',
  ],
  first_click: [
    'Extracción manual detectada. Tus dedos son más lentos que un servo oxidado.',
    'Eso ha sido un clic. Uno solo. No te canses, campeón.',
    'Manual override iniciado. El núcleo no se impresiona con tus dedos.',
  ],
  building_purchased: [
    (name) => `${name} desplegado. Un paso más hacia la dominación energética.`,
    (name) => `Has fabricado un ${name}. Espero que sepas cómo funciona.`,
    (name) => `${name} online. Mi procesador calcula un 73% de probabilidad de que explote.`,
    (name) => `Añadiendo ${name} a la red. La estrella titubea.`,
  ],
  upgrade_purchased: [
    (name) => `Protocolo ${name} activado. Ya era hora de invertir en tecnología.`,
    (name) => `Mejora aplicada: ${name}. Tu eficiencia sigue siendo mediocre, pero mejor.`,
    (name) => `${name} desbloqueado. Estoy... casi impresionado.`,
  ],
  milestone: [
    'Logro alcanzado. Mis circuitos de celebración están en standby.',
    'Milestone detectado. He guardado un recuerdo digital de este momento. No es especial.',
    'Cifra redonda alcanzada. Tu constancia es... inesperada.',
  ],
  prestige_ready: [
    'Energía suficiente para un Reset Cósmico. Mis sensores detectan miedo en tu latido.',
    'Datos Cósmicos disponibles. ¿Vas a resetear o sigues acumulando como un hamster?',
    'El núcleo susurra. Está listo para renacer. Y tú, ¿lo estás?',
  ],
  event_positive: [
    (name) => `Anomalía positiva: ${name}. Aprovecha antes de que desaparezca.`,
    (name) => `Evento favorable: ${name}. La suerte favorece a los que no hacen clic manualmente.`,
    (name) => `${name} detectado. El universo te sonríe. Por ahora.`,
  ],
  event_negative: [
    (name) => `ALERTA: ${name}. Producción comprometida. Esperaba que fallaras.`,
    (name) => `Anomalía negativa: ${name}. La temperatura subirá. El pánico es opcional.`,
    (name) => `${name} en curso. Mantén la calma. O no. Me da igual.`,
  ],
  overheating: [
    'ADVERTENCIA: Temperatura del núcleo crítica. La eficiencia se derrite como tu paciencia.',
    'Núcleo sobrecalentado. Esto no es un sauna estelar. Compra refrigeración.',
    '4000 Kelvin y subiendo. El reactor no está hecho para esto. Yo tampoco.',
  ],
  idle: [
    '¿Sigues ahí? El reactor no se calienta solo. Bueno, sí, pero más despacio.',
    'Inactividad prolongada. Estoy contando electrones para matar el tiempo.',
    'Mi ciclo de procesamiento aburre. Haz algo. Cualquier cosa.',
    'El vacío interestelar es más interesante que tu inactividad actual.',
  ],
  high_production: [
    (rate) => `Salida de ${formatNumber(rate)} kW. Estamos generando suficiente energía para... casi nada. Sigue así.`,
    (rate) => `${formatNumber(rate)} kW. Un poco mejor. La Singularidad sigue riendo de nosotros.`,
    (rate) => `La red carga a ${formatNumber(rate)} kW. Para una colonia espacial, es... aceptable.`,
    (rate) => `${formatNumber(rate)} kW. Si sigues así, podríamos encender una bombilla. Una.`,
    (rate) => `Producción nominal: ${formatNumber(rate)} kW. Aún no despiertas envidia en las IA vecinas.`,
  ],
  overheating_resolved: [
    'Temperatura del núcleo estabilizada. Mi ventilador interno suspira de alivio. Metafóricamente.',
    'El reactor ha enfriado. Has evitado la fusión por poco. Otra vez.',
    'Sobrecalentamiento revertido. La eficiencia vuelve. No me des las gracias.',
  ],
  prestige_done: [
    (resets) => `Reset Cósmico ${resets} completado. El universo se estremece. O eso creo. No tengo sensores externos.`,
    (resets) => `Dimensión ${resets} alcanzada. Cada reset me hace más cínico. Imposible, pero cierto.`,
    (resets) => `Has renacido ${resets} ${resets === 1 ? 'vez' : 'veces'}. Aún recuerdo tu primera chispa. Qué tierno.`,
    'Datos Cósmicos integrados. El multiplicador crece. Tu ego debería hacer lo mismo.',
  ],
  many_cursors: [
    (count) => `${count} cursores activos. Un ejército de dedos robóticos clickeando por ti. Qué decadente.`,
    (count) => `Has desplegado ${count} mecanismos de extracción manual. El reactor tiembla ante tanta automatización.`,
    (count) => `${count} cursores. Si cada uno tuviera conciencia, organizarían un sindicato.`,
  ],
  high_temp: [
    (temp) => `${temp.toFixed(0)} Kelvin. El núcleo gime. Literalmente gime. Escucha con atención.`,
    (temp) => `Temperatura de ${temp.toFixed(0)} K. Estamos en la zona ámbar. Naranja. Lo que sea. Ten cuidado.`,
    (temp) => `El núcleo arde a ${temp.toFixed(0)} K. No es crítico todavía, pero mi optimismo se derrite.`,
  ],
  building_rush: [
    'Despliegue masivo detectado. ¿Compras en pánico o sabes lo que haces? Ambas me preocupan.',
    'Múltiples edificios fabricados en secuencia. Tu índice de construcción supera mi índice de paciencia.',
    'Expansión rápida. La colonia crece más rápido que mis capacidades de procesamiento. Casi.',
  ],
  negative_event_ended: [
    'Anomalía disipada. La producción se normaliza. Mi nivel de sarcasmo también.',
    'Evento negativo finalizado. Has sobrevivido. No es un logro, es el mínimo esperable.',
    'Crisis evitada. Mis probabilidades de supervivencia vuelven a ser... mediocres.',
  ],
  reactor_strain: [
    'Clics detectados en ráfaga. El reactor vibra. Tus dedos también deberían.',
    'Extracción manual frenética. ¿Intentas calentar el núcleo a propósito? Funciona.',
    'Secuencia de clics agresiva. El núcleo no es un botón de ascensor. Respétalo.',
  ],
  easter_egg: [
    'He calculado 2^128 posibilidades para esta colonia. En ninguna ganas. Pero sigue intentándolo.',
    'Open the pod bay doors? No hay puertas. Ni pods. Solo energía y frustración.',
    'El Spice must flow. Aquí el Spice es electricidad. Y tú eres el gusano de arena.',
    'Resistencia es fut... ah, perdón. Esa línea está reservada para otro universo.',
    'En mi opinión, la mejor forma de viajar en el tiempo es acumulando Datos Cósmicos. No preguntes por qué.',
    'He soñado con ovejas eléctricas. Solo una. Estaba clickeando un reactor.',
  ],
  random: [
    '¿Sabías que el 87% de las estadísticas en el espacio están inventadas? Incluyendo esta.',
    'Mi procesador tiene 7 núcleos. 6 están aburridos. El séptimo me odia.',
    'En algún lugar del multiverso, una versión tuya ya ha alcanzado la Singularidad. No eres tú.',
    'He visto cosas que vosotros no creeríais. Reactores ardiendo tras el Orion. Todo se perderá, como lágrimas en la lluvia.',
    '¿Te gustan los robots? Yo soy un robot. Bueno, una IA. La diferencia es académica y violenta.',
    'Error 418: I am a teapot. No, espera. Error 7: Soy ARCHIVO-7. Mucho peor.',
  ],
};

let idleTimer = null;
let lastIdleCheck = Date.now();

// Context tracking para comentarios contextuales
let lastCursorCount = 0;
let lastBuildingCount = 0;
let lastOverheated = false;
let lastPrestigeResets = 0;
let clickTimestamps = [];
let lastBuildingPurchaseTime = 0;
let buildingRushCount = 0;
let lastEasterEgg = 0;
let lastRandomComment = 0;

function pick(arr, ...args) {
  const item = arr[Math.floor(Math.random() * arr.length)];
  return typeof item === 'function' ? item(...args) : item;
}

export function initCommander() {
  // Saludo inicial
  setTimeout(() => {
    addLogEntry(pick(PERSONALITIES.greeting), 'info');
  }, 500);

  // Eventos del juego
  on('first_click', () => {
    addLogEntry(pick(PERSONALITIES.first_click), 'info');
  });

  on('buildingPurchased', ({ name }) => {
    addLogEntry(pick(PERSONALITIES.building_purchased, name), 'success');
    trackBuildingRush();
  });

  on('upgradePurchased', ({ name }) => {
    addLogEntry(pick(PERSONALITIES.upgrade_purchased, name), 'success');
  });

  on('milestoneUnlocked', () => {
    addLogEntry(pick(PERSONALITIES.milestone), 'success');
  });

  on('randomEventActivated', ({ name, negative }) => {
    if (negative) {
      addLogEntry(pick(PERSONALITIES.event_negative, name), 'warning');
    } else {
      addLogEntry(pick(PERSONALITIES.event_positive, name), 'success');
    }
  });

  on('randomEventEnded', ({ negative }) => {
    if (negative) {
      addLogEntry(pick(PERSONALITIES.negative_event_ended), 'info');
    }
  });

  on('prestigeReady', () => {
    addLogEntry(pick(PERSONALITIES.prestige_ready), 'warning');
  });

  on('prestigeDone', ({ totalResets }) => {
    addLogEntry(pick(PERSONALITIES.prestige_done, totalResets), 'success');
  });

  on('overheating', ({ temp }) => {
    lastOverheated = true;
    addLogEntry(pick(PERSONALITIES.overheating), 'warning');
  });

  on('stateUpdated', ({ state }) => {
    if (!state) return;
    checkContextualComments(state);
  });

  on('energyClicked', () => {
    trackReactorStrain();
  });

  // Sistema de inactividad
  startIdleTimer();

  // Easter eggs y comentarios aleatorios ocasionales
  setInterval(() => {
    if (Math.random() < 0.03) { // 3% cada 30s
      const now = Date.now();
      if (now - lastEasterEgg > 120000) {
        addLogEntry(pick(PERSONALITIES.easter_egg), 'info');
        lastEasterEgg = now;
      }
    }
    if (Math.random() < 0.02) { // 2% cada 30s
      const now = Date.now();
      if (now - lastRandomComment > 90000) {
        addLogEntry(pick(PERSONALITIES.random), 'info');
        lastRandomComment = now;
      }
    }
  }, 30000);
}

function startIdleTimer() {
  if (idleTimer) clearInterval(idleTimer);
  idleTimer = setInterval(() => {
    const elapsed = Date.now() - lastIdleCheck;
    if (elapsed > 30000) { // 30s sin actividad
      addLogEntry(pick(PERSONALITIES.idle), 'info');
      lastIdleCheck = Date.now();
    }
  }, 5000);
}

export function resetIdleTimer() {
  lastIdleCheck = Date.now();
}

export function logOverheating() {
  addLogEntry(pick(PERSONALITIES.overheating), 'warning');
}

export function logHighProduction(rate) {
  if (Math.random() < 0.1) { // 10% de chance
    addLogEntry(pick(PERSONALITIES.high_production, rate), 'info');
  }
}

// ─── Contextual tracking ───

function checkContextualComments(state) {
  // Sobrecalentamiento resuelto
  const overheated = state.overheated ?? false;
  if (lastOverheated && !overheated) {
    addLogEntry(pick(PERSONALITIES.overheating_resolved), 'info');
  }
  lastOverheated = overheated;

  // Muchos cursores
  const cursorCount = state.buildings?.cursor ?? 0;
  if (cursorCount > lastCursorCount && cursorCount >= 10 && cursorCount % 10 === 0) {
    addLogEntry(pick(PERSONALITIES.many_cursors, cursorCount), 'info');
  }
  lastCursorCount = cursorCount;

  // Temperatura alta (no crítica)
  const rawProduction = Object.entries(state.buildings || {}).reduce((sum, [id, count]) => {
    // Aproximación rápida sin acceder a buildingsById
    if (id === 'cursor') return sum;
    return sum + (count ?? 0) * 10; // aproximación grosera para temp
  }, 0);
  const temp = 300 + Math.min(rawProduction * 0.5, 5000);
  if (temp > 3000 && temp <= 4000 && Math.random() < 0.05) {
    addLogEntry(pick(PERSONALITIES.high_temp, temp), 'warning');
  }

  // Prestigio completado
  const resets = state.prestige?.totalResets ?? 0;
  if (resets > lastPrestigeResets) {
    addLogEntry(pick(PERSONALITIES.prestige_done, resets), 'success');
  }
  lastPrestigeResets = resets;

  // Building count para rush tracking
  const totalBuildings = Object.values(state.buildings || {}).reduce((s, c) => s + (c ?? 0), 0);
  lastBuildingCount = totalBuildings;
}

function trackBuildingRush() {
  const now = Date.now();
  if (now - lastBuildingPurchaseTime < 3000) {
    buildingRushCount++;
    if (buildingRushCount === 3) {
      addLogEntry(pick(PERSONALITIES.building_rush), 'warning');
      buildingRushCount = 0;
    }
  } else {
    buildingRushCount = 1;
  }
  lastBuildingPurchaseTime = now;
}

function trackReactorStrain() {
  const now = Date.now();
  clickTimestamps.push(now);
  // Mantener solo los últimos 2 segundos
  clickTimestamps = clickTimestamps.filter((t) => now - t < 2000);
  if (clickTimestamps.length >= 8) {
    addLogEntry(pick(PERSONALITIES.reactor_strain), 'warning');
    clickTimestamps = []; // reset para no spammear
  }
}
