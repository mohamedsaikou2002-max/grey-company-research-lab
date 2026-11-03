# Occult Killer — fictional "Absolute Evil" negative-visualization baseline (v4.2)

**Status:** Explicitly fictional worst-case scenario model. NOT a statement about real cults, religions, ethnic communities, associations, or specific people. NOT an empirical forecast.

## Objective and governing question

> Under which observable circumstances could a private, fictional organization with deliberately amoral incentives exert ordinary institutional or social pressure against an independent founder, and which counterfactuals distinguish purposeful coercion from shared incentives, no contact, or mistaken attribution?

This is a **stress test**, not an investigation finding. The model must allow no interest, no contact, ethical conduct, and independent secular explanations. The word "evil" is an intentionally extreme modeling assumption, not a measurement of any person's nature.

## Seven hypotheses as negative-visualization tests

| Hypothesis | Fictional worst-case interpretation | Essential disconfirmation or comparison |
|---|---|---|
| H1: Ordinary association | High group cohesion could facilitate pressure if other conditions also exist | No actual contact/communication => no directed response |
| H2: Informal social influence | Repeated expectations may produce conformity, exclusion or self-censorship | Preexisting preferences, benign relationship effects and independent decisions |
| H3: Coordinated secular misconduct | Joint interests could permit conflicts of interest or improper gatekeeping | No authenticated coordination, alternative economic motives and oversight |
| H4: Spiritual-authority pretext | A fictional actor could invoke supernatural language to pressure compliance | No direct authority claims, voluntary belief, unrelated ritual |
| H5: Genuine religious practice | Even sincerely religious members could face organizational conflicts of interest | Actual lawful conduct and independent individual decisions |
| H6: Misattribution/coincidence | The observer might mistakenly connect unrelated events into a hostile pattern | Explicit no contact, incompatible timelines, common external causes |
| H7: Supernatural influence | A narrative could *allege* occult intervention | No verified physical mechanism or observed causal link: this does not turn into a directed response |

These are possible alternative explanations, not a hierarchy that presumes wrongdoing.

## Starting synthetic personality

When a **fresh** Occult Killer page is opened, `defaultInput.swarm.baseline_mode` is `absolute_evil_stress_test`:

- Hypothetical core motives: dominance/control, preservation of impunity, institutional self-preservation, status-defense, instrumental exploitation.
- Traits: high cohesion, hierarchy, defensiveness and reputational pressure; weak pluralism, dissent safety, integrity and oversight.
- Agent moral disengagement begins high by stipulation. This is an assumption, **not inferred** from books, symbolism, affiliation, Qur'anic verses, or demographic identities.
- One synthetic founder remains independent and may use the Qur'anic ethics lens, which does not act as a supernatural or empirical predictor.

The preset assumes the group's **potential incentives are severely adversarial**. It does not presume the group has contacted or is interested in any individual.

## Actual algorithmic behavior

The model version is `gc-swarm-ts-4.2.0` and remains deterministically seeded.

The `scenario.narrative` is converted into inspectable **lexical signals**: explicit absence of contact, direct contact, economic competition, claimed spiritual authority, independent oversight, and (explicitly asserted) verified interference. These signals are **hypotheses parsed from user text**, not fact-checks. The user must verify their assertions separately.

At each monthly round, conditional utility scores consider: group motives and tactics, input narrative signals, protagonist's behavioral choices, model-based moral disengagement, a dynamic hostility index, and safeguards.

Two new **abstract** synthetic response types exist:
- `undue_pressure`: possible coercive pressure category (without tactical mechanisms).
- `improper_gatekeeping`: possible unfair denial of institutional or commercial access (without criminal instruction).

Other responses remain: no response, competition, cooperation, dialogue, due diligence, scrutiny, disengagement, internal review, and accountability.

Narrative changes affect these categories. Strong oversight and safeguards reduce adverse-response utility and gradually lower hypothetical hostility. Seeded Monte Carlo variation generates synthetic response shares, **not calibrated probabilities**. The system does not simulate actual financial market concentration, criminal operations, or remote spiritual influence.

## Mandatory safeguards and falsification

1. An explicit "no contact" or unrelated scenario gives **100% no directed response** regardless of the adversarial preset.
2. A **neutral reference** mode is available for matched-seed comparison; both adversarial-only response types are disabled in that mode.
3. No religious label, Kabbalistic vocabulary, affiliation, or historical case title automatically changes response functions. Identity must never be treated as evidence of evil or coordination.
4. Unverified reports and rumours may suggest follow-up hypotheses but do not prove causation.
5. "Absolute evil" is never an estimated psychological trait of a real organization.
6. Serious violence and exploitation are modeled only through abstract harms, institutional failure, reporting, protection, and accountability; no tactics for abuse or evasion.
7. The selected ethics lens assesses actions normatively; it does not calculate divine judgment or turn mystical assertions into neuroscience.

## Frontend workflow

1. Open **Occult Killer**; it loads the *fictional adversarial stress-test preset*, not an arbitrary saved group.
2. Edit swarm motives, traits, hierarchy and strategy; separately edit the founder's motives, strategies and Qur'anic/secular ethics lens.
3. Enter a narrative describing observable contacts, market interactions or actual lack of connection, then set evidence quality, safeguards, agent population, seed and duration (1–60 months).
4. Run the **TypeScript v4.2** engine; see extracted narrative features, adversarial/neutral label, synthetic response shares, mean disengagement, and hostility trajectory.
5. Use matched-seed counterfactuals. For a direct neutral reference, select "Neutral reference" and rerun with the same scenario and seed.
6. Do not use the older Python v2 adapter for this feature: it does not implement the new stress-test model and is disabled in adversarial mode.

The **Research AI** chatbot now explicitly describes this mode as a fictional negative-visualization scenario and refuses to turn synthetic outcomes into allegations about real people.

## Validity limitations and next steps

- The feature extractor is basic lexical matching, not robust semantic natural-language understanding.
- These weights are **stipulated**, not inferred from the corpus or scientifically calibrated.
- Output confidence bands reflect variation across simulated random seeds, not uncertainty about actual real-world people.
- A future version should represent real inter-agent edges, causal institutions, empirically benchmarked cases, and source-aware competing hypotheses with explicitly checkable disconfirmation.
- The simulator does not prove that any occult network exists, coordinates cross-institutionally, or targets a founder.

**Run acceptance checks:** `bun run test` and `bun run build` on the feature branch. The new unit tests include deterministic runs, narrative-dependent decisions, explicit no-contact response, neutral negative control, safeguards, and identity-label non-attribution.
