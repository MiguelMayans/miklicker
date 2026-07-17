/**
 * CÁMARA DE IGNICIÓN ESTELAR v2.0
 * Reactor de fusión lineal horizontal con pistones mecánicos,
 * plasma animado, LEDs de estado y barra de presión.
 * Animaciones via GSAP para fluidez y sequencialidad.
 */

import gsap from 'gsap';

let rootEl = null;
let plasmaEl = null;
let pressureFillEl = null;
let pressureTextEl = null;
let pulseContainer = null;
let ledEls = [];
let stageTitleEl = null;

// Tween continuo del plasma
let plasmaTween = null;

// ─── ESTADIOS VISUALES DEL REACTOR ───
// Cada etapa desbloquea nuevos componentes visuales y renombra la cámara.
const REACTOR_STAGES = [
  { threshold: 0, name: 'Cámara de Ignición Estelar // SECC-01', label: 'MK-I' },
  { threshold: 1_000, name: 'Cámara de Plasma Refinado // SECC-02', label: 'MK-II' },
  { threshold: 50_000, name: 'Cámara de Fusión Estelar // SECC-03', label: 'MK-III' },
  { threshold: 1_000_000, name: 'Cámara Cuántica Estelar // SECC-04', label: 'MK-IV' },
  { threshold: 100_000_000, name: 'Cámara de Singularidad // SECC-05', label: 'MK-V' },
];

let currentStageIndex = -1;

