import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Panel, Tag } from "@/components/lab/Shell";
import { Field, inputCls, download } from "@/components/lab/controls";
import { REGIONS } from "@/lib/engine/neural";
import { createNeuralRun } from "@/lib/lab.functions";

export const Route = createFileRoute("/neural-atlas")({
  head: () => ({
    meta: [
      { title: "Neural Atlas — Grey Company Research Lab" },
      { name: "description", content: "Synthetic NeuroAtlas EEG proxy experiments with band power, connectivity and exports." },
      { property: "og:title", content: "Neural Atlas — Grey Company Research Lab" },
      { property: "og:description", content: "Illustrative synthetic neurophysiology workspace. Not live brain data." },
    ],
  }),
  component: NeuralAtlas,
});

type Res = Awaited<ReturnType<typeof createNeuralRun>>;

function NeuralAtlas() {
  const [p, setP] = useState({ seed: 1, sensors: 8, seconds: 2, hz: 128, arousal: 0.5, task: "rest" as "rest" | "attention" | "sleep" });
  const [runs, setRuns] = useState<Res[]>([]);
  const [busy, setBusy] = useState(false);
  const f = useServerFn(createNeuralRun);
  const cur = runs[0];
  const go = async () => { setBusy(true); try { const r = await f({ data: p }); setRuns((x) => [r, ...x].slice(0, 4)); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel title="Experiment setup" className="lg:col-span-3">
        <div className="space-y-3">
          <Field label="Mode"><select className={inputCls} defaultValue="synthetic"><option value="synthetic">Synthetic experiment</option><option disabled>Imported measurements (parser not built yet)</option></select></Field>
          <Field label="Task"><select className={inputCls} value={p.task} onChange={(e) => setP({ ...p, task: e.target.value as typeof p.task })}><option>rest</option><option>attention</option><option>sleep</option></select></Field>
          <Field label={`Arousal (model variable) ${p.arousal.toFixed(2)}`}><Slider min={0} max={1} step={0.01} value={[p.arousal]} onValueChange={(vals) => setP({ ...p, arousal: vals[0] ?? p.arousal })} /></Field>
          <Field label="Sensors"><input type="number" min={2} max={16} className={`${inputCls} font-mono`} value={p.sensors} onChange={(e) => setP({ ...p, sensors: Math.max(2, Math.min(16, +e.target.value || 2)) })} /></Field>
          <Field label="Seed"><input type="number" className={`${inputCls} font-mono`} value={p.seed} onChange={(e) => setP({ ...p, seed: Math.max(0, Math.round(+e.target.value)) })} /></Field>
          <div className="flex gap-2"><Button onClick={go} disabled={busy}>{busy ? "Running…" : "START"}</Button><Button variant="outline" onClick={() => setRuns([])}>RESET</Button></div>
          <p className="text-[11px] text-muted-foreground">TypeScript port of NeuroAtlas synthesize_eeg. The Python/native modules are not connected here.</p>
        </div>
      </Panel>
      <Panel title="Region map (placeholder)" className="lg:col-span-6" actions={<Tag>SYNTHETIC / ILLUSTRATIVE</Tag>}>
        <svg viewBox="0 0 400 260" className="w-full" role="img" aria-label="Schematic region map">
          <ellipse cx={200} cy={130} rx={170} ry={110} fill="none" stroke="var(--border)" />
          {REGIONS.map((r, i) => { const a = (i / REGIONS.length) * Math.PI * 2; const x = 200 + Math.cos(a) * 110, y = 130 + Math.sin(a) * 70; return <g key={r}><circle cx={x} cy={y} r={6} fill="var(--foreground)" /><text x={x} y={y - 10} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{r}</text></g>; })}
        </svg>
        <p className="text-[11px] text-muted-foreground">No validated 3D brain asset supplied; schematic only. Does not measure real neurochemistry or thoughts.</p>
      </Panel>
      <Panel title="Measurements" className="lg:col-span-3">
        {cur ? <div className="space-y-1 font-mono text-xs">{Object.entries(cur.bands).map(([b, v]) => <div key={b} className="flex justify-between"><span>{b}</span><span>{(v * 100).toFixed(1)}%</span></div>)}<div className="pt-2 text-[10px] text-muted-foreground">run {cur.id.slice(0, 8)} · {cur.version}</div><Button size="sm" variant="outline" onClick={() => download(`neural-${cur.id.slice(0, 8)}.json`, JSON.stringify(cur))}>Export</Button></div> : <p className="text-xs text-muted-foreground">No run yet.</p>}
      </Panel>
      {cur && <>
        <Panel title="Signal plot (sensor 1)" className="lg:col-span-7"><div className="h-48"><ResponsiveContainer><LineChart data={(cur.preview[0] ?? []).map((v, i) => ({ i, v, w: cur.preview[1]?.[i] }))}><XAxis dataKey="i" hide /><YAxis hide /><Line dataKey="v" dot={false} stroke="var(--foreground)" isAnimationActive={false} /><Line dataKey="w" dot={false} stroke="var(--muted-foreground)" strokeDasharray="3 3" isAnimationActive={false} /></LineChart></ResponsiveContainer></div></Panel>
        <Panel title="Sensor connectivity (correlation)" className="lg:col-span-5"><div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${cur.connectivity.length}, 1fr)` }}>{cur.connectivity.flat().map((v, i) => <div key={i} title={String(v)} className="aspect-square bg-foreground" style={{ opacity: Math.abs(v) }} />)}</div></Panel>
        <Panel title="Session comparison" className="lg:col-span-12"><table className="w-full font-mono text-[11px]"><thead><tr className="text-left text-muted-foreground"><th>run</th>{Object.keys(cur.bands).map((b) => <th key={b}>{b}</th>)}</tr></thead><tbody>{runs.map((r) => <tr key={r.id} className="border-t border-border"><td>{r.id.slice(0, 8)}</td>{Object.values(r.bands).map((v, i) => <td key={i}>{(v * 100).toFixed(1)}%</td>)}</tr>)}</tbody></table></Panel>
      </>}
    </div>
  );
}
