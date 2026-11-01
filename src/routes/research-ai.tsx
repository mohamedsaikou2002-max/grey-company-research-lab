import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel, Tag } from "@/components/lab/Shell";
import { inputCls, download } from "@/components/lab/controls";
import { createSession, getMessages, listSessions, sendMessage } from "@/server/chat.functions";
import { listRuns, listNeuralRuns } from "@/server/lab.functions";

export const Route = createFileRoute("/research-ai")({
  head: () => ({
    meta: [
      { title: "AI Research — Grey Company Research Lab" },
      { name: "description", content: "Gemini research assistant grounded in stored sources and saved runs, with citations." },
      { property: "og:title", content: "AI Research — Grey Company Research Lab" },
      { property: "og:description", content: "Grounded research chat with citations across Occult Killer and Neural Atlas." },
    ],
  }),
  component: ResearchAI,
});

type Scope = "occult_killer" | "neural_atlas" | "cross_project";
type Msg = { id: string; role: string; content: string; citations: unknown; model: string | null };

function ResearchAI() {
  const [scope, setScope] = useState<Scope>("occult_killer");
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listSessions>>>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [runs, setRuns] = useState<{ id: string; label: string }[]>([]);
  const [runId, setRunId] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const fl = useServerFn(listSessions), fc = useServerFn(createSession), fm = useServerFn(getMessages), fs = useServerFn(sendMessage), fr = useServerFn(listRuns), fn = useServerFn(listNeuralRuns);

  useEffect(() => { fl().then(setSessions).catch((e) => toast.error(e.message)); }, [fl]);
  useEffect(() => {
    setRunId("");
    (scope === "neural_atlas" ? fn().then((r) => r.map((x) => ({ id: x.id, label: `neural ${x.id.slice(0, 8)} seed ${x.seed}` }))) : fr().then((r) => r.map((x) => ({ id: x.id, label: `${x.engine} ${x.id.slice(0, 8)} seed ${x.seed}` })))).then(setRuns).catch(() => setRuns([]));
  }, [scope, fr, fn]);
  useEffect(() => { if (active) fm({ data: { session_id: active } }).then((m) => setMsgs(m as Msg[])); else setMsgs([]); ta.current?.focus(); }, [active, fm]);

  const send = async () => {
    if (!text.trim()) return;
    let sid = active;
    setBusy(true);
    try {
      if (!sid) { const s = await fc({ data: { scope } }); sid = s.id; setActive(s.id); }
      const content = text; setText("");
      setMsgs((m) => [...m, { id: "tmp", role: "user", content, citations: [], model: null }]);
      const r = await fs({ data: { session_id: sid!, content, run_id: runId || null } });
      setMsgs((m) => [...m.filter((x) => x.id !== "tmp"), { id: "u" + r.id, role: "user", content, citations: [], model: null }, r as Msg]);
      fl().then(setSessions);
    } catch (e) { toast.error((e as Error).message); setMsgs((m) => m.filter((x) => x.id !== "tmp")); } finally { setBusy(false); ta.current?.focus(); }
  };

  const shown = sessions.filter((s) => s.scope === scope && s.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel title="Conversations" className="lg:col-span-3">
        <div className="mb-2 flex flex-wrap gap-1">{(["occult_killer", "neural_atlas", "cross_project"] as const).map((s) => <Button key={s} size="sm" variant={scope === s ? "default" : "outline"} onClick={() => { setScope(s); setActive(null); }}>{s.replace(/_/g, " ")}</Button>)}</div>
        <input className={inputCls} placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search conversations" />
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setActive(null)}>+ New conversation</Button>
        <ul className="mt-2 space-y-1">{shown.map((s) => <li key={s.id}><button className={`w-full truncate border px-2 py-1 text-left text-xs ${active === s.id ? "border-foreground" : "border-transparent hover:border-border"}`} onClick={() => setActive(s.id)}>{s.title}</button></li>)}</ul>
      </Panel>
      <Panel title={`Chat · ${scope.replace(/_/g, " ")}`} className="lg:col-span-9" actions={<div className="flex gap-2"><Tag>gemini-2.5-flash</Tag>{msgs.length > 0 && <Button size="sm" variant="outline" onClick={() => download("chat.md", msgs.map((m) => `**${m.role}**: ${m.content}`).join("\n\n"), "text/markdown")}>Export</Button>}</div>}>
        <div className="min-h-[300px] space-y-3">
          {msgs.length === 0 && <p className="text-xs text-muted-foreground">Ask about stored sources or a saved run. Answers cite only what is stored; if a source is bibliography-only, the assistant says so.</p>}
          {msgs.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[80%] bg-primary p-2 text-sm text-primary-foreground" : "text-sm"}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {Array.isArray(m.citations) && m.citations.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{(m.citations as { id: string; title: string; kind: string }[]).map((c) => <span key={c.id} title={c.title}><Tag>{c.id} · {c.kind}</Tag></span>)}</div>}
              {m.role === "assistant" && <div className="mt-1 flex gap-2 font-mono text-[10px] text-muted-foreground">{m.model}<button className="underline" onClick={() => navigator.clipboard.writeText(m.content)}>copy</button></div>}
            </div>
          ))}
          {busy && <p className="animate-pulse font-mono text-xs text-muted-foreground">retrieving sources · thinking…</p>}
        </div>
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <select aria-label="Attach saved run" className={inputCls} value={runId} onChange={(e) => setRunId(e.target.value)}><option value="">No run attached</option>{runs.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
          <div className="flex gap-2">
            <textarea ref={ta} autoFocus className={inputCls} rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask a research question…" aria-label="Message" />
            <Button onClick={send} disabled={busy || !text.trim()}>Send</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