export function initReactor(container) {
  container.innerHTML = '';

  const root = document.createElement('div');
  root.id = 'star-chamber-v2';
  root.className = 'w-full h-full flex flex-col items-center justify-center select-none gap-4';

  root.innerHTML = `
    <!-- CONSOLA SUPERIOR: LEDs + Título -->
    <div class="w-full max-w-[560px] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex gap-1.5 p-1.5 border-[2px] border-[#111111] bg-[#d4d0c8]">
          <div class="reactor-led w-3 h-3 rounded-full bg-[#16a34a]" data-led="0"></div>
          <div class="reactor-led w-3 h-3 rounded-full bg-[#16a34a]" data-led="1"></div>
          <div class="reactor-led w-3 h-3 rounded-full bg-[#16a34a]" data-led="2"></div>
          <div class="reactor-led w-3 h-3 rounded-full bg-[#16a34a]" data-led="3"></div>
          <div class="reactor-led w-3 h-3 rounded-full bg-[#16a34a]" data-led="4"></div>
        </div>
        <span id="reactor-stage-label" class="text-[10px] font-extrabold text-[#06b6d4] uppercase tracking-[0.15em] border-[2px] border-black px-1.5 py-0.5 bg-[#111111]">MK-I</span>
      </div>
      <span id="reactor-stage-title" class="text-[10px] font-extrabold text-[#777777] uppercase tracking-[0.15em]">Cámara de Ignición Estelar // SECC-01</span>
    </div>

    <!-- ZONA DE PISTONES -->
    <div class="w-full max-w-[560px] relative h-12 flex justify-center gap-12">
      <div class="piston-unit relative flex flex-col items-center" data-piston="0">
        <!-- Alojamiento / cilindro fijo -->
        <div class="piston-housing w-14 h-10 bg-[#555555] border-[2px] border-[#111111] rounded-sm relative z-0 overflow-hidden" style="background: linear-gradient(180deg, #666666 0%, #555555 40%, #444444 100%);">
          <!-- Ranuras decorativas -->
          <div class="absolute top-1 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-3 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <!-- Tornillos laterales -->
          <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
          <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
        </div>
        <!-- Vástago (rod) -->
        <div class="piston-rod w-4 h-5 bg-[#999999] border-x-[2px] border-[#111111] relative z-10" style="background: linear-gradient(90deg, #888888, #bbbbbb, #888888);"></div>
        <!-- Cabezal de impacto -->
        <div class="piston-cap w-12 h-5 bg-[#444444] border-[2px] border-[#111111] rounded-sm relative z-20 flex items-center justify-center" style="background: linear-gradient(180deg, #555555, #333333);">
          <div class="w-8 h-[2px] bg-[#111111] opacity-40"></div>
        </div>
        <!-- Anillo de sellado -->
        <div class="piston-seal w-16 h-2 bg-[#333333] border-[2px] border-[#111111] rounded-sm relative z-10 mt-[-2px]" style="background: linear-gradient(180deg, #444444, #222222);"></div>
        <!-- Flash de impacto -->
        <div class="piston-strike absolute bottom-[-2px] w-8 h-2 bg-white opacity-0 rounded-full blur-[3px] z-30"></div>
        <!-- Chispa al impacto -->
        <div class="piston-spark absolute bottom-[-2px] w-1 h-1 bg-[#facc15] opacity-0 rounded-full z-30" style="box-shadow: 0 0 6px #facc15;"></div>
      </div>
      <div class="piston-unit relative flex flex-col items-center" data-piston="1">
        <div class="piston-housing w-14 h-10 bg-[#555555] border-[2px] border-[#111111] rounded-sm relative z-0 overflow-hidden" style="background: linear-gradient(180deg, #666666 0%, #555555 40%, #444444 100%);">
          <div class="absolute top-1 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-3 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
          <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
        </div>
        <div class="piston-rod w-4 h-5 bg-[#999999] border-x-[2px] border-[#111111] relative z-10" style="background: linear-gradient(90deg, #888888, #bbbbbb, #888888);"></div>
        <div class="piston-cap w-12 h-5 bg-[#444444] border-[2px] border-[#111111] rounded-sm relative z-20 flex items-center justify-center" style="background: linear-gradient(180deg, #555555, #333333);">
          <div class="w-8 h-[2px] bg-[#111111] opacity-40"></div>
        </div>
        <div class="piston-seal w-16 h-2 bg-[#333333] border-[2px] border-[#111111] rounded-sm relative z-10 mt-[-2px]" style="background: linear-gradient(180deg, #444444, #222222);"></div>
        <div class="piston-strike absolute bottom-[-2px] w-8 h-2 bg-white opacity-0 rounded-full blur-[3px] z-30"></div>
        <div class="piston-spark absolute bottom-[-2px] w-1 h-1 bg-[#facc15] opacity-0 rounded-full z-30" style="box-shadow: 0 0 6px #facc15;"></div>
      </div>
      <div class="piston-unit relative flex flex-col items-center" data-piston="2">
        <div class="piston-housing w-14 h-10 bg-[#555555] border-[2px] border-[#111111] rounded-sm relative z-0 overflow-hidden" style="background: linear-gradient(180deg, #666666 0%, #555555 40%, #444444 100%);">
          <div class="absolute top-1 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-3 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
          <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
        </div>
        <div class="piston-rod w-4 h-5 bg-[#999999] border-x-[2px] border-[#111111] relative z-10" style="background: linear-gradient(90deg, #888888, #bbbbbb, #888888);"></div>
        <div class="piston-cap w-12 h-5 bg-[#444444] border-[2px] border-[#111111] rounded-sm relative z-20 flex items-center justify-center" style="background: linear-gradient(180deg, #555555, #333333);">
          <div class="w-8 h-[2px] bg-[#111111] opacity-40"></div>
        </div>
        <div class="piston-seal w-16 h-2 bg-[#333333] border-[2px] border-[#111111] rounded-sm relative z-10 mt-[-2px]" style="background: linear-gradient(180deg, #444444, #222222);"></div>
        <div class="piston-strike absolute bottom-[-2px] w-8 h-2 bg-white opacity-0 rounded-full blur-[3px] z-30"></div>
        <div class="piston-spark absolute bottom-[-2px] w-1 h-1 bg-[#facc15] opacity-0 rounded-full z-30" style="box-shadow: 0 0 6px #facc15;"></div>
      </div>
      <div class="piston-unit relative flex flex-col items-center" data-piston="3">
        <div class="piston-housing w-14 h-10 bg-[#555555] border-[2px] border-[#111111] rounded-sm relative z-0 overflow-hidden" style="background: linear-gradient(180deg, #666666 0%, #555555 40%, #444444 100%);">
          <div class="absolute top-1 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-3 left-1 right-1 h-[2px] bg-[#111111] opacity-30"></div>
          <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
          <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#333333] border border-[#111111]"></div>
        </div>
        <div class="piston-rod w-4 h-5 bg-[#999999] border-x-[2px] border-[#111111] relative z-10" style="background: linear-gradient(90deg, #888888, #bbbbbb, #888888);"></div>
        <div class="piston-cap w-12 h-5 bg-[#444444] border-[2px] border-[#111111] rounded-sm relative z-20 flex items-center justify-center" style="background: linear-gradient(180deg, #555555, #333333);">
          <div class="w-8 h-[2px] bg-[#111111] opacity-40"></div>
        </div>
        <div class="piston-seal w-16 h-2 bg-[#333333] border-[2px] border-[#111111] rounded-sm relative z-10 mt-[-2px]" style="background: linear-gradient(180deg, #444444, #222222);"></div>
        <div class="piston-strike absolute bottom-[-2px] w-8 h-2 bg-white opacity-0 rounded-full blur-[3px] z-30"></div>
        <div class="piston-spark absolute bottom-[-2px] w-1 h-1 bg-[#facc15] opacity-0 rounded-full z-30" style="box-shadow: 0 0 6px #facc15;"></div>
      </div>
    </div>

    <!-- TUBO DE CONTENCIÓN CON PLASMA -->
    <div class="relative w-full max-w-[560px]">
      <!-- Marco exterior (bezel) -->
      <div class="relative w-full h-24 lg:h-28">
        <!-- Carcasa gruesa -->
        <div class="absolute inset-0 border-[4px] border-[#111111] bg-[#d4d0c8] rounded-sm"></div>
        <!-- Línea decorativa interior -->
        <div class="absolute inset-[6px] border-[2px] border-[#111111] rounded-sm overflow-hidden">

          <!-- PLASMA -->
          <div
            id="reactor-plasma"
            class="absolute inset-0"
            style="background: linear-gradient(90deg, #083344 0%, #0e7490 25%, #06b6d4 50%, #22d3ee 55%, #0e7490 75%, #083344 100%);"
          >
            <!-- Glow de plasma -->
            <div class="absolute inset-0" style="box-shadow: inset 0 0 30px rgba(6,182,212,0.3);"></div>

            <!-- Líneas de escaneo verticales sutiles -->
            <div class="absolute inset-0" style="background: repeating-linear-gradient(90deg, transparent 0px, transparent 59px, rgba(0,0,0,0.15) 59px, rgba(0,0,0,0.15) 60px);"></div>

            <!-- Líneas de escaneo horizontales (CRT) -->
            <div class="absolute inset-0" style="background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px);"></div>

            <!-- Brillo central pulsante -->
            <div id="plasma-core" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[60%] rounded-full" style="background: radial-gradient(ellipse, rgba(165,243,252,0.35), transparent 70%);"></div>

            <!-- Partículas de plasma -->
            <div id="plasma-particles" class="absolute inset-0 pointer-events-none overflow-hidden"></div>

            <!-- Onda de choque al click -->
            <div id="plasma-shockwave" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 rounded-full pointer-events-none" style="border: 2px solid rgba(165,243,252,0.9); box-shadow: 0 0 20px rgba(165,243,252,0.5);"></div>

            <!-- Moving highlight — reflejo de luz que viaja por el tubo (Starfield vibes) -->
            <div id="plasma-highlight" class="absolute top-0 bottom-0 w-[60px] pointer-events-none" style="background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(165,243,252,0.25) 50%, rgba(255,255,255,0.12) 60%, transparent 100%); left: -60px;"></div>
          </div>
        </div>

        <!-- TORNILLOS de esquina (prominentes) -->
        <div class="absolute top-1 left-1 w-2.5 h-2.5 bg-[#111111] rounded-full border border-[#777777]"></div>
        <div class="absolute top-1 right-1 w-2.5 h-2.5 bg-[#111111] rounded-full border border-[#777777]"></div>
        <div class="absolute bottom-1 left-1 w-2.5 h-2.5 bg-[#111111] rounded-full border border-[#777777]"></div>
        <div class="absolute bottom-1 right-1 w-2.5 h-2.5 bg-[#111111] rounded-full border border-[#777777]"></div>

        <!-- Graduaciones en el bezel inferior -->
        <div class="absolute bottom-[-10px] left-[6px] right-[6px] flex justify-between px-2">
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
          <div class="w-[2px] h-2 bg-[#111111]"></div>
        </div>
      </div>

      <!-- Contenedor de pulsos (auto-click) -->
      <div id="pulse-container" class="absolute inset-[6px] pointer-events-none overflow-hidden z-30"></div>

      <!-- STAGE 2: Bobinas de refrigeración laterales -->
      <div id="stage-coils" class="absolute inset-y-0 left-[-14px] right-[-14px] pointer-events-none opacity-0 z-20">
        <div class="absolute top-0 bottom-0 left-0 w-3 border-y-[3px] border-l-[3px] border-black bg-[#d4d0c8]" style="background: repeating-linear-gradient(0deg, #555555 0px, #555555 3px, #d4d0c8 3px, #d4d0c8 6px);"></div>
        <div class="absolute top-0 bottom-0 right-0 w-3 border-y-[3px] border-r-[3px] border-black bg-[#d4d0c8]" style="background: repeating-linear-gradient(0deg, #555555 0px, #555555 3px, #d4d0c8 3px, #d4d0c8 6px);"></div>
      </div>

      <!-- STAGE 3: Anillo de confinamiento magnético -->
      <div id="stage-ring" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] rounded-full border-[3px] border-dashed border-[#06b6d4] opacity-0 pointer-events-none z-20" style="box-shadow: 0 0 0 4px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1);"></div>

      <!-- STAGE 4: Estabilizadores cuánticos (orbs) -->
      <div id="stage-orbs" class="absolute inset-0 pointer-events-none opacity-0 z-20">
        <div class="stage-orb absolute top-1/2 left-[12%] w-2.5 h-2.5 rounded-full bg-[#a855f7] border border-black" style="box-shadow: 0 0 8px #a855f7;"></div>
        <div class="stage-orb absolute top-1/2 right-[12%] w-2.5 h-2.5 rounded-full bg-[#a855f7] border border-black" style="box-shadow: 0 0 8px #a855f7;"></div>
        <div class="stage-orb absolute top-[18%] left-1/2 w-2 h-2 rounded-full bg-[#22d3ee] border border-black" style="box-shadow: 0 0 8px #22d3ee;"></div>
        <div class="stage-orb absolute bottom-[18%] left-1/2 w-2 h-2 rounded-full bg-[#22d3ee] border border-black" style="box-shadow: 0 0 8px #22d3ee;"></div>
      </div>

      <!-- STAGE 5: Núcleo de singularidad -->
      <div id="stage-singularity" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full opacity-0 pointer-events-none z-20" style="background: radial-gradient(circle, rgba(239,68,68,0.9) 0%, rgba(0,0,0,0.85) 55%, transparent 70%); box-shadow: 0 0 20px rgba(239,68,68,0.5), inset 0 0 10px rgba(0,0,0,0.8);"></div>
    </div>

    <!-- BARRA DE PRESIÓN -->
    <div class="w-full max-w-[560px] flex items-center gap-3">
      <span class="text-[10px] font-extrabold text-[#777777] uppercase tracking-wider shrink-0 w-14">Presión</span>
      <div class="flex-1 h-4 border-[3px] border-[#111111] bg-[#d4d0c8] relative overflow-hidden">
        <!-- Marcas de la barra -->
        <div class="absolute inset-0 flex justify-between px-0.5">
          <div class="w-[2px] h-full bg-[#111111] opacity-10"></div>
          <div class="w-[2px] h-full bg-[#111111] opacity-10"></div>
          <div class="w-[2px] h-full bg-[#111111] opacity-10"></div>
          <div class="w-[2px] h-full bg-[#111111] opacity-10"></div>
          <div class="w-[2px] h-full bg-[#111111] opacity-10"></div>
        </div>
        <div id="pressure-fill" class="h-full relative z-10" style="width: 0%; background: linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee); transition: width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);"></div>
      </div>
      <span id="pressure-text" class="text-[10px] font-extrabold text-[#06b6d4] tabular-nums shrink-0 w-8 text-right">0%</span>
    </div>
  `;

  container.appendChild(root);
  rootEl = root;

  plasmaEl = document.getElementById('reactor-plasma');
  pressureFillEl = document.getElementById('pressure-fill');
  pressureTextEl = document.getElementById('pressure-text');
  pulseContainer = document.getElementById('pulse-container');
  ledEls = root.querySelectorAll('.reactor-led');
  stageTitleEl = document.getElementById('reactor-stage-title');

  // Animación continua del plasma (brillo central respirando)
  startPlasmaIdle();

  // Spawnear partículas de plasma periódicamente
  startPlasmaParticles();

  // Animaciones de los elementos de etapa avanzada
  startStageAnimations();
}

