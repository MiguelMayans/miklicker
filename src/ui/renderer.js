/**
 * Renderer — Puesto de Mando Espacial.
 * Layout fijo en viewport (sin scroll de página).
 * Fondo oscuro cálido, paneles blancos neobrutalistas.
 * ENERGÍA como display principal grande.
 */

import { getState, updateState } from '../state.js';
import { calculateTotalProduction, calculateRawProduction, calculateClickPower, calculateCoreTemp, isOverheated } from '../engine/formulas.js';
import { BUILDINGS_BY_ID } from '../data/buildings.js';
import { formatNumber } from '../utils/numbers.js';
import { on } from '../utils/eventBus.js';
import { handleReactorClick } from '../mechanics/clicker.js';
import { initAutoClickers } from '../engine/autoClicker.js';
import { calculatePrestigeGain, calculatePrestigeMultiplier, doPrestige } from '../engine/prestige.js';
import { initShop, refreshShopAffordability, setBuyQuantity } from './shop.js';
import { UPGRADES, UPGRADES_BY_ID } from '../data/upgrades.js';
import { initUpgrades, refreshUpgrades } from './upgrades.js';
import { initLog, addRandomLog } from './log.js';
import { checkMilestones } from '../engine/milestones.js';
import { logOverheating, resetIdleTimer } from '../engine/commander.js';
import { playAutoClickPop, playPurchaseDing } from '../audio/audioEngine.js';
import {
  initReactor,
  triggerReactorClick,
  triggerAutoClickPulse,
  updateReactorPressure,
  updateReactorTemperature,
  updateReactorLEDs,
} from './reactor.js';

let energyDisplay = null;
let rateDisplay = null;

const HEADER_UPDATE_INTERVAL = 200;
let lastHeaderUpdate = 0;

let telemetryInterval = null;

export function initUI() {
  const app = document.getElementById('app');
  if (!app) return;

  renderLayout();
  bindEvents();
  updateHeader();
  updateTelemetry();
  updatePrestigeDisplay();

  addRandomLog('first_click', {}, 'info');

  // Intervalo propio para telemetría (1s) — uptime, temp, eff, o2 fluctúan en vivo
  if (telemetryInterval) clearInterval(telemetryInterval);
  telemetryInterval = setInterval(() => {
    updateTelemetry();
  }, 1000);
}

