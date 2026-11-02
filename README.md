# Grey Company Research Lab

# GREY COMPANY — THREE-PAGE RESEARCH LAB
## Copy/paste implementation prompt for Lovable

Build a production-quality **monochrome research application** using the attached **NeuroAtlas_Swarm_Vice_Quranic_Integrated_v2.zip** (and NeuroAtlas_Occult_Killer_Integrated_v3), the **Occult_Killer_v4_1_Rumor_Motives_Prediction_Spec.md** specification, and the existing **Belicia** GitHub repository (`mohamedsaikou2002-max/belicia`, main branch). Treat the archive and specification as the sources of truth. Inspect actual files before coding. If a file or repo is not accessible in the Lovable environment, report that dependency clearly; do not silently generate substitute analytics. Preserve existing Belicia authentication, Supabase setup, Pod Room, MiroFish, and existing NeuroAtlas logic. Do not overwrite production code without a migration and tests.

**Goal:** exactly THREE primary pages with a shared authenticated navigation shell:
1. `/occult-killer` — persistent *one individual versus one configurable AI swarm* simulator.
2. `/neural-atlas` — independent NeuroAtlas brain/neurophysiology research and simulation workspace.
3. `/research-ai` — Gemini-powered AI research chatbot with citations, separate project scopes, and cross-page read-only context.

Name the app **Grey Company | Research Lab**. The “Occult Killer” name describes critical scrutiny of social coercion, misconduct claims, and fear; it is not about physical harm. Put a small `SYNTHETIC / UNVALIDATED` indication next to simulation results unless validated against independent observations.

## 1. Design system — BLACK / WHITE ONLY

- Black `#080808` app canvas; secondary `#111111`; elevated panels `#181818`; borders `#333333`.
- Primary text `#F6F6F6`, secondary text `#AAAAAA`; high-contrast white buttons, inverted black text, black outline buttons. NO neon, red/green status semantics, gradients, saturated accent colors, glowing rainbow visuals, or decorative rainbow charts. Use line patterns, solid/dashed/dotted styles, icons, and labels to distinguish chart series.
- Fonts: Space Grotesk / Inter / system sans-serif for UI; IBM Plex Mono for datasets, scores, seed hashes, and timestamps.
- Desktop: fixed narrow sidebar with three routes and status; sticky top bar; spacious 12-column grid, subdued separators, crisp tool controls. Mobile: bottom nav or collapsed menu; tabbed group/individual editors; no sideways scrolling of forms; charts resize correctly.
- Visual character: high-end research terminal / monochrome scientific console, dense but legible. Keyboard accessible (WCAG AA), reduced-motion toggle, skeleton loaders, empty states, inline validation and error feedback.
- Do not use purely color-coded moral labels or declare individuals/groups intrinsically evil.

## 2. OCCULT KILLER /occult-killer

### Primary desktop layout
A. **Left: SWARM / ORGANIZATION (55%)**
  - Create/select/delete synthetic swarm; swarm title, description, institutional type, hypothetical roles and subgroups, agent population, seeded identity/persona distribution. Historical names are *case-study contexts*, not factual behavioral profiles.
  - Editable `swarm_motives`: financial gain, prestige/status, group belonging, ideological commitments, institutional self-preservation, procedural duty, justice/compassion, and **no special interest in the individual**. Allow custom motives with label + justification and weights that normalize to 1. Show assumptions/provenance for each weight. Never infer physiological dopamine receptors from documents; label the parameter `reward sensitivity`.
  - Editable `swarm_strategy`: collaboration, due diligence, competition, internal deliberation, disengagement, oversight and remediation. Allow a user-written objective and policies as hypotheses, not operational plans for abuse, coercion, sabotage, or evasion.
  - Separate editable group traits: cohesion, hierarchy, pluralism, accountability, defensiveness, openness, integrity, dissent safety, reputational pressure. Changes must truly be sent to the backend, versioned, and reflected in results.
  - Group inspector: roster of synthetic roles, present state, memory summary, uncertainty, interaction log, institutional decision log; click a synthetic agent and ask why it made a specific choice. Answers must cite its model state and source-supported hypotheses.

B. **Right: SINGLE INDIVIDUAL / PROTAGONIST (45%)**
  - Exactly one focal person per run; synthetic or user-created persona, never presume any real group is pursuing the user.
  - Independent editable `individual_motives`: autonomy, wealth/market growth, duty/justice, reputation, security, service, relationship-building and custom user definitions. Normalize weights and show score contributions.
  - Independent editable `individual_strategy`: choose existing 11 v3 strategies plus future user-defined *lawful* objectives, business plan, market entry, partnership approach, evidence verification, ethical boundaries, communication style, transparency, and how to respond to documented concerns. Do NOT collapse this field into swarm motives.
  - Individual traits: patience, humility, verification discipline, compassion, boundary discipline; optional stoicism, stress tolerance, financial runway, capital needs, independent counsel, and willingness to collaborate (declare which are new backend fields).
  - Qur'anic optional ethical lens with verses 49:6, 4:135, 5:8, 3:175, 4:76, 96:6–7, 57:20, 18:103–104, 2:102. Display these as interpretive ethics categories, not divine judgments or brain measurements. Let a user select a secular ethics lens as well.

