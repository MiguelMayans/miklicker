/**
 * Módulos de la colonia. Costes calcados de la curva de Cookie Clicker (cada módulo
 * cuesta ~10× el anterior y rinde ~6×), con la producción ×2,5 para un ritmo más ágil.
 * `hue` tiñe la fila de la colonia; `icon` es el id del símbolo SVG (ui/icons.js).
 */

export const BUILDINGS = [
  { id: 'drone', name: 'Dron de minería', plural: 'drones de minería', baseCost: 15, baseEps: 0.25, hue: 40,
    desc: 'Recoge gas del planeta y lo trae a la colonia. Silba mientras trabaja.' },
  { id: 'crew', name: 'Tripulante', plural: 'tripulantes', baseCost: 100, baseEps: 2.5, hue: 20,
    desc: 'Alguien tiene que pilotar, cocinar y contar chistes malos. Cobra en café.' },
  { id: 'hydro', name: 'Granja hidropónica', plural: 'granjas hidropónicas', baseCost: 1100, baseEps: 20, hue: 120,
    desc: 'Tomates y algas bajo cristal. La colonia vende lo que no se come.' },
  { id: 'helium', name: 'Extractor de helio-3', plural: 'extractores de helio-3', baseCost: 12000, baseEps: 117.5, hue: 200,
    desc: 'Perfora el regolito lunar en busca del isótopo más caro del sistema.' },
  { id: 'factory', name: 'Astillero orbital', plural: 'astilleros orbitales', baseCost: 130000, baseEps: 650, hue: 15,
    desc: 'Construye naves por encargo. Siempre hay alguien que quiere una.' },
  { id: 'outpost', name: 'Puesto comercial', plural: 'puestos comerciales', baseCost: 1.4e6, baseEps: 3500, hue: 45,
    desc: 'Compra barato en un sistema, vende caro en el siguiente.' },
  { id: 'sanctuary', name: 'Santuario estelar', plural: 'santuarios estelares', baseCost: 2e7, baseEps: 19500, hue: 280,
    desc: 'Sus monjes meditan sobre el vacío y venden un incienso buenísimo.' },
  { id: 'xenolab', name: 'Laboratorio xenobiológico', plural: 'laboratorios xenobiológicos', baseCost: 3.3e8, baseEps: 110000, hue: 160,
    desc: 'Cuida fauna alienígena. Los zoos de medio sector pagan por verla.' },
  { id: 'freighter', name: 'Carguero de salto', plural: 'cargueros de salto', baseCost: 5.1e9, baseEps: 650000, hue: 210,
    desc: 'Lleva lo que produce la colonia a mercados de otras estrellas.' },
  { id: 'refinery', name: 'Refinería de plasma', plural: 'refinerías de plasma', baseCost: 7.5e10, baseEps: 4e+06, hue: 0,
    desc: 'Convierte roca vulgar en plasma de grado estelar, muy cotizado.' },
  { id: 'gate', name: 'Puerta gravitatoria', plural: 'puertas gravitatorias', baseCost: 1e12, baseEps: 2.5e+07, hue: 250,
    desc: 'Pliega el espacio: comerciantes de otras galaxias llegan en un paso.' },
  { id: 'chrono', name: 'Cronoestabilizador', plural: 'cronoestabilizadores', baseCost: 1.4e13, baseEps: 1.625e+08, hue: 185,
    desc: 'Vende hoy lo que la colonia producirá mañana.' },
  { id: 'antimatter', name: 'Condensador de antimateria', plural: 'condensadores de antimateria', baseCost: 1.7e14, baseEps: 1.075e+09, hue: 330,
    desc: 'Una cucharadita alimenta un sistema solar durante un siglo.' },
  { id: 'dyson', name: 'Esfera de Dyson', plural: 'esferas de Dyson', baseCost: 2.1e15, baseEps: 7.25e+09, hue: 50,
    desc: 'Envuelve una estrella entera. Los vecinos se quejan de la sombra.' },
  { id: 'probability', name: 'Motor de probabilidad', plural: 'motores de probabilidad', baseCost: 2.6e16, baseEps: 5.25e+10, hue: 100,
    desc: 'Hace que lo improbable ocurra, sobre todo si es rentable.' },
  { id: 'artifact', name: 'Resonador de artefactos', plural: 'resonadores de artefactos', baseCost: 3.1e17, baseEps: 3.75e+11, hue: 35,
    desc: 'Hace cantar a los fragmentos antiguos. Los coleccionistas pagan fortunas.' },
  { id: 'reality', name: 'Motor de realidad', plural: 'motores de realidad', baseCost: 7.1e19, baseEps: 2.75e+12, hue: 300,
    desc: 'Reescribe las constantes físicas a tu favor.' },
  { id: 'multiverse', name: 'Multiverso', plural: 'multiversos', baseCost: 1.2e22, baseEps: 2.075e+13, hue: 220,
    desc: 'Infinitas colonias como la tuya, todas trabajando para ti.' },
];

export const BUILDINGS_BY_ID = new Map(BUILDINGS.map((b, i) => [b.id, { ...b, index: i }]));
for (const [i, b] of BUILDINGS.entries()) b.index = i;

export const COST_GROWTH = 1.15;
export const SELL_REFUND = 0.25;
