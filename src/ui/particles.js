/**
 * Sistema de partículas pixeladas para efectos visuales.
 * Canvas overlay separado del fondo para no mezclar.
 */

import gsap from 'gsap';

/** @type {HTMLCanvasElement|null} */
let canvas = null;

/** @type {CanvasRenderingContext2D|null} */
let ctx = null;

let width = 0;
let height = 0;

/** @type {Array<{x:number, y:number, vx:number, vy:number, size:number, color:string, life:number, maxLife:number}>} */
let particles = [];

let animationId = null;

/**
 * Inicializa el canvas de partículas.
 * @param {HTMLElement} container
 */
export function initParticles(container) {
  if (canvas) return;

  canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';

  container.appendChild(canvas);

  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);

  startLoop();
}

function resize() {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  if (ctx) {
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}

/**
 * Efecto de clic en el reactor: chispas que explotan radialmente.
 * @param {number} x
 * @param {number} y
 * @param {number} amount
 */
export function spawnClickSparks(x, y, amount) {
  const count = Math.min(12, 6 + Math.floor(amount / 5));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1, // ligera tendencia hacia arriba
      size: 2 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#facc15' : '#22d3ee', // amarillo o cyan
      life: 1,
      maxLife: 0.8 + Math.random() * 0.4,
    });
  }
}

/**
 * Efecto de compra de edificio: lluvia de partículas del color del edificio.
 * @param {number} x
 * @param {number} y
 * @param {string} color - Color hex del edificio.
 */
export function spawnPurchaseRain(x, y, color) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 60,
      y: y - 20 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1 + Math.random() * 2,
      size: 2 + Math.random() * 2,
      color,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.5,
    });
  }
}

/**
 * Efecto de desbloqueo: confeti dorado de estrellas.
 * @param {number} x
 * @param {number} y
 */
export function spawnUnlockConfetti(x, y) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color: '#facc15',
      life: 1,
      maxLife: 1.0 + Math.random() * 0.5,
    });
  }
}

function updateAndDraw() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravedad
    p.life -= 0.016; // ~60fps

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;

    // Dibujar como cuadrado pixelado
    const s = p.size;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }

  ctx.globalAlpha = 1;
}

function loop() {
  updateAndDraw();
  animationId = requestAnimationFrame(loop);
}

function startLoop() {
  if (animationId) return;
  loop();
}
