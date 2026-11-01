import type { AgentState } from "@/lib/engine/swarm";

const SHAPE: Record<string, string> = {
  accountability: "square", internal_review: "square", due_diligence: "square",
  collaboration: "circle", dialogue: "circle", routine_competition: "diamond",
  scrutiny: "triangle", disengagement: "ring", no_response: "dot",
};

/** Monochrome network: swarm agents arranged by role around ONE protagonist marker. Links = simulated interactions only. */
export function SwarmNetwork({ agents, selected, onSelect }: { agents: AgentState[]; selected: number | null; onSelect: (id: number) => void }) {
  const W = 520, H = 360, cx = W / 2, cy = H / 2;
  const roles = [...new Set(agents.map((a) => a.role))];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Simulated interaction network: swarm agents around one protagonist">
      {agents.map((a, i) => {
        const ri = roles.indexOf(a.role);
        const ang = (i / agents.length) * Math.PI * 2;
        const rad = 80 + ri * 38;
        const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.8;
        const linked = a.state !== "no_response" && a.state !== "disengagement";
        const sel = selected === a.id;
        const sh = SHAPE[a.state];
        const fill = sel ? "var(--foreground)" : "var(--muted-foreground)";
        return (
          <g key={a.id} onClick={() => onSelect(a.id)} className="cursor-pointer" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelect(a.id)} aria-label={`Agent ${a.id}, ${a.role}, ${a.state.replace(/_/g, " ")}`}>
            <title>{`#${a.id} ${a.role} · ${a.state}`}</title>
            {linked && <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeDasharray={a.state === "scrutiny" ? "2 3" : a.state === "routine_competition" ? "6 3" : undefined} strokeWidth={0.6} />}
            {sh === "square" && <rect x={x - 4} y={y - 4} width={8} height={8} fill={fill} />}
            {sh === "circle" && <circle cx={x} cy={y} r={4.5} fill={fill} />}
            {sh === "diamond" && <rect x={x - 4} y={y - 4} width={8} height={8} fill={fill} transform={`rotate(45 ${x} ${y})`} />}
            {sh === "triangle" && <polygon points={`${x},${y - 5} ${x - 5},${y + 4} ${x + 5},${y + 4}`} fill={fill} />}
            {sh === "ring" && <circle cx={x} cy={y} r={4} fill="none" stroke={fill} />}
            {sh === "dot" && <circle cx={x} cy={y} r={2} fill={fill} />}
            {sel && <circle cx={x} cy={y} r={9} fill="none" stroke="var(--foreground)" />}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={13} fill="var(--foreground)" />
      <circle cx={cx} cy={cy} r={18} fill="none" stroke="var(--foreground)" strokeDasharray="3 3" />
      <text x={cx} y={cy + 34} textAnchor="middle" fontSize={10} fill="var(--foreground)" fontFamily="IBM Plex Mono">PROTAGONIST (1)</text>
    </svg>
  );
}

export const LEGEND = [
  ["■", "review / accountability / due diligence"],
  ["●", "collaboration / dialogue"],
  ["◆", "routine competition"],
  ["▲", "scrutiny"],
  ["○", "disengagement"],
  ["·", "no response"],
];
