import { Slider } from "@/components/ui/slider";
import { normalize } from "@/lib/engine/swarm";

const pretty = (k: string) => k.replace(/_/g, " ");

export function WeightEditor({ value, onChange, normalized = true }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void; normalized?: boolean }) {
  const n = normalized ? normalize(value) : value;
  return (
    <div className="space-y-2">
      {Object.keys(value).map((k) => {
        const raw = value[k] ?? 0;
        const share = n[k] ?? 0;
        return (
          <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <label htmlFor={`w-${k}`} className="text-xs capitalize">{pretty(k)}</label>
            <span className="font-mono text-[11px] text-muted-foreground">{raw.toFixed(2)}{normalized && ` → ${(share * 100).toFixed(0)}%`}</span>
            <Slider id={`w-${k}`} aria-label={pretty(k)} className="col-span-2" min={0} max={1} step={0.01} value={[raw]} onValueChange={(vals) => onChange({ ...value, [k]: vals[0] ?? raw })} />
          </div>
        );
      })}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring";

export function download(name: string, text: string, mime = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
