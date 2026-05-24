/**
 * Background.js — Campo de partículas estelar + ambiente mágico.
 * Canvas fijo detrás de todo. Partículas doradas/cálidas + acentos azules.
 * Efectos GSAP sobre elementos DOM para "magia" de dashboard.
 */

import gsap from 'gsap';

let canvas, ctx;
let particles = [];
let width, height;
let animationId;

const PARTICLE_COUNT = 80;
const CONNECTION_DIST = 120;
const WARM_COLORS = ['#f59e0b', '#d97706', '#b45309', '#fef3c7', '#fbbf24'];
const COOL_COLORS = ['#06b6d4', '#60a5fa', '#93c5fd'];

class Particle {
  constructor() {
    this.reset();
    this.y = Math.random() * height; // initial random placement
  }

  reset() {
    this.x = Math.random() * width;
    this.y = height + 10;
    this.size = Math.random() * 2 + 0.5;
    this.speedY = Math.random() * 0.4 + 0.1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.6 + 0.2;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.02 + 0.01;
    this.wobbleAmp = Math.random() * 0.5 + 0.2;
    this.isCool = Math.random() < 0.15;
    this.color = this.isCool
      ? COOL_COLORS[Math.floor(Math.random() * COOL_COLORS.length)]
      : WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)];
  }

  update() {
    this.y -= this.speedY;
    this.wobble += this.wobbleSpeed;
    this.x += this.speedX + Math.sin(this.wobble) * this.wobbleAmp;

    if (this.y < -10 || this.x < -10 || this.x > width + 10) {
      this.reset();
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
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

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONNECTION_DIST) {
        const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = particles[i].isCool || particles[j].isCool ? '#06b6d4' : '#d97706';
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Draw connections first (behind particles)
  drawConnections();

  for (const p of particles) {
    p.update();
    p.draw();
  }

  animationId = requestAnimationFrame(animate);
}

export function initBackground() {
  canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  animate();

  // GSAP ambient glow on main dashboard panel
  const dashboardPanel = document.querySelector('.panel');
  if (dashboardPanel) {
    gsap.to(dashboardPanel, {
      boxShadow: '0 0 40px rgba(37, 99, 235, 0.06), 0 0 80px rgba(245, 158, 11, 0.03)',
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  // Reactor ambient glow pulse
  const reactorImg = document.getElementById('reactor-image');
  if (reactorImg) {
    gsap.to(reactorImg, {
      filter: 'contrast(1.25) drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))',
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  // Subtle ambient float on the reactor container
  const reactorContainer = document.getElementById('reactor-container');
  if (reactorContainer) {
    gsap.to(reactorContainer, {
      y: -4,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }
}
