/**
 * Sonido procedural con Web Audio. Sin archivos: todo se sintetiza.
 * El contexto se crea con el primer gesto del usuario (requisito del navegador).
 */

import { G } from './core/state.js';

let ctx = null;
let master = null;
let noiseBuf = null;

function ready() {
  if (!G.settings.sound) return false;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.value = 0.35 * G.settings.volume;
  return true;
}

function tone(freq, { type = 'sine', at = 0, dur = 0.2, vol = 0.2, slide = 0, pan = 0 } = {}) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const p = ctx.createStereoPanner();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  p.pan.value = pan;
  o.connect(g).connect(p).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ at = 0, dur = 0.08, vol = 0.3, from = 1800, to = 300, pan = 0 } = {}) {
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  s.connect(f).connect(g).connect(p).connect(master);
  s.start(t, Math.random() * 0.3);
  s.stop(t + dur + 0.02);
}

export const sfx = {
  click(boosted = false) {
    if (!ready()) return;
    const pan = (Math.random() - 0.5) * 0.5;
    noise({ dur: 0.07, vol: 0.35, from: 1400 + Math.random() * 600, to: 180, pan });
    tone(110 + Math.random() * 25, { type: 'sine', dur: 0.12, vol: 0.35, slide: 0.5, pan });
    if (boosted) tone(880 + Math.random() * 200, { type: 'triangle', dur: 0.1, vol: 0.06, slide: 1.5, pan });
  },
  buy() {
    if (!ready()) return;
    tone(520, { type: 'triangle', dur: 0.09, vol: 0.12 });
    tone(780, { type: 'triangle', at: 0.06, dur: 0.14, vol: 0.12 });
  },
  sell() {
    if (!ready()) return;
    tone(600, { type: 'triangle', dur: 0.1, vol: 0.1 });
    tone(400, { type: 'triangle', at: 0.06, dur: 0.14, vol: 0.1 });
  },
  upgrade() {
    if (!ready()) return;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.05, dur: 0.22, vol: 0.09 }));
  },
  achievement() {
    if (!ready()) return;
    [784, 988, 1175].forEach((f, i) => tone(f, { type: 'sine', at: i * 0.09, dur: 0.6, vol: 0.12 }));
  },
  anomalySpawn() {
    if (!ready()) return;
    for (let i = 0; i < 6; i++) tone(1400 + i * 180, { type: 'sine', at: i * 0.04, dur: 0.35, vol: 0.035, pan: Math.sin(i) * 0.6 });
  },
  anomalyCapture() {
    if (!ready()) return;
    [659, 880, 1109, 1319, 1760].forEach((f, i) => tone(f, { type: 'square', at: i * 0.035, dur: 0.25, vol: 0.035 }));
    noise({ dur: 0.4, vol: 0.12, from: 8000, to: 1200 });
  },
  ascend() {
    if (!ready()) return;
    [65, 98, 131, 196].forEach((f, i) => tone(f, { type: 'sawtooth', at: i * 0.15, dur: 2.2, vol: 0.05, slide: 2 }));
  },
};