function renderLayout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="h-screen w-full overflow-hidden flex flex-col p-2 lg:p-3 bg-[#1c1917]">
      <div class="flex-1 flex flex-col max-w-[1280px] mx-auto w-full gap-2">

        <!-- HEADER -->
        <header class="shrink-0 flex items-center justify-between px-4 py-2 bg-[#e0ddd6] border-[3px] border-black">
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-indicator"></div>
            <div>
              <h1 class="text-lg font-extrabold tracking-tight text-black">SECC-01 // COLONIA ESTELAR</h1>
              <p class="text-xs font-bold text-[#777777] uppercase tracking-[0.15em]">Puesto de Mando — Unidad de Potencia</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="export-btn" class="text-xs font-extrabold text-[#444444] hover:text-black uppercase tracking-wider px-4 py-2 border-[3px] border-black bg-[#e0ddd6] hover:bg-[#d4d0c8] block-interactive">Exportar</button>
            <button id="reset-btn" class="text-xs font-extrabold text-[#dc2626] hover:text-white uppercase tracking-wider px-4 py-2 border-[3px] border-[#dc2626] bg-[#e0ddd6] hover:bg-[#dc2626] block-interactive">Reiniciar</button>
          </div>
        </header>

        <!-- MAIN: REACTOR + ENERGY (panel prominente) -->
        <div id="main-panel" class="shrink-0 bg-[#e0ddd6] border-[3px] border-black flex items-stretch min-h-[140px]">
          <!-- LEFT: REACTOR ZONE -->
          <div id="reactor-zone" class="flex-[70] flex flex-col p-3 min-w-0 cursor-pointer">
            <div id="reactor-root" class="flex-1 min-h-0"></div>
            <div class="shrink-0 grid grid-cols-2 gap-2 pt-2 border-t-[3px] border-black mt-2">
              <div class="text-center">
                <p class="text-xs font-bold text-[#777777] uppercase tracking-wider">Extracción Manual</p>
                <p id="click-power-display" class="text-base font-extrabold text-black">1.00 kWh</p>
              </div>
              <div class="text-center border-l-[3px] border-black">
                <p class="text-xs font-bold text-[#777777] uppercase tracking-wider">Subsistemas Activos</p>
                <p id="buildings-count" class="text-base font-extrabold text-black">0</p>
              </div>
            </div>
          </div>
          <!-- DIVIDER -->
          <div class="w-[3px] bg-black shrink-0"></div>
          <!-- RIGHT: ENERGY DISPLAYS -->
          <div class="flex-[30] flex flex-col items-center justify-center p-4 min-w-0 gap-4">
            <div class="flex flex-col items-center gap-1">
              <div class="text-xs font-bold text-[#777777] uppercase tracking-[0.2em]">Banco de Capacitores</div>
              <div class="flex items-baseline gap-1.5">
                <span id="energy-display" class="text-4xl lg:text-5xl font-extrabold tabular-nums text-black leading-none">
                  0.0
                </span>
                <span class="text-sm font-bold text-[#777777] uppercase">kWh</span>
              </div>
            </div>
            <div class="w-full h-[3px] bg-black"></div>
            <div class="flex flex-col items-center gap-1">
              <div class="text-xs font-bold text-[#777777] uppercase tracking-[0.2em]">Generación Automática /s</div>
              <div class="flex items-baseline gap-1.5">
                <span id="rate-display" class="text-3xl lg:text-4xl font-extrabold text-[#06b6d4] tabular-nums leading-none">
                  +0.0
                </span>
                <span class="text-sm font-bold text-[#06b6d4] uppercase">kW</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PRESTIGE BAR -->
        <div class="shrink-0 bg-[#e0ddd6] border-[3px] border-black px-4 py-2 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-xs font-bold text-[#777777] uppercase tracking-wider">Datos Cósmicos</div>
            <span id="prestige-data" class="text-sm font-extrabold text-[#06b6d4] tabular-nums">0</span>
            <div class="text-xs font-bold text-[#777777] uppercase tracking-wider ml-2">Multiplicador</div>
            <span id="prestige-multiplier" class="text-sm font-extrabold text-[#06b6d4] tabular-nums">×1.00</span>
          </div>
          <div class="flex items-center gap-3">
            <span id="prestige-gain" class="text-xs font-bold text-[#777777]">+0 al resetear</span>
            <button
              id="prestige-btn"
              class="text-[10px] font-extrabold text-[#444444] uppercase tracking-wider px-3 py-1.5 border-[3px] border-[#a09c94] bg-[#d4d0c8] opacity-50 cursor-not-allowed"
              disabled
            >
              Reset Cósmico
            </button>
          </div>
        </div>

        <!-- ACTIVE UPGRADES BAR -->
        <div class="shrink-0 bg-[#e0ddd6] border-[3px] border-black px-3 py-1.5">
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-bold text-[#777777] uppercase tracking-wider shrink-0">Protocolos Activos</span>
            <div id="active-upgrades-bar" class="flex items-center gap-1.5 flex-wrap min-h-[20px]">
              <span class="text-[10px] text-[#a09c94]">Ninguno</span>
            </div>
          </div>
        </div>

        <!-- TELEMETRY ROW -->
        <div class="shrink-0 bg-[#e0ddd6] border-[3px] border-black grid grid-cols-5 divide-x-[3px] divide-black">
          <div class="px-2 py-2 text-center">
            <div class="text-[9px] font-bold text-[#777777] uppercase tracking-wider">T° Núcleo</div>
            <div id="telemetry-temp" class="text-sm font-extrabold text-black tabular-nums">300 K</div>
          </div>
          <div class="px-2 py-2 text-center">
            <div class="text-[9px] font-bold text-[#777777] uppercase tracking-wider">Eficiencia</div>
            <div id="telemetry-efficiency" class="text-sm font-extrabold text-black tabular-nums">42%</div>
          </div>
          <div class="px-2 py-2 text-center">
            <div class="text-[9px] font-bold text-[#777777] uppercase tracking-wider">Uptime</div>
            <div id="telemetry-uptime" class="text-sm font-extrabold text-black tabular-nums">00:00:00</div>
          </div>
          <div class="px-2 py-2 text-center">
            <div class="text-[9px] font-bold text-[#777777] uppercase tracking-wider">Tripulación</div>
            <div id="telemetry-crew" class="text-sm font-extrabold text-black tabular-nums">5</div>
          </div>
          <div class="px-2 py-2 text-center">
            <div class="text-[9px] font-bold text-[#777777] uppercase tracking-wider">Oxígeno</div>
            <div id="telemetry-o2" class="text-sm font-extrabold text-[#16a34a] tabular-nums">100%</div>
          </div>
        </div>

        <!-- BOTTOM: LOGS + SHOP/UPGRADES -->
        <div class="flex-1 bg-[#e0ddd6] border-[3px] border-black flex flex-col min-h-0">
          <div class="flex border-b-[3px] border-black bg-[#d4d0c8] shrink-0">
            <div class="w-1/3 px-2 py-2 text-xs font-extrabold text-black tracking-wider uppercase border-r-[3px] border-black flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
              LOG del Sistema
            </div>
            <div class="flex-1 px-2 py-2 text-xs font-extrabold text-black tracking-wider uppercase border-r-[3px] border-black flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#06b6d4]"></span>
              FABRICAR MÓDULOS
            </div>
            <div class="flex-1 px-2 py-2 text-xs font-extrabold text-black tracking-wider uppercase flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
              PROTOCOLOS
            </div>
          </div>
          <div class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_2fr] min-h-0">
            <!-- LOGS -->
            <div class="overflow-y-auto p-2 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black">
              <div id="log-container" class="space-y-1.5"></div>
            </div>
            <!-- SHOP + UPGRADES -->
            <div class="flex-1 grid grid-cols-2 min-h-0">
              <div class="overflow-y-auto p-2 border-r-[3px] border-black">
                <div class="flex gap-1 mb-2">
                  <button id="buy-qty-1" class="flex-1 text-[9px] font-extrabold text-black py-1 border-[2px] border-black bg-white block-interactive">×1</button>
                  <button id="buy-qty-10" class="flex-1 text-[9px] font-extrabold text-[#777777] py-1 border-[2px] border-[#a09c94] bg-[#e0ddd6] block-interactive">×10</button>
                  <button id="buy-qty-100" class="flex-1 text-[9px] font-extrabold text-[#777777] py-1 border-[2px] border-[#a09c94] bg-[#e0ddd6] block-interactive">×100</button>
                  <button id="buy-qty-max" class="flex-1 text-[9px] font-extrabold text-[#777777] py-1 border-[2px] border-[#a09c94] bg-[#e0ddd6] block-interactive">MAX</button>
                </div>
                <div id="shop-container" class="space-y-2"></div>
              </div>
              <div class="overflow-y-auto p-2">
                <div id="upgrades-container" class="space-y-2"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  const shopContainer = document.getElementById('shop-container');
  if (shopContainer) initShop(shopContainer);

  const upgradesContainer = document.getElementById('upgrades-container');
  if (upgradesContainer) initUpgrades(upgradesContainer);

  const logContainer = document.getElementById('log-container');
  if (logContainer) initLog(logContainer);

  const reactorRoot = document.getElementById('reactor-root');
  if (reactorRoot) initReactor(reactorRoot);

  energyDisplay = document.getElementById('energy-display');
  rateDisplay = document.getElementById('rate-display');
}

