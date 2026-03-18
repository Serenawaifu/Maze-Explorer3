import { create } from "zustand";

interface AudioState {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
}

export const useAudioState = create<AudioState>((set, get) => ({
  muted: false,
  volume: 0.7,
  toggleMute: () => set({ muted: !get().muted }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
}));

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let ambientStarted = false;
let ambientNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
let ambientSubNodes: (GainNode | BiquadFilterNode)[] = [];
let convolver: ConvolverNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = useAudioState.getState().volume;
    masterGain.connect(audioCtx.destination);

    convolver = audioCtx.createConvolver();
    const rate = audioCtx.sampleRate;
    const len = rate * 1.8;
    const impulse = audioCtx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    convolver.buffer = impulse;
    convolver.connect(masterGain!);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

export function updateMasterVolume() {
  const { muted, volume } = useAudioState.getState();
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
  }
}

export function startAmbient() {
  if (ambientStarted) return;
  const ctx = getCtx();
  ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.12;
  ambientGain.connect(getMaster());

  const freqs = [55, 82.41, 110, 73.42];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
    osc.frequency.value = freq;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.03 + (i * 0.008);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200 + i * 50;
    filter.Q.value = 2;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.1 + i * 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);
    lfo.start();

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(ambientGain!);
    osc.start();
    ambientNodes.push(osc, lfo);
    ambientSubNodes.push(oscGain, filter, lfoGain);
  });

  const noiseLen = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.015;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 300;
  noiseFilter.Q.value = 0.5;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(ambientGain);
  noiseSource.start();
  ambientNodes.push(noiseSource);
  ambientSubNodes.push(noiseFilter);

  ambientStarted = true;
}

export function stopAmbient() {
  ambientNodes.forEach((o) => {
    try { o.stop(); } catch {}
    try { o.disconnect(); } catch {}
  });
  ambientNodes = [];
  ambientSubNodes.forEach((n) => {
    try { n.disconnect(); } catch {}
  });
  ambientSubNodes = [];
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
  ambientStarted = false;
}

let lastFootstepTime = 0;
export function playFootstep() {
  const now = performance.now();
  if (now - lastFootstepTime < 320) return;
  lastFootstepTime = now;

  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80 + Math.random() * 40, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(convolver!);

  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.5;
  gain.connect(dryGain);
  dryGain.connect(getMaster());

  osc.start(t);
  osc.stop(t + 0.2);

  const noise = ctx.createBufferSource();
  const noiseLen = ctx.sampleRate * 0.05;
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.06;
  }
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.08, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  noise.connect(nGain);
  nGain.connect(convolver!);
  noise.start(t);
  noise.stop(t + 0.12);
}

let heartbeatGain: GainNode | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let currentHeartbeatIntensity = 0;
let closestEnemyDist = Infinity;

export function reportEnemyDistance(distance: number) {
  if (distance < closestEnemyDist) {
    closestEnemyDist = distance;
  }
}

export function flushProximityFrame() {
  updateProximityAudio(closestEnemyDist, 15);
  closestEnemyDist = Infinity;
}

export function updateProximityAudio(distance: number, maxRange: number) {
  const ctx = getCtx();
  if (!heartbeatGain) {
    heartbeatGain = ctx.createGain();
    heartbeatGain.gain.value = 0;
    heartbeatGain.connect(getMaster());
  }

  if (distance > maxRange) {
    currentHeartbeatIntensity = 0;
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    return;
  }

  const intensity = Math.pow(1 - distance / maxRange, 1.5);
  currentHeartbeatIntensity = intensity;

  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      if (currentHeartbeatIntensity <= 0.01) return;
      playHeartbeat(currentHeartbeatIntensity);
    }, 600);
  }
}

function playHeartbeat(intensity: number) {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const vol = intensity * 0.25;

  for (let beat = 0; beat < 2; beat++) {
    const offset = beat * 0.15;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(50 + intensity * 20, t + offset);
    osc.frequency.exponentialRampToValueAtTime(30, t + offset + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t + offset);
    gain.gain.linearRampToValueAtTime(vol * (beat === 0 ? 1 : 0.7), t + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.15);

    osc.connect(gain);
    gain.connect(getMaster());
    osc.start(t + offset);
    osc.stop(t + offset + 0.2);
  }

  if (intensity > 0.5) {
    const growl = ctx.createOscillator();
    growl.type = "sawtooth";
    growl.frequency.value = 35 + Math.random() * 15;
    const gGain = ctx.createGain();
    gGain.gain.setValueAtTime(intensity * 0.04, t);
    gGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    const gFilter = ctx.createBiquadFilter();
    gFilter.type = "lowpass";
    gFilter.frequency.value = 150;
    growl.connect(gFilter);
    gFilter.connect(gGain);
    gGain.connect(convolver!);
    growl.start(t);
    growl.stop(t + 0.5);
  }
}

export function playPickup() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.07;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(getMaster());

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    gain.connect(reverbGain);
    reverbGain.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.3);
  });

  const shimmer = ctx.createOscillator();
  shimmer.type = "triangle";
  shimmer.frequency.value = 2093;
  const sGain = ctx.createGain();
  sGain.gain.setValueAtTime(0.03, t + 0.2);
  sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  shimmer.connect(sGain);
  sGain.connect(getMaster());
  shimmer.start(t + 0.2);
  shimmer.stop(t + 0.65);
}

