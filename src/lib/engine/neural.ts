/**
 * Port of NeuroAtlas electrophysiology.synthesize_eeg concept: synthetic, unitless
 * EEG proxies (sum of band oscillators modulated by a model excitation trace).
 * NOT a biophysical model; never represents real brain activity.
 */
import { mulberry32 } from "./swarm";

export const NEURAL_VERSION = "na-eeg-ts-1.0.0";
export const BANDS = { delta: [0.5, 4], theta: [4, 8], alpha: [8, 13], beta: [13, 30], gamma: [30, 80] } as const;
const OSC = [2, 6, 10, 21, 41];
export const REGIONS = ["Prefrontal", "Motor", "Parietal", "Temporal", "Occipital", "Insula", "Hippocampal", "Thalamus"];

export type NeuralInput = { seed: number; sensors: number; seconds: number; hz: number; arousal: number; task: "rest" | "attention" | "sleep" };

export function synthesizeEEG(inp: NeuralInput) {
  const r = mulberry32(inp.seed);
  const n = Math.round(inp.seconds * inp.hz);
  const taskGain = { rest: [0.3, 0.3, 0.9, 0.3, 0.1], attention: [0.1, 0.4, 0.3, 0.8, 0.5], sleep: [1, 0.6, 0.2, 0.1, 0.05] }[inp.task];
  const phases = OSC.map(() => REGIONS.map(() => r() * Math.PI * 2));
  const lead = Array.from({ length: inp.sensors }, () => REGIONS.map(() => r() * 2 - 1));
  const signals = Array.from({ length: inp.sensors }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    const t = i / inp.hz;
    const exc = 0.5 + inp.arousal * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.1 * t));
    const src = REGIONS.map((_, j) => OSC.reduce((p, f, k) => p + (taskGain[k] ?? 0) * Math.sin(2 * Math.PI * f * t + (phases[k]?.[j] ?? 0)), 0) * exc);
    for (let s = 0; s < inp.sensors; s++) {
      const w = lead[s] ?? [];
      const out = signals[s];
      if (out) out[i] = w.reduce((p, ww, j) => p + ww * (src[j] ?? 0), 0) / REGIONS.length + 0.05 * (r() - 0.5);
    }
  }
  return signals;
}

export function bandPower(sig: Float64Array, hz: number) {
  const n = sig.length;
  const out: Record<string, number> = {};
  for (const [b, [lo, hi]] of Object.entries(BANDS)) {
    let p = 0;
    for (let f = lo; f < Math.min(hi, hz / 2); f += 0.5) {
      let re = 0, im = 0;
      for (let i = 0; i < n; i += 2) {
        const a = (2 * Math.PI * f * i) / hz;
        const v = sig[i] ?? 0;
        re += v * Math.cos(a);
        im -= v * Math.sin(a);
      }
      p += (re * re + im * im) / n;
    }
    out[b] = p;
  }
  const total = Object.values(out).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, +(v / total).toFixed(4)]));
}

export function connectivity(signals: Float64Array[]) {
  const m = signals.map((a) => signals.map((b) => {
    let ab = 0, aa = 0, bb = 0;
    for (let i = 0; i < a.length; i++) { const x = a[i] ?? 0, y = b[i] ?? 0; ab += x * y; aa += x * x; bb += y * y; }
    return +(ab / Math.sqrt(aa * bb || 1)).toFixed(3);
  }));
  return m;
}

export function runNeural(inp: NeuralInput) {
  const s = synthesizeEEG(inp);
  const first = s[0] ?? new Float64Array(Math.round(inp.seconds * inp.hz));
  return {
    version: NEURAL_VERSION,
    label: "SYNTHETIC / ILLUSTRATIVE" as const,
    bands: bandPower(first, inp.hz),
    connectivity: connectivity(s),
    preview: s.slice(0, 4).map((x) => Array.from(x.slice(0, Math.min(x.length, 400)), (v) => +v.toFixed(4))),
  };
}
