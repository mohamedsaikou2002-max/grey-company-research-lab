import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { IndividualSchema, RunInputSchema, SwarmSchema, ScenarioSchema, runSimulation, hashInput, MODEL_VERSION } from "@/lib/engine/swarm";
import { runNeural, NEURAL_VERSION } from "@/lib/engine/neural";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

// ---------- Profiles (swarm and individual are separate, versioned records) ----------
export const saveSwarm = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().nullable(), config: SwarmSchema }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    if (data.id) {
      const { data: cur } = await s.from("group_profiles").select("version").eq("id", data.id).maybeSingle();
      const { data: row, error } = await s.from("group_profiles").update({ config: data.config, name: data.config.title, version: (cur?.version ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", data.id).select().single();
      fail(error);
      return row!;
    }
    const { data: row, error } = await s.from("group_profiles").insert({ config: data.config, name: data.config.title }).select().single();
    fail(error);
    return row!;
  });

export const saveIndividual = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().nullable(), config: IndividualSchema }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    if (data.id) {
      const { data: cur } = await s.from("individual_profiles").select("version").eq("id", data.id).maybeSingle();
      const { data: row, error } = await s.from("individual_profiles").update({ config: data.config, name: data.config.name, version: (cur?.version ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", data.id).select().single();
      fail(error);
      return row!;
    }
    const { data: row, error } = await s.from("individual_profiles").insert({ config: data.config, name: data.config.name }).select().single();
    fail(error);
    return row!;
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const [g, i, sc] = await Promise.all([
    s.from("group_profiles").select("*").order("updated_at", { ascending: false }).limit(50),
    s.from("individual_profiles").select("*").order("updated_at", { ascending: false }).limit(50),
    s.from("scenarios").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  fail(g.error); fail(i.error); fail(sc.error);
  return { swarms: g.data!, individuals: i.data!, scenarios: sc.data! };
});

export const deleteSwarm = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("group_profiles").delete().eq("id", data.id);
    fail(error);
    return { ok: true };
  });

export const saveScenario = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(80), group_profile_id: z.string().uuid(), individual_profile_id: z.string().uuid(), config: ScenarioSchema }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await (await db()).from("scenarios").insert(data).select().single();
    fail(error);
    return row!;
  });

// ---------- Runs ----------
async function pythonUrl() {
  return process.env["PYTHON_SIM_URL"]?.replace(/\/$/, "") || null;
}

export const engineStatus = createServerFn({ method: "GET" }).handler(async () => {
  const url = await pythonUrl();
  if (!url) return { typescript: true, python: { configured: false, ok: false, detail: "PYTHON_SIM_URL is not set" }, pythonV3: { ok: false, detail: "not configured" } };
  const serviceHeaders = process.env["NEURO_SERVICE_TOKEN"] ? { Authorization: "Bearer " + process.env["NEURO_SERVICE_TOKEN"] } : {};
  try {
    const r = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000), headers: serviceHeaders });
    // Distinguish the v3 compare endpoint from the legacy Python /api/run.
    let v3 = false;
    if (r.ok) {
      try {
        const v = await fetch(`${url}/api/occult-killer`, { signal: AbortSignal.timeout(5000), headers: serviceHeaders });
        const body = await v.json() as { books?: unknown[] };
        v3 = v.ok && Array.isArray(body.books);
      } catch { /* Legacy Python server or offline: no v3 claim. */ }
    }
    return { typescript: true,
      python: { configured: true, ok: r.ok, detail: r.ok ? "reachable" : `HTTP ${r.status}` },
      pythonV3: { ok: v3, detail: v3 ? "occult-killer compare ready" : "v3 compare endpoint not found" },
    };
  } catch (e) {
    return { typescript: true, python: { configured: true, ok: false, detail: (e as Error).message }, pythonV3: { ok: false, detail: "offline" } };
  }
});

export const createRun = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ input: RunInputSchema, scenario_id: z.string().uuid().nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const result = runSimulation(data.input);
    const { data: row, error } = await s
      .from("simulation_runs")
      .insert({
        scenario_id: data.scenario_id ?? null,
        status: "COMPLETED",
        engine: "typescript",
        model_version: result.model_version,
        seed: result.seed,
        input_hash: result.input_hash,
        input: data.input,
        summary: result.summary,
        frames: result.frames,
        agents: result.agents,
      })
      .select("id, created_at")
      .single();
    fail(error);
    return { id: row!.id, ...result };
  });

