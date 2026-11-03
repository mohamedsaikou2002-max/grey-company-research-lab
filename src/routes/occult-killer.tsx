import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, Tag } from "@/components/lab/Shell";
import { WeightEditor, Field, inputCls, download } from "@/components/lab/controls";
import { SwarmNetwork, LEGEND } from "@/components/lab/SwarmNetwork";
import { defaultInput } from "@/lib/engine/defaults";
import { INDIVIDUAL_STRATEGIES, RESPONSES, type RunInput, type RunResult, type Swarm, type Individual, type Scenario } from "@/lib/engine/swarm";
import { createRun, createPythonRun, deleteSwarm, engineStatus, ingestExcerpt, listProfiles, listSources, saveIndividual, saveScenario, saveSwarm } from "@/lib/lab.functions";

export const Route = createFileRoute("/occult-killer")({
  head: () => ({
    meta: [
      { title: "Occult Killer — Grey Company Research Lab" },
      { name: "description", content: "Synthetic one-individual-versus-one-swarm simulator with separate motives, strategies and matched-seed counterfactuals." },
      { property: "og:title", content: "Occult Killer — Grey Company Research Lab" },
      { property: "og:description", content: "Synthetic, unvalidated individual-vs-swarm scenario simulator with evidence provenance." },
    ],
  }),
  component: OccultKiller,
});

const QURAN = [
  ["49:6", "Verify reports before acting on them"],
  ["4:135", "Stand firm for justice, even against oneself"],
  ["5:8", "Do not let hostility lead to injustice"],
  ["3:175", "Fear used as a tool of pressure"],
  ["4:76", "Weakness of coercive schemes"],
  ["96:6–7", "Self-sufficiency and transgression"],
  ["57:20", "Rivalry in wealth and status"],
  ["18:103–104", "Misjudging one's own deeds"],
  ["2:102", "Rumor, sorcery claims and harm"],
];
const DASH = ["", "6 3", "2 3", "8 2 2 2", "1 4", "10 4", "4 4", "3 1", "12 3"];

type Profiles = Awaited<ReturnType<typeof listProfiles>>;

