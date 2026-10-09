/**
 * Renderer — Puesto de Mando Espacial Brutalista-Retrofuturista.
 * Layout responsive con scroll, grid asimétrico y paneles pesados.
 * Todos los IDs se mantienen para compatibilidad con el engine.
 */

import { getState, updateState } from "../state.js";
import {
  calculateTotalProduction,
  calculateRawProduction,
  calculateClickPower,
  calculateCoreTemp,
  isOverheated,
} from "../engine/formulas.js";
import { BUILDINGS_BY_ID } from "../data/buildings.js";
import { formatNumber } from "../utils/numbers.js";
import { on } from "../utils/eventBus.js";
import { handleReactorClick } from "../mechanics/clicker.js";
import { initAutoClickers } from "../engine/autoClicker.js";
import {
  calculatePrestigeGain,
  calculatePrestigeMultiplier,
  calculatePrestigeEfficiency,
  doPrestige,
  chooseDoctrine,
} from "../engine/prestige.js";
import { DOCTRINES } from "../data/doctrines.js";
import { initShop, refreshShopAffordability, setBuyQuantity } from "./shop.js";
import { UPGRADES, UPGRADES_BY_ID } from "../data/upgrades.js";
import { initUpgrades, refreshUpgrades } from "./upgrades.js";
import { initLog, addRandomLog } from "./log.js";
import { checkMilestones } from "../engine/milestones.js";
import { logOverheating, resetIdleTimer } from "../engine/commander.js";
import { activateAbility, isAbilityReady, getCooldownRemaining, ABILITIES } from "../engine/abilities.js";
import {
  playAutoClickPop,
  playPurchaseDing,
  toggleMute,
  getMuteState,
} from "../audio/audioEngine.js";
import {
  initReactor,
  triggerReactorClick,
  triggerAutoClickPulse,
  updateReactorPressure,
  updateReactorTemperature,
  updateReactorLEDs,
  updateReactorStage,
} from "./reactor.js";

let energyDisplay = null;
let rateDisplay = null;

const HEADER_UPDATE_INTERVAL = 200;
let lastHeaderUpdate = 0;

let telemetryInterval = null;

export function initUI() {
  const app = document.getElementById("app");
  if (!app) return;

  addOverlays();
  renderLayout();
  bindEvents();
  updateHeader();
  updateTelemetry();
  updatePrestigeDisplay();

  addRandomLog("first_click", {}, "info");

  if (telemetryInterval) clearInterval(telemetryInterval);
  telemetryInterval = setInterval(() => {
    updateTelemetry();
    updateFooterClock();
  }, 1000);
}

function addOverlays() {
  if (document.getElementById("scanlines-overlay")) return;

  const scanlines = document.createElement("div");
  scanlines.id = "scanlines-overlay";
  document.body.appendChild(scanlines);

  const vignette = document.createElement("div");
  vignette.id = "vignette-overlay";
  document.body.appendChild(vignette);

  const noise = document.createElement("div");
  noise.className = "noise-overlay";
  document.body.appendChild(noise);
}