function bindEvents() {
  const reactor = document.getElementById('reactor-zone');
  if (reactor) {
    reactor.addEventListener('click', (e) => {
      triggerReactorClick();
      handleReactorClick(e);
      resetIdleTimer();
      updateHeader();
      checkMilestones();
    });
  }

  // Bulk buy quantity selector
  const qtyBtns = {
    1: document.getElementById('buy-qty-1'),
    10: document.getElementById('buy-qty-10'),
    100: document.getElementById('buy-qty-100'),
    max: document.getElementById('buy-qty-max'),
  };

  function setQtyBtnActive(activeKey) {
    for (const [key, btn] of Object.entries(qtyBtns)) {
      if (!btn) continue;
      if (key === activeKey) {
        btn.className = 'flex-1 text-[9px] font-extrabold text-black py-1 border-[2px] border-black bg-white block-interactive';
      } else {
        btn.className = 'flex-1 text-[9px] font-extrabold text-[#777777] py-1 border-[2px] border-[#a09c94] bg-[#e0ddd6] block-interactive';
      }
    }
  }

  if (qtyBtns[1]) qtyBtns[1].addEventListener('click', () => { setBuyQuantity(1); setQtyBtnActive('1'); });
  if (qtyBtns[10]) qtyBtns[10].addEventListener('click', () => { setBuyQuantity(10); setQtyBtnActive('10'); });
  if (qtyBtns[100]) qtyBtns[100].addEventListener('click', () => { setBuyQuantity(100); setQtyBtnActive('100'); });
  if (qtyBtns.max) qtyBtns.max.addEventListener('click', () => { setBuyQuantity(-1); setQtyBtnActive('max'); });

  on('stateUpdated', () => {
    throttledUpdateHeader();
  });

  on('buildingPurchased', ({ id }) => {
    updateShopCount();
    updateBuildingsCount();
    checkMilestones();
    if (id === 'cursor') {
      initAutoClickers();
    }
  });

  on('autoClickFired', () => {
    triggerAutoClickPulse();
    playAutoClickPop();
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

  const prestigeBtn = document.getElementById('prestige-btn');
  if (prestigeBtn) {
    prestigeBtn.addEventListener('click', () => {
      const state = getState();
      const gain = calculatePrestigeGain(state);
      const newMultiplier = calculatePrestigeMultiplier(state.prestige.cosmicData + gain);
      if (gain <= 0) return;
      if (confirm(
        `RESET CÓSMICO\n\n` +
        `Datos a ganar: +${gain}\n` +
        `Total tras reset: ${state.prestige.cosmicData + gain}\n` +
        `Multiplicador pasará de ×${formatNumber(state.prestige.multiplier, 2)} a ×${formatNumber(newMultiplier, 2)}\n\n` +
        `⚠ Todo el progreso actual se perderá. Los Datos Cósmicos y su multiplicador son permanentes.`
      )) {
        if (doPrestige()) {
          window.location.reload();
        }
      }
    });
  }
}

function throttledUpdateHeader() {
  const now = performance.now();
  if (now - lastHeaderUpdate >= HEADER_UPDATE_INTERVAL) {
    lastHeaderUpdate = now;
    updateHeader();
    updateTelemetry();
    updatePrestigeDisplay();
    updateActiveUpgradesBar();
    refreshShopAffordability();
    refreshUpgrades();
  }
}

function updateHeader() {
  const state = getState();
  const production = calculateTotalProduction(state, BUILDINGS_BY_ID);
  const clickPower = calculateClickPower(state);

  const energyText = formatNumber(state.energy, 2);
  if (energyDisplay && energyDisplay.textContent !== energyText) {
    energyDisplay.textContent = energyText;
  }

  if (rateDisplay) {
    rateDisplay.textContent = formatNumber(production, 2);
  }

  const clickPowerEl = document.getElementById('click-power-display');
  if (clickPowerEl) clickPowerEl.textContent = `${formatNumber(clickPower, 2)} kWh`;

  updateReactorPressure(state.energy);
}

function updateBuildingsCount() {
  const el = document.getElementById('buildings-count');
  if (!el) return;
  const state = getState();
  const total = Object.values(state.buildings).reduce((sum, count) => sum + (count ?? 0), 0);
  el.textContent = String(total);
}

/**
 * Actualiza la fila de telemetría del sistema.
 * Temperatura, eficiencia, uptime, tripulación y oxígeno.
 * Las métricas térmicas fluctúan para simular ruido de sistema real.
 * Detecta sobrecalentamiento del núcleo con histéresis.
 */
function updateTelemetry() {
  const state = getState();
  const rawProduction = calculateRawProduction(state, BUILDINGS_BY_ID);
  const production = calculateTotalProduction(state, BUILDINGS_BY_ID);
  const buildingsCount = Object.values(state.buildings).reduce((sum, c) => sum + (c ?? 0), 0);

  // Ruido térmico: oscilación senoidal suave + micro-ruido aleatorio
  const t = Date.now() / 1000;
  const thermalNoise = Math.sin(t * 2.7) * 12 + Math.sin(t * 7.3) * 5 + (Math.random() - 0.5) * 8;
  const effNoise = Math.sin(t * 1.3) * 0.8 + (Math.random() - 0.5) * 0.6;
  const o2Noise = Math.sin(t * 0.5) * 0.4 + (Math.random() - 0.5) * 0.3;

  // Temperatura del núcleo: base coherente con formulas.js + fluctuación
  const tempEl = document.getElementById('telemetry-temp');
  let temp = 300;
  if (tempEl) {
    const baseTemp = calculateCoreTemp(rawProduction);
    temp = Math.max(250, baseTemp + thermalNoise);
    tempEl.textContent = `${temp.toFixed(0)} K`;
    tempEl.className = `text-sm font-extrabold tabular-nums ${temp > 4000 ? 'text-[#dc2626]' : temp > 2000 ? 'text-[#f59e0b]' : temp > 1000 ? 'text-[#d97706]' : 'text-black'}`;
  }

  // Estado de sobrecalentamiento con histéresis
  const overheated = isOverheated(state, rawProduction);
  if (overheated !== state.overheated) {
    updateState({ overheated });
    if (overheated) {
      logOverheating();
      emit('overheating', { temp });
    }
  }

  // Indicador visual del reactor (nuevo componente)
  const heatRatio = (temp - 300) / 4000;
  updateReactorTemperature(heatRatio);
  if (overheated) {
    updateReactorLEDs('critical');
  } else if (temp > 3000) {
    updateReactorLEDs('warning');
  } else {
    updateReactorLEDs('stable');
  }

  // Panel principal: borde rojo cuando está sobrecalentado
  const mainPanel = document.getElementById('main-panel');
  if (mainPanel) {
    if (overheated) {
      mainPanel.classList.add('border-[#dc2626]');
      mainPanel.classList.remove('border-black');
    } else {
      mainPanel.classList.add('border-black');
      mainPanel.classList.remove('border-[#dc2626]');
    }
  }

  // Eficiencia: 42% base + mejora con edificios y upgrades + fluctuación
  const effEl = document.getElementById('telemetry-efficiency');
  if (effEl) {
    const baseEff = 42;
    const bonus = Math.min(buildingsCount * 0.5 + state.upgrades.length * 2, 55);
    const eff = Math.max(20, Math.min(97, baseEff + bonus + effNoise));
    effEl.textContent = `${eff.toFixed(1)}%`;
    effEl.className = `text-sm font-extrabold tabular-nums ${eff > 85 ? 'text-[#16a34a]' : eff > 60 ? 'text-black' : 'text-[#dc2626]'}`;
  }

  // Uptime: tiempo desde gameStartedAt
  const upEl = document.getElementById('telemetry-uptime');
  if (upEl) {
    const elapsed = Math.floor((Date.now() - (state.gameStartedAt ?? Date.now())) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    upEl.textContent = `${h}:${m}:${s}`;
  }

  // Tripulación: base 5 + 1 por cada 10 edificios (estática, no fluctúa)
  const crewEl = document.getElementById('telemetry-crew');
  if (crewEl) {
    const crew = 5 + Math.floor(buildingsCount / 10);
    crewEl.textContent = String(crew);
  }

  // Oxígeno: 100% - degradación por edificios + fluctuación
  const o2El = document.getElementById('telemetry-o2');
  if (o2El) {
    const baseO2 = Math.max(15, 100 - buildingsCount * 0.3);
    const o2 = Math.max(14, Math.min(100, baseO2 + o2Noise));
    o2El.textContent = `${o2.toFixed(1)}%`;
    o2El.className = `text-sm font-extrabold tabular-nums ${o2 > 60 ? 'text-[#16a34a]' : o2 > 30 ? 'text-[#f59e0b]' : 'text-[#dc2626]'}`;
  }
}

/**
 * Actualiza la barra de Prestigio (Datos Cósmicos, multiplicador, botón).
 */
function updatePrestigeDisplay() {
  const state = getState();
  const gain = calculatePrestigeGain(state);

  const dataEl = document.getElementById('prestige-data');
  if (dataEl) dataEl.textContent = String(state.prestige.cosmicData ?? 0);

  const multEl = document.getElementById('prestige-multiplier');
  if (multEl) multEl.textContent = `×${formatNumber(state.prestige.multiplier ?? 1, 2)}`;

  const gainEl = document.getElementById('prestige-gain');
  if (gainEl) gainEl.textContent = gain > 0 ? `+${gain} al resetear` : 'Acumula 1M kWh para resetear';

  const btn = document.getElementById('prestige-btn');
  if (btn) {
    if (gain > 0) {
      btn.disabled = false;
      btn.className = 'text-[10px] font-extrabold text-black uppercase tracking-wider px-3 py-1.5 border-[3px] border-black bg-[#06b6d4] hover:bg-[#0891b2] block-interactive';
    } else {
      btn.disabled = true;
      btn.className = 'text-[10px] font-extrabold text-[#444444] uppercase tracking-wider px-3 py-1.5 border-[3px] border-[#a09c94] bg-[#d4d0c8] opacity-50 cursor-not-allowed';
    }
  }
}

let activeUpgradeTooltip = null;

function getActiveUpgradeTooltip() {
  if (!activeUpgradeTooltip) {
    activeUpgradeTooltip = document.createElement('div');
    activeUpgradeTooltip.className = 'fixed z-[9999] hidden pointer-events-none';
    activeUpgradeTooltip.style.cssText = `
      background: #111111;
      border: 3px solid #06b6d4;
      color: #ffffff;
      padding: 6px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: bold;
      line-height: 1.4;
      max-width: 240px;
      box-shadow: 4px 4px 0 0 #06b6d4;
      white-space: normal;
      word-break: break-word;
    `;
    document.body.appendChild(activeUpgradeTooltip);
  }
  return activeUpgradeTooltip;
}

/**
 * Renderiza chips visuales de las mejoras/protocolos activos.
 * Cada chip tiene un tooltip neobrutalista flotante con su descripción.
 */
function updateActiveUpgradesBar() {
  const container = document.getElementById('active-upgrades-bar');
  if (!container) return;

  const state = getState();
  const active = state.upgrades ?? [];

  if (active.length === 0) {
    container.innerHTML = '<span class="text-[10px] text-[#a09c94]">Ninguno</span>';
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const tooltip = getActiveUpgradeTooltip();

  for (const id of active) {
    const upgrade = UPGRADES_BY_ID.get(id);
    if (!upgrade) continue;

    const chip = document.createElement('span');
    chip.className = 'text-[9px] font-bold text-black px-1.5 py-0.5 border-[2px] border-black bg-[#06b6d4] whitespace-nowrap';
    chip.textContent = upgrade.name;

    chip.addEventListener('mouseenter', (e) => {
      tooltip.textContent = upgrade.description;
      tooltip.classList.remove('hidden');
      positionTooltip(e, tooltip);
    });

    chip.addEventListener('mousemove', (e) => {
      positionTooltip(e, tooltip);
    });

    chip.addEventListener('mouseleave', () => {
      tooltip.classList.add('hidden');
    });

    fragment.appendChild(chip);
  }

  container.appendChild(fragment);
}

function positionTooltip(e, tooltip) {
  const pad = 12;
  let left = e.clientX + pad;
  let top = e.clientY + pad;

  const rect = tooltip.getBoundingClientRect();
  if (left + rect.width > window.innerWidth) {
    left = e.clientX - rect.width - pad;
  }
  if (top + rect.height > window.innerHeight) {
    top = e.clientY - rect.height - pad;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