/** v2 Python engine: aggregate synthetic group sim via POST /api/run. Only maps fields v2 supports. */
export const createPythonRun = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RunInputSchema.parse(d))
  .handler(async ({ data }) => {
    const url = await pythonUrl();
    if (!url) throw new Error("Python engine not connected: set PYTHON_SIM_URL to your hosted group_sim server.");
    const t = data.swarm.traits;
    const payload = {
      mode: "institutional_corrosion",
      narrative: data.scenario.narrative,
      agents: Math.max(20, data.scenario.agents),
      rounds: Math.min(30, data.scenario.months),
      trials: Math.max(2, Math.min(30, data.scenario.trials)),
      seed: data.scenario.seed,
      pressure: data.scenario.external_shock,
      safeguards: data.scenario.safeguards,
      transparency: data.individual.transparency,
      groups: data.swarm.roles.map((r) => ({
        id: r.id, label: r.label, proportion: r.share,
        authority_deference: t["hierarchy"] ?? 0.5, status_incentive: data.swarm.motives["prestige_status"] ?? 0.5,
        fear_of_loss: t["defensiveness"] ?? 0.5, peer_conformity: t["cohesion"] ?? 0.5, integrity: t["integrity"] ?? 0.5,
        critical_reflection: t["openness"] ?? 0.5, dissent_safety: t["dissent_safety"] ?? 0.5,
      })),
    };
    const r = await fetch(`${url}/api/run`, { method: "POST", headers: { "content-type": "application/json", ...(process.env["NEURO_SERVICE_TOKEN"] ? { Authorization: "Bearer " + process.env["NEURO_SERVICE_TOKEN"] } : {}) }, body: JSON.stringify(payload) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Python engine error ${r.status}: ${JSON.stringify(body).slice(0, 300)}`);
    const s = await db();
    const { data: row, error } = await s.from("simulation_runs").insert({
      status: "COMPLETED", engine: "python-v2", model_version: "group_sim-v2", seed: data.scenario.seed,
      input_hash: hashInput(payload), input: payload, summary: body, frames: null, agents: null,
    }).select("id").single();
    fail(error);
    return { id: row!.id, mapped_payload: payload, result: body };
  });

/** Adapter to the actual Occult Killer v3 Python module supplied separately.
 * Explicitly shows lossy mappings: v3 only knows 6 group traits and 1–12 rounds,
 * not the v4.2 fictional adversary, motive distribution, or economic simulations.
 */
export const createPythonV3Compare = createServerFn({ method: "POST" })
 .inputValidator((d: unknown) => RunInputSchema.parse(d))
 .handler(async ({ data }) => {
   // The new Python v4.3 engine implements both fictional worst-case and neutral-reference presets.
   const url=await pythonUrl();
   if (!url) throw new Error("Python v3 unavailable: set PYTHON_SIM_URL to the hosted Occult Killer v3 server.");
   const event: Record<string,string>={
     business_proposal:"ethical_offer",market_entry:"routine",
     competitor_response:"professional_disagreement",
     confirmed_report:"documented_issue",unsupported_rumor:"unverified_rumor",
   };
   const map: Record<string,string>={
     transparent_engagement:"respectful_dialogue",
     evidence_verification:"verify_first",
     partnership_outreach:"ethical_partnership",
     market_entry:"quiet_work",
     patient_observation:"quiet_work",
     independent_counsel:"independent_mediation",
     boundary_setting:"firm_boundaries",
     public_documentation:"lawful_reporting",
     quiet_disengagement:"firm_boundaries",
     formal_complaint:"lawful_reporting",
     community_building:"community_service",
   };
   const strategies=[...new Set(data.individual.strategies.map(x=>map[x]).filter(Boolean))];
   const pick=(k:string)=>data.swarm.traits[k] ?? 0.5;
   const payload={
     track:"fraternity", // synthetic category, never attributes real-world conduct.
     group_overrides:{
       cohesion:pick("cohesion"),hierarchy:pick("hierarchy"),pluralism:pick("pluralism"),
       accountability:pick("accountability"),defensiveness:pick("defensiveness"),openness:pick("openness"),
     },
     event:event[data.scenario.event_type]??"routine",
     strategies,
     trials:Math.max(10,Math.min(500,data.scenario.trials*10)),
     seed:data.scenario.seed,
     rounds:Math.max(1,Math.min(12,Math.ceil(data.scenario.months/5))),
     pressure:data.scenario.external_shock,
     safeguards:data.scenario.safeguards,
     baseline_mode:data.swarm.baseline_mode,
     narrative:data.scenario.narrative,
     evidence_tier:data.scenario.evidence_tier,
     individual_objective:(data.individual.lawful_objective||"Independent lawful founder").slice(0,500),
     individual:Object.fromEntries(["patience","humility","verification_discipline","compassion","boundary_discipline"]
       .map(k=>[k,data.individual.traits[k]??0.5])),
   };
   const r=await fetch(url+"/api/occult-killer/compare",{
     method:"POST",headers:{"content-type":"application/json", ...(process.env["NEURO_SERVICE_TOKEN"] ? {Authorization:"Bearer "+process.env["NEURO_SERVICE_TOKEN"]} : {})},
     signal:AbortSignal.timeout(20000),body:JSON.stringify(payload),
   });
   const result=await r.json() as Record<string,unknown>;
   if(!r.ok||!Array.isArray(result.strategies))
     throw new Error("Python v3 compare error: "+JSON.stringify(result).slice(0,250));
   const s=await db();
   const {data:row,error}=await s.from("simulation_runs").insert({
      status:"COMPLETED",engine:"python-v4.3",model_version:"gc-group-sim-py-4.3.0",
      seed:data.scenario.seed,input_hash:hashInput(payload),
      input:{payload,original_input:data},summary:{result,warning:"Python v4.3 supports the synthetic worst-case preset; six group traits map through this adapter. Rounds are not months."},
      frames:null,agents:null,
   }).select("id").single();
   fail(error);
   return {id:row!.id,engine:"python-v4.3" as const,result,
     mapping_note:"Python v4.3 is a fictional, unvalidated worst-case/neutral comparison. Rounds are abstract steps, not months. Six group traits map through the adapter, not the full motive profile. Synthetic response shares are not probabilities for real people."};
 });

export const listRuns = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("simulation_runs").select("id, engine, model_version, seed, input_hash, status, created_at, summary").order("created_at", { ascending: false }).limit(30);
  fail(error);
  return data!;
});

export const getRun = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await (await db()).from("simulation_runs").select("*").eq("id", data.id).single();
    fail(error);
    return row!;
  });

// ---------- Sources ----------
export const listSources = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const [d, e] = await Promise.all([
    s.from("source_documents").select("*").order("title"),
    s.from("source_excerpts").select("id, source_id, page, excerpt, claim_status, independence_cluster, created_at"),
  ]);
  fail(d.error); fail(e.error);
  return { documents: d.data!, excerpts: e.data! };
});

export const ingestExcerpt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      source_id: z.string().min(1),
      page: z.string().max(40).optional(),
      excerpt: z.string().min(10).max(4000),
      claim_status: z.enum(["verified", "corroborated", "unverified", "contested", "rumor"]),
      independence_cluster: z.string().max(80).optional(),
      provenance: z.object({ edition: z.string().max(120).optional(), origin: z.enum(["direct", "secondary"]), source_date: z.string().max(40).optional() }),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await (await db())
      .from("source_excerpts")
      .insert({
        source_id: data.source_id,
        excerpt: data.excerpt,
        claim_status: data.claim_status,
        provenance: data.provenance,
        ...(data.page ? { page: data.page } : {}),
        ...(data.independence_cluster ? { independence_cluster: data.independence_cluster } : {}),
      })
      .select()
      .single();
    fail(error);
    return row!;
  });

// ---------- Neural ----------
export const createNeuralRun = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ seed: z.number().int().min(0).max(2 ** 31 - 1), sensors: z.number().int().min(2).max(16), seconds: z.number().min(1).max(4), hz: z.number().int().min(64).max(256), arousal: z.number().min(0).max(1), task: z.enum(["rest", "attention", "sleep"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const result = runNeural(data);
    const { data: row, error } = await (await db()).from("neural_runs").insert({ mode: "synthetic", seed: data.seed, input: data, summary: { version: NEURAL_VERSION, label: result.label, bands: result.bands } }).select("id").single();
    fail(error);
    return { id: row!.id, ...result };
  });

export const listNeuralRuns = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("neural_runs").select("*").order("created_at", { ascending: false }).limit(20);
  fail(error);
  return data!;
});

export const meta = { MODEL_VERSION };
