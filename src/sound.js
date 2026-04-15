// ── Neo-Venezia Sound Engine ──────────────────────────────────────────────────
// All sounds are procedurally generated via Web Audio API — no audio files needed.
// Call initSound() once on first user interaction to unlock the AudioContext.

let ctx = null;
let masterGain = null;
let ambientNode = null;
let ambientGain = null;
let footStepTime = 0;

export function initSound() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);
    startCanalAmbience();
  } catch(e) { ctx = null; }
  return ctx;
}

export function setVolume(v) {
  if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.3);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function osc(type, freq, start, dur, vol, dest) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + dur * 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g); g.connect(dest || masterGain);
  o.start(start); o.stop(start + dur + 0.05);
}

function noise(dur, vol, filterFreq, dest) {
  if (!ctx) return;
  const bufSize = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 400;
  filter.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter); filter.connect(g); g.connect(dest || masterGain);
  src.start(); src.stop(ctx.currentTime + dur);
}

// ── Canal water ambience — gentle lapping loops ───────────────────────────────
function startCanalAmbience() {
  if (!ctx || ambientNode) return;
  // Low-frequency water burble: filtered noise + slow LFO
  const bufDur = 4;
  const buf = ctx.createBuffer(1, ctx.sampleRate * bufDur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  ambientNode = ctx.createBufferSource();
  ambientNode.buffer = buf;
  ambientNode.loop = true;

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 320;
  lpf.Q.value = 1.2;

  // LFO for gentle wave motion
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.18;
  lfoGain.gain.value = 80;
  lfo.connect(lfoGain);
  lfoGain.connect(lpf.frequency);
  lfo.start();

  ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.06;

  ambientNode.connect(lpf);
  lpf.connect(ambientGain);
  ambientGain.connect(masterGain);
  ambientNode.start();

  // Occasional water lap transients
  scheduleWaterLaps();
}

function scheduleWaterLaps() {
  if (!ctx) return;
  const lap = () => {
    if (!ctx) return;
    // Stone-lap splash — short noise burst
    noise(0.18, 0.04, 600 + Math.random() * 400);
    // Resonant drip tone
    const freq = 280 + Math.random() * 120;
    osc('sine', freq, ctx.currentTime, 0.55, 0.04);
    osc('sine', freq * 2.1, ctx.currentTime + 0.04, 0.3, 0.015);
    setTimeout(lap, 1800 + Math.random() * 3200);
  };
  setTimeout(lap, 800 + Math.random() * 2000);
}

// ── Footstep on stone / water ─────────────────────────────────────────────────
export function playFootstep(onWater) {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (now - footStepTime < 0.22) return; // rate-limit
  footStepTime = now;
  if (onWater) {
    // Hollow wooden plank knock
    noise(0.08, 0.055, 180 + Math.random() * 60);
    osc('sine', 95 + Math.random() * 15, now, 0.12, 0.025);
  } else {
    // Stone cobble thud
    noise(0.07, 0.06, 250 + Math.random() * 80);
    osc('sine', 60 + Math.random() * 20, now, 0.09, 0.02);
  }
}

// ── Bridge crossing chime ─────────────────────────────────────────────────────
export function playBridgeCross() {
  if (!ctx) return;
  const now = ctx.currentTime;
  // Three rising tones — like water resonating through stone arches
  const base = 330;
  [0, 0.14, 0.30].forEach((delay, i) => {
    osc('sine', base * Math.pow(1.25, i), now + delay, 1.1, 0.07);
    osc('triangle', base * Math.pow(1.25, i) * 2.01, now + delay + 0.02, 0.7, 0.018);
  });
  // Low watergate resonance
  osc('sine', 82, now, 1.8, 0.05);
}

// ── Bond formed — warm harmonic swell ────────────────────────────────────────
export function playBondFormed() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const root = 261.63; // C4
  // Perfect fifth + octave
  [[root,1.4],[root*1.5,1.1],[root*2,0.8],[root*3,0.5]].forEach(([f,dur],i)=>{
    osc('sine', f, now + i*0.07, dur, 0.055);
    osc('triangle', f*0.998, now + i*0.07 + 0.01, dur*.8, 0.018);
  });
  // Shimmer on top
  osc('sine', root*4, now+0.25, 0.6, 0.022);
}

// ── Bond clash — dissonant scrape ────────────────────────────────────────────
export function playBondClash() {
  if (!ctx) return;
  const now = ctx.currentTime;
  osc('sawtooth', 180, now, 0.18, 0.055);
  osc('sawtooth', 191, now + 0.04, 0.14, 0.04);
  noise(0.12, 0.04, 900);
  osc('sine', 95, now, 0.4, 0.035);
}

// ── Canal Vibe Match bloom ────────────────────────────────────────────────────
export function playCanalBloom() {
  if (!ctx) return;
  const now = ctx.currentTime;
  // Ascending water-glass tones
  const freqs = [392, 523.25, 659.25, 783.99];
  freqs.forEach((f, i) => {
    osc('sine', f, now + i * 0.11, 1.4 - i * 0.1, 0.045);
    osc('sine', f * 1.004, now + i * 0.11 + 0.015, 1.1, 0.015);
  });
  // Soft shimmer noise
  noise(0.6, 0.022, 1800);
}

// ── Zone encounter pulse ──────────────────────────────────────────────────────
export function playZoneEnter() {
  if (!ctx) return;
  const now = ctx.currentTime;
  osc('sine', 220, now, 0.55, 0.06);
  osc('triangle', 330, now + 0.12, 0.4, 0.03);
  noise(0.1, 0.03, 500);
}

// ── NPC encounter — subtle social ping ───────────────────────────────────────
export function playNPCNear() {
  if (!ctx) return;
  const now = ctx.currentTime;
  osc('sine', 528, now, 0.22, 0.028);
  osc('sine', 528 * 1.5, now + 0.08, 0.14, 0.015);
}

// ── Day/night transition ──────────────────────────────────────────────────────
export function playDawnChime() {
  if (!ctx) return;
  const now = ctx.currentTime;
  [0,0.18,0.38,0.62].forEach((d,i)=>{
    const f = 196 * Math.pow(1.189, i);
    osc('sine', f, now+d, 1.8, 0.04);
  });
}

export function playNightFall() {
  if (!ctx) return;
  const now = ctx.currentTime;
  [0,0.2,0.44].forEach((d,i)=>{
    const f = 220 * Math.pow(0.84, i);
    osc('sine', f, now+d, 2.0, 0.038);
  });
  osc('sine', 65, now, 3.0, 0.03);
}

// ── Set canal ambience volume (louder near canal) ─────────────────────────────
export function setCanalVolume(v) {
  if (ambientGain) ambientGain.gain.setTargetAtTime(Math.max(0.02, v * 0.14), ctx.currentTime, 0.8);
}
