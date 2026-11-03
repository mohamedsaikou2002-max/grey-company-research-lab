"""Offline adapters for DARPA-origin research outputs.

Reads externally generated *aggregate* data and emits the strict browser exchange
schema. Never invokes external engines, RF capture or vulnerability exploit code.
Only metadata/counts; no identities, private examples or raw sensor samples.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
from pathlib import Path
from typing import Any

SOURCES = {"macm", "rhpc_smple", "armory", "atlantis", "dragonradio",
           "benchq", "pyliqtr", "angr", "openroad"}
METRICS = {
    "macm": {"events", "steps", "simulated_agents"},
    "rhpc_smple": {"posts", "interactions", "simulated_users"},
    "armory": {"samples", "clean_accuracy", "perturbed_accuracy"},
    "atlantis": {"findings", "patches_proposed", "tests_passed"},
    "dragonradio": {"frames", "packet_loss_pct", "rssi_dbm"},
    "benchq": {"physical_qubits", "duration_seconds", "logical_qubits"},
    "pyliqtr": {"logical_qubits", "t_count", "clifford_count"},
    "angr": {"blocks", "functions", "imports"},
    "openroad": {"cells", "die_area_um2", "setup_wns_ns"},
}


def _num(v: Any) -> float:
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        raise ValueError("Numeric, finite aggregate metric required")
    n = float(v)
    if not (-1e12 <= n <= 1e12):
        raise ValueError("Metric outside allowable range")
    return n


def convert(source: str, raw: str, version: str, scope: str = "synthetic") -> dict[str, Any]:
    if source not in SOURCES or scope not in {"synthetic", "authorized_lab"}:
        raise ValueError("Unknown source or missing explicit scope")
    if not 1 <= len(version) <= 80 or not all(c.isalnum() or c in "._+-" for c in version):
        raise ValueError("Invalid upstream version")
    if len(raw) > 4_000_000:
        raise ValueError("Input too large")
    metrics: dict[str, float] = {}
    if source in {"macm", "rhpc_smple", "dragonradio"}:
        reader = csv.DictReader(io.StringIO(raw))
        n = 0
        steps: set[str] = set()
        rssi: list[float] = []
        for row in reader:
            n += 1
            if n > 20000:
                raise ValueError("CSV row limit exceeded")
            if source == "macm":
                step = row.get("tick") or row.get("step") or row.get("round")
                if step is not None:
                    steps.add(step)
            if source == "dragonradio":
                val = row.get("rssi_dbm")
                if val not in (None, ""):
                    try:
                        rssi.append(float(val))
                    except ValueError as exc:
                        raise ValueError("Invalid RSSI aggregate input") from exc
        if source == "macm":
            metrics = {"events": n, "steps": len(steps) if steps else n}
        elif source == "rhpc_smple":
            metrics = {"posts": n}
        else:
            metrics = {"frames": n}
            if rssi:
                metrics["rssi_dbm"] = round(sum(rssi) / len(rssi), 3)
    else:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("JSON object required")
        if source == "atlantis":
            runs = data.get("runs")
            if not isinstance(runs, list):
                raise ValueError("SARIF artifact must contain runs[]")
            findings = 0
            for run in runs:
                results = run.get("results", []) if isinstance(run, dict) else []
                if not isinstance(results, list):
                    raise ValueError("Invalid SARIF run")
                findings += len(results)
            metrics = {"findings": findings}
        elif source == "armory":
            clean, perturbed = data.get("clean"), data.get("perturbed")
            if not isinstance(clean, dict) or not isinstance(perturbed, dict):
                raise ValueError("Expected clean and perturbed metric objects")
            metrics = {"samples": data.get("samples"),
                       "clean_accuracy": clean.get("accuracy"),
                       "perturbed_accuracy": perturbed.get("accuracy")}
        elif source == "openroad":
            keys = {"cells": ("cells", "design__instance__count"),
                    "die_area_um2": ("die_area_um2", "design__die__area"),
                    "setup_wns_ns": ("setup_wns_ns", "timing__setup__ws")}
            for out, aliases in keys.items():
                for alias in aliases:
                    if alias in data:
                        metrics[out] = data[alias]
                        break
        elif source == "pyliqtr":
            keys = {"logical_qubits": ("logical_qubits", "LogicalQubits"),
                    "t_count": ("t_count", "T"),
                    "clifford_count": ("clifford_count", "Clifford")}
            for out, aliases in keys.items():
                for alias in aliases:
                    if alias in data and data[alias] is not None:
                        metrics[out] = data[alias]
                        break
        else:
            for key in METRICS[source]:
                if key in data and data[key] is not None:
                    metrics[key] = data[key]
    if not metrics:
        raise ValueError("No recognized numeric aggregate fields for " + source)
    normalized = {k: _num(v) for k, v in metrics.items()}
    for key, value in normalized.items():
        if key.endswith("accuracy") and not 0 <= value <= 1:
            raise ValueError("Accuracy outside 0–1")
        if key.endswith("_pct") and not 0 <= value <= 100:
            raise ValueError("Percentage outside 0–100")
        if key not in {"rssi_dbm", "setup_wns_ns"} and value < 0:
            raise ValueError("Negative count")
    return {"schema_version": "gc-research-exchange/1", "source": source,
            "upstream_version": version, "scope": scope,
            "aggregates": normalized,
            "imported_status": "UNVERIFIED_EXTERNAL_RESULT"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, choices=sorted(SOURCES))
    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument("--upstream-version", required=True)
    parser.add_argument("--scope", choices=["synthetic", "authorized_lab"], default="synthetic")
    args = parser.parse_args()
    if not args.file.is_file() or args.file.stat().st_size > 4_000_000:
        parser.error("Input file is absent or exceeds 4 MB")
    output = convert(args.source, args.file.read_text(encoding="utf-8"),
                     args.upstream_version, args.scope)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
