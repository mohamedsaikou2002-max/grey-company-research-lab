/**
 * Deterministic, non-operational narrative features for fictional stress tests.
 * These are transparent keyword heuristics, NOT natural-language understanding,
 * factual verification, psychological diagnosis, or evidence of targeting.
 * Religious/ethnic identities deliberately never trigger adversity.
 */
export const NEGATIVE_VISUALIZATION_VERSION = "gc-negviz-1";
export type ScenarioEvent =
  | "business_proposal" | "market_entry" | "competitor_response"
  | "confirmed_report" | "unsupported_rumor";

export type NarrativeSignals = {
  market: number;
  engagement: number;
  oversight: number;
  conflict: number;
  separation: number;
  allegation: number;
  matched_cues: string[];
  interpretive_note: string;
};

const clip = (n: number) => Math.min(1, Math.max(0, n));

const CUES: { key: keyof Omit<NarrativeSignals, "matched_cues" | "interpretive_note">; name: string; pattern: RegExp }[] = [
  { key: "market", name: "economic competition", pattern: /\b(market|competit(?:ion|or|ive)|business|contract|revenue|capital|startup|founder|company|acquisition|invest(?:or|ment))\b/i },
  { key: "engagement", name: "voluntary engagement", pattern: /\b(partner(?:ship)?|collaborat(?:e|ion)|cooperat(?:e|ion)|negotiate|dialogue|agreement|voluntary)\b/i },
  { key: "oversight", name: "independent oversight", pattern: /\b(audit|oversight|independent review|due process|transparen(?:t|cy)|court|regulator|whistleblow|investigat(?:e|ion))\b/i },
  { key: "conflict", name: "overt disagreement", pattern: /\b(dispute|lawsuit|refus(?:al|e)|rivalry|hostil(?:e|ity)|conflict|challenge|criticis(?:m|e)|oppose)\b/i },
  { key: "separation", name: "limited contact", pattern: /\b(no contact|no relationship|unrelated|separate|distant|disengage|ignore|independent\s+(?:industry|sector))\b/i },
  { key: "allegation", name: "allegation or uncertainty", pattern: /\b(rumou?r|alleg(?:e|ation)|unverified|hearsay|speculat(?:ion|e)|claim(?:ed|s)?)\b/i },
];

export function deriveNarrativeSignals(narrative: string, eventType: ScenarioEvent): NarrativeSignals {
  const matches = CUES.filter((cue) => cue.pattern.test(narrative));
  const found = (key: string) => matches.some((cue) => cue.key === key);
  // Event type is an explicit simulation input, not a historical inference.
  const market = clip((eventType === "market_entry" || eventType === "competitor_response" ? 0.65 : 0.1) + (found("market") ? 0.35 : 0));
  const engagement = clip((eventType === "business_proposal" ? 0.65 : 0.05) + (found("engagement") ? 0.35 : 0));
  const oversight = clip((eventType === "confirmed_report" ? 0.45 : 0.05) + (found("oversight") ? 0.55 : 0));
  const conflict = clip((eventType === "competitor_response" ? 0.4 : 0.05) + (found("conflict") ? 0.55 : 0));
  const separation = found("separation") ? 0.95 : 0.05;
  const allegation = clip((eventType === "unsupported_rumor" ? 0.8 : 0) + (found("allegation") ? 0.2 : 0));
  return {
    market, engagement, oversight, conflict, separation, allegation,
    matched_cues: matches.map((x) => x.name),
    interpretive_note: "Heuristic fictional scenario features, not verified events, intent, or supernatural causation.",
  };
}
