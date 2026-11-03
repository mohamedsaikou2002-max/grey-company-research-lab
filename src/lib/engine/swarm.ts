/**
 * Grey Company v4 swarm-vs-individual engine (TypeScript, deterministic).
 * Candidate model from Occult Killer v4.1 spec section B: per-agent utility over
 * a response taxonomy with random effects. SYNTHETIC / UNVALIDATED — outputs are
 * synthetic utility-derived shares, not empirically calibrated probabilities.
 */
import { z } from "zod";

export const MODEL_VERSION = "gc-swarm-ts-4.2.0";

export const RESPONSES = [
  "no_response",
  "routine_competition",
  "collaboration",
  "dialogue",
  "due_diligence",
  "scrutiny",
  "disengagement",
  "internal_review",
  "accountability",
  "undue_pressure",
  "improper_gatekeeping",
] as const;
export type Response = (typeof RESPONSES)[number];

export const SWARM_MOTIVES = [
  "financial_gain",
  "prestige_status",
  "group_belonging",
  "ideological_commitment",
  "institutional_self_preservation",
  "procedural_duty",
  "justice_compassion",
  "no_special_interest",
  "dominance_control",
  "status_defense",
  "impunity",
  "instrumental_exploitation",
] as const;
export const SWARM_STRATEGIES = [
  "collaboration",
  "due_diligence",
  "competition",
  "internal_deliberation",
  "disengagement",
  "oversight_remediation",
] as const;
export const GROUP_TRAITS = [
  "cohesion",
  "hierarchy",
  "pluralism",
  "accountability",
  "defensiveness",
  "openness",
  "integrity",
  "dissent_safety",
  "reputational_pressure",
  "reward_sensitivity",
] as const;
export const INDIVIDUAL_MOTIVES = [
  "autonomy",
  "wealth_market_growth",
  "duty_justice",
  "reputation",
  "security",
  "service",
  "relationship_building",
] as const;
export const INDIVIDUAL_STRATEGIES = [
  "transparent_engagement",
  "evidence_verification",
  "partnership_outreach",
  "market_entry",
  "patient_observation",
  "independent_counsel",
  "boundary_setting",
  "public_documentation",
  "quiet_disengagement",
  "formal_complaint",
  "community_building",
] as const;
export const INDIVIDUAL_TRAITS = [
  "patience",
  "humility",
  "verification_discipline",
  "compassion",
  "boundary_discipline",
  "stress_tolerance",
  "financial_runway",
  "willingness_to_collaborate",
] as const;

const unit = z.number().min(0).max(1);
const weightMap = z.record(z.string().min(1).max(60), z.number().min(0).max(1));
const custom = z.object({
  label: z.string().min(1).max(60),
  weight: unit,
  justification: z.string().min(1).max(500),
});

export const SwarmSchema = z.object({
  // Always a synthetic scenario preset; neutral_reference is the essential negative control.
  baseline_mode: z.enum(["absolute_evil_stress_test", "neutral_reference"]).default("absolute_evil_stress_test"),
  title: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  institutional_type: z.string().max(80).default("fictional archetype"),
  roles: z.array(z.object({ id: z.string().min(1).max(32), label: z.string().min(1).max(60), share: unit })).min(1).max(8),
  motives: weightMap,
  custom_motives: z.array(custom).max(6).default([]),
  motive_provenance: z.record(z.string(), z.string().max(300)).default({}),
  strategy: weightMap,
  objective: z.string().max(600).default(""),
  traits: z.record(z.string(), unit),
});
export type Swarm = z.infer<typeof SwarmSchema>;

export const IndividualSchema = z.object({
  name: z.string().min(1).max(80),
  motives: weightMap,
  custom_motives: z.array(custom).max(6).default([]),
  strategies: z.array(z.enum(INDIVIDUAL_STRATEGIES)).min(1).max(11),
  lawful_objective: z.string().max(600).default(""),
  ethical_boundaries: z.string().max(600).default(""),
  transparency: unit,
  traits: z.record(z.string(), unit),
  ethics_lens: z.enum(["none", "quranic", "secular"]).default("none"),
});
export type Individual = z.infer<typeof IndividualSchema>;