// ─── ANIMACIONES CONTINUAS ───

function startPlasmaIdle() {
  const core = document.getElementById('plasma-core');
  if (!core) return;

  // Brillo central respirando
  plasmaTween = gsap.to(core, {
    opacity: 0.4,
    scale: 0.85,
    duration: 1.8,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });

  // Moving highlight — reflejo de luz que viaja por el tubo (Starfield vibes)
  const highlight = document.getElementById('plasma-highlight');
  if (highlight) {
    gsap.to(highlight, {
      left: '100%',
      duration: 3.5,
      ease: 'none',
      repeat: -1,
      repeatDelay: 1.5,
    });
  }
}

function startPlasmaParticles() {
  if (!plasmaEl) return;

  const spawn = () => {
    if (!plasmaEl) return;
    const particle = document.createElement('div');
    const size = 2 + Math.random() * 3;
    const top = 10 + Math.random() * 80;
    particle.style.cssText = `
      position: absolute;
      left: 0;
      top: ${top}%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(165, 243, 252, ${0.4 + Math.random() * 0.4});
      box-shadow: 0 0 ${4 + Math.random() * 4}px rgba(165,243,252,0.6);
      pointer-events: none;
    `;
    plasmaEl.appendChild(particle);

    gsap.to(particle, {
      left: '100%',
      duration: 1.5 + Math.random() * 2,
      ease: 'none',
      onComplete: () => particle.remove(),
    });
  };

  const interval = setInterval(spawn, 400);
  // Limpiar si el componente se desmonta
  return () => clearInterval(interval);
}

