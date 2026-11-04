"""Occult Killer Python 4.3: synthetic adversarial institutional stress testing.

This offline simulator does not investigate real people or predict actual behavior.
Synthetic response shares are not empirically calibrated probabilities. Supports
the legacy v3 catalog/compare API while adding a fictional worst-case preset.
"""
from __future__ import annotations
import hashlib
import json
import math
import random
import re
from collections import Counter
from typing import Any

MODEL_VERSION = "gc-group-sim-py-4.3.0"
LABEL = "SYNTHETIC / UNVALIDATED"
RESPONSES = (
    "no_response", "routine_competition", "collaboration", "dialogue",
    "due_diligence", "scrutiny", "disengagement", "internal_review",
    "accountability", "undue_pressure", "improper_gatekeeping",
)
STRATEGIES = (
    "respectful_dialogue", "verify_first", "ethical_partnership", "quiet_work",
    "independent_mediation", "firm_boundaries", "lawful_reporting",
    "community_service", "documented_due_diligence", "diversified_capital",
    "security_and_ip_hygiene",
)
TRAITS = ("cohesion", "hierarchy", "pluralism", "accountability", "defensiveness", "openness")
EVENTS = {"ethical_offer", "routine", "professional_disagreement", "documented_issue", "unverified_rumor", "market_entry", "competitor_response"}
EVIDENCE = {"documented", "corroborated", "single_testimony", "rumor"}
# Values are stipulated model parameters, not empirical estimates.
DEFENSE = {
    "respectful_dialogue": (.05, .18, .04), "verify_first": (.21, .03, .12),
    "ethical_partnership": (.08, .20, .06), "quiet_work": (.09, .05, .06),
    "independent_mediation": (.14, .12, .13), "firm_boundaries": (.20, .01, .13),
    "lawful_reporting": (.18, .03, .18), "community_service": (.07, .12, .05),
    "documented_due_diligence": (.23, .09, .12), "diversified_capital": (.17, .20, .09),
    "security_and_ip_hygiene": (.24, .02, .12),
}

def catalog() -> dict[str, Any]:
    # Existing frontend checks that `books` is an array.
    return {"books": [
        {"title": "Social identity and intergroup comparison", "status": "research topic, full text not ingested"},
        {"title": "Information cascades and rumor dynamics", "status": "research topic, full text not ingested"},
        {"title": "Institutional accountability and economic competition", "status": "research topic, full text not ingested"},
    ], "model_version": MODEL_VERSION, "label": LABEL,
        "modes": ["absolute_evil_stress_test", "neutral_reference"],
        "strategies": list(STRATEGIES), "installed_upstream_engines": [],
        "research_exchange": "gc-research-exchange/1"}

def _unit(v: Any, name: str) -> float:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v <= 1:
        raise ValueError(f"{name} must be a finite number in [0,1]")
    return float(v)

def _integer(v: Any, name: str, low: int, high: int) -> int:
    if isinstance(v, bool) or not isinstance(v, int) or not low <= v <= high:
        raise ValueError(f"{name} must be an integer in [{low},{high}]")
    return v

def _signals(text: str) -> dict[str, bool]:
    text = text.lower()
    def match(expr: str) -> bool:
        return bool(re.search(expr, text))
    return {
        "explicit_no_contact": match(r"\b(no (?:contact|interaction|connection|relationship|awareness)|never met|unaware of|unrelated|no evidence of contact)\b"),
        "direct_contact": match(r"\b(contacted|approached|met with|communicated|invited|negotiated|received (?:an? )?offer)\b"),
        "market_competition": match(r"\b(competitor|competition|compete|market|investment|contract|business)\b"),
        "reported_interference": match(r"\b(reported interference|alleged obstruction|claimed retaliation)\b"),
        "independent_oversight": match(r"\b(oversight|independent review|audit|regulator|due process|legal counsel)\b"),
    }

