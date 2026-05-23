/**
 * Renderer principal — Diseño integrado tipo Dashboard Espacial.
 * Layout moderno: sin header fijo rígido, paneles flotantes con aire,
 * reactor prominente, y todo fluye con scroll natural.
 */

import { getState } from '../state.js';
import { calculateTotalProduction, calculateClickPower } from '../engine/formulas.js';
import { BUILDINGS_BY_ID } from '../data/buildings.js';
import { formatNumber, formatRate } from '../utils/numbers.js';
import { on } from '../utils/eventBus.js';
import { handleReactorClick } from '../mechanics/clicker.js';
import { initShop, refreshShopAffordability } from './shop.js';
import { initUpgrades, refreshUpgrades } from './upgrades.js';
import { initLog, addRandomLog } from './log.js';
import { initBackground } from './canvasBackground.js';
import { initParticles } from './particles.js';
import { initMilestonePopup } from './milestonePopup.js';
import { checkMilestones } from '../engine/milestones.js';
import { spawnFloatingNumber } from './animations.js';

import gsap from 'gsap';

let app = null;
let energyDisplay = null;
let rateDisplay = null;

const HEADER_UPDATE_INTERVAL = 200;
let lastHeaderUpdate = 0;

export function initUI() {
  app = document.getElementById('app');
  if (!app) return;

  initBackground(app);
  initParticles(app);
  initMilestonePopup(app);
  addCRTOverlays(app);

  renderLayout();
  bindEvents();
  updateHeader();

  addRandomLog('first_click', {}, 'info');
}

function addCRTOverlays(container) {
  const overlay = document.createElement('div');
  overlay.className = 'crt-overlay';
  container.appendChild(overlay);

  const chromatic = document.createElement('div');
  chromatic.className = 'crt-chromatic';
  container.appendChild(chromatic);
}