export function playLoreDiscovery() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [392, 440, 523.25, 587.33, 659.25];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i < 3 ? "sine" : "triangle";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

    osc.connect(gain);
    gain.connect(getMaster());

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;
    gain.connect(reverbGain);
    reverbGain.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.7);
  });

  const pad = ctx.createOscillator();
  pad.type = "sine";
  pad.frequency.value = 196;
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0, t);
  padGain.gain.linearRampToValueAtTime(0.04, t + 0.2);
  padGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  pad.connect(padGain);
  padGain.connect(getMaster());
  pad.start(t);
  pad.stop(t + 1.3);
}

export function playDamage() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  const distortion = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = (Math.PI + 20) * x / (Math.PI + 20 * Math.abs(x));
  }
  distortion.curve = curve;
  distortion.oversample = "4x";

  osc.connect(distortion);
  distortion.connect(gain);
  gain.connect(getMaster());
  osc.start(t);
  osc.stop(t + 0.45);

  const noise = ctx.createBufferSource();
  const noiseLen = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.12, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = "highpass";
  nFilter.frequency.value = 800;
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(getMaster());
  noise.start(t);
  noise.stop(t + 0.25);
}

export function playVictoryFanfare() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const melody = [
    { freq: 523.25, time: 0, dur: 0.2 },
    { freq: 659.25, time: 0.15, dur: 0.2 },
    { freq: 783.99, time: 0.3, dur: 0.2 },
    { freq: 1046.5, time: 0.45, dur: 0.5 },
    { freq: 783.99, time: 0.7, dur: 0.15 },
    { freq: 1046.5, time: 0.85, dur: 0.6 },
  ];

  melody.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + time;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
    gain.gain.setValueAtTime(0.15, start + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(getMaster());

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.4;
    gain.connect(reverbSend);
    reverbSend.connect(convolver!);

    osc.start(start);
    osc.stop(start + dur + 0.05);

    const harm = ctx.createOscillator();
    harm.type = "sine";
    harm.frequency.value = freq * 2;
    const hGain = ctx.createGain();
    hGain.gain.setValueAtTime(0, start);
    hGain.gain.linearRampToValueAtTime(0.04, start + 0.03);
    hGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    harm.connect(hGain);
    hGain.connect(getMaster());
    harm.start(start);
    harm.stop(start + dur + 0.05);
  });
}

export function playLevelComplete() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [392, 523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.setValueAtTime(0.12, start + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

    osc.connect(gain);
    gain.connect(getMaster());

    const rv = ctx.createGain();
    rv.gain.value = 0.3;
    gain.connect(rv);
    rv.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.45);
  });
}

export function playBossHit() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

  const distortion = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 3);
  }
  distortion.curve = curve;

  osc.connect(distortion);
  distortion.connect(gain);
  gain.connect(getMaster());
  osc.start(t);
  osc.stop(t + 0.35);

  const impact = ctx.createOscillator();
  impact.type = "sine";
  impact.frequency.setValueAtTime(80, t);
  impact.frequency.exponentialRampToValueAtTime(20, t + 0.15);
  const iGain = ctx.createGain();
  iGain.gain.setValueAtTime(0.3, t);
  iGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  impact.connect(iGain);
  iGain.connect(getMaster());
  impact.start(t);
  impact.stop(t + 0.25);
}

export function playPlayerAttack() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(t);
  osc.stop(t + 0.25);

  const noise = ctx.createBufferSource();
  const noiseLen = ctx.sampleRate * 0.1;
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.1, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = "highpass";
  nFilter.frequency.value = 2000;
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(getMaster());
  noise.start(t);
  noise.stop(t + 0.15);
}

export function playBossRoar() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(100, t);
  osc1.frequency.linearRampToValueAtTime(60, t + 0.5);
  osc1.frequency.linearRampToValueAtTime(80, t + 1.0);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0, t);
  gain1.gain.linearRampToValueAtTime(0.15, t + 0.1);
  gain1.gain.setValueAtTime(0.15, t + 0.6);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  filter.Q.value = 3;

  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(getMaster());

  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.5;
  gain1.connect(reverbSend);
  reverbSend.connect(convolver!);

  osc1.start(t);
  osc1.stop(t + 1.3);

  const osc2 = ctx.createOscillator();
  osc2.type = "square";
  osc2.frequency.value = 45;
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.06, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  osc2.connect(gain2);
  gain2.connect(getMaster());
  osc2.start(t);
  osc2.stop(t + 1.1);
}

export function playBossDeath() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const startFreq = 200 - i * 30;
    osc.frequency.setValueAtTime(startFreq, t + i * 0.3);
    osc.frequency.exponentialRampToValueAtTime(20, t + i * 0.3 + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t + i * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.3 + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400 - i * 50;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMaster());

    const rv = ctx.createGain();
    rv.gain.value = 0.4;
    gain.connect(rv);
    rv.connect(convolver!);

    osc.start(t + i * 0.3);
    osc.stop(t + i * 0.3 + 0.6);
  }
}

export function playCollapseRumble() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 30;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.setValueAtTime(0.15, t + 2.5);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 100;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc.start(t);
  osc.stop(t + 4.5);

  const noise = ctx.createBufferSource();
  const noiseLen = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.1;
  }
  noise.buffer = buf;
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = "lowpass";
  nFilter.frequency.value = 200;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.12, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(getMaster());
  noise.start(t);
  noise.stop(t + 4.2);
}

export function playGameOver() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const notes = [
    { freq: 293.66, time: 0 },
    { freq: 261.63, time: 0.3 },
    { freq: 220, time: 0.6 },
    { freq: 196, time: 0.9 },
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + time;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMaster());

    const rv = ctx.createGain();
    rv.gain.value = 0.5;
    gain.connect(rv);
    rv.connect(convolver!);

    osc.start(start);
    osc.stop(start + 0.6);
  });
}
