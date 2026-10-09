/**
 * Ilustraciones propias para toda la interfaz: los módulos, la colonia y los iconos.
 *
 * Estilo de cómic/pegatina: colores planos y contorno de tinta grueso con
 * esquinas suavizadas (un toque mínimo de irregularidad para que no parezca
 * un icono de librería).
 *
 * Todos los sprites se diseñan en una rejilla de 40×40 con el origen abajo en
 * el centro (x ∈ [-20, 20], y ∈ [-40, 0]) y se escalan al dibujarlos.
 */

export const INK = '#1e2539';
export const COL = {
  cream: '#f7f1e1', paper: '#ece4cf', paper2: '#d3c7a8',
  red: '#d9472b', orange: '#f08a2e', gold: '#f4be3e', blue: '#3f7fd0',
  green: '#4fbf8a', leaf: '#2f9b62', teal: '#3fc1d3', purple: '#8f63d6', lilac: '#b79bf0',
  pink: '#ee86b4', grey: '#9aa3b5', steel: '#6b7590', dark: '#2b3450', night: '#121b30',
};
const SUITS = [COL.red, COL.orange, COL.blue, COL.gold, COL.green];

function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * "Bolígrafo": helpers que trazan formas temblorosas, las rellenan y las
 * repasan con tinta. `amp` es el temblor en unidades de la rejilla.
 */
