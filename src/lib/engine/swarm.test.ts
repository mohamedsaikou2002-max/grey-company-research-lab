import { describe, expect, it } from "vitest";
import { runSimulation, RESPONSES, type RunInput } from "./swarm";
import { defaultInput } from "./defaults";

const base = (): RunInput => structuredClone(defaultInput);

describe("swarm engine", () => {
  it("same seed and input give identical output", () => {
    expect(runSimulation(base())).toEqual(runSimulation(base()));
  });
  it("response shares sum to ~1 each month", () => {
    for (const f of runSimulation(base()).frames) {
      const s = RESPONSES.reduce((a, r) => a + f.responses[r], 0);
      expect(Math.abs(s - 1)).toBeLessThan(0.01);
    }
  });
  it("changing swarm motives changes the input hash and results", () => {
    const a = base();
    const b = base();
    b.swarm.motives = { ...b.swarm.motives, no_special_interest: 0, financial_gain: 1 };
    const ra = runSimulation(a), rb = runSimulation(b);
    expect(ra.input_hash).not.toBe(rb.input_hash);
    expect(ra.summary.final).not.toEqual(rb.summary.final);
  });
  it("individual changes are separate from swarm config", () => {
    const b = base();
    b.individual.strategies = ["market_entry"];
    expect(runSimulation(b).input_hash).not.toBe(runSimulation(base()).input_hash);
    expect(b.swarm).toEqual(base().swarm);
  });
  it("rejects horizons over 60 months", () => {
    const b = base();
    b.scenario.months = 61;
    expect(() => runSimulation(b)).toThrow();
  });
});