function renderLayout() {
  app.innerHTML = `
    <!-- Main Container -->
    <div class="relative z-10 w-full max-w-[1400px] mx-auto pt-10 lg:pt-16 pb-4 lg:pb-8 px-4 lg:px-6 flex flex-col gap-6">

      <!-- Top Section: Header integrado -->
      <header class="flex items-center justify-between">
        <!-- Left: Logo + Title -->
        <div class="flex items-center gap-3">
          <!-- Logo SVG estilizado -->
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-glow/10 to-transparent border border-cyan-glow/20 flex items-center justify-center relative overflow-hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="relative z-10">
              <circle cx="12" cy="12" r="4" fill="#22d3ee" fill-opacity="0.8"/>
              <circle cx="12" cy="12" r="7" stroke="#22d3ee" stroke-opacity="0.4" stroke-width="1"/>
              <circle cx="12" cy="12" r="10" stroke="#22d3ee" stroke-opacity="0.2" stroke-width="0.5" stroke-dasharray="2 2"/>
              <circle cx="17" cy="7" r="1.5" fill="#facc15" fill-opacity="0.9"/>
            </svg>
            <div class="absolute inset-0 bg-cyan-glow/5 blur-md"></div>
          </div>
          <div>
            <h1 class="font-pixel text-xl text-cyan-pale tracking-widest drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]">COLONIA ESTELAR</h1>
            <p class="text-xs text-cosmic-500 tracking-wider mt-0.5">Simulador de Energía</p>
          </div>
        </div>

        <!-- Center: Energy Display (elemento dominante) -->
        <div class="absolute left-1/2 -translate-x-1/2 text-center hidden sm:block">
          <div id="energy-display" class="font-pixel text-2xl lg:text-3xl text-energy energy-glow tabular-nums">
            ⚡ 0
          </div>
          <div class="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20">
            <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span id="rate-display" class="text-sm text-cyan-glow font-sans tracking-wider font-semibold">
              +0.0/s
            </span>
          </div>
        </div>

        <!-- Right: Stats mini -->
        <div class="flex items-center gap-4 text-right">
          <div class="hidden md:block">
            <p class="text-[9px] text-cosmic-500 uppercase tracking-wider">Poder de Clic</p>
            <p id="click-power-display" class="font-pixel text-[10px] text-cyan-pale mt-0.5">1</p>
          </div>
          <div class="hidden lg:block">
            <p class="text-[9px] text-cosmic-500 uppercase tracking-wider">Edificios</p>
            <p id="buildings-count" class="font-pixel text-[10px] text-cyan-pale mt-0.5">0</p>
          </div>
        </div>
      </header>

      <!-- Mobile Energy (solo visible en móvil) -->
      <div class="sm:hidden text-center -mt-2">
        <div id="energy-display-mobile" class="font-pixel text-xl text-energy energy-glow">
          ⚡ 0
        </div>
        <div class="inline-flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20">
          <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span id="rate-display-mobile" class="text-sm text-cyan-glow font-sans tracking-wider font-semibold">
            +0.0/s
          </span>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

        <!-- Left Column: Log (2 cols) -->
        <aside class="hidden lg:block lg:col-span-3">
          <div class="glass rounded-2xl p-5 h-full max-h-[calc(100vh-10rem)] flex flex-col">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-cyan-glow/60 animate-pulse"></div>
              <h2 class="font-pixel text-[9px] text-cosmic-500 uppercase tracking-widest">Registro de Eventos</h2>
            </div>
            <div id="log-container" class="flex-1 overflow-y-auto space-y-2 min-h-0 pr-2"></div>
          </div>
        </aside>

        <!-- Center Column: Reactor (6 cols en desktop, full en móvil) -->
        <section class="lg:col-span-6 flex flex-col items-center justify-start pt-4 lg:pt-8">
          <!-- Anillos decorativos (contenido dentro del flujo, no absolute) -->
          <div class="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-6">
            <!-- Ring 1 -->
            <div class="absolute w-full h-full rounded-full border border-cyan-glow/[0.08] animate-ring-rotate"></div>
            <!-- Ring 2 -->
            <div class="absolute w-[85%] h-[85%] rounded-full border border-dashed border-cyan-glow/[0.05] animate-ring-rotate-reverse"></div>
            <!-- Ring 3 -->
            <div class="absolute w-[70%] h-[70%] rounded-full border border-energy/[0.06]" style="animation: ringRotate 15s linear infinite;"></div>

            <!-- Reactor -->
            <div class="relative group cursor-pointer select-none z-10" id="reactor-container">
              <div class="absolute inset-0 bg-cyan-glow/10 rounded-full blur-3xl group-hover:bg-cyan-glow/15 transition-all duration-700"></div>
              <img
                id="reactor-image"
                src="sprites/generator.png"
                alt="Reactor de Fusión"
                class="relative w-36 h-36 md:w-44 md:h-44 pixelated animate-glow-pulse transition-all duration-150 active:scale-95 group-hover:scale-105"
                draggable="false"
              />
            </div>
          </div>

          <!-- Info debajo del reactor -->
          <div class="text-center space-y-1">
            <p class="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-medium">Reactor de Fusión</p>
            <p class="text-[10px] text-cyan-dim/50">Clica para generar energía estelar</p>
          </div>

          <!-- Botones de acción -->
          <div class="mt-8 flex gap-3">
            <button
              id="export-btn"
              class="text-[10px] text-cosmic-500 hover:text-cyan-glow transition-all px-4 py-2 rounded-xl border border-white/5 hover:border-cyan-glow/20 hover:bg-cyan-glow/5"
            >
              Exportar
            </button>
            <button
              id="reset-btn"
              class="text-[10px] text-mars-dim/50 hover:text-mars/70 transition-all px-4 py-2 rounded-xl border border-white/5 hover:border-mars/20 hover:bg-mars/5"
            >
              Reiniciar
            </button>
          </div>
        </section>

        <!-- Right Column: Shop + Upgrades (3 cols) -->
        <aside class="lg:col-span-3">
          <div class="glass rounded-2xl flex flex-col h-auto lg:max-h-[calc(100vh-10rem)]">
            <!-- Tabs -->
            <div class="flex border-b border-white/[0.06]">
              <button id="tab-shop" class="flex-1 px-4 py-3.5 font-pixel text-[9px] text-cyan-pale bg-white/[0.04] border-b-2 border-cyan-glow/50 transition-all tracking-wider">
                CONSTRUIR
              </button>
              <button id="tab-upgrades" class="flex-1 px-4 py-3.5 font-pixel text-[9px] text-cosmic-500 hover:text-cyan-pale/60 transition-all tracking-wider">
                MEJORAS
              </button>
            </div>

            <!-- Shop Panel -->
            <div id="panel-shop" class="tab-content flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <div class="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
                <span class="text-[10px] text-slate-500" id="shop-count">0 edificios</span>
              </div>
              <div id="shop-container" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
            </div>

            <!-- Upgrades Panel -->
            <div id="panel-upgrades" class="tab-content hidden flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <div class="px-5 py-3 border-b border-white/[0.04]">
                <span class="text-[10px] text-slate-500">Mejoras permanentes</span>
              </div>
              <div id="upgrades-container" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;

  addCRTOverlays(app);

  // Inicializar sub-módulos
  const shopContainer = document.getElementById('shop-container');
  if (shopContainer) initShop(shopContainer);

  const upgradesContainer = document.getElementById('upgrades-container');
  if (upgradesContainer) initUpgrades(upgradesContainer);

  const logContainer = document.getElementById('log-container');
  if (logContainer) initLog(logContainer);

  energyDisplay = document.getElementById('energy-display');
  rateDisplay = document.getElementById('rate-display');

  setupTabs();
}

function setupTabs() {
  const tabShop = document.getElementById('tab-shop');
  const tabUpgrades = document.getElementById('tab-upgrades');
  const panelShop = document.getElementById('panel-shop');
  const panelUpgrades = document.getElementById('panel-upgrades');

  if (!tabShop || !tabUpgrades || !panelShop || !panelUpgrades) return;

  tabShop.addEventListener('click', () => {
    switchTab(panelShop, panelUpgrades, tabShop, tabUpgrades);
  });

  tabUpgrades.addEventListener('click', () => {
    switchTab(panelUpgrades, panelShop, tabUpgrades, tabShop);
  });
}

function switchTab(activePanel, inactivePanel, activeTab, inactiveTab) {
  gsap.to(inactivePanel, {
    opacity: 0,
    duration: 0.15,
    onComplete: () => {
      inactivePanel.classList.add('hidden');
      activePanel.classList.remove('hidden');
      gsap.fromTo(activePanel, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    },
  });

  activeTab.classList.add('text-cyan-pale', 'bg-white/[0.04]', 'border-b-2', 'border-cyan-glow/50');
  activeTab.classList.remove('text-cosmic-500');
  inactiveTab.classList.remove('text-cyan-pale', 'bg-white/[0.04]', 'border-b-2', 'border-cyan-glow/50');
  inactiveTab.classList.add('text-cosmic-500');
}

function bindEvents() {
  const reactor = document.getElementById('reactor-container');
  if (reactor) {
    reactor.addEventListener('click', (e) => {
      handleReactorClick(e);
      updateHeader();
      checkMilestones();
    });
  }

  on('stateUpdated', () => {
    throttledUpdateHeader();
  });

  on('buildingPurchased', () => {
    updateShopCount();
    updateBuildingsCount();
    checkMilestones();
  });

  on('upgradePurchased', () => {
    checkMilestones();
  });

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const { exportSave } = await import('../engine/saveLoad.js');
      exportSave();
    });
  }

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('¿Borrar partida y empezar de nuevo?')) {
        const { clearSave } = await import('../engine/saveLoad.js');
        const { setState, createInitialState } = await import('../state.js');
        clearSave();
        setState(createInitialState());
        window.location.reload();
      }
    });
  }
}

function throttledUpdateHeader() {
  const now = performance.now();
  if (now - lastHeaderUpdate >= HEADER_UPDATE_INTERVAL) {
    lastHeaderUpdate = now;
    updateHeader();
    refreshShopAffordability();
    refreshUpgrades();
  }
}

function updateHeader() {
  const state = getState();
  const production = calculateTotalProduction(state, BUILDINGS_BY_ID);
  const clickPower = calculateClickPower(state);

  const newText = `⚡ ${formatNumber(Math.floor(state.energy), 0)}`;

  // Desktop
  if (energyDisplay && energyDisplay.textContent !== newText) {
    energyDisplay.textContent = newText;
    gsap.fromTo(energyDisplay, { scale: 1.08 }, { scale: 1, duration: 0.25, ease: 'back.out(1.5)' });
  }

  if (rateDisplay) {
    rateDisplay.textContent = `+${formatNumber(production, 1)} / s`;
  }

  // Mobile
  const mobileEnergy = document.getElementById('energy-display-mobile');
  if (mobileEnergy) mobileEnergy.textContent = newText;
  const mobileRate = document.getElementById('rate-display-mobile');
  if (mobileRate) mobileRate.textContent = `+${formatNumber(production, 1)} / s`;

  // Stats
  const clickPowerEl = document.getElementById('click-power-display');
  if (clickPowerEl) clickPowerEl.textContent = formatNumber(clickPower, 0);
}

function updateShopCount() {
  const el = document.getElementById('shop-count');
  if (!el) return;
  const state = getState();
  const total = Object.values(state.buildings).reduce((sum, count) => sum + (count ?? 0), 0);
  el.textContent = `${total} edificio${total !== 1 ? 's' : ''}`;
}

function updateBuildingsCount() {
  const el = document.getElementById('buildings-count');
  if (!el) return;
  const state = getState();
  const total = Object.values(state.buildings).reduce((sum, count) => sum + (count ?? 0), 0);
  el.textContent = String(total);
}
