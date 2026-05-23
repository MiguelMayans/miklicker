/**
 * Fondo espacial animado con Canvas.
 * 3 capas de estrellas parallax + nebulosas sutiles + polvo estelar.
 */

/** @type {HTMLCanvasElement|null} */
let canvas = null;

/** @type {CanvasRenderingContext2D|null} */
let ctx = null;

let animationId = null;
let width = 0;
let height = 0;

// Configuración de capas
const LAYERS = [
  { count: 100, speed: 0.05, size: 0.5, opacity: 0.3 },   // Lejanas
  { count: 60, speed: 0.15, size: 1.0, opacity: 0.5 },    // Medias
  { count: 30, speed: 0.4, size: 1.8, opacity: 0.8 },     // Cercanas
];

/** @type {Array<{x:number, y:number, layer:number, offset:number}>} */
let stars = [];

/** @type {Array<{x:number, y:number, vx:number, vy:number, size:number, life:number}>} */
let dust = [];

/**
 * Inicializa el canvas de fondo.
 * @param {HTMLElement} container - Elemento donde montar el canvas.
 */
export function initBackground(container) {
  if (canvas) return;

  canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';

  container.insertBefore(canvas, container.firstChild);

  ctx = canvas.getContext('2d');

  resize();
  generateStars();
  generateDust();

  window.addEventListener('resize', resize);

  start();
}

function resize() {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (ctx) {
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}

function generateStars() {
  stars = [];
  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i];
    for (let j = 0; j < layer.count; j++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        layer: i,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }
}

function generateDust() {
  dust = [];
  for (let i = 0; i < 40; i++) {
    dust.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 1.5 + 0.5,
      life: Math.random(),
    });
  }
}

function draw() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, width, height);

  // Fondo base
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.8);
  gradient.addColorStop(0, '#0b1120');
  gradient.addColorStop(0.5, '#070d1a');
  gradient.addColorStop(1, '#02040a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Nebulosas sutiles
  drawNebula(width * 0.3, height * 0.4, 300, 'rgba(100, 50, 180, 0.04)');
  drawNebula(width * 0.7, height * 0.6, 400, 'rgba(30, 100, 160, 0.03)');
  drawNebula(width * 0.5, height * 0.2, 250, 'rgba(180, 60, 100, 0.02)');

  // Estrellas
  const time = Date.now() * 0.001;
  for (const star of stars) {
    const config = LAYERS[star.layer];
    const twinkle = 0.7 + 0.3 * Math.sin(time * 2 + star.offset);
    const alpha = config.opacity * twinkle;

    ctx.beginPath();
    ctx.arc(star.x, star.y, config.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();

    // Mover parallax
    star.x -= config.speed;
    if (star.x < -2) star.x = width + 2;
  }

  // Polvo estelar
  for (const p of dust) {
    p.x += p.vx;
    p.y += p.vy;
    p.life += 0.005;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    const alpha = 0.2 + 0.2 * Math.sin(p.life * 3);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
    ctx.fill();
  }
}

function drawNebula(cx, cy, radius, color) {
  if (!ctx) return;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  draw();
  animationId = requestAnimationFrame(loop);
}

export function start() {
  if (animationId) return;
  loop();
}

export function stop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