export const ScenarioSchema = z.object({
  narrative: z.string().min(1).max(2500),
  event_type: z.enum(["business_proposal", "market_entry", "competitor_response", "confirmed_report", "unsupported_rumor"]),
  evidence_tier: z.enum(["documented", "corroborated", "single_testimony", "rumor"]),
  months: z.number().int().min(1).max(60),
  agents: z.number().int().min(10).max(400),
  seed: z.number().int().min(0).max(2 ** 31 - 1),
  trials: z.number().int().min(1).max(50),
  safeguards: unit,
  external_shock: unit,
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const RunInputSchema = z.object({ swarm: SwarmSchema, individual: IndividualSchema, scenario: ScenarioSchema });
export type RunInput = z.infer<typeof RunInputSchema>;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  const u = Math.max(1e-12, r());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const clip = (v: number) => Math.max(0, Math.min(1, v));

export function normalize(w: Record<string, number>): Record<string, number> {
  const s = Object.values(w).reduce((a, b) => a + b, 0);
  if (s <= 0) {
    const k = Object.keys(w);
    return Object.fromEntries(k.map((x) => [x, 1 / Math.max(1, k.length)]));
  }
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / s]));
}

/** Stable FNV-1a hash of canonical JSON, used for input versioning. */
export function hashInput(v: unknown): string {
  const canon = (x: unknown): string =>
    Array.isArray(x)
      ? `[${x.map(canon).join(",")}]`
      : x && typeof x === "object"
        ? `{${Object.keys(x as object).sort().map((k) => `${JSON.stringify(k)}:${canon((x as Record<string, unknown>)[k])}`).join(",")}}`
        : JSON.stringify(x);
  let h = 0x811c9dc5;
  for (const c of canon(v)) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

/**
 * A deliberately narrow, transparent lexical feature extractor; it does not
 * resolve actors or establish facts. These signals are MODEL INPUTS only.
 * Future NLP adapters must emit reviewable structured signals, never covert "proof".
 */
export function extractNarrativeSignals(narrative: string) {
  const n = narrative.toLowerCase();
  const has = (re: RegExp) => re.test(n);
  return {
    explicit_no_contact: has(/\b(no (contact|interaction|connection|relationship|awareness)|unaware of|does not know|never met|unrelated|no evidence of contact)\b/),
    direct_contact: has(/\b(meets?|contacted?|approach(?:es|ed)?|negotiat(?:e|es|ion|ing)|communicat(?:e|ion|ed)|invites?|offers?|message(?:s|d)?|recruit(?:s|ed)?)\b/),
    market_competition: has(/\b(compet(?:e|es|ed|ition|itor|itors)|market(?: share| entry)?|price(?:s| war)?|commercial|business|bid|contract|acqui(?:re|sition)|monopoly)\b/),
    authority_claim: has(/\b(claim(?:s|ed)? (?:spiritual|supernatural|divine|exclusive) authority|threaten(?:s|ed)? with (?:a curse|spiritual punishment)|spiritual coercion)\b/),
    oversight: has(/\b(oversight|independent investigation|audit|court|regulator|due process|whistleblow|report(?:ed|ing)? misconduct|external review)\b/),
    verified_interference: has(/\b(documented interference|verified obstruction|proven retaliation|confirmed misconduct)\b/),
  };
}
export type NarrativeSignals = ReturnType<typeof extractNarrativeSignals>;

const EVIDENCE_WEIGHT = { documented: 1, corroborated: 0.75, single_testimony: 0.35, rumor: 0.1 } as const;
const ZERO = Object.fromEntries(RESPONSES.map((r) => [r, 0])) as Record<Response, number>;

export type Frame = {
  month: number;
  responses: Record<Response, number>;
  cohesion: number;
  accountability: number;
  indices: { autonomy: number; safety: number; integrity: number; evidence: number };
  hostility_index: number;
  mean_disengagement: number;
};
export type AgentState = {
  id: number;
  role: string;
  state: Response;
  top_drivers: { factor: string; contribution: number }[];
  disengagement: number;
  utilities: Record<Response, number>;
};

function utilities(
  m: Record<string, number>,
  st: Record<string, number>,
  t: Record<string, number>,
  ind: { openness: number; transparency: number; collab: number; market: number; boundaries: number },
  ctx: { evidence: number; safeguards: number; shock: number; rumor: boolean; adversarial: number; contact: number; conflict: number; oversight: number; hostility: number; authorityClaim: boolean },
  disengage: number,
): { u: Record<Response, number>; parts: Record<string, number> } {
  const g = (k: string) => t[k] ?? 0.5;
  const parts = {
    "financial gain": m["financial_gain"] ?? 0,
    "prestige/status": m["prestige_status"] ?? 0,
    belonging: m["group_belonging"] ?? 0,
    "self-preservation": m["institutional_self_preservation"] ?? 0,
    "procedural duty": m["procedural_duty"] ?? 0,
    "justice/compassion": m["justice_compassion"] ?? 0,
    "no special interest": m["no_special_interest"] ?? 0,
    "dominance/control": m["dominance_control"] ?? 0,
    impunity: m["impunity"] ?? 0,
    exploitation: m["instrumental_exploitation"] ?? 0,
    "status defense": m["status_defense"] ?? 0,
    "evidence strength": ctx.evidence,
    oversight: g("accountability") * ctx.safeguards,
  };
  const u: Record<Response, number> = {
    no_response: 1.4 * parts["no special interest"] + 1.9 * (1 - ctx.contact) + 0.4 * (1 - ctx.evidence) + 0.3 * ctx.shock,
    routine_competition: 1.6 * parts["financial gain"] * ind.market + 0.4 * g("reward_sensitivity"),
    collaboration: 1.2 * (m["financial_gain"] ?? 0) * ind.collab + 0.8 * g("openness") + 0.6 * (st["collaboration"] ?? 0) + 0.4 * ind.transparency,
    dialogue: 0.9 * g("openness") + 0.6 * g("pluralism") + 0.5 * ind.openness,
    due_diligence: 1.1 * parts["procedural duty"] + 0.8 * (st["due_diligence"] ?? 0) + 0.5 * ctx.evidence,
    scrutiny: 0.9 * parts["prestige/status"] + 0.8 * g("reputational_pressure") * (ctx.rumor ? 0.6 : 1) + 0.4 * g("defensiveness") + 0.4 * ctx.conflict * ctx.contact,
    disengagement: 0.8 * (st["disengagement"] ?? 0) + 0.6 * parts["self-preservation"] + 0.3 * ctx.shock,
    internal_review: 0.9 * g("integrity") * ctx.evidence + 0.8 * (st["internal_deliberation"] ?? 0) + 0.5 * g("dissent_safety"),
    accountability:
      1.3 * parts.oversight * ctx.evidence + 0.9 * parts["justice/compassion"] * ctx.evidence + 0.6 * (st["oversight_remediation"] ?? 0) + 0.7 * ctx.oversight - 0.9 * g("defensiveness") * disengage,
    // These are ABSTRACT institution-level failure modes. They never specify
    // methods of abuse or infer that any actual group is behaving this way.
    undue_pressure:
      ctx.adversarial * ctx.hostility * ctx.contact * (1 - 0.75 * ctx.safeguards) *
      (1.8 * parts["dominance/control"] + 1.2 * parts.impunity + 1.0 * parts.exploitation + 0.65 * disengage + (ctx.authorityClaim ? 0.35 : 0)) * (1 - 0.3 * ind.boundaries),
    improper_gatekeeping:
      ctx.adversarial * ctx.hostility * ctx.contact * ctx.conflict * (1 - 0.7 * ctx.safeguards) *
      (1.8 * parts["dominance/control"] + 1.3 * parts["status defense"] + 1.1 * parts["self-preservation"] + 0.5 * g("hierarchy")),
  };
  return { u, parts };
}

export type RunResult = {
  model_version: string;
  engine: "typescript";
  input_hash: string;
  seed: number;
  frames: Frame[];
  agents: AgentState[];
  summary: { final: Record<Response, number>; label: "SYNTHETIC / UNVALIDATED"; trials: number; ci90: Record<Response, [number, number]>; narrative_signals: NarrativeSignals; baseline_mode: Swarm["baseline_mode"]; warning: string };
};

function runOnce(input: RunInput, seed: number, keepAgents: boolean) {
  const { swarm, individual, scenario } = input;
  const rng = mulberry32(seed);
  const narrative = extractNarrativeSignals(scenario.narrative);
  const adversarial = swarm.baseline_mode === "absolute_evil_stress_test" ? 1 : 0;
  const contact = narrative.explicit_no_contact ? 0 : narrative.direct_contact ? 1 :
    scenario.event_type === "business_proposal" ? 0.8 :
    narrative.market_competition || scenario.event_type === "competitor_response" ? 0.55 : 0.2;
  const conflict = narrative.market_competition || scenario.event_type === "competitor_response" || scenario.event_type === "market_entry" ? 1 : 0.15;
  const oversight = narrative.oversight ? 1 : 0;
  const m = normalize({ ...swarm.motives, ...Object.fromEntries(swarm.custom_motives.map((c) => [c.label, c.weight])) });
  const st = normalize(swarm.strategy);
  const it = individual.traits;
  const strat = new Set(individual.strategies);
  const ind = {
    openness: clip(0.3 + 0.4 * (it["humility"] ?? 0.5) + (strat.has("transparent_engagement") ? 0.2 : 0)),
    transparency: individual.transparency,
    collab: clip((it["willingness_to_collaborate"] ?? 0.5) + (strat.has("partnership_outreach") ? 0.2 : 0)),
    market: clip(0.3 + (individual.motives["wealth_market_growth"] ?? 0) + (strat.has("market_entry") ? 0.3 : 0)),
    boundaries: it["boundary_discipline"] ?? 0.5,
  };
  const evidence = EVIDENCE_WEIGHT[scenario.evidence_tier];
  const rumor = scenario.evidence_tier === "rumor" || scenario.event_type === "unsupported_rumor";
  const roles = swarm.roles;
  const rs = roles.reduce((a, r) => a + r.share, 0) || 1;
  const agents = Array.from({ length: scenario.agents }, (_, i) => {
    let x = rng() * rs;
    const role = roles.find((r) => (x -= r.share) <= 0) ?? roles[roles.length - 1] ?? { id: "unassigned", label: "Unassigned", share: 0 };
    const traits = Object.fromEntries(Object.entries(swarm.traits).map(([k, v]) => [k, clip(v + 0.12 * gauss(rng))]));
    return { id: i, role: role.label, traits, re: 0.25 * gauss(rng), d: clip((adversarial ? 0.75 : 0.2) + 0.18 * (1 - (traits["integrity"] ?? 0.5))), state: "no_response" as Response, last: null as null | ReturnType<typeof utilities> };
  });
  const frames: Frame[] = [];
  let cohesion = swarm.traits["cohesion"] ?? 0.5;
  let acc = swarm.traits["accountability"] ?? 0.5;
  // Moral hostility is a scenario construct, not an inference about a population.
  // Narrative context and oversight can attenuate the realized response despite
  // the explicitly pessimistic initial assumptions.
  let hostility = adversarial ? 0.94 : 0.1;
  for (let month = 1; month <= scenario.months; month++) {
    const counts = Object.fromEntries(RESPONSES.map((r) => [r, 0])) as Record<Response, number>;
    const shock = scenario.external_shock * (rng() < 0.15 ? 1 : 0.2);
    for (const a of agents) {
      // Explicitly unrelated people cannot be assigned a directed response.
      // This negative control is stronger than lowering a utility, because a
      // softmax still gives zero-utility states nonzero selection probability.
      if (narrative.explicit_no_contact) {
        a.state = "no_response";
        a.last = null;
        counts.no_response++;
        continue;
      }
      const res = utilities(m, st, { ...a.traits, accountability: acc, cohesion }, ind, {
        evidence, safeguards: scenario.safeguards, shock, rumor, adversarial,
        contact, conflict, oversight, hostility, authorityClaim: narrative.authority_claim,
      }, a.d);
      const logits = RESPONSES.map((r) =>
        (!adversarial && (r === "undue_pressure" || r === "improper_gatekeeping")) ? -1e6 :
        res.u[r] * 2 + a.re * (r === "no_response" ? 1 : 0) + 0.35 * gauss(rng));
      const mx = Math.max(...logits);
      const ex = logits.map((l) => Math.exp(l - mx));
      const s = ex.reduce((p, q) => p + q, 0);
      let x = rng() * s;
      const idx = Math.max(0, ex.findIndex((e) => (x -= e) <= 0));
      a.state = RESPONSES[idx] ?? "no_response";
      a.last = res;
      counts[a.state]++;
      const bad = a.state === "disengagement" || a.state === "undue_pressure" || a.state === "improper_gatekeeping";
      a.d = clip(a.d + 0.04 * (bad ? 1 : 0) - 0.05 * (a.state === "accountability" || a.state === "internal_review" ? 1 : 0) - 0.03 * scenario.safeguards - 0.035 * oversight);
    }
    const n = agents.length;
    const share = (r: Response) => counts[r] / n;
    acc = clip(acc + 0.05 * (share("accountability") + share("internal_review")) - 0.03 * share("disengagement") + 0.01 * (scenario.safeguards - 0.5));
    cohesion = clip(cohesion + 0.03 * (share("collaboration") + share("dialogue")) - 0.03 * share("scrutiny") - 0.02 * shock);
    hostility = clip(hostility + (adversarial ? 0.025 * share("undue_pressure") + 0.02 * share("improper_gatekeeping") : 0)
      - 0.025 * scenario.safeguards - 0.025 * acc - 0.025 * oversight);
    const meanD = agents.reduce((p, a) => p + a.d, 0) / n;
    frames.push({
      month,
      responses: Object.fromEntries(RESPONSES.map((r) => [r, +(counts[r] / n).toFixed(4)])) as Record<Response, number>,
      cohesion: +cohesion.toFixed(4),
      accountability: +acc.toFixed(4),
      hostility_index: +hostility.toFixed(4),
      mean_disengagement: +meanD.toFixed(4),
      indices: {
        autonomy: +clip((individual.motives["autonomy"] ?? 0.3) * 0.5 + 0.5 * (1 - share("scrutiny") - share("disengagement"))).toFixed(4),
        safety: +clip(1 - (share("undue_pressure") + share("improper_gatekeeping")) * (1 - scenario.safeguards) - 0.3 * shock).toFixed(4),
        integrity: +clip(1 - meanD).toFixed(4),
        evidence: evidence,
      },
    });
  }
  const outAgents: AgentState[] = keepAgents
    ? agents.slice(0, 60).map((a) => ({
        id: a.id,
        role: a.role,
        state: a.state,
        disengagement: +a.d.toFixed(4),
        utilities: Object.fromEntries(RESPONSES.map((r) => [r, +(a.last?.u[r] ?? 0).toFixed(3)])) as Record<Response, number>,
        top_drivers: Object.entries(a.last?.parts ?? {})
          .sort((p, q) => q[1] - p[1])
          .slice(0, 3)
          .map(([factor, contribution]) => ({ factor, contribution: +contribution.toFixed(3) })),
      }))
    : [];
  return { frames, agents: outAgents };
}

export function runSimulation(raw: RunInput): RunResult {
  const input = RunInputSchema.parse(raw);
  const { scenario } = input;
  const trials = Array.from({ length: scenario.trials }, (_, k) => runOnce(input, (scenario.seed + k * 7919) >>> 0, k === 0));
  const frames: Frame[] = (trials[0]?.frames ?? []).map((f, i) => {
    const avg = (get: (fr: Frame) => number) => +(trials.reduce((p, t) => p + get(t.frames[i] ?? f), 0) / trials.length).toFixed(4);
    return {
      month: f.month,
      responses: Object.fromEntries(RESPONSES.map((r) => [r, avg((fr) => fr.responses[r])])) as Record<Response, number>,
      cohesion: avg((fr) => fr.cohesion),
      accountability: avg((fr) => fr.accountability),
      hostility_index: avg((fr) => fr.hostility_index),
      mean_disengagement: avg((fr) => fr.mean_disengagement),
      indices: {
        autonomy: avg((fr) => fr.indices.autonomy),
        safety: avg((fr) => fr.indices.safety),
        integrity: avg((fr) => fr.indices.integrity),
        evidence: f.indices.evidence,
      },
    };
  });
  const last = trials.map((t) => t.frames[t.frames.length - 1]?.responses ?? ZERO);
  const ci90 = Object.fromEntries(
    RESPONSES.map((r) => {
      const v = last.map((x) => x[r]).sort((a, b) => a - b);
      return [r, [v[Math.floor(0.05 * (v.length - 1))], v[Math.ceil(0.95 * (v.length - 1))]]];
    }),
  ) as Record<Response, [number, number]>;
  return {
    model_version: MODEL_VERSION,
    engine: "typescript",
    input_hash: hashInput(input),
    seed: scenario.seed,
    frames,
    agents: trials[0]?.agents ?? [],
    summary: {
      final: frames[frames.length - 1]?.responses ?? ZERO,
      label: "SYNTHETIC / UNVALIDATED",
      trials: scenario.trials, ci90,
      narrative_signals: extractNarrativeSignals(scenario.narrative),
      baseline_mode: input.swarm.baseline_mode,
      warning: "Fictional worst-case assumptions; not an estimate of any actual organization's intentions or conduct.",
    },
  };
}
