"use client";

let ctx: AudioContext | null = null;

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
  if (typeof window === "undefined") return;
  ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  const t = ctx.currentTime + delay;
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export type SoundName = "play" | "win" | "turn" | "deal" | "chat";

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  try {
    if (name === "play") tone(320, 0.08, "square", 0.04);
    if (name === "deal") tone(220, 0.12, "triangle", 0.06);
    if (name === "turn") {
      tone(660, 0.1);
      tone(880, 0.12, "sine", 0.08, 0.1);
    }
    if (name === "win") [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, "triangle", 0.08, i * 0.15));
    if (name === "chat") tone(900, 0.05, "sine", 0.04);
  } catch {
    /* audio unavailable */
  }
}