C. **Center/bottom: SCENARIO & INTERACTION ENGINE**
  - Central visual: monochrome network animation — swarm nodes around ONE distinct white protagonist marker, links for documented/simulated interactions; labels and shapes distinguish relationships. Hover for state, select node to inspect decisions. Avoid suggesting invisible real-world contact.
  - Editable scenario/narrative prompt, event type, setting, economic assumptions, evidence tier, response options, extrinsic shocks, time horizon (1–60 monthly steps), agent count (start with realistic backend limits), seed, Monte Carlo repetitions, safeguards and accountability settings.
  - Buttons `RUN`, `PAUSE` (only if async runner exists), `STEP`, `RESET`, `COMPARE COUNTERFACTUAL`, `SAVE SCENARIO`, `EXPORT JSON/CSV`. Show `RUN` disabled with actionable explanation if backend features are missing — never pretend a result ran.
  - Replay timeline with period scrubber; categorical response estimates including `no_response`, cooperation, dialogue, scrutiny, routine competition, due diligence, disengagement, internal review, accountability. Each probability must sum to ~1 within its output taxonomy. Show evidence provenance, scenario assumptions, confidence/uncertainty and `UNVALIDATED` label.
  - Charts: swarm motivation weights vs protagonist motivation weights; response distribution over time; group cohesion and accountability trajectory; autonomy/safety/integrity/evidence indices; economic outputs ONLY once an actual economic model exists. Clear difference between *synthetic utility score* and *empirically calibrated probability*.
  - `What changed?` counterfactual pane comparing identical random seeds but changed conditions (e.g., accountability or economic competition). Explicitly list variables held constant.

### Corpus and evidence inside Occult Killer
- Collapsible `Research Sources` drawer, not a fourth main page. Import bibliography from `GET /api/occult-killer`: 37 metadata records, 14 thematic tracks, source types and reading lenses. Show **BIBLIOGRAPHY ONLY** vs **EXCERPTS INDEXED** per source.
- Lawfully ingest excerpts with title, author, edition, page, URL/DOI, source date, publication vs event date, direct/secondary origin, evidence tier, claims, corroboration, contradictory evidence and independence cluster. Searchable source cards and direct citations.
- Rumors and testimony must be visibly labeled as unverified/contested; dozens of retellings of one rumor must not be counted as independent confirmation. Allegations about real groups/people never silently become fixed “group personality” sliders, criminality estimates or predictions. For serious abuse: model reporting, victim safety, independent investigation, and institutional accountability abstractly. Never ingest or expose abuse recordings or sensitive victim identifying information.
- Historical fields are **context**, not default motives or proof of a named group’s wrongdoing. Keep Jewish Kabbalah distinct from Western Hermetic Qabalah.

## 3. NEURAL ATLAS /neural-atlas

- Completely separate top-level route. Use the existing `NeuroAtlas_Combined/python/neuroatlas/` and `native/` modules as references; preserve their algorithms and data handling.
- Layout: left experiment setup and source data; center large interactive brain/3D viewer (Three.js with a placeholder model if no valid asset supplied); right research measurements and AI annotations; bottom experimental timeline, network heat map, signal plots, session comparisons, downloadable results.
- Support valid datasets/synthetic EEG, regions and connectivity, neurochemical *model variables*, task/physiological scenarios, and uncertainty tags. Clearly label illustrative/synthetic neural activation; do not claim to measure actual neurochemistry or infer anyone’s hidden thoughts from a simulation.
- Offer a mode selector (synthetic experiments vs imported measurements), upload/parse legitimate supported datasets, experiment parameters, start/reset/compare, and export.
- Existing Python and native executables are NOT automatically browser APIs. Implement explicit authenticated backend adapters/edge-function orchestration and document which calculations are available; if not connected, show truthful offline/placeholder states. Never fabricate “live brain” telemetry.

## 4. AI RESEARCH CHAT /research-ai

- Shared assistant, not a static chat mockup. Chat has three selectable scopes: `Occult Killer`, `Neural Atlas`, and `Cross-project`. Dedicated project conversations, searchable chat histories, attachments limited by authorization and privacy, citation panel, copy/export actions and persistent sessions.
- Configure Gemini API **only server-side** using Supabase Edge Function / secrets (`GEMINI_API_KEY`); never embed API keys in React, localStorage, or browser requests. If previous Belicia MiroFish uses Gemini/Claude, keep its provider adapter intact and reuse safely.
- RAG pipeline: metadata filters -> retrieve only indexed/licensed excerpts -> quote/cite exact source IDs, title/pages -> distinguish verified observations, interpretations, rumors, synthetic model outputs, and unanswered questions. If only a bibliography record exists, explicitly state that no text from the book is indexed.
- Assistant may inspect a user-selected saved run, compare strategy outcomes, describe a synthetic agent’s motivational assumptions, explain equations, generate a short methodological report, and draft a fresh scenario for **user approval**. Do not give chat unrestricted authority to overwrite corpus or run expensive jobs without approval.
- Show source chips for each claim, links to selected run and evidence record, model/seed/dataset version and data-coverage meter. No fabricated citations or unsupported numeric confidence.
- Keep Qur'anic interpretation separate from empirical outcomes. Do not infer supernatural activity or hidden targeting from ambiguous events, affiliation, or rumors.