def _research_noise(a: Any) -> float:
    # External engines exchange bounded *synthetic aggregate metrics* only.
    if a is None:
        return 0.0
    if not isinstance(a, dict) or a.get("schema_version") != "gc-research-exchange/1":
        raise ValueError("Unsupported research exchange schema")
    if a.get("scope") != "synthetic" or a.get("imported_status") != "UNVERIFIED_EXTERNAL_RESULT":
        raise ValueError("Only synthetic unverified aggregates are accepted")
    allowed = {"macm": {"events", "steps", "simulated_agents"},
               "rhpc_smple": {"posts", "interactions", "simulated_users"}}
    source = a.get("source")
    if source not in allowed:
        raise ValueError("Only synthetic SocialSim-like aggregate inputs affect this engine")
    data = a.get("aggregates")
    if not isinstance(data, dict) or not 1 <= len(data) <= 3:
        raise ValueError("Expected 1 to 3 numeric aggregates")
    for k, v in data.items():
        if k not in allowed[source] or isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v <= 1e12:
            raise ValueError("Invalid or unsupported aggregate")
    activity = data.get("events", data.get("interactions", 0))
    return min(.04, math.log1p(activity) / 400)

def _parse(p: Any) -> dict[str, Any]:
    if not isinstance(p, dict):
        raise ValueError("Expected JSON object")
    mode = p.get("baseline_mode", "neutral_reference")
    if mode not in ("absolute_evil_stress_test", "neutral_reference"):
        raise ValueError("Unknown baseline mode")
    traits = p.get("group_overrides", {})
    if not isinstance(traits, dict) or any(k not in TRAITS for k in traits):
        raise ValueError("Unknown group trait")
    traits = {k: _unit(traits.get(k, .5), k) for k in TRAITS}
    event = p.get("event", "routine")
    if event not in EVENTS:
        raise ValueError("Unknown event type")
    strategies = p.get("strategies", list(STRATEGIES))
    if not isinstance(strategies, list) or not strategies or len(strategies) > 11 or any(s not in STRATEGIES for s in strategies):
        raise ValueError("Expected 1-11 known lawful strategies")
    narrative = p.get("narrative", "")
    if not isinstance(narrative, str) or len(narrative) > 2500:
        raise ValueError("Invalid narrative")
    evidence = p.get("evidence_tier", "rumor")
    if evidence not in EVIDENCE:
        raise ValueError("Invalid evidence tier")
    return {
        "mode": mode, "traits": traits, "event": event,
        "strategies": list(dict.fromkeys(strategies)),
        "trials": _integer(p.get("trials", 40), "trials", 10, 500),
        "rounds": _integer(p.get("rounds", 5), "rounds", 1, 12),
        "seed": _integer(p.get("seed", 19), "seed", 0, 2**31 - 1),
        "pressure": _unit(p.get("pressure", .2), "pressure"),
        "safeguards": _unit(p.get("safeguards", .5), "safeguards"),
        "signals": _signals(narrative), "evidence": evidence,
        "research_noise": _research_noise(p.get("research_artifact")),
    }

def _weights(c: dict[str, Any], defense: float, round_no: int) -> dict[str, float]:
    t, sig = c["traits"], c["signals"]
    if sig["explicit_no_contact"]:
        return {r: float(r == "no_response") for r in RESPONSES}
    active = 1.0 if sig["direct_contact"] else .45 if c["event"] in ("ethical_offer", "professional_disagreement", "competitor_response") else .22
    competition = 1.0 if sig["market_competition"] or c["event"] in ("market_entry", "competitor_response") else .35
    hostility = (.95 if c["mode"] == "absolute_evil_stress_test" else .09) * (.7 + .3 * t["cohesion"])
    oversight = max(c["safeguards"], .65 if sig["independent_oversight"] else 0)
    adverse = min(1, max(0, hostility * active * (1 - .70 * oversight) * (1 - defense) * (.9 + .1 * round_no / c["rounds"])))
    rumor_weight = .3 if c["evidence"] == "rumor" else .8
    return {
        "no_response": .95 + 1.2 * (1 - active),
        "routine_competition": .8 + competition * (.6 + .3 * t["cohesion"]),
        "collaboration": .5 + .7 * t["openness"],
        "dialogue": .5 + t["pluralism"],
        "due_diligence": .6 + .6 * oversight,
        "scrutiny": .55 + .6 * t["defensiveness"] * rumor_weight,
        "disengagement": .6 + .5 * t["hierarchy"],
        "internal_review": .4 + .8 * t["accountability"],
        "accountability": .3 + oversight * t["accountability"],
        "undue_pressure": 0 if c["mode"] == "neutral_reference" else 2.4 * adverse,
        "improper_gatekeeping": 0 if c["mode"] == "neutral_reference" else 2.2 * adverse * competition,
    }

