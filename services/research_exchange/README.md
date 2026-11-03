# Offline output converter

Use this CLI to translate **aggregate research outputs** into `gc-research-exchange/1` JSON for the Research Lab, Belicia, and Vulture Vision local import panels. All source engines are external; this script neither runs nor installs them.

```bash
python -m unittest discover -s services/research_exchange/tests -v
python -m services.research_exchange.convert --source macm --file /path/to/synthetic-events.csv --upstream-version commit123
python -m services.research_exchange.convert --source atlantis --file /path/to/authorized-report.sarif --upstream-version commit123 --scope authorized_lab
```

Source-specific input assumptions:
- MACM/RHPC_SMPLE: CSV event rows; counts only. MACM step column may be `tick`, `step`, or `round`. No synthetic agents inferred if identifiers are absent. This is **not** a direct MACM data file schema guarantee.
- Armory: evaluator metrics JSON with `samples`, `clean.accuracy` and `perturbed.accuracy` keys (as produced by CASPER's offline evaluator).
- ATLANTIS: SARIF-compatible `runs[].results[]`; native ATLANTIS output requires a SARIF conversion stage.
- DragonRadio: **recorded, authorized lab** CSV with optional `rssi_dbm`; not a through-wall or cardiac sensor.
- BenchQ/pyLIQTR: explicit numeric resource summary; missing values are **never fabricated**. BenchQ raw object repr must be converted by the external worker.
- angr: JSON with count fields such as `blocks`, `functions`.
- OpenROAD: numeric `metrics.json` counts; aliases are best effort and vary by flow version.

No input data or output is uploaded, persisted or sent to a remote network. For production do not accept untrusted provenance as a basis for factual claims.