export function pen(ctx, seed = 1, lw = 2.2, amp = 0.15) {
  const r = rng(seed);
  const j = () => (r() - 0.5) * 2 * amp;

  function trace(pts, closed) {
    const p = pts.map(([x, y]) => [x + j(), y + j()]);
    ctx.beginPath();
    if (!closed) {
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      return;
    }
    // Curva suave que pasa por los puntos medios: da el aire de trazo a mano.
    const n = p.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(p[n - 1], p[0]);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(p[i], p[(i + 1) % n]);
      ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]);
    }
    ctx.closePath();
  }

  function paint(fill, stroke = true, width = lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = INK; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  }

  /** Rectángulo de esquinas suaves (puntos extra en los lados para que tiemble). */
  function box(x, y, w, h, fill, rad = 1.5) {
    const k = Math.min(rad, w / 2, h / 2);
    trace([
      [x + k, y], [x + w / 2, y], [x + w - k, y], [x + w, y + k], [x + w, y + h / 2], [x + w, y + h - k],
      [x + w - k, y + h], [x + w / 2, y + h], [x + k, y + h], [x, y + h - k], [x, y + h / 2], [x, y + k],
    ], true);
    paint(fill);
  }
  function blob(cx, cy, rx, ry = rx, fill, n = 12) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    trace(pts, true);
    paint(fill);
  }
  /** Polígono de esquinas marcadas (sin suavizar). */
  function poly(pts, fill) {
    const p = pts.map(([x, y]) => [x + j(), y + j()]);
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    paint(fill);
  }
  function line(x1, y1, x2, y2, width = lw, color = INK) {
    const mx = (x1 + x2) / 2 + j();
    const my = (y1 + y2) / 2 + j();
    ctx.beginPath();
    ctx.moveTo(x1 + j() * 0.5, y1 + j() * 0.5);
    ctx.quadraticCurveTo(mx, my, x2 + j() * 0.5, y2 + j() * 0.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  /** Arco abierto (para cúpulas, anillos…). */
  function arc(cx, cy, rx, ry, a0, a1, fill, close = true, n = 10) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    if (close) poly(pts, fill);
    else { trace(pts, false); paint(null); }
  }
  function dot(x, y, rad, fill) {
    ctx.beginPath();
    ctx.arc(x + j() * 0.3, y + j() * 0.3, rad, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  return { box, blob, poly, line, arc, dot, rnd: r };
}

// ─── Sprites de módulos (parte estática) ───
// `v` es una variante estable por unidad (color de traje, etc.)
export const SPRITES = {
  drone(d, v) {
    d.line(-6, -22, -13, -27); d.line(6, -22, 13, -27);
    d.blob(-13, -28, 6.5, 1.8, COL.cream); d.blob(13, -28, 6.5, 1.8, COL.cream);
    d.box(-8, -25, 16, 10, COL.grey, 3);
    d.box(-4, -23, 8, 4, COL.gold, 1.5);
    d.line(-4, -15, -6, -11); d.line(4, -15, 6, -11);
    d.box(-4, -12, 8, 6, [COL.orange, COL.red, COL.blue][v % 3], 1);
  },
  crew(d, v) {
    d.box(-9, -21, 4, 10, COL.grey, 1.5);
    d.box(-6, -22, 12, 13, SUITS[v % SUITS.length], 3);
    d.line(-2, -18, 2, -18, 1.6);
    d.blob(0, -29, 8, 7.5, COL.cream);
    d.blob(1.8, -29, 5, 4, COL.dark);
    d.dot(3.6, -30.5, 1.2, COL.gold);
  },
  hydro(d, v) {
    d.box(-18, -7, 36, 7, COL.steel, 1);
    d.arc(0, -7, 16, 17, Math.PI, Math.PI * 2, 'rgba(150, 230, 170, .55)');
    d.blob(-7, -11, 4.5, 4, COL.leaf); d.blob(1, -13, 5, 6, COL.green); d.blob(8, -10, 4, 3.5, COL.leaf);
    d.blob(-2, -18, 2.5, 2.5, v % 2 ? COL.gold : COL.pink);
    d.arc(0, -7, 8, 17, Math.PI, Math.PI * 2, null, false, 8);
    d.line(-14, -3.5, -10, -3.5, 1.4); d.line(10, -3.5, 14, -3.5, 1.4);
  },
  helium(d, v) {
    d.poly([[-11, 0], [-2, -34], [2, -34], [11, 0]], COL.paper);
    d.line(-8, -10, 7, -18, 1.6); d.line(8, -10, -7, -18, 1.6); d.line(-5, -22, 4, -28, 1.4);
    d.box(-4, -38, 8, 6, COL.orange, 1);
    d.blob(14, -8, 6, 8, COL.blue);
    d.line(11, -10, 17, -10, 1.4);
    d.box(-14, -4, 28, 4, COL.steel, 1);
    if (v % 2) d.dot(14, -19, 1.6, COL.teal);
  },
  factory(d, v) {
    d.line(-16, 0, -16, -36); d.line(16, 0, 16, -36); d.line(-16, -36, 18, -36);
    d.line(-16, -12, 16, -24, 1.4); d.line(-16, -24, 16, -12, 1.4);
    d.poly([[0, -33], [7, -20], [7, -5], [-7, -5], [-7, -20]], COL.cream);
    d.box(-7, -16, 14, 4, v % 2 ? COL.red : COL.blue, 0.5);
    d.blob(0, -24, 2.6, 2.6, COL.teal);
    d.poly([[-7, -8], [-11, -2], [-7, -3]], COL.orange); d.poly([[7, -8], [11, -2], [7, -3]], COL.orange);
    d.line(10, -36, 10, -30, 1.2);
    d.box(-20, -3, 40, 3, COL.steel, 0.5);
  },
  outpost(d, v) {
    d.box(-15, -18, 30, 18, COL.paper, 2);
    d.poly([[-18, -18], [18, -18], [15, -25], [-15, -25]], COL.red);
    d.line(-9, -25, -10, -18, 3, COL.cream); d.line(0, -25, 0, -18, 3, COL.cream); d.line(9, -25, 10, -18, 3, COL.cream);
    d.box(-4, -12, 8, 12, COL.dark, 1);
    d.box(-14, -8, 7, 8, COL.orange, 0.8); d.box(-13, -14, 5, 6, COL.gold, 0.8);
    d.box(8, -7, 7, 7, v % 2 ? COL.blue : COL.green, 0.8);
  },
  sanctuary(d, v) {
    d.box(-14, -4, 28, 4, COL.paper2, 1);
    d.poly([[-9, -4], [-6, -34], [6, -34], [9, -4]], COL.purple);
    d.blob(0, -22, 3.5, 4.5, COL.gold);
    d.dot(0, -22, 1.4, INK);
    d.line(-3, -12, 3, -12, 1.4, COL.lilac);
    d.line(-14, -4, -14, -12, 2); d.blob(-14, -14, 2.4, 2.4, COL.orange);
    d.line(14, -4, 14, -12, 2); d.blob(14, -14, 2.4, 2.4, COL.orange);
  },
  xenolab(d, v) {
    d.box(-13, -4, 26, 4, COL.steel, 0.5);
    d.box(-11, -32, 22, 28, 'rgba(120, 220, 230, .45)', 6);
    d.blob(0, -13, 8, 7, v % 2 ? COL.pink : COL.lilac);
    d.blob(-3, -15, 2.2, 2.6, COL.cream); d.blob(3, -15, 2.2, 2.6, COL.cream);
    d.dot(-2.6, -14.6, 1, INK); d.dot(3.4, -14.6, 1, INK);
    d.line(-5, -21, -7, -25, 1.4); d.line(5, -21, 7, -25, 1.4);
    d.box(-8, -35, 16, 4, COL.steel, 1);
    d.dot(-6, -26, 1.3, COL.cream); d.dot(6, -28, 1, COL.cream);
  },
  freighter(d, v) {
    d.poly([[-20, -12], [10, -14], [20, -8], [10, -2], [-20, -4]], COL.grey);
    d.box(-16, -21, 8, 8, COL.red, 0.8); d.box(-8, -21, 8, 8, COL.gold, 0.8); d.box(0, -21, 8, 8, v % 2 ? COL.blue : COL.green, 0.8);
    d.blob(13, -9, 3, 2.4, COL.teal);
    d.box(-23, -11, 4, 6, COL.steel, 1);
  },
  refinery(d, v) {
    d.box(4, -38, 8, 34, COL.steel, 1);
    d.box(3, -40, 10, 4, COL.dark, 1);
    d.blob(-7, -10, 10, 9, COL.orange);
    d.blob(-7, -12, 6, 3, COL.gold);
    d.box(-18, -4, 36, 4, COL.dark, 0.5);
    d.line(3, -15, -1, -15, 2);
  },
  gate(d, v) {
    d.line(-10, 0, -8, -8, 2.4); d.line(10, 0, 8, -8, 2.4);
    d.blob(0, -21, 15, 15, COL.dark);
    d.blob(0, -21, 10, 10, v % 2 ? COL.purple : COL.blue);
    d.dot(-12, -21, 1.6, COL.gold); d.dot(12, -21, 1.6, COL.gold); d.dot(0, -34, 1.6, COL.gold);
  },
  chrono(d, v) {
    d.box(-11, -38, 22, 4, COL.orange, 1);
    d.box(-11, -4, 22, 4, COL.orange, 1);
    d.poly([[-8, -34], [8, -34], [1.5, -19], [8, -4], [-8, -4], [-1.5, -19]], 'rgba(180, 225, 240, .5)');
    d.poly([[-5, -30], [5, -30], [0, -21]], COL.gold);
    d.poly([[-6, -4], [6, -4], [0, -10]], COL.gold);
    d.line(-10, -34, -10, -4, 1.6); d.line(10, -34, 10, -4, 1.6);
  },
  antimatter(d, v) {
    d.box(-16, -30, 6, 30, COL.steel, 1.5); d.box(10, -30, 6, 30, COL.steel, 1.5);
    d.box(-17, -33, 8, 4, COL.dark, 1); d.box(9, -33, 8, 4, COL.dark, 1);
    d.line(-10, -18, -6, -18, 1.4, COL.pink); d.line(6, -18, 10, -18, 1.4, COL.pink);
    d.box(-20, -3, 40, 3, COL.dark, 0.5);
  },
  dyson(d, v) {
    d.blob(0, -20, 10, 10, COL.gold);
    d.blob(0, -20, 5, 5, '#fff3c4');
    d.arc(0, -20, 16, 16, -2.6, -0.4, null, false, 8);
    d.arc(0, -20, 16, 16, 0.5, 2.2, null, false, 8);
    d.box(-15, -34, 6, 4, COL.steel, 0.5); d.box(10, -10, 6, 4, COL.steel, 0.5); d.box(-18, -12, 5, 4, COL.steel, 0.5);
  },
  probability(d, v) {
    d.box(-12, -6, 24, 6, COL.leaf, 1);
    d.box(-9, -26, 18, 18, COL.cream, 3);
    d.dot(-4, -21, 1.8, INK); d.dot(4, -13, 1.8, INK); d.dot(0, -17, 1.8, v % 2 ? COL.red : INK);
    d.dot(4, -21, 1.8, INK); d.dot(-4, -13, 1.8, INK);
  },
  artifact(d, v) {
    d.box(-9, -10, 18, 10, COL.paper2, 1);
    d.box(-11, -12, 22, 3, COL.paper, 1);
    d.poly([[0, -38], [6, -27], [3, -15], [-4, -21], [-6, -30]], COL.gold);
    d.line(0, -38, 1, -22, 1.2);
  },
  reality(d, v) {
    d.line(-20, -16, -6, -16, 2, COL.cream);
    d.poly([[0, -32], [11, -6], [-11, -6]], 'rgba(200, 230, 255, .6)');
    d.line(6, -18, 20, -26, 2, COL.red); d.line(6, -17, 20, -20, 2, COL.orange);
    d.line(6, -16, 20, -14, 2, COL.gold); d.line(6, -15, 20, -8, 2, COL.blue);
    d.box(-13, -6, 26, 6, COL.dark, 1);
  },
  multiverse(d, v) {
    d.blob(0, -20, 15, 15, 'rgba(190, 170, 255, .35)');
    d.blob(-2, -22, 6, 6, [COL.orange, COL.teal, COL.pink][v % 3]);
    d.arc(-2, -22, 10, 3, 0, Math.PI, null, false, 6);
    d.dot(6, -29, 1.4, COL.cream); d.dot(-8, -12, 1, COL.cream);
  },

  // ─── Iconos ilustrados (mejoras, logros, avisos) ───
  gauntlet(d) {
    d.box(-9, -12, 18, 10, COL.orange, 2);
    d.box(-10, -26, 5, 15, COL.cream, 2.5); d.box(-5, -30, 5, 19, COL.cream, 2.5);
    d.box(0, -29, 5, 18, COL.cream, 2.5); d.box(5, -26, 5, 15, COL.cream, 2.5);
    d.box(-15, -20, 6, 10, COL.cream, 2.5);
    d.line(-8, -6, 8, -6, 1.4);
  },
  supply(d) {
    d.box(-10, -24, 18, 22, COL.cream, 3);
    d.box(-10, -18, 18, 5, COL.red, 1);
    d.arc(9, -14, 6, 6, -Math.PI / 2, Math.PI / 2, null, false, 6);
    d.line(-5, -28, -3, -33, 1.6); d.line(1, -28, 3, -34, 1.6);
  },
  officer(d) {
    d.poly([[-14, -16], [14, -16], [11, -28], [-11, -28]], COL.dark);
    d.box(-16, -16, 32, 5, COL.dark, 2);
    d.poly([[-7, -25], [0, -21], [7, -25], [7, -22], [0, -18], [-7, -22]], COL.gold);
    d.poly([[-14, -11], [10, -11], [15, -6], [-9, -6]], INK);
  },
  anomaly(d) {
    d.poly([[0, -38], [9, -24], [5, -2], [-6, -14], [-9, -26]], COL.gold);
    d.line(0, -38, 1, -16, 1.2);
    d.dot(-12, -34, 1.6, COL.gold); d.dot(12, -10, 1.3, COL.gold);
  },
  bolt(d) { d.poly([[3, -38], [-10, -16], [-1, -16], [-5, 0], [10, -24], [1, -24]], COL.gold); },
  gauge(d) {
    d.arc(0, -8, 16, 16, Math.PI, Math.PI * 2, COL.cream);
    d.arc(0, -8, 16, 16, Math.PI * 1.65, Math.PI * 2, COL.red, true, 4);
    d.line(0, -8, 9, -20, 2.4);
    d.dot(0, -8, 2.4, INK);
  },
  colony(d) {
    d.box(-16, -18, 9, 18, COL.blue, 1); d.box(-6, -30, 10, 30, COL.cream, 1); d.box(5, -22, 10, 22, COL.orange, 1);
    d.dot(-1, -24, 1.2, COL.gold); d.dot(-1, -16, 1.2, COL.gold); d.dot(10, -15, 1.2, INK);
  },
  chip(d) {
    for (let i = -1; i <= 1; i++) { d.line(i * 6, -32, i * 6, -28, 1.6); d.line(i * 6, -6, i * 6, -2, 1.6); d.line(-16, -17 + i * 6, -12, -17 + i * 6, 1.6); d.line(12, -17 + i * 6, 16, -17 + i * 6, 1.6); }
    d.box(-12, -28, 24, 22, COL.dark, 2);
    d.box(-5, -21, 10, 8, COL.teal, 1);
  },
  unity(d) { d.blob(0, -20, 16, 16, COL.dark); d.blob(0, -20, 10, 10, COL.blue); d.blob(0, -20, 4.5, 4.5, COL.gold); },
  news(d) { d.box(-14, -32, 28, 30, COL.cream, 1.5); d.line(-9, -25, 9, -25, 2); d.line(-9, -19, 9, -19, 1.4); d.line(-9, -14, 9, -14, 1.4); d.line(-9, -9, 3, -9, 1.4); },
  trophy(d) {
    d.arc(0, -30, 11, 13, 0, Math.PI, COL.gold);
    d.box(-11, -33, 22, 4, COL.gold, 1);
    d.line(0, -17, 0, -8, 3);
    d.box(-8, -8, 16, 6, COL.dark, 1);
  },
  question(d) { d.blob(0, -20, 15, 15, COL.paper2); },
};

// ─── Partes animadas (se dibujan cada fotograma, sin caché) ───
export const LIVE = {
  sanctuary(ctx, t, i) {
    ctx.strokeStyle = COL.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -40 - Math.sin(t * 2 + i) * 2, 9 * Math.abs(Math.cos(t * 1.4 + i)) + 2, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
  refinery(ctx, t, i) {
    const f = 6 + Math.sin(t * 18 + i * 3) * 2 + Math.random() * 2;
    ctx.fillStyle = COL.orange;
    ctx.beginPath(); ctx.moveTo(4, -40); ctx.quadraticCurveTo(8, -40 - f * 2.2, 12, -40); ctx.fill();
    ctx.fillStyle = COL.gold;
    ctx.beginPath(); ctx.moveTo(6, -40); ctx.quadraticCurveTo(8, -40 - f * 1.3, 10, -40); ctx.fill();
  },
  gate(ctx, t, i) {
    ctx.save();
    ctx.translate(0, -21);
    ctx.rotate(t * 2.5 + i);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(0, 0, 3 + k * 2.4, k * 2, k * 2 + 2.4);
      ctx.stroke();
    }
    ctx.restore();
  },
  antimatter(ctx, t, i) {
    const p = 5 + Math.sin(t * 5 + i) * 1.5;
    const g = ctx.createRadialGradient(0, -18, 0, 0, -18, p * 2.4);
    g.addColorStop(0, 'rgba(255, 220, 240, 1)');
    g.addColorStop(0.4, 'rgba(238, 134, 180, .9)');
    g.addColorStop(1, 'rgba(238, 134, 180, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, -18, p * 2.4, 0, Math.PI * 2); ctx.fill();
  },
  dyson(ctx, t, i) {
    const g = ctx.createRadialGradient(0, -20, 4, 0, -20, 22 + Math.sin(t * 3 + i) * 2);
    g.addColorStop(0, 'rgba(255, 220, 120, .5)');
    g.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, -20, 26, 0, Math.PI * 2); ctx.fill();
  },
  freighter(ctx, t, i) {
    const f = 5 + Math.random() * 4;
    ctx.fillStyle = COL.orange;
    ctx.beginPath(); ctx.moveTo(-23, -11); ctx.lineTo(-23 - f, -8); ctx.lineTo(-23, -5); ctx.fill();
  },
  artifact(ctx, t, i) {
    ctx.strokeStyle = `rgba(244, 190, 62, ${0.6 - ((t * 0.8 + i * 0.3) % 1) * 0.6})`;
    ctx.lineWidth = 1.5;
    const r = 6 + ((t * 0.8 + i * 0.3) % 1) * 14;
    ctx.beginPath(); ctx.ellipse(0, -26, r, r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
  },
  hydro(ctx, t, i) {
    const y = -10 - ((t * 6 + i * 7) % 18);
    ctx.fillStyle = 'rgba(244, 190, 62, .8)';
    ctx.beginPath(); ctx.arc(Math.sin(t + i) * 6, y, 1.2, 0, Math.PI * 2); ctx.fill();
  },
  helium(ctx, t, i) {
    const y = -18 - ((t * 10 + i * 5) % 14);
    ctx.strokeStyle = 'rgba(160, 220, 255, .9)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(14 + Math.sin(t * 3 + i) * 2, y, 1.6, 0, Math.PI * 2); ctx.stroke();
  },
  factory(ctx, t, i) {
    if (Math.sin(t * 9 + i * 1.7) > 0.7) {
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(-6 + (i % 3) * 6, -10, 1.6 + Math.random() * 1.4, 0, Math.PI * 2); ctx.fill();
    }
  },
  chrono(ctx, t, i) {
    ctx.fillStyle = COL.gold;
    const y = -19 + ((t * 20 + i * 3) % 12);
    ctx.fillRect(-0.6, y, 1.2, 2);
  },
  reality(ctx, t, i) {
    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 4 + i);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(11, -6); ctx.lineTo(-11, -6); ctx.fill();
    ctx.globalAlpha = 1;
  },
};

// ─── Caché de imágenes (sprites estáticos) ───
const cache = new Map();

/** Lienzo con el sprite dibujado. `px` es el alto del sprite en píxeles. */
export function spriteCanvas(id, px, { boil = 0, variant = 0, silhouette = false } = {}) {
  const key = `${id}|${px}|${boil}|${variant}|${silhouette}`;
  let c = cache.get(key);
  if (c) return c;
  const draw = SPRITES[id] ?? SPRITES.question;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pad = px * 0.25;
  c = document.createElement('canvas');
  const w = px * 1.25 + pad * 2;
  const h = px * 1.1 + pad * 2;
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  c.cssW = w;
  c.cssH = h;
  c.ax = w / 2;          // ancla: centro abajo del sprite
  c.ay = h - pad;
  const ctx = c.getContext('2d');
  const k = (px / 40) * dpr;
  ctx.setTransform(k, 0, 0, k, c.ax * dpr, c.ay * dpr);
  const lw = Math.max(1.6, 2.4 * (40 / px) * 0.9);
  draw(pen(ctx, hash(id) + boil * 101 + variant * 7, Math.min(lw, 3.2)), variant);
  if (silhouette) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = 'rgba(30, 37, 57, .55)';
    ctx.fillRect(0, 0, c.width, c.height);
  }
  cache.set(key, c);
  return c;
}

const urls = new Map();
/** URL de imagen para usar en <img> (logros, almacén, avisos…). */
export function spriteURL(id, px = 56, opts = {}) {
  const key = `${id}|${px}|${opts.silhouette ? 1 : 0}|${opts.variant ?? 0}`;
  let u = urls.get(key);
  if (!u) {
    // Para miniaturas el lienzo se recorta a un cuadrado centrado en el dibujo.
    const src = spriteCanvas(id, px, opts);
    const dpr = src.width / src.cssW;
    const size = px * 1.15;
    const out = document.createElement('canvas');
    out.width = Math.ceil(size * dpr);
    out.height = Math.ceil(size * dpr);
    const o = out.getContext('2d');
    o.drawImage(src, (src.ax - size / 2) * dpr, (src.ay - px * 0.5 - size / 2) * dpr, size * dpr, size * dpr, 0, 0, out.width, out.height);
    u = out.toDataURL();
    urls.set(key, u);
  }
  return u;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
