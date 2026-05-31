/**
 * Starfield Background — Canvas de estrellas parallax.
 * Estrellas a 3 capas de profundidad con estrellas fugaces ocasionales.
 */

const STAR_COUNT = 180;
const LAYERS = 3;

let canvas = null;
let ctx = null;
let stars = [];
let shootingStars = [];
let animFrame = null;
let width = 0;
let height = 0;

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.layer = Math.floor(Math.random() * LAYERS);
    this.size = 0.5 + Math.random() * (this.layer + 1) * 0.8;
    this.speed = 0.02 + this.layer * 0.04;
    this.brightness = 0.3 + Math.random() * 0.7;
    this.twinkleSpeed = 0.5 + Math.random() * 2;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.y += this.speed * dt * 0.06;
    this.twinklePhase += this.twinkleSpeed * dt * 0.001;

    if (this.y > height + 5) {
      this.y = -5;
      this.x = Math.random() * width;
    }
  }

  draw(ctx) {
    const alpha = this.brightness * (0.5 + 0.5 * Math.sin(this.twinklePhase));
    const temp = 0.6 + Math.random() * 0.4;
    const r = 200 + temp * 55;
    const g = 220 + temp * 35;
    const b = 255;

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Brillo difuso para estrellas grandes
    if (this.size > 1.5) {
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.15})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class ShootingStar {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.x = -100;
    this.y = -100;
  }

  spawn() {
    this.x = Math.random() * width * 0.8;
    this.y = Math.random() * height * 0.3;
    this.vx = 3 + Math.random() * 4;
    this.vy = 2 + Math.random() * 2;
    this.length = 20 + Math.random() * 40;
    this.life = 1;
    this.decay = 0.015 + Math.random() * 0.02;
    this.active = true;
  }

  update() {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    if (this.life <= 0 || this.x > width + 100 || this.y > height + 100) {
      this.reset();
    }
  }

  draw(ctx) {
    if (!this.active) return;
    const alpha = this.life;
    const tailX = this.x - this.vx * this.length * 0.3;
    const tailY = this.y - this.vy * this.length * 0.3;

    const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.3, `rgba(200,230,255,${alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(200,230,255,0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    // Cabeza brillante
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  if (canvas) {
    canvas.width = width;
    canvas.height = height;
  }
}

function init() {
  if (document.getElementById('starfield-canvas')) return;

  canvas = document.createElement('canvas');
  canvas.id = 'starfield-canvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.6;
  `;
  document.body.insertBefore(canvas, document.body.firstChild);

  ctx = canvas.getContext('2d');
  resize();

  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
  }

  shootingStars = [];
  for (let i = 0; i < 2; i++) {
    shootingStars.push(new ShootingStar());
  }

  window.addEventListener('resize', resize);
  start();
}

let lastTime = 0;
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  ctx.clearRect(0, 0, width, height);

  // Estrellas
  for (const star of stars) {
    star.update(dt);
    star.draw(ctx);
  }

  // Estrellas fugaces (spawn ocasional)
  if (Math.random() < 0.003) {
    const idle = shootingStars.find((s) => !s.active);
    if (idle) idle.spawn();
  }
  for (const ss of shootingStars) {
    ss.update();
    ss.draw(ctx);
  }

  animFrame = requestAnimationFrame(loop);
}

function start() {
  if (animFrame) cancelAnimationFrame(animFrame);
  lastTime = 0;
  animFrame = requestAnimationFrame(loop);
}

export function initStarfield() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