function startStageAnimations() {
  if (!rootEl) return;

  // Anillo de confinamiento magnético: rotación lenta continua
  const ring = document.getElementById('stage-ring');
  if (ring) {
    gsap.to(ring, {
      rotation: 360,
      duration: 20,
      ease: 'none',
      repeat: -1,
      transformOrigin: '50% 50%',
    });
  }

  // Órbitas de los estabilizadores cuánticos
  const orbs = rootEl.querySelectorAll('.stage-orb');
  orbs.forEach((orb, i) => {
    const isVertical = i >= 2;
    gsap.to(orb, {
      [isVertical ? 'y' : 'x']: isVertical ? (i === 2 ? 14 : -14) : (i === 0 ? 18 : -18),
      duration: 1.6 + i * 0.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  });

  // Singularidad: pulso lento amenazante
  const singularity = document.getElementById('stage-singularity');
  if (singularity) {
    gsap.to(singularity, {
      scale: 1.15,
      opacity: 0.85,
      duration: 1.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }
}

// ─── ACTUALIZACIÓN DE ETAPA DEL REACTOR ───

export function updateReactorStage(energy) {
  if (!rootEl) return;

  // Encontrar la etapa actual según energía acumulada en el banco
  let stageIndex = 0;
  for (let i = REACTOR_STAGES.length - 1; i >= 0; i--) {
    if (energy >= REACTOR_STAGES[i].threshold) {
      stageIndex = i;
      break;
    }
  }

  // Actualizar título y badge
  const stage = REACTOR_STAGES[stageIndex];
  const labelEl = document.getElementById('reactor-stage-label');
  if (labelEl) labelEl.textContent = stage.label;
  if (stageTitleEl) stageTitleEl.textContent = stage.name;

  // Si no hay cambio de etapa, no animar revelado
  if (stageIndex <= currentStageIndex) {
    currentStageIndex = stageIndex;
    return;
  }

  const previousStage = currentStageIndex;
  currentStageIndex = stageIndex;

  // Revelar componentes nuevos con GSAP
  const reveals = [];
  if (stageIndex >= 1) reveals.push(document.getElementById('stage-coils'));
  if (stageIndex >= 2) reveals.push(document.getElementById('stage-ring'));
  if (stageIndex >= 3) reveals.push(document.getElementById('stage-orbs'));
  if (stageIndex >= 4) reveals.push(document.getElementById('stage-singularity'));

  reveals.forEach((el, i) => {
    if (!el) return;
    gsap.to(el, {
      opacity: 1,
      duration: 0.8,
      delay: i * 0.15,
      ease: 'power2.out',
    });
  });

  // Efecto de "power-up" del plasma al subir de etapa
  if (plasmaEl && previousStage >= 0) {
    gsap.fromTo(
      plasmaEl,
      { filter: 'brightness(2.5) saturate(1.8)' },
      { filter: 'brightness(1) saturate(1)', duration: 1.2, ease: 'power2.out' }
    );
  }
}

// ─── EVENTOS DEL REACTOR ───

export function triggerReactorClick(opts = {}) {
  if (!rootEl) return;

  const intensity = opts.intensity ?? 1;
  const isCrit = !!opts.isCrit;

  // Pistones: timeline secuencial con stagger
  const units = rootEl.querySelectorAll('.piston-unit');
  const tl = gsap.timeline();

  // En crítico: bajada más larga, stagger más rápido para impacto brutal
  const downY = 16 + (isCrit ? 8 : 0) + intensity * 4;
  const downDur = isCrit ? 0.04 : 0.05;
  const stagger = isCrit ? 0.035 : 0.06;

  units.forEach((unit, i) => {
    const cap = unit.querySelector('.piston-cap');
    const rod = unit.querySelector('.piston-rod');
    const strike = unit.querySelector('.piston-strike');
    const spark = unit.querySelector('.piston-spark');

    // BAJADA: cabezal + vástago golpean hacia abajo
    tl.to(
      [cap, rod],
      {
        y: downY,
        duration: downDur,
        ease: 'power4.in',
      },
      i * stagger
    );

    // Flash de impacto blanco (más intenso en crítico)
    tl.to(
      strike,
      {
        opacity: isCrit ? 1 : 0.95,
        scale: isCrit ? 2.2 : 1.5,
        duration: 0.03,
        ease: 'none',
      },
      i * stagger + 0.04
    );

    // Chispa (gold en normal, roja en crítico)
    tl.to(
      spark,
      {
        opacity: 1,
        scale: isCrit ? 4 : 3,
        duration: 0.04,
        ease: 'power2.out',
      },
      i * stagger + 0.04
    );

    // SUBIDA: rebote elástico pesado
    tl.to(
      [cap, rod],
      {
        y: 0,
        duration: isCrit ? 0.28 : 0.22,
        ease: 'elastic.out(1, 0.45)',
      },
      i * stagger + 0.06
    );

    // Fade out del flash
    tl.to(
      strike,
      { opacity: 0, scale: 1, duration: 0.18, ease: 'power2.out' },
      i * stagger + 0.06
    );

    // Fade out de la chispa (tinte rojo si crit)
    tl.to(
      spark,
      {
        opacity: 0,
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
        backgroundColor: isCrit ? '#ef4444' : '#facc15',
      },
      i * stagger + 0.08
    );
  });

  // Plasma: shockwave horizontal (más grande en crítico)
  const shock = document.getElementById('plasma-shockwave');
  if (shock) {
    if (isCrit) {
      shock.style.borderColor = 'rgba(250,204,21,0.95)';
      shock.style.boxShadow = '0 0 30px rgba(250,204,21,0.7)';
    } else {
      shock.style.borderColor = 'rgba(165,243,252,0.9)';
      shock.style.boxShadow = '0 0 20px rgba(165,243,252,0.5)';
    }
    gsap.fromTo(
      shock,
      { width: 10, height: 10, opacity: 1 },
      {
        width: isCrit ? 620 : 500,
        height: isCrit ? 110 : 80,
        opacity: 0,
        duration: isCrit ? 0.6 : 0.5,
        ease: 'power2.out',
      }
    );
  }

  // Brillo intenso del plasma (más fuerte en crítico)
  if (plasmaEl) {
    const brightness = isCrit ? 'brightness(2) saturate(1.5)' : 'brightness(1.5) saturate(1.3)';
    gsap.to(plasmaEl, {
      filter: brightness,
      duration: 0.08,
      ease: 'none',
      onComplete: () => {
        gsap.to(plasmaEl, {
          filter: 'brightness(1) saturate(1)',
          duration: isCrit ? 0.4 : 0.3,
          ease: 'power2.out',
        });
      },
    });
  }
}

export function triggerAutoClickPulse() {
  if (!pulseContainer) return;

  const pulse = document.createElement('div');
  pulse.style.cssText = `
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(250, 204, 21, 0.95);
    box-shadow: 0 0 10px rgba(250, 204, 21, 0.7), 0 0 20px rgba(250, 204, 21, 0.4);
    pointer-events: none;
  `;
  pulseContainer.appendChild(pulse);

  gsap.to(pulse, {
    left: '100%',
    opacity: 0.3,
    scale: 0.5,
    duration: 0.7,
    ease: 'power1.out',
    onComplete: () => pulse.remove(),
  });
}

// ─── ACTUALIZACIONES DE ESTADO ───

export function updateReactorPressure(energy) {
  if (!pressureFillEl || !pressureTextEl) return;

  const logVal = Math.log10(Math.max(1, energy + 1));
  const percent = Math.min(95, Math.max(0, (logVal / 10) * 95));

  pressureFillEl.style.width = `${percent}%`;
  pressureTextEl.textContent = `${percent.toFixed(0)}%`;
}

export function updateReactorTemperature(heatRatio) {
  if (!plasmaEl) return;

  heatRatio = Math.max(0, Math.min(1, heatRatio));

  let targetGradient;
  if (heatRatio > 0.7) {
    targetGradient = 'linear-gradient(90deg, #450a0a 0%, #991b1b 25%, #dc2626 50%, #ef4444 55%, #991b1b 75%, #450a0a 100%)';
  } else if (heatRatio > 0.4) {
    targetGradient = 'linear-gradient(90deg, #431407 0%, #92400e 25%, #f59e0b 50%, #fbbf24 55%, #92400e 75%, #431407 100%)';
  } else {
    targetGradient = 'linear-gradient(90deg, #083344 0%, #0e7490 25%, #06b6d4 50%, #22d3ee 55%, #0e7490 75%, #083344 100%)';
  }

  gsap.to(plasmaEl, {
    background: targetGradient,
    duration: 0.8,
    ease: 'power2.inOut',
  });
}

export function updateReactorLEDs(status) {
  if (!ledEls.length) return;

  const colorMap = {
    stable: '#16a34a',
    warning: '#f59e0b',
    critical: '#dc2626',
    overload: '#dc2626',
  };
  const color = colorMap[status] || '#16a34a';

  ledEls.forEach((led, i) => {
    gsap.to(led, {
      backgroundColor: color,
      boxShadow: `0 0 ${status === 'critical' ? 10 : 6}px ${color}`,
      duration: 0.3,
      delay: i * 0.05,
    });
  });

  // Si es crítico, parpadear
  if (status === 'critical' || status === 'overload') {
    gsap.to(ledEls, {
      opacity: 0.3,
      duration: 0.25,
      yoyo: true,
      repeat: 3,
      stagger: 0.05,
    });
  }
}
