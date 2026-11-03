import { useId } from "react";
import type { AgentState } from "@/lib/engine/swarm";
import { decagonPoints, positionAgentInsideDecagon } from "./decagon";

const SHAPE: Record<string, string> = {
  accountability: "square", internal_review: "square", due_diligence: "square",
  collaboration: "circle", dialogue: "circle", routine_competition: "diamond",
  scrutiny: "triangle", undue_pressure: "triangle", improper_gatekeeping: "diamond",
  disengagement: "ring", no_response: "dot",
};

/** Monochrome network: swarm agents arranged by role around ONE protagonist marker. Links = simulated interactions only. */
export function SwarmNetwork({ agents, selected, onSelect }: { agents: AgentState[]; selected: number | null; onSelect: (id: number) => void }) {
  const W = 520, H = 410, cx = W / 2, cy = H / 2, R = 170;
  const clipId = useId().replace(/:/g, "");
  const outline = decagonPoints(cx, cy, R);
  const innerRing = decagonPoints(cx, cy, R - 12);
  const roles = [...new Set(agents.map((a) => a.role))];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Ten-sided decagon containing a simulated swarm and one protagonist">
      <title>Occult Killer — swarm contained inside a decagon</title>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <polygon points={outline} />
        </clipPath>
      </defs>
      <polygon points={outline} fill="var(--card)" fillOpacity={0.45} stroke="var(--border)" strokeWidth={1.5} />
      <polygon points={innerRing} fill="none" stroke="var(--muted-foreground)" strokeWidth={0.6} strokeDasharray="2 9" opacity={0.45} />
      <g clipPath={`url(#${clipId})`}>
      {agents.map((a, i) => {
        const ri = roles.indexOf(a.role);
        const { x, y } = positionAgentInsideDecagon(i, agents.length, ri, cx, cy, R);
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
      </g>
      <polygon points={outline} fill="none" stroke="var(--foreground)" strokeWidth={1.6} opacity={0.9} />
    </svg>
  );
}

export const LEGEND = [
  ["■", "review / accountability / due diligence"],
  ["●", "collaboration / dialogue"],
  ["◆", "routine competition"],
  ["▲", "scrutiny / hypothetical undue pressure"],
  ["◆", "hypothetical improper gatekeeping"],
  ["○", "disengagement"],
  ["·", "no response"],
];
