/**
 * Teletipo de noticias. Cada entrada aparece solo si se cumple `when`.
 * Las noticias de progreso pesan más que las genéricas para que el mundo
 * parezca reaccionar a lo que haces.
 */

const has = (G, id, n = 1) => (G.buildings[id] ?? 0) >= n;
const earned = (G, n) => G.earnedRun >= n;

export const NEWS = [
  // Primeros pasos
  { when: (G) => G.earnedRun < 50, t: 'Un planeta remoto empieza a emitir pulsos rítmicos. Los astrónomos sospechan de alguien muy aburrido.' },
  { when: (G) => G.earnedRun < 50, t: 'Tienes un planeta, un dedo y un sueño. Dos de los tres son útiles.' },
  { when: (G) => G.earnedRun < 1000, t: 'Consejo del día: haz clic en el planeta para recoger gas y venderlo. Cuantos más clics, más créditos.' },
  { when: (G) => G.earnedRun < 1000, t: 'La Autoridad Colonial califica tu colonia de "experimento de una sola persona".' },

  // Drones
  { when: (G) => has(G, 'drone'), t: 'Los drones de minería se quejan de mareos tras orbitar 400 veces seguidas.' },
  { when: (G) => has(G, 'drone', 50), t: 'Un enjambre de drones bloquea la vista del planeta. Los turistas exigen reembolsos.' },
  { when: (G) => has(G, 'drone', 100), t: 'Encuesta: el 83% de los drones preferiría golpear otra cosa.' },

  // Tripulantes
  { when: (G) => has(G, 'crew'), t: 'Llega el primer tripulante. Pregunta dónde está la máquina de café. No hay máquina de café.' },
  { when: (G) => has(G, 'crew', 25), t: 'Los tripulantes forman un sindicato. Su única exigencia: café.' },
  { when: (G) => has(G, 'crew', 100), t: 'La cola del comedor alcanza la órbita baja.' },

  // Granjas
  { when: (G) => has(G, 'hydro'), t: 'Las algas bioluminiscentes son la nueva moda culinaria: "saben a batería".' },
  { when: (G) => has(G, 'hydro', 50), t: 'Una granja hidropónica brilla tanto que se ve desde el sistema vecino.' },

  // Helio
  { when: (G) => has(G, 'helium'), t: 'El precio del helio-3 baja un 0,01%. Los analistas te culpan a ti.' },
  { when: (G) => has(G, 'helium', 50), t: 'La luna local tiene ahora más agujeros que un queso. Lo confirma un ratón astronauta.' },

  // Astilleros
  { when: (G) => has(G, 'factory'), t: 'El astillero orbital entrega una nave sin pedido. Nadie sabe qué hacer con ella.' },
  { when: (G) => has(G, 'factory', 50), t: 'Atasco orbital: 3.000 naves sin estrenar esperan aparcamiento.' },

  // Comercio
  { when: (G) => has(G, 'outpost'), t: 'Tu puesto comercial vende gas a precio de saldo. Tus rivales, furiosos.' },
  { when: (G) => has(G, 'outpost', 25), t: 'Un mercader asegura que te ha vendido tu propio gas dos veces. Es cierto.' },

  // Santuario
  { when: (G) => has(G, 'sanctuary'), t: 'Los monjes del santuario afirman que el vacío les susurra cifras de producción.' },
  { when: (G) => has(G, 'sanctuary', 25), t: 'Nueva religión en auge: el Clicismo. Su único rito, adivina cuál.' },

  // Xenolab
  { when: (G) => has(G, 'xenolab'), t: 'Una criatura del laboratorio xenobiológico se ha comido un reactor. Está bien. El reactor no.' },

  // Cargueros
  { when: (G) => has(G, 'freighter'), t: 'Un carguero de salto llega con plasma de otra estrella y un polizón muy confundido.' },

  // Refinería
  { when: (G) => has(G, 'refinery'), t: 'La refinería convierte plomo en plasma. Los alquimistas medievales lloran en sus tumbas.' },

  // Puertas
  { when: (G) => has(G, 'gate'), t: 'Algo ha salido por la puerta gravitatoria. Ha pedido indicaciones y ha vuelto a entrar.' },

  // Crono
  { when: (G) => has(G, 'chrono'), t: 'Mañana es noticia que hoy fue ayer. El cronoestabilizador funciona perfectamente.' },

  // Antimateria
  { when: (G) => has(G, 'antimatter'), t: 'Aviso: no confundir el condensador de antimateria con la cafetera. Otra vez.' },

  // Dyson
  { when: (G) => has(G, 'dyson'), t: 'Tras cubrir su estrella, el sistema vecino envía una queja formal por "sombra excesiva".' },

  // Probabilidad
  { when: (G) => has(G, 'probability'), t: 'El motor de probabilidad ha hecho que esta noticia sea graciosa. Al 4%.' },

  // Artefactos
  { when: (G) => has(G, 'artifact'), t: 'Los resonadores captan una melodía en los artefactos. Suena sospechosamente a tu nombre.' },

  // Realidad / multiverso
  { when: (G) => has(G, 'reality'), t: 'Se modifica la constante gravitatoria. Tu taza de café ahora flota. Ventajas.' },
  { when: (G) => has(G, 'multiverse'), t: 'En otro universo hay una versión tuya que no hace clic. Nadie la conoce.' },

  // Escala
  { when: (G) => earned(G, 1e6), t: 'La colonia supera el millón de unidades. El ayuntamiento instala una placa conmemorativa. Brilla.' },
  { when: (G) => earned(G, 1e9), t: 'Récord: tu colonia mueve más créditos que tres planetas juntos.' },
  { when: (G) => earned(G, 1e12), t: 'Los cartógrafos añaden tu planeta a los mapas con la etiqueta "no mirar directamente".' },
  { when: (G) => earned(G, 1e15), t: 'Varias civilizaciones te envían cartas de admiración. Una, una factura.' },

  // Anomalías
  { when: (G) => G.anomaliesAll >= 1, t: 'Los científicos estudian las anomalías doradas. Conclusión: "brillan y hay que tocarlas".' },
  { when: (G) => G.anomaliesAll >= 10, t: 'Rumor en los bares: si clicas una anomalía a tiempo, el universo te debe un favor.' },

  // Prestigio
  { when: (G) => G.prestige.ascensions >= 1, t: 'Tienes una sensación de déjà vu. Ya habías construido esta colonia. Exactamente igual.' },
  { when: (G) => G.prestige.ascensions >= 1, t: 'Los Starborn cuchichean sobre ti. Bien, por lo general.' },

  // Genéricas
  { when: () => true, t: 'Previsión meteorológica: soleado con probabilidad de viento solar del 100%.' },
  { when: () => true, t: 'Un estudio confirma que mirar las estrellas no da dinero. Hacer clic sí.' },
  { when: () => true, t: 'Se busca piloto con experiencia en saltos. Abstenerse quien se maree en ascensores.' },
  { when: () => true, t: 'Oferta de empleo: tripulante de cubierta. Requisitos: tener dedos. Mínimo uno.' },
  { when: () => true, t: 'El comité de nombres planetarios rechaza "Planeta McPlanetaFace" por quinta vez.' },
  { when: () => true, t: 'Un asteroide pasa a 3 km de la colonia. Saluda. Nadie le devuelve el saludo.' },
  { when: () => true, t: 'Encuesta: lo más echado de menos en el espacio son las ventanas que se abren.' },
  { when: () => true, t: 'Un robot de servicio pide un aumento de sueldo. Cobra 0. Pide 0,01.' },
  { when: () => true, t: 'Prohibido silbar en la cubierta de mando. Nadie recuerda por qué.' },
  { when: () => true, t: 'Se descubre un nuevo exoplaneta. Es igualito al tuyo, pero sin nadie haciendo clic.' },
];