function renderLayout() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="min-h-screen w-full bg-[#1a1816] text-[#0f0f0f] font-mono pb-8">

      <!-- STICKY HEADER -->
      <header class="sticky top-0 z-50 bg-[#e8e4dc] border-b-[5px] border-black">
        <div class="max-w-[1400px] mx-auto px-3 py-2 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex items-center gap-1.5 shrink-0">
              <div class="w-3 h-3 bg-[#16a34a] animate-indicator border border-black"></div>
              <div class="w-3 h-3 bg-[#00b4d8] border border-black"></div>
              <div class="w-3 h-3 bg-[#facc15] border border-black"></div>
              <div class="w-3 h-3 bg-[#ef4444] border border-black"></div>
            </div>
            <div class="min-w-0">
              <h1 class="text-lg md:text-xl font-extrabold tracking-tight font-display text-black truncate">SECC-01 // COLONIA ESTELAR</h1>
              <p class="text-[10px] font-bold text-[#555555] uppercase tracking-[0.2em] truncate">Puesto de Mando — Unidad de Potencia</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button id="mute-btn" class="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 border-[3px] border-black bg-[#e8e4dc] b-interactive" title="Silenciar/Activar sonido">🔊</button>
            <button id="export-btn" class="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 border-[3px] border-black bg-[#e8e4dc] b-interactive">Exportar</button>
            <button id="reset-btn" class="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 border-[3px] border-[#ef4444] bg-[#e8e4dc] text-[#ef4444] hover:bg-[#ef4444] hover:text-white b-interactive">Reiniciar</button>
          </div>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="max-w-[1400px] mx-auto px-3 py-4 space-y-4">

        <!-- SECTION LABEL -->
        <div class="flex items-center gap-3">
          <div class="h-[5px] w-16 bg-black"></div>
          <span class="text-[10px] font-extrabold text-[#555555] uppercase tracking-[0.3em]">SEC-01 // Núcleo de Ignición</span>
          <div class="flex-1 h-[5px] bg-black"></div>
        </div>

        <!-- HERO: REACTOR + ENERGY -->
        <section class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-stretch">

          <!-- REACTOR ZONE -->
          <div id="reactor-zone" class="relative bg-[#e8e4dc] border-[5px] border-black b-shadow hud-corner cursor-pointer select-none overflow-hidden">
            <div class="absolute inset-0 bg-grid pointer-events-none"></div>
            <div class="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,#0f0f0f_0px,#0f0f0f_8px,#facc15_8px,#facc15_16px)]"></div>
            <div id="reactor-root" class="relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] p-4 pt-6 flex flex-col"></div>

            <!-- COMBO METER -->
            <div id="combo-meter" class="relative z-10 px-4 pb-2 opacity-0 transition-opacity duration-200">
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-extrabold text-[#555555] uppercase tracking-wider shrink-0">Combo</span>
                <div class="flex-1 h-3 border-[3px] border-black bg-[#d8d4cc] relative overflow-hidden">
                  <div id="combo-fill" class="h-full combo-meter" style="width: 0%;"></div>
                </div>
                <span id="combo-text" class="text-[10px] font-extrabold text-[#00b4d8] tabular-nums shrink-0 w-16 text-right">×1.00</span>
              </div>
            </div>

            <!-- ABILITY BAR -->
            <div id="ability-bar" class="relative z-10 px-4 pb-3 flex gap-2 flex-wrap">
              <button id="ability-energize" class="ability-btn hidden text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 border-[3px] border-black bg-[#facc15] hover:bg-[#eab308] b-interactive" title="Próximos 10 clics ×10 + reducen T°">⚡ ENERGIZE</button>
              <button id="ability-purge" class="ability-btn hidden text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 border-[3px] border-black bg-[#60a5fa] hover:bg-[#3b82f6] b-interactive" title="Resetea T° — cuesta 10% energía">❄ PURGE</button>
              <button id="ability-overload" class="ability-btn hidden text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 border-[3px] border-black bg-[#ef4444] text-white hover:bg-[#dc2626] b-interactive" title="×3 producción 15s — T° sube 3×">🔥 OVERLOAD</button>
            </div>
          </div>

          <!-- RIGHT: ENERGY + STATS -->
          <div class="flex flex-col gap-4">

            <!-- ENERGY DISPLAY -->
            <div class="bg-[#e8e4dc] border-[5px] border-black b-shadow p-4 flex flex-col items-center justify-center gap-4 hud-corner">
              <div class="text-center">
                <div class="text-[10px] font-bold text-[#555555] uppercase tracking-[0.25em] mb-1">Banco de Capacitores</div>
                <div class="flex items-baseline justify-center gap-2">
                  <span id="energy-display" class="text-4xl md:text-5xl font-extrabold tabular-nums text-black leading-none">0.0</span>
                  <span class="text-sm font-bold text-[#555555] uppercase">kWh</span>
                </div>
              </div>
              <div class="w-full h-[4px] bg-black"></div>
              <div class="text-center">
                <div class="text-[10px] font-bold text-[#555555] uppercase tracking-[0.25em] mb-1">Generación Automática /s</div>
                <div class="flex items-baseline justify-center gap-2">
                  <span id="rate-display" class="text-3xl md:text-4xl font-extrabold text-[#00b4d8] tabular-nums leading-none">+0.0</span>
                  <span class="text-sm font-bold text-[#00b4d8] uppercase">kW</span>
                </div>
              </div>
              <div class="w-full h-[4px] bg-black"></div>
              <div class="grid grid-cols-2 gap-3 w-full text-center">
                <div>
                  <div class="text-[10px] font-bold text-[#555555] uppercase tracking-wider">Extracción Manual</div>
                  <div id="click-power-display" class="text-lg font-extrabold text-black">1.00 kWh</div>
                </div>
                <div class="border-l-[4px] border-black">
                  <div class="text-[10px] font-bold text-[#555555] uppercase tracking-wider">Subsistemas</div>
                  <div id="buildings-count" class="text-lg font-extrabold text-black">0</div>
                </div>
              </div>
            </div>

            <!-- PRESTIGE PANEL -->
            <div class="bg-[#2a2a2a] border-[5px] border-black b-shadow p-4 text-[#e8e4dc] hud-corner">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a8a8a]">Datos Cósmicos</span>
                <span id="prestige-data" class="text-xl font-extrabold text-[#22d3ee] tabular-nums">0</span>
              </div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a8a8a]">Multiplicador</span>
                <span id="prestige-multiplier" class="text-xl font-extrabold text-[#22d3ee] tabular-nums">×1.00</span>
              </div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a8a8a]">Doctrina</span>
                <span id="prestige-doctrine" class="text-sm font-extrabold text-[#facc15] tabular-nums">Sin doctrina</span>
              </div>
              <div class="border-t-[3px] border-black pt-3 flex items-center justify-between gap-3">
                <span id="prestige-gain" class="text-[10px] font-bold text-[#8a8a8a]">Acumula 1M kWh para resetear</span>
                <button id="prestige-btn" class="text-[10px] font-extrabold uppercase tracking-wider px-3 py-2 border-[3px] border-[#555555] bg-[#3a3a3a] text-[#8a8a8a] opacity-60 cursor-not-allowed" disabled>Reset Cósmico</button>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION LABEL -->
        <div class="flex items-center gap-3">
          <div class="h-[5px] w-16 bg-black"></div>
          <span class="text-[10px] font-extrabold text-[#555555] uppercase tracking-[0.3em]">SEC-02 // Telemetría</span>
          <div class="flex-1 h-[5px] bg-black"></div>
        </div>

        <!-- TELEMETRY STRIP -->
        <section class="bg-[#e8e4dc] border-[5px] border-black b-shadow grid grid-cols-2 md:grid-cols-5 divide-y-[4px] md:divide-y-0 md:divide-x-[4px] divide-black hud-corner">
          <div class="px-3 py-3 text-center">
            <div class="text-[9px] font-bold text-[#555555] uppercase tracking-wider">T° Núcleo</div>
            <div id="telemetry-temp" class="text-lg font-extrabold text-black tabular-nums">300 K</div>
          </div>
          <div class="px-3 py-3 text-center">
            <div class="text-[9px] font-bold text-[#555555] uppercase tracking-wider">Eficiencia</div>
            <div id="telemetry-efficiency" class="text-lg font-extrabold text-black tabular-nums">42%</div>
          </div>
          <div class="px-3 py-3 text-center">
            <div class="text-[9px] font-bold text-[#555555] uppercase tracking-wider">Uptime</div>
            <div id="telemetry-uptime" class="text-lg font-extrabold text-black tabular-nums">00:00:00</div>
          </div>
          <div class="px-3 py-3 text-center">
            <div class="text-[9px] font-bold text-[#555555] uppercase tracking-wider">Tripulación</div>
            <div id="telemetry-crew" class="text-lg font-extrabold text-black tabular-nums">5</div>
          </div>
          <div class="px-3 py-3 text-center">
            <div class="text-[9px] font-bold text-[#555555] uppercase tracking-wider">Oxígeno</div>
            <div id="telemetry-o2" class="text-lg font-extrabold text-[#16a34a] tabular-nums">100%</div>
          </div>
        </section>

        <!-- ACTIVE UPGRADES -->
        <section class="bg-[#e8e4dc] border-[5px] border-black b-shadow px-3 py-2 hud-corner">
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-bold text-[#555555] uppercase tracking-wider shrink-0">Protocolos Activos</span>
            <div id="active-upgrades-bar" class="flex items-center gap-1.5 flex-wrap min-h-[24px]">
              <span class="text-[10px] text-[#8a8a8a]">Ninguno</span>
            </div>
          </div>
        </section>

        <!-- SECTION LABEL -->
        <div class="flex items-center gap-3">
          <div class="h-[5px] w-16 bg-black"></div>
          <span class="text-[10px] font-extrabold text-[#555555] uppercase tracking-[0.3em]">SEC-03 // Fabricación</span>
          <div class="flex-1 h-[5px] bg-black"></div>
        </div>

        <!-- SHOP + UPGRADES -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          <!-- SHOP -->
          <div class="bg-[#e8e4dc] border-[5px] border-black b-shadow hud-corner">
            <div class="panel-header flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 bg-[#00b4d8] border border-black"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider">Fabricar Módulos</span>
              </div>
              <div class="flex gap-1">
                <button id="buy-qty-1" class="text-[9px] font-extrabold px-2 py-0.5 border-[2px] border-black bg-white b-interactive">×1</button>
                <button id="buy-qty-10" class="text-[9px] font-extrabold px-2 py-0.5 border-[2px] border-[#8a8a8a] bg-[#e8e4dc] b-interactive">×10</button>
                <button id="buy-qty-100" class="text-[9px] font-extrabold px-2 py-0.5 border-[2px] border-[#8a8a8a] bg-[#e8e4dc] b-interactive">×100</button>
                <button id="buy-qty-max" class="text-[9px] font-extrabold px-2 py-0.5 border-[2px] border-[#8a8a8a] bg-[#e8e4dc] b-interactive">MAX</button>
              </div>
            </div>
            <div id="shop-container" class="p-3 space-y-2 max-h-[520px] overflow-y-auto"></div>
          </div>

          <!-- UPGRADES -->
          <div class="bg-[#e8e4dc] border-[5px] border-black b-shadow hud-corner">
            <div class="panel-header flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-[#facc15] border border-black"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider">Protocolos</span>
            </div>
            <div id="upgrades-container" class="p-3 space-y-2 max-h-[520px] overflow-y-auto"></div>
          </div>
        </section>

        <!-- SECTION LABEL -->
        <div class="flex items-center gap-3">
          <div class="h-[5px] w-16 bg-black"></div>
          <span class="text-[10px] font-extrabold text-[#555555] uppercase tracking-[0.3em]">SEC-04 // Registro</span>
          <div class="flex-1 h-[5px] bg-black"></div>
        </div>

        <!-- LOG -->
        <section class="bg-[#2a2a2a] border-[5px] border-black b-shadow hud-corner">
          <div class="panel-header bg-[#3a3a3a] flex items-center gap-2">
            <div class="w-2.5 h-2.5 bg-[#16a34a] border border-black"></div>
            <span class="text-xs font-extrabold uppercase tracking-wider text-[#e8e4dc]">Log del Sistema</span>
          </div>
          <div id="log-container" class="p-3 space-y-1.5 max-h-[200px] overflow-y-auto text-[#e8e4dc]"></div>
        </section>

        <!-- FOOTER -->
        <footer class="flex items-center justify-between pt-2 pb-4">
          <span class="text-[9px] font-bold text-[#555555] uppercase tracking-[0.2em]">SECC-01 // Firmware v2.0 // Brutalist OS</span>
          <span id="footer-clock" class="text-[9px] font-bold text-[#555555] uppercase tracking-[0.2em] tabular-nums">00:00:00 UTC</span>
        </footer>

      </main>
    </div>
  `;

  const shopContainer = document.getElementById("shop-container");
  if (shopContainer) initShop(shopContainer);

  const upgradesContainer = document.getElementById("upgrades-container");
  if (upgradesContainer) initUpgrades(upgradesContainer);

  const logContainer = document.getElementById("log-container");
  if (logContainer) initLog(logContainer);

  const reactorRoot = document.getElementById("reactor-root");
  if (reactorRoot) initReactor(reactorRoot);

  energyDisplay = document.getElementById("energy-display");
  rateDisplay = document.getElementById("rate-display");
}

function bindEvents() {
  const reactor = document.getElementById("reactor-zone");
  if (reactor) {
    reactor.addEventListener("click", (e) => {
      handleReactorClick(e);
      resetIdleTimer();
      updateHeader();
      checkMilestones();
    });
  }

  on('energyClicked', ({ amount, isCrit }) => {
    const intensity = Math.min(2.5, Math.log10(amount + 10) / 3);
    triggerReactorClick({ intensity, isCrit });
  });

  on('comboChanged', ({ comboCount, comboMult }) => {
    updateComboMeter(comboCount, comboMult);
  });

  const qtyBtns = {
    1: document.getElementById("buy-qty-1"),
    10: document.getElementById("buy-qty-10"),
    100: document.getElementById("buy-qty-100"),
    max: document.getElementById("buy-qty-max"),
  };

  function setQtyBtnActive(activeKey) {
    for (const [key, btn] of Object.entries(qtyBtns)) {
      if (!btn) continue;
      if (key === activeKey) {
        btn.className =
          "text-[9px] font-extrabold px-2 py-0.5 border-[2px] border-black bg-white b-interactive";
      } else {
        btn.className =
          "text-[9px] font-extrabold px-2 py-0.5 border-[2px] border-[#8a8a8a] bg-[#e8e4dc] b-interactive";
      }
    }
  }

  if (qtyBtns[1])
    qtyBtns[1].addEventListener("click", () => {
      setBuyQuantity(1);
      setQtyBtnActive("1");
    });
  if (qtyBtns[10])
    qtyBtns[10].addEventListener("click", () => {
      setBuyQuantity(10);
      setQtyBtnActive("10");
    });
  if (qtyBtns[100])
    qtyBtns[100].addEventListener("click", () => {
      setBuyQuantity(100);
      setQtyBtnActive("100");
    });
  if (qtyBtns.max)
    qtyBtns.max.addEventListener("click", () => {
      setBuyQuantity(-1);
      setQtyBtnActive("max");
    });

  on("stateUpdated", () => {
    throttledUpdateHeader();
  });

  on("buildingPurchased", ({ id }) => {
    updateShopCount();
    updateBuildingsCount();
    checkMilestones();
    if (id === "cursor") {
      initAutoClickers();
    }
  });

  on("autoClickFired", () => {
    triggerAutoClickPulse();
    playAutoClickPop();
  });

  on("upgradePurchased", () => {
    checkMilestones();
  });

  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      const { exportSave } = await import("../engine/saveLoad.js");
      exportSave();
    });
  }

  const muteBtn = document.getElementById("mute-btn");
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      const muted = toggleMute();
      muteBtn.textContent = muted ? "🔇" : "🔊";
      muteBtn.title = muted ? "Activar sonido" : "Silenciar sonido";
    });
    muteBtn.textContent = getMuteState() ? "🔇" : "🔊";
    muteBtn.title = getMuteState() ? "Activar sonido" : "Silenciar sonido";
  }

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      if (confirm("¿Borrar partida y empezar de nuevo?")) {
        const { clearSave } = await import("../engine/saveLoad.js");
        const { setState, createInitialState } = await import("../state.js");
        clearSave();
        setState(createInitialState());
        window.location.reload();
      }
    });
  }

  for (const id of ['energize', 'purge', 'overload']) {
    const btn = document.getElementById(`ability-${id}`);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activateAbility(id)) {
          updateAbilityButtons();
        }
      });
    }
  }
  setInterval(updateAbilityButtons, 250);

  const prestigeBtn = document.getElementById("prestige-btn");
  if (prestigeBtn) {
    prestigeBtn.addEventListener("click", () => {
      const state = getState();
      const gain = calculatePrestigeGain(state);
      if (gain <= 0) return;

      if (!state.prestige?.doctrine) {
        showDoctrineSelection(() => runPrestigeConfirmation());
        return;
      }

      runPrestigeConfirmation();
    });
  }
}

function runPrestigeConfirmation() {
  const state = getState();
  const gain = calculatePrestigeGain(state);
  const efficiency = calculatePrestigeEfficiency(state);
  const newMultiplier = calculatePrestigeMultiplier(
    (state.prestige.totalCosmicDataEarned ?? 0) + gain,
    efficiency,
  );
  if (gain <= 0) return;

  const doctrineName = state.prestige?.doctrine
    ? `\nDoctrina: ${DOCTRINES.find((d) => d.id === state.prestige.doctrine)?.name ?? state.prestige.doctrine}`
    : '';

  if (
    confirm(
      `RESET CÓSMICO\n\n` +
        `Datos a ganar: +${gain}\n` +
        `Total acumulado: ${(state.prestige.totalCosmicDataEarned ?? 0) + gain}\n` +
        `Disponibles tras reset: ${(state.prestige.cosmicData ?? 0) + gain}\n` +
        `Multiplicador pasará de ×${formatNumber(state.prestige.multiplier, 2)} a ×${formatNumber(newMultiplier, 2)}` +
        doctrineName +
        `\n\n⚠ Todo el progreso actual se perderá. Los Datos Cósmicos, su multiplicador y la doctrina son permanentes.`,
    )
  ) {
    if (doPrestige()) {
      window.location.reload();
    }
  }
}

function showDoctrineSelection(onSelected) {
  if (document.getElementById('doctrine-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'doctrine-modal';
  modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/60';
  modal.innerHTML = `
    <div class="bg-[#e8e4dc] border-[5px] border-black p-5 max-w-lg w-full b-shadow mx-3">
      <h2 class="text-lg font-extrabold text-black font-display mb-2 uppercase tracking-wider">Elige una Doctrina</h2>
      <p class="text-xs text-[#444444] mb-4 leading-relaxed">
        La doctrina define la identidad de tu colonia. Es una elección permanente que seguirá activa en todos tus resets cósmicos.
      </p>
      <div id="doctrine-options" class="grid grid-cols-1 gap-2 mb-4"></div>
      <button id="doctrine-cancel" class="w-full text-xs font-extrabold text-[#444444] uppercase tracking-wider px-3 py-2 border-[3px] border-[#8a8a8a] bg-[#d8d4cc] hover:bg-[#c4c0b8] b-interactive">Cancelar</button>
    </div>
  `;

  document.body.appendChild(modal);

  const options = modal.querySelector('#doctrine-options');
  for (const doctrine of DOCTRINES) {
    const btn = document.createElement('button');
    btn.className = 'flex items-center gap-3 p-3 border-[3px] border-black bg-[#eae7e0] hover:bg-[#d8d4cc] text-left b-interactive';
    btn.innerHTML = `
      <span class="text-2xl">${doctrine.icon}</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-extrabold text-black truncate">${doctrine.name}</div>
        <div class="text-xs text-[#444444] leading-tight">${doctrine.description}</div>
      </div>
    `;
    btn.addEventListener('click', () => {
      if (chooseDoctrine(doctrine.id)) {
        modal.remove();
        if (onSelected) onSelected();
      }
    });
    options.appendChild(btn);
  }

  modal.querySelector('#doctrine-cancel').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
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

  const clickPowerEl = document.getElementById("click-power-display");
  if (clickPowerEl)
    clickPowerEl.textContent = `${formatNumber(clickPower, 2)} kWh`;

  updateReactorPressure(state.energy);
  updateReactorStage(state.energy);
}

function updateBuildingsCount() {
  const el = document.getElementById("buildings-count");
  if (!el) return;
  const state = getState();
  const total = Object.values(state.buildings).reduce(
    (sum, count) => sum + (count ?? 0),
    0,
  );
  el.textContent = String(total);
}

function updateFooterClock() {
  const el = document.getElementById('footer-clock');
  if (!el) return;
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  el.textContent = `${h}:${m}:${s} UTC`;
}

function updateTelemetry() {
  const state = getState();
  const rawProduction = calculateRawProduction(state, BUILDINGS_BY_ID);
  const production = calculateTotalProduction(state, BUILDINGS_BY_ID);
  const buildingsCount = Object.values(state.buildings).reduce(
    (sum, c) => sum + (c ?? 0),
    0,
  );

  const t = Date.now() / 1000;
  const thermalNoise =
    Math.sin(t * 2.7) * 12 + Math.sin(t * 7.3) * 5 + (Math.random() - 0.5) * 8;
  const effNoise = Math.sin(t * 1.3) * 0.8 + (Math.random() - 0.5) * 0.6;
  const o2Noise = Math.sin(t * 0.5) * 0.4 + (Math.random() - 0.5) * 0.3;

  const tempEl = document.getElementById("telemetry-temp");
  let temp = 300;
  if (tempEl) {
    const baseTemp = calculateCoreTemp(rawProduction, state);
    temp = Math.max(250, baseTemp + thermalNoise);
    tempEl.textContent = `${temp.toFixed(0)} K`;
    tempEl.className = `text-lg font-extrabold tabular-nums ${temp > 4000 ? "text-[#ef4444]" : temp > 2000 ? "text-[#f59e0b]" : temp > 1000 ? "text-[#d97706]" : "text-black"}`;
  }

  const overheated = isOverheated(state, rawProduction);
  if (overheated !== state.overheated) {
    updateState({ overheated });
    if (overheated) {
      logOverheating();
      emit("overheating", { temp });
    }
  }

  const heatRatio = (temp - 300) / 4000;
  updateReactorTemperature(heatRatio);
  if (overheated) {
    updateReactorLEDs("critical");
  } else if (temp > 3000) {
    updateReactorLEDs("warning");
  } else {
    updateReactorLEDs("stable");
  }

  const reactorZone = document.getElementById("reactor-zone");
  if (reactorZone) {
    if (overheated) {
      reactorZone.style.borderColor = "#ef4444";
    } else {
      reactorZone.style.borderColor = "#0f0f0f";
    }
  }

  const effEl = document.getElementById("telemetry-efficiency");
  if (effEl) {
    const baseEff = 42;
    const bonus = Math.min(
      buildingsCount * 0.5 + state.upgrades.length * 2,
      55,
    );
    const eff = Math.max(20, Math.min(97, baseEff + bonus + effNoise));
    effEl.textContent = `${eff.toFixed(1)}%`;
    effEl.className = `text-lg font-extrabold tabular-nums ${eff > 85 ? "text-[#16a34a]" : eff > 60 ? "text-black" : "text-[#ef4444]"}`;
  }

  const upEl = document.getElementById("telemetry-uptime");
  if (upEl) {
    const elapsed = Math.floor(
      (Date.now() - (state.gameStartedAt ?? Date.now())) / 1000,
    );
    const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    upEl.textContent = `${h}:${m}:${s}`;
  }

  const crewEl = document.getElementById("telemetry-crew");
  if (crewEl) {
    const crew = 5 + Math.floor(buildingsCount / 10);
    crewEl.textContent = String(crew);
  }

  const o2El = document.getElementById("telemetry-o2");
  if (o2El) {
    const baseO2 = Math.max(15, 100 - buildingsCount * 0.3);
    const o2 = Math.max(14, Math.min(100, baseO2 + o2Noise));
    o2El.textContent = `${o2.toFixed(1)}%`;
    o2El.className = `text-lg font-extrabold tabular-nums ${o2 > 60 ? "text-[#16a34a]" : o2 > 30 ? "text-[#f59e0b]" : "text-[#ef4444]"}`;
  }
}

function updatePrestigeDisplay() {
  const state = getState();
  const gain = calculatePrestigeGain(state);

  const dataEl = document.getElementById("prestige-data");
  if (dataEl) dataEl.textContent = String(state.prestige.cosmicData ?? 0);

  const multEl = document.getElementById("prestige-multiplier");
  if (multEl)
    multEl.textContent = `×${formatNumber(state.prestige.multiplier ?? 1, 2)}`;

  const doctrineEl = document.getElementById("prestige-doctrine");
  if (doctrineEl) {
    const doctrine = DOCTRINES.find((d) => d.id === state.prestige?.doctrine);
    doctrineEl.textContent = doctrine
      ? `${doctrine.icon} ${doctrine.name}`
      : "Sin doctrina";
  }

  const gainEl = document.getElementById("prestige-gain");
  if (gainEl)
    gainEl.textContent =
      gain > 0 ? `+${gain} al resetear` : "Acumula 1M kWh para resetear";

  const btn = document.getElementById("prestige-btn");
  if (btn) {
    if (gain > 0) {
      btn.disabled = false;
      btn.className =
        "text-[10px] font-extrabold uppercase tracking-wider px-3 py-2 border-[3px] border-black bg-[#00b4d8] hover:bg-[#0891b2] text-black b-interactive";
    } else {
      btn.disabled = true;
      btn.className =
        "text-[10px] font-extrabold uppercase tracking-wider px-3 py-2 border-[3px] border-[#555555] bg-[#3a3a3a] text-[#8a8a8a] opacity-60 cursor-not-allowed";
    }
  }
}

let activeUpgradeTooltip = null;

function getActiveUpgradeTooltip() {
  if (!activeUpgradeTooltip) {
    activeUpgradeTooltip = document.createElement("div");
    activeUpgradeTooltip.className =
      "fixed z-[9999] hidden pointer-events-none";
    activeUpgradeTooltip.style.cssText = `
      background: #0f0f0f;
      border: 3px solid #00b4d8;
      color: #ffffff;
      padding: 6px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: bold;
      line-height: 1.4;
      max-width: 240px;
      box-shadow: 4px 4px 0 0 #00b4d8;
      white-space: normal;
      word-break: break-word;
    `;
    document.body.appendChild(activeUpgradeTooltip);
  }
  return activeUpgradeTooltip;
}

function updateActiveUpgradesBar() {
  const container = document.getElementById("active-upgrades-bar");
  if (!container) return;

  const state = getState();
  const active = state.upgrades ?? [];

  if (active.length === 0) {
    container.innerHTML =
      '<span class="text-[10px] text-[#8a8a8a]">Ninguno</span>';
    return;
  }

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const tooltip = getActiveUpgradeTooltip();

  for (const id of active) {
    const upgrade = UPGRADES_BY_ID.get(id);
    if (!upgrade) continue;

    const chip = document.createElement("span");
    chip.className =
      "text-[9px] font-bold text-black px-1.5 py-0.5 border-[2px] border-black bg-[#00b4d8] whitespace-nowrap";
    chip.textContent = upgrade.name;

    chip.addEventListener("mouseenter", (e) => {
      tooltip.textContent = upgrade.description;
      tooltip.classList.remove("hidden");
      positionTooltip(e, tooltip);
    });

    chip.addEventListener("mousemove", (e) => {
      positionTooltip(e, tooltip);
    });

    chip.addEventListener("mouseleave", () => {
      tooltip.classList.add("hidden");
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

function updateComboMeter(comboCount, comboMult) {
  const meter = document.getElementById('combo-meter');
  if (!meter) return;
  const fill = document.getElementById('combo-fill');
  const text = document.getElementById('combo-text');

  if (comboCount <= 1) {
    meter.style.opacity = '0';
    return;
  }

  meter.style.opacity = '1';

  const state = getState();
  const cap = state.comboCap ?? 50;
  const percent = Math.min(100, (comboCount / cap) * 100);
  if (fill) fill.style.width = `${percent}%`;
  if (text) {
    text.textContent = `×${comboMult.toFixed(2)}`;
    if (comboCount > cap * 0.7) {
      text.className = 'text-[10px] font-extrabold text-[#ef4444] tabular-nums shrink-0 w-16 text-right';
    } else if (comboCount > cap * 0.4) {
      text.className = 'text-[10px] font-extrabold text-[#facc15] tabular-nums shrink-0 w-16 text-right';
    } else {
      text.className = 'text-[10px] font-extrabold text-[#00b4d8] tabular-nums shrink-0 w-16 text-right';
    }
  }
}

function updateAbilityButtons() {
  const state = getState();
  for (const id of ['energize', 'purge', 'overload']) {
    const btn = document.getElementById(`ability-${id}`);
    if (!btn) continue;

    const unlocked = state.abilities?.[id]?.unlocked;
    if (!unlocked) {
      btn.classList.add('hidden');
      continue;
    }
    btn.classList.remove('hidden');

    const ready = isAbilityReady(state, id);
    if (ready) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.textContent = `${glyphFor(id)} ${ABILITIES[id].name}`;
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      const secs = getCooldownRemaining(state, id);
      btn.textContent = `${glyphFor(id)} ${secs.toFixed(0)}s`;
    }

    if (id === 'energize') {
      const charges = state.abilities?.energize?.charges ?? 0;
      if (charges > 0) {
        btn.style.boxShadow = `0 0 12px ${ABILITIES.energize.color}`;
        btn.textContent = `⚡ ${charges}×`;
      }
    } else if (id === 'overload') {
      if (state.abilities?.overload?.activeUntil && Date.now() < state.abilities.overload.activeUntil) {
        btn.style.boxShadow = '0 0 14px #ef4444';
        btn.style.animation = 'pulseFast 0.5s infinite';
      } else {
        btn.style.animation = '';
      }
    }
  }
}

function glyphFor(id) {
  return { energize: '⚡', purge: '❄', overload: '🔥' }[id] ?? '';
}
