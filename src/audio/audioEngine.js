/**
 * Audio Engine — Sonidos procedurales con Web Audio API.
 * Sin dependencias externas. Pop/click/ding/chime generados en tiempo real.
 */

let audioCtx = null;
let masterGain = null;

const SOUND_ENABLED = true;

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Pop cálido y satisfactorio para clics en el reactor.
 * Ruido blanco filtrado con pitch drop rápido.
 */
export function playClickPop(intensity = 1) {
  if (!SOUND_ENABLED) return;
  ensureContext();

  const t0 = audioCtx.currentTime;
  const duration = 0.08;

  // Ruido blanco
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  // Filtro paso-bajo que baja de frecuencia
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, t0);
  filter.frequency.exponentialRampToValueAtTime(200, t0 + duration);

  // Envolvente
  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(0.4 * intensity, t0 + 0.005);
  env.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

  // Pan aleatorio
  const panner = audioCtx.createStereoPanner();
  panner.pan.value = (Math.random() - 0.5) * 0.6;

  noise.connect(filter);
  filter.connect(env);
  env.connect(panner);
  panner.connect(masterGain);

  noise.start(t0);
  noise.stop(t0 + duration);
}

/**
 * Pop más suave y agudo para auto-clicks de cursor.
 */
export function playAutoClickPop() {
  if (!SOUND_ENABLED) return;
  ensureContext();

  const t0 = audioCtx.currentTime;
  const duration = 0.06;

  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, t0);
  filter.frequency.exponentialRampToValueAtTime(400, t0 + duration);

  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(0.15, t0 + 0.003);
  env.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

  const panner = audioCtx.createStereoPanner();
  panner.pan.value = (Math.random() - 0.5) * 0.8;

  noise.connect(filter);
  filter.connect(env);
  env.connect(panner);
  panner.connect(masterGain);

  noise.start(t0);
  noise.stop(t0 + duration);
}

/**
 * Ding metálico ascendente para compra de edificio.
 * Onda sinusoidal con vibrato ligero.
 */
export function playPurchaseDing() {
  if (!SOUND_ENABLED) return;
  ensureContext();

  const t0 = audioCtx.currentTime;

  // Tono principal ascendente
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t0);
  osc.frequency.linearRampToValueAtTime(880, t0 + 0.15);

  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(0.25, t0 + 0.02);
  env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

  osc.connect(env);
  env.connect(masterGain);

  osc.start(t0);
  osc.stop(t0 + 0.35);
}

/**
 * Chime brillante para milestones/desbloqueos.
 * Tres notas en arpegio rápido.
 */
export function playMilestoneChime() {
  if (!SOUND_ENABLED) return;
  ensureContext();

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const t0 = audioCtx.currentTime;

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0, t0 + i * 0.08);
    env.gain.linearRampToValueAtTime(0.2, t0 + i * 0.08 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.08 + 0.4);

    osc.connect(env);
    env.connect(masterGain);

    osc.start(t0 + i * 0.08);
    osc.stop(t0 + i * 0.08 + 0.4);
  });
}