function OccultKiller() {
  const [swarm, setSwarm] = useState<Swarm>(defaultInput.swarm);
  const [ind, setInd] = useState<Individual>(defaultInput.individual);
  const [sc, setSc] = useState<Scenario>(defaultInput.scenario);
  const [swarmId, setSwarmId] = useState<string | null>(null);
  const [indId, setIndId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  const [run, setRun] = useState<(RunResult & { id: string }) | null>(null);
  const [cf, setCf] = useState<(RunResult & { id: string }) | null>(null);
  const [cfVar, setCfVar] = useState<"safeguards" | "accountability" | "competition">("safeguards");
  const [month, setMonth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [engine, setEngine] = useState<Awaited<ReturnType<typeof engineStatus>> | null>(null);
  const [useEngine, setUseEngine] = useState<"typescript" | "python">("typescript");

  const fList = useServerFn(listProfiles), fSaveS = useServerFn(saveSwarm), fSaveI = useServerFn(saveIndividual);
  const fRun = useServerFn(createRun), fPy = useServerFn(createPythonRun), fStatus = useServerFn(engineStatus);
  const fScen = useServerFn(saveScenario), fDel = useServerFn(deleteSwarm);

  const refresh = async () => {
    const p = await fList();
    setProfiles(p);
    return p;
  };
  useEffect(() => {
    fStatus().then(setEngine).catch(() => setEngine(null));
    // Load the worst-case synthetic preset on each fresh visit; never silently
    // replace it with a previously saved neutral or historical profile.
    // Saved profiles remain available through explicit user selection.
    refresh().catch((e) => toast.error(`Could not list saved profiles: ${e.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = async () => {
    const s = await fSaveS({ data: { id: swarmId, config: swarm } });
    const i = await fSaveI({ data: { id: indId, config: ind } });
    setSwarmId(s.id); setIndId(i.id);
    localStorage.setItem("gc-swarm", s.id); localStorage.setItem("gc-ind", i.id);
    refresh();
    return { s, i };
  };

  const doRun = async () => {
    setBusy(true); setCf(null);
    try {
      await persist();
      const input: RunInput = { swarm, individual: ind, scenario: sc };
      if (useEngine === "python") {
        if ((swarm.baseline_mode ?? "absolute_evil_stress_test") === "absolute_evil_stress_test") throw new Error("The legacy Python v2 adapter does not support the adversarial baseline; select the TypeScript engine.");
        const r = await fPy({ data: input });
        toast.success(`Python v2 run saved (${r.id.slice(0, 8)}). Aggregate output only.`);
        console.info("python v2 result", r);
      } else {
        const r = await fRun({ data: { input } });
        setRun(r); setMonth(r.frames.length - 1);
      }
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const doCompare = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const alt: RunInput = structuredClone({ swarm, individual: ind, scenario: sc });
      if (cfVar === "safeguards") alt.scenario.safeguards = Math.min(1, sc.safeguards + 0.3);
      if (cfVar === "accountability") alt.swarm.traits["accountability"] = Math.min(1, (swarm.traits["accountability"] ?? 0.5) + 0.3);
      if (cfVar === "competition") alt.swarm.motives["financial_gain"] = Math.min(1, (swarm.motives["financial_gain"] ?? 0) + 0.3);
      setCf(await fRun({ data: { input: alt } }));
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const frame = run?.frames[Math.min(month, (run?.frames.length ?? 1) - 1)];
  const timeline = useMemo(() => run?.frames.map((f) => ({ month: f.month, ...f.responses, cohesion: f.cohesion, accountability: f.accountability, hostility_index: f.hostility_index, mean_disengagement: f.mean_disengagement, ...f.indices })) ?? [], [run]);
  const selAgent = run?.agents.find((a) => a.id === sel);

  const exportCsv = () => {
    if (!run) return;
    const head = ["month", ...RESPONSES, "cohesion", "accountability", "hostility_index", "mean_disengagement", "autonomy", "safety", "integrity", "evidence"];
    const rows = run.frames.map((f) => [f.month, ...RESPONSES.map((r) => f.responses[r]), f.cohesion, f.accountability, f.hostility_index, f.mean_disengagement, f.indices.autonomy, f.indices.safety, f.indices.integrity, f.indices.evidence].join(","));
    download(`run-${run.id.slice(0, 8)}.csv`, [head.join(","), ...rows].join("\n"), "text/csv");
  };

  const motiveCompare = useMemo(() => {
    const keys = Object.keys(swarm.motives);
    const ik = Object.keys(ind.motives);
    return [...keys.map((k) => ({ name: k.replace(/_/g, " "), swarm: swarm.motives[k], individual: 0 })), ...ik.map((k) => ({ name: k.replace(/_/g, " "), swarm: 0, individual: ind.motives[k] }))];
  }, [swarm.motives, ind.motives]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>model {run?.model_version ?? "gc-swarm-ts-4.2.0"}</Tag>
        <Tag>{swarm.baseline_mode === "neutral_reference" ? "NEUTRAL REFERENCE" : "FICTIONAL ABSOLUTE-EVIL STRESS TEST"}</Tag>
        <Button size="sm" variant="outline" onClick={() => { setSwarm(structuredClone(defaultInput.swarm)); setSwarmId(null); setRun(null); setCf(null); }}>Load worst-case preset</Button>
        <Tag>python v2: {engine ? (engine.python.ok ? "connected" : engine.python.detail) : "checking…"}</Tag>
        <SourcesDrawer />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* SWARM 55% */}
        <div className="lg:col-span-7">
          <Panel title="Swarm / Organization (synthetic)" actions={
            <div className="flex items-center gap-2">
              <select aria-label="Select saved swarm" className={`${inputCls} w-40 py-0.5 text-xs`} value={swarmId ?? ""} onChange={(e) => { const s = profiles?.swarms.find((x) => x.id === e.target.value); if (s) { setSwarm(s.config as Swarm); setSwarmId(s.id); } else { setSwarm(defaultInput.swarm); setSwarmId(null); } }}>
                <option value="">+ new swarm</option>
                {profiles?.swarms.map((s) => <option key={s.id} value={s.id}>{s.name} v{s.version}</option>)}
              </select>
              {swarmId && <Button size="sm" variant="outline" onClick={async () => { await fDel({ data: { id: swarmId } }); setSwarmId(null); setSwarm(defaultInput.swarm); refresh(); }}>Delete</Button>}
            </div>
          }>
            <Tabs defaultValue="identity">
              <TabsList className="flex-wrap">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="motives">Motives</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="traits">Traits</TabsTrigger>
              </TabsList>
              <TabsContent value="identity" className="space-y-3">
                <Field label="Baseline assumption (fictional only)">
                  <select className={inputCls} aria-label="Simulation assumption mode" value={swarm.baseline_mode ?? "absolute_evil_stress_test"} onChange={(e) => setSwarm({ ...swarm, baseline_mode: e.target.value as Swarm["baseline_mode"] })}>
                    <option value="absolute_evil_stress_test">Absolute evil — worst-case fictional stress test</option>
                    <option value="neutral_reference">Neutral reference — negative control</option>
                  </select>
                </Field>
                <p className="text-[11px] text-muted-foreground">Worst-case means deliberately pessimistic synthetic assumptions, not proof that any real group is malicious. Neutral mode is retained to reveal assumption-driven conclusions.</p>
                <Field label="Title"><input className={inputCls} value={swarm.title} maxLength={80} onChange={(e) => setSwarm({ ...swarm, title: e.target.value })} /></Field>
                <Field label="Description"><textarea className={inputCls} rows={2} value={swarm.description} onChange={(e) => setSwarm({ ...swarm, description: e.target.value })} /></Field>
                <Field label="Institutional type"><input className={inputCls} value={swarm.institutional_type} onChange={(e) => setSwarm({ ...swarm, institutional_type: e.target.value })} /></Field>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Hypothetical roles (share)</span>
                  {swarm.roles.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <input aria-label="Role label" className={inputCls} value={r.label} onChange={(e) => { const roles = [...swarm.roles]; roles[i] = { ...r, label: e.target.value, id: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32) || `r${i}` }; setSwarm({ ...swarm, roles }); }} />
                      <input aria-label="Role share" type="number" min={0} max={1} step={0.05} className={`${inputCls} w-20 font-mono`} value={r.share} onChange={(e) => { const roles = [...swarm.roles]; roles[i] = { ...r, share: Math.max(0, Math.min(1, +e.target.value)) }; setSwarm({ ...swarm, roles }); }} />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Historical names are case-study context only — not behavioral profiles or evidence of wrongdoing.</p>
              </TabsContent>
              <TabsContent value="motives" className="space-y-3">
                <WeightEditor value={swarm.motives} onChange={(motives) => setSwarm({ ...swarm, motives })} />
                <Field label="Provenance / assumptions for weights">
                  <textarea className={inputCls} rows={2} value={Object.entries(swarm.motive_provenance).map(([k, v]) => `${k}: ${v}`).join("\n")} onChange={(e) => setSwarm({ ...swarm, motive_provenance: Object.fromEntries(e.target.value.split("\n").filter((l) => l.includes(":")).map((l) => [(l.split(":")[0] ?? "").trim(), l.split(":").slice(1).join(":").trim()])) })} />
                </Field>
                <p className="text-[11px] text-muted-foreground">"Reward sensitivity" is a behavioral parameter (Traits tab), not dopamine receptor activity.</p>
              </TabsContent>
              <TabsContent value="strategy" className="space-y-3">
                <WeightEditor value={swarm.strategy} onChange={(strategy) => setSwarm({ ...swarm, strategy })} />
                <Field label="Objective (hypothesis, not an operational plan)"><textarea className={inputCls} rows={2} value={swarm.objective} onChange={(e) => setSwarm({ ...swarm, objective: e.target.value })} /></Field>
              </TabsContent>
              <TabsContent value="traits"><WeightEditor normalized={false} value={swarm.traits} onChange={(traits) => setSwarm({ ...swarm, traits })} /></TabsContent>
            </Tabs>
          </Panel>
        </div>

        {/* INDIVIDUAL 45% */}
        <div className="lg:col-span-5">
          <Panel title="Single Individual / Protagonist">
            <Tabs defaultValue="motives">
              <TabsList className="flex-wrap">
                <TabsTrigger value="motives">Motives</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="traits">Traits</TabsTrigger>
                <TabsTrigger value="ethics">Ethics lens</TabsTrigger>
              </TabsList>
              <TabsContent value="motives" className="space-y-3">
                <Field label="Name (synthetic persona)"><input className={inputCls} value={ind.name} onChange={(e) => setInd({ ...ind, name: e.target.value })} /></Field>
                <WeightEditor value={ind.motives} onChange={(motives) => setInd({ ...ind, motives })} />
              </TabsContent>
              <TabsContent value="strategy" className="space-y-3">
                <fieldset className="grid grid-cols-2 gap-1">
                  <legend className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Strategies (11 fixed)</legend>
                  {INDIVIDUAL_STRATEGIES.map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={ind.strategies.includes(s)} onChange={(e) => setInd({ ...ind, strategies: e.target.checked ? [...ind.strategies, s] : ind.strategies.filter((x) => x !== s) })} />
                      {s.replace(/_/g, " ")}
                    </label>
                  ))}
                </fieldset>
                {ind.strategies.length === 0 && <p role="alert" className="text-xs underline">Pick at least one strategy.</p>}
                <Field label="Lawful objective / business plan"><textarea className={inputCls} rows={2} value={ind.lawful_objective} onChange={(e) => setInd({ ...ind, lawful_objective: e.target.value })} /></Field>
                <Field label="Ethical boundaries"><textarea className={inputCls} rows={2} value={ind.ethical_boundaries} onChange={(e) => setInd({ ...ind, ethical_boundaries: e.target.value })} /></Field>
                <Field label={`Transparency ${ind.transparency.toFixed(2)}`}><Slider min={0} max={1} step={0.01} value={[ind.transparency]} onValueChange={(vals) => setInd({ ...ind, transparency: vals[0] ?? ind.transparency })} /></Field>
              </TabsContent>
              <TabsContent value="traits"><WeightEditor normalized={false} value={ind.traits} onChange={(traits) => setInd({ ...ind, traits })} /><p className="mt-2 text-[11px] text-muted-foreground">New v4 fields: stress tolerance, financial runway, willingness to collaborate.</p></TabsContent>
              <TabsContent value="ethics" className="space-y-2">
                <div className="flex gap-2">{(["none", "quranic", "secular"] as const).map((l) => <Button key={l} size="sm" variant={ind.ethics_lens === l ? "default" : "outline"} onClick={() => setInd({ ...ind, ethics_lens: l })}>{l}</Button>)}</div>
                {ind.ethics_lens === "quranic" && <ul className="space-y-1 text-xs">{QURAN.map(([v, t]) => <li key={v}><span className="font-mono">{v}</span> — {t}</li>)}</ul>}
                {ind.ethics_lens === "secular" && <p className="text-xs">Verification before action · proportionality · fairness to adversaries · due process.</p>}
                <p className="text-[11px] text-muted-foreground">Interpretive ethics categories only — not divine judgments or brain measurements. The lens does not change simulation numbers.</p>
              </TabsContent>
            </Tabs>
          </Panel>
        </div>
      </div>

      {/* SCENARIO ENGINE */}
      <Panel title="Scenario & interaction engine">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Narrative"><textarea className={inputCls} rows={3} value={sc.narrative} onChange={(e) => setSc({ ...sc, narrative: e.target.value })} /></Field>
          <div className="space-y-2">
            <Field label="Event type"><select className={inputCls} value={sc.event_type} onChange={(e) => setSc({ ...sc, event_type: e.target.value as Scenario["event_type"] })}>{["business_proposal", "market_entry", "competitor_response", "confirmed_report", "unsupported_rumor"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Evidence tier"><select className={inputCls} value={sc.evidence_tier} onChange={(e) => setSc({ ...sc, evidence_tier: e.target.value as Scenario["evidence_tier"] })}>{["documented", "corroborated", "single_testimony", "rumor"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([["months", 1, 60], ["agents", 10, 400], ["seed", 0, 2147483647], ["trials", 1, 50]] as const).map(([k, lo, hi]) => (
              <Field key={k} label={k}><input type="number" min={lo} max={hi} className={`${inputCls} font-mono`} value={sc[k]} onChange={(e) => setSc({ ...sc, [k]: Math.max(lo, Math.min(hi, Math.round(+e.target.value || lo))) })} /></Field>
            ))}
          </div>
          <div className="space-y-2">
            <Field label={`Safeguards ${sc.safeguards.toFixed(2)}`}><Slider min={0} max={1} step={0.01} value={[sc.safeguards]} onValueChange={(vals) => setSc({ ...sc, safeguards: vals[0] ?? sc.safeguards })} /></Field>
            <Field label={`External shock ${sc.external_shock.toFixed(2)}`}><Slider min={0} max={1} step={0.01} value={[sc.external_shock]} onValueChange={(vals) => setSc({ ...sc, external_shock: vals[0] ?? sc.external_shock })} /></Field>
            <Field label="Engine"><select className={inputCls} value={useEngine} onChange={(e) => setUseEngine(e.target.value as "typescript" | "python")}><option value="typescript">TypeScript v4 (built-in)</option><option value="python" disabled={!engine?.python.ok || (swarm.baseline_mode ?? "absolute_evil_stress_test") === "absolute_evil_stress_test"}>Python v2 {engine?.python.ok ? "(neutral only)" : "(not connected)"}</option></select></Field>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={doRun} disabled={busy || ind.strategies.length === 0}>{busy ? "Running…" : "RUN"}</Button>
          <Button variant="outline" disabled title="Runs complete synchronously in under a second; no async runner to pause.">PAUSE (n/a)</Button>
          <Button variant="outline" disabled={!run} onClick={() => setMonth((m) => Math.min((run?.frames.length ?? 1) - 1, m + 1))}>STEP</Button>
          <Button variant="outline" onClick={() => { setRun(null); setCf(null); setMonth(0); setSel(null); }}>RESET</Button>
          <Button variant="outline" disabled={busy} onClick={async () => { try { const { s, i } = await persist(); await fScen({ data: { name: sc.narrative.slice(0, 60), group_profile_id: s.id, individual_profile_id: i.id, config: sc } }); toast.success("Scenario and both profiles saved"); } catch (e) { toast.error((e as Error).message); } }}>SAVE SCENARIO</Button>
          <Button variant="outline" disabled={!run} onClick={() => run && download(`run-${run.id.slice(0, 8)}.json`, JSON.stringify({ input: { swarm, individual: ind, scenario: sc }, result: run }, null, 2))}>EXPORT JSON</Button>
          <Button variant="outline" disabled={!run} onClick={exportCsv}>EXPORT CSV</Button>
          {profiles && profiles.scenarios.length > 0 && (
            <select aria-label="Reopen saved scenario" className={`${inputCls} w-auto text-xs`} defaultValue="" onChange={(e) => { const s = profiles.scenarios.find((x) => x.id === e.target.value); if (!s) return; setSc(s.config as Scenario); const g = profiles.swarms.find((x) => x.id === s.group_profile_id); const i = profiles.individuals.find((x) => x.id === s.individual_profile_id); if (g) { setSwarm(g.config as Swarm); setSwarmId(g.id); } if (i) { setInd(i.config as Individual); setIndId(i.id); } toast("Scenario reopened — RUN with the same seed reproduces identical output."); }}>
              <option value="">Reopen scenario…</option>
              {profiles.scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </Panel>

      {!run ? (
        <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No run yet. Configure the swarm and protagonist, then press RUN. Nothing is shown until a real run completes.</div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <Panel title="Interaction network (simulated)" className="lg:col-span-7" actions={<Tag>month {frame?.month}</Tag>}>
              <SwarmNetwork agents={run.agents} selected={sel} onSelect={setSel} />
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">{LEGEND.map(([s, l]) => <span key={l}>{s} {l}</span>)}</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Shows the first 60 agents of trial 1, final month. Links are simulated interactions, not real-world contact.</p>
            </Panel>
            <Panel title="Agent inspector" className="lg:col-span-5">
              {selAgent ? (
                <div className="space-y-2 text-xs">
                  <div className="font-mono">#{selAgent.id} · {selAgent.role} · <strong>{selAgent.state.replace(/_/g, " ")}</strong></div>
                  <div>Why? Highest weighted model inputs:</div>
                  <ul className="font-mono">{selAgent.top_drivers.map((d) => <li key={d.factor}>{d.factor}: {d.contribution}</li>)}</ul>
                  <div>Utility per response (higher = more likely, plus noise):</div>
                  <ul className="grid grid-cols-2 font-mono">{RESPONSES.map((r) => <li key={r}>{r}: {selAgent.utilities[r]}</li>)}</ul>
                  <div className="font-mono">disengagement: {selAgent.disengagement}</div>
                  <p className="text-muted-foreground">Explanation derived from model state only. These are synthetic hypotheses, not claims about real people.</p>
                </div>
              ) : <p className="text-xs text-muted-foreground">Select a node to inspect its decision.</p>}
            </Panel>
          </div>

          <Panel title="Replay & response distribution" actions={<Tag>SYNTHETIC / UNVALIDATED · utility-derived shares, not calibrated probabilities</Tag>}>
            <label className="flex items-center gap-3 text-xs">Period <Slider className="flex-1" min={0} max={run.frames.length - 1} step={1} value={[month]} onValueChange={(vals) => setMonth(vals[0] ?? month)} aria-label="Month scrubber" /> <span className="font-mono">{frame?.month}/{run.frames.length}</span></label>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
              {RESPONSES.map((r) => (
                <div key={r} className="border border-border p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">{r.replace(/_/g, " ")}</div>
                  <div className="font-mono text-lg">{((frame?.responses[r] ?? 0) * 100).toFixed(1)}%</div>
                  <div className="font-mono text-[10px] text-muted-foreground">90% band {(run.summary.ci90[r][0] * 100).toFixed(0)}–{(run.summary.ci90[r][1] * 100).toFixed(0)}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">run {run.id.slice(0, 8)} · seed {run.seed} · input hash {run.input_hash} · {run.summary.trials} trials · evidence tier {sc.evidence_tier}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">{run.summary.warning}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs"><Tag>Narrative features (lexical, not verified facts)</Tag>{Object.entries(run.summary.narrative_signals).filter(([, on]) => on).map(([k]) => <Tag key={k}>{k.replace(/_/g, " ")}</Tag>)}</div>
            <div className="mt-3 h-64"><ResponsiveContainer><LineChart data={timeline}><CartesianGrid stroke="var(--border)" strokeDasharray="2 4" /><XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} /><YAxis stroke="var(--muted-foreground)" fontSize={10} /><Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} /><Legend wrapperStyle={{ fontSize: 10 }} />{RESPONSES.map((r, i) => <Line key={r} dataKey={r} dot={false} stroke={i % 2 ? "var(--muted-foreground)" : "var(--foreground)"} strokeDasharray={DASH[i % DASH.length]} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Cohesion, accountability & indices">
              <div className="h-56"><ResponsiveContainer><LineChart data={timeline}><CartesianGrid stroke="var(--border)" strokeDasharray="2 4" /><XAxis dataKey="month" fontSize={10} stroke="var(--muted-foreground)" /><YAxis domain={[0, 1]} fontSize={10} stroke="var(--muted-foreground)" /><Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} /><Legend wrapperStyle={{ fontSize: 10 }} />{["cohesion", "accountability", "hostility_index", "mean_disengagement", "autonomy", "safety", "integrity", "evidence"].map((k, i) => <Line key={k} dataKey={k} dot={false} stroke="var(--foreground)" strokeDasharray={DASH[i]} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div>
              <p className="text-[11px] text-muted-foreground">Economic outputs are not shown: no economic model exists yet.</p>
            </Panel>
            <Panel title="Motive weights: swarm vs protagonist">
              <div className="h-56"><ResponsiveContainer><BarChart data={motiveCompare} layout="vertical"><XAxis type="number" domain={[0, 1]} fontSize={10} stroke="var(--muted-foreground)" /><YAxis type="category" dataKey="name" width={150} fontSize={9} stroke="var(--muted-foreground)" /><Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="swarm" fill="var(--foreground)" isAnimationActive={false} /><Bar dataKey="individual" fill="var(--card)" stroke="var(--foreground)" isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
            </Panel>
          </div>

          <Panel title="What changed? (matched-seed counterfactual)" actions={
            <div className="flex gap-2">
              <select aria-label="Counterfactual variable" className={`${inputCls} py-0.5 text-xs`} value={cfVar} onChange={(e) => setCfVar(e.target.value as typeof cfVar)}><option value="safeguards">Safeguards +0.3</option><option value="accountability">Swarm accountability +0.3</option><option value="competition">Financial-gain motive +0.3</option></select>
              <Button size="sm" onClick={doCompare} disabled={busy}>COMPARE COUNTERFACTUAL</Button>
            </div>
          }>
            {cf ? (
              <div className="space-y-2 text-xs">
                <p>Same seed ({cf.seed}), same trials, same agents. Changed: <strong>{cfVar}</strong>. Held constant: every other swarm motive, strategy and trait; all protagonist fields; narrative, event, evidence tier, horizon.</p>
                <table className="w-full font-mono text-[11px]"><thead><tr className="text-left text-muted-foreground"><th>response</th><th>baseline</th><th>counterfactual</th><th>Δ</th></tr></thead><tbody>{RESPONSES.map((r) => <tr key={r} className="border-t border-border"><td>{r}</td><td>{(run.summary.final[r] * 100).toFixed(1)}%</td><td>{(cf.summary.final[r] * 100).toFixed(1)}%</td><td>{((cf.summary.final[r] - run.summary.final[r]) * 100).toFixed(1)}</td></tr>)}</tbody></table>
              </div>
            ) : <p className="text-xs text-muted-foreground">Pick one variable and compare against the current run.</p>}
          </Panel>
        </>
      )}
    </div>
  );
}

function SourcesDrawer() {
  const fList = useServerFn(listSources), fIngest = useServerFn(ingestExcerpt);
  const [data, setData] = useState<Awaited<ReturnType<typeof listSources>> | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ source_id: "", page: "", excerpt: "", claim_status: "unverified" as const, origin: "direct" as "direct" | "secondary", independence_cluster: "" });
  const load = () => fList().then(setData).catch((e) => toast.error(e.message));
  const counts = new Map<string, number>();
  data?.excerpts.forEach((e) => counts.set(e.source_id, (counts.get(e.source_id) ?? 0) + 1));
  const docs = data?.documents.filter((d) => `${d.title} ${d.summary}`.toLowerCase().includes(q.toLowerCase())) ?? [];
  return (
    <Sheet onOpenChange={(o) => o && load()}>
      <SheetTrigger asChild><Button size="sm" variant="outline">Research Sources</Button></SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>Research Sources</SheetTitle></SheetHeader>
        {!data ? <p className="p-4 text-sm text-muted-foreground">Loading…</p> : (
          <div className="space-y-3 p-4">
            <p className="font-mono text-[11px] text-muted-foreground">{data.documents.length} source records · {counts.size} with excerpts · {data.excerpts.length} excerpts indexed. Bibliography records contain metadata only; source-specific text must be separately and lawfully indexed.</p>
            <input className={inputCls} placeholder="Search sources…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sources" />
            {docs.map((d) => (
              <article key={d.id} className="border border-border p-2 text-xs">
                <div className="flex justify-between gap-2"><strong>{d.title}</strong><Tag>{counts.get(d.id) ? (d.origin === "user_synthesis" ? "RESEARCH NOTES INDEXED" : "EXCERPTS INDEXED") : "BIBLIOGRAPHY ONLY"}</Tag></div>
                <div className="font-mono text-[10px] text-muted-foreground">{d.id} · {d.evidence_tier} · {d.verification}</div>
                <p className="mt-1 text-muted-foreground">{d.summary}</p>
                {d.url && <a className="underline" href={d.url} target="_blank" rel="noreferrer">source</a>}
              </article>
            ))}
            <form className="space-y-2 border border-border p-2" onSubmit={async (e) => { e.preventDefault(); try { await fIngest({ data: { source_id: form.source_id, page: form.page || undefined, excerpt: form.excerpt, claim_status: form.claim_status, independence_cluster: form.independence_cluster || undefined, provenance: { origin: form.origin } } }); toast.success("Excerpt ingested"); setForm({ ...form, excerpt: "" }); load(); } catch (err) { toast.error((err as Error).message); } }}>
              <div className="text-xs font-semibold">Ingest lawful excerpt</div>
              <select required className={inputCls} value={form.source_id} onChange={(e) => setForm({ ...form, source_id: e.target.value })} aria-label="Source"><option value="">Source…</option>{data.documents.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
              <div className="flex gap-2"><input className={inputCls} placeholder="Page" value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} /><select className={inputCls} value={form.claim_status} onChange={(e) => setForm({ ...form, claim_status: e.target.value as never })}>{["verified", "corroborated", "unverified", "contested", "rumor"].map((x) => <option key={x}>{x}</option>)}</select><select className={inputCls} value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as never })}><option>direct</option><option>secondary</option></select></div>
              <input className={inputCls} placeholder="Independence cluster (retellings of one rumor share a cluster)" value={form.independence_cluster} onChange={(e) => setForm({ ...form, independence_cluster: e.target.value })} />
              <textarea required minLength={10} className={inputCls} rows={3} placeholder="Excerpt text (no victim-identifying information)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              <Button size="sm" type="submit">Ingest</Button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