## 5. Backend integration contract — critically important

First inspect the actual v3 endpoints in `NeuroAtlas_Combined/python/group_sim/server.py`:
- `GET /api/health`
- `GET /api/occult-killer`
- `POST /api/occult-killer/compare`
- `GET /api/corpus`
- `POST /api/corpus/ingest`
- `POST /api/corpus/search`
- `GET /api/cases`
- `POST /api/evidence/assess`
- `GET /api/ethics/framework`
- `POST /api/ethics/evaluate`
- `POST /api/run`
- `POST /api/interpret`
- `POST /api/agent-reflection`
These are real v3 endpoints, but v3 `compare` currently supports **aggregate synthetic responses only**, with 1–12 rounds, 10–500 trials, one track, six group overrides, and 11 fixed individual strategies. It DOES NOT support user-defined swarm motives, full persistent agents, market competition, five-year monthly progression or calibrated group predictions. **Do not imply otherwise.**

Implement a versioned new backend API rather than passing unsupported fields to v3. Proposed v4 routes (NOT pre-existing):
- `POST /api/v4/swarm/configure` validate and save synthetic swarm profile and motive vector.
- `POST /api/v4/individual/configure` validate and save the one-person profile and motive/strategy vector.
- `POST /api/v4/scenarios` save event, time horizon, evidence rules, counterfactual settings.
- `POST /api/v4/runs` submit reproducible jobs; return job ID + `QUEUED/RUNNING/COMPLETED/FAILED`.
- `GET /api/v4/runs/:id` read status and summary, `GET /api/v4/runs/:id/timeline` for paginated per-period output, `GET /api/v4/runs/:id/agents` for synthetic roster, `POST /api/v4/runs/:id/compare` for matched-seed counterfactuals.
- `POST /api/v4/research/chat` authenticated server-side LLM + RAG call, `GET /api/v4/research/sources`, `POST /api/v4/research/ingest` with provenance.
- `POST /api/v4/neural/runs`, `GET /api/v4/neural/runs/:id` using a tested adapter to NeuroAtlas.

Version runs, seeds, dataset hashes, model hashes, prompt versions and user choices. Store tables for `group_profiles`, `individual_profiles`, `scenarios`, `simulation_runs`, `simulation_frames`, `agent_states`, `source_documents`, `source_claims`, `source_lineage`, `hypotheses`, `chat_sessions`, `chat_messages`, `neural_runs`. Make all user-owned records protected by Supabase Auth and RLS; implement background job queue, cancellation and resource limits if concurrency is needed. Secrets server-side. Use Zod on client and server and TypeScript types generated from API schemas. Prevent prompt injection through retrieved books.

Reuse only the UI/agent machinery of `src/pages/PodRoom.tsx`, `src/lib/podApi.ts`, `supabase/functions/pod-room/index.ts`, `src/pages/MiroFish.tsx`, `supabase/functions/mirofish/index.ts` from Belicia as appropriate; never claim that Dr. Saikou Y. Diallo's published model or MiroFish runtime was literally imported unless verified by source inspection and integration tests.

## 6. Completion and acceptance criteria

1. Exactly three main routes visible: Occult Killer, Neural Atlas, AI Research. Corpus is a drawer/section, not a fourth route.
2. On Occult Killer, changing the **swarm's motives** changes the submitted backend config; changing the **individual's motives and strategies** changes a *different* submitted config. Both persist after reload.
3. A single protagonist remains explicitly distinct from a multi-member swarm in the visualization and simulation payload.
4. A saved scenario can be reopened, repeated with the same seed and model version and produce identical deterministic outputs when configured in deterministic mode.
5. Every result has `SIMULATED / UNVALIDATED` unless independent validation is available. Unverified rumors never become documented facts because of repetition.
6. Disabled/unimplemented controls must say so explicitly; never return invented curves, labels, economic forecasts, or AI responses.
7. Neural Atlas computation stays isolated from the Occult Killer simulator, while the AI can read each approved result in appropriate chat scope.
8. Full-text/book indexed count accurately reflects stored excerpts, NOT 37 bibliography titles.
9. Secure auth, RLS, no browser API secrets, mobile navigation, accessible keyboard operation, export, loading/error states, and working client/API tests.
10. Provide summary of created/modified files, database migrations, env vars, actual backend integrations, remaining blockers, and steps to run. Run and report `npm run build`, relevant tests, and backend smoke tests. Do not claim 'complete' for unimplemented backend features.

**Delivery order:** (A) audit & map existing code, (B) create navigation/design, (C) wire current v3 capabilities accurately, (D) implement v4 persistent individual-vs-swarm schema and compute engine, (E) Neural Atlas adapter, (F) Gemini grounded chatbot, (G) QA/security and deploy. Prioritize actual data flow and fidelity over decorative UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f080ee90-cb65-4152-a467-9e542e23b7f3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
