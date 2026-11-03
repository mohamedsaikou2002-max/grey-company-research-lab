import { describe, expect, it } from "vitest";
import { extractNarrativeSignals, runSimulation, RESPONSES, type RunInput } from "./swarm";
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
  it("defaults to an explicitly fictional adversarial stress test", () => {
    expect(base().swarm.baseline_mode).toBe("absolute_evil_stress_test");
    const run = runSimulation(base());
    expect(run.summary.baseline_mode).toBe("absolute_evil_stress_test");
    expect(run.summary.warning).toMatch(/fictional/i);
    expect(run.frames[0]?.mean_disengagement).toBeGreaterThan(0.5);
  });

  it("a changed narrative alters outcomes even with identical structured settings", () => {
    const engaged = base();
    const independent = base();
    engaged.scenario.narrative = "The association contacted the independent founder to compete for a contract.";
    independent.scenario.narrative = "The association has no contact with the independent founder.";
    const a = runSimulation(engaged), b = runSimulation(independent);
    expect(a.summary.narrative_signals.direct_contact).toBe(true);
    expect(b.summary.narrative_signals.explicit_no_contact).toBe(true);
    expect(a.summary.final).not.toEqual(b.summary.final);
  });

  it("never fabricates a directed response when the narrative states no contact", () => {
    const b = base();
    b.scenario.narrative = "The organization is unrelated to the founder and has no contact.";
    for (const frame of runSimulation(b).frames) {
      expect(frame.responses.no_response).toBe(1);
      expect(frame.responses.undue_pressure).toBe(0);
      expect(frame.responses.improper_gatekeeping).toBe(0);
    }
  });

  it("neutral negative controls disable hypothetical adverse-action states", () => {
    const b = base();
    b.swarm.baseline_mode = "neutral_reference";
    for (const frame of runSimulation(b).frames) {
      expect(frame.responses.undue_pressure).toBe(0);
      expect(frame.responses.improper_gatekeeping).toBe(0);
    }
  });

  it("religious labels alone do not become evidence of motive or contact", () => {
    const a = extractNarrativeSignals("The Kabbalah study group exists.");
    const b = extractNarrativeSignals("A secular book discussion group exists.");
    expect(a).toEqual(b);
    expect(a.direct_contact).toBe(false);
  });

  it("safeguards reduce synthetic adverse-action share in the fictional stress test", () => {
    const low = base(), high = base();
    low.scenario.narrative = "The company contacted the founder to compete for a market contract.";
    high.scenario.narrative = low.scenario.narrative;
    low.scenario.safeguards = 0;
    high.scenario.safeguards = 1;
    const outcome = (b: RunInput) => {
      const r = runSimulation(b).summary.final;
      return r.undue_pressure + r.improper_gatekeeping;
    };
    expect(outcome(high)).toBeLessThan(outcome(low));
  });

  it("rejects horizons over 60 months", () => {
    const b = base();
    b.scenario.months = 61;
    expect(() => runSimulation(b)).toThrow();
  });
});