def _run(c: dict[str, Any], strategy: str, seed: int) -> tuple[dict[str, float], float]:
    rng = random.Random(seed)
    defense, alliance, cost = DEFENSE[strategy]
    counts = Counter()
    for step in range(1, c["rounds"] + 1):
        weights = _weights(c, defense, step)
        weights["scrutiny"] *= 1 + c["pressure"] * .15 + c["research_noise"]
        categories = [r for r in RESPONSES if weights[r] > 0]
        counts.update(rng.choices(categories, weights=[weights[r] for r in categories], k=64))
    total = 64 * c["rounds"]
    shares = {r: round(counts[r] / total, 5) for r in RESPONSES}
    risk = shares["undue_pressure"] + shares["improper_gatekeeping"]
    score = min(1, max(0, .65 * (1 - risk) + .13 * defense + .10 * alliance + .12 * (1 - cost)))
    return shares, score

def compare(payload: Any) -> dict[str, Any]:
    c = _parse(payload)
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    digest = hashlib.sha256(canonical.encode()).hexdigest()[:16]
    seeds = [(c["seed"] + 7919 * i) % (2**31) for i in range(c["trials"])]
    candidates = []
    for strategy in c["strategies"]:
        totals = Counter()
        scores = []
        for seed in seeds:
            shares, score = _run(c, strategy, seed)
            for response, share in shares.items():
                totals[response] += share
            scores.append(score)
        candidates.append({
            "strategy": strategy,
            "score": round(sum(scores) / len(scores), 4),
            "model_only_adverse_share": round((totals["undue_pressure"] + totals["improper_gatekeeping"]) / c["trials"], 4),
            "response_shares": {r: round(totals[r] / c["trials"], 4) for r in RESPONSES},
        })
    candidates.sort(key=lambda x: (-x["score"], x["strategy"]))
    top = candidates[0]
    leading = sorted(top["response_shares"].items(), key=lambda x: (-x[1], x[0]))[:3]
    return {
        "model_version": MODEL_VERSION, "engine": "python-v4.3", "label": LABEL,
        "input_hash": digest, "seed": c["seed"], "trials": c["trials"],
        "rounds": c["rounds"], "baseline_mode": c["mode"],
        "best_in_model": top["strategy"], "strategies": candidates,
        "next_response_categories": [{"category": k, "synthetic_share": v} for k, v in leading],
        "narrative_signals": c["signals"],
        "assumptions": {
            "group_trait_weights": c["traits"], "evidence_tier": c["evidence"],
            "research_artifact_noise": c["research_noise"],
            "provenance": "User assumptions and optional synthetic aggregates; not verified facts",
        },
        "validation_checks": {
            "explicit_no_contact": c["signals"]["explicit_no_contact"],
            "neutral_disables_adverse_types": c["mode"] == "neutral_reference",
            "random_seeds_matched_across_strategies": True,
            "actual_behavior_prediction": False,
        },
        "warning": "Fictional stress test, not a calibrated forecast or evidence of intent. No supernatural mechanism is modeled.",
    }
