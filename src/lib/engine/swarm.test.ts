import { describe, expect, it } from "vitest";
import { runSimulation, RESPONSES, type RunInput } from "./swarm";
import { defaultInput } from "./defaults";
import { deriveNarrativeSignals } from "./negativeVisualization";

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
  it("starts new simulations in the fictional negative-visualization baseline", () => {
    const run = runSimulation(base());
    expect(run.summary.baseline_mode).toBe("negative_visualization");
    expect(run.frames[0]?.adversarial_intensity).toBeGreaterThan(0.8);
    expect(run.summary.label).toBe("SYNTHETIC / UNVALIDATED");
  });
  it("same narrative and seed produce identical results under worst-case assumptions", () => {
    const a = base();
    a.scenario.narrative = "A fictional founder faces a commercial dispute.";
    expect(runSimulation(a)).toEqual(runSimulation(a));
  });
  it("switching to open hypotheses changes the outcome without changing the narrative", () => {
    const a = base(), b = base();
    b.scenario.baseline_mode = "open_hypotheses";
    const x = runSimulation(a), y = runSimulation(b);
    expect(x.input_hash).not.toBe(y.input_hash);
    expect(x.summary.final.coercive_pressure).not.toEqual(y.summary.final.coercive_pressure);
  });
  it("narrative cues affect calculations rather than only the input hash", () => {
    const a = base(), b = base();
    a.scenario.narrative = "A fictional founder enters a competing market.";
    b.scenario.narrative = "The same fictional founder faces an independent audit and transparent review.";
    expect(runSimulation(a).summary.final).not.toEqual(runSimulation(b).summary.final);
  });
  it("a religious identity label alone does not increase assumed threat", () => {
    const a = deriveNarrativeSignals("A Kabbalistic Jewish circle exists.", "business_proposal");
    const b = deriveNarrativeSignals("A secular community circle exists.", "business_proposal");
    expect({ ...a, matched_cues: [] }).toEqual({ ...b, matched_cues: [] });
  });
  it("no contact produces stronger no-response incentives than an active dispute", () => {
    const a = base(), b = base();
    a.scenario.narrative = "They have no contact with this unrelated person.";
    b.scenario.narrative = "They negotiate and compete in a shared market amid a dispute.";
    expect(deriveNarrativeSignals(a.scenario.narrative, a.scenario.event_type).separation).toBeGreaterThan(0.9);
    expect(runSimulation(a).summary.final.no_response).toBeGreaterThan(runSimulation(b).summary.final.no_response);
  });
  it("rejects horizons over 60 months", () => {
    const b = base();
    b.scenario.months = 61;
    expect(() => runSimulation(b)).toThrow();
  });
});
