import { Link, useRouterState } from "@tanstack/react-router";
import { Atom, Brain, MessagesSquare, Contrast } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { to: "/occult-killer", label: "Occult Killer", icon: Atom },
  { to: "/neural-atlas", label: "Neural Atlas", icon: Brain },
  { to: "/research-ai", label: "AI Research", icon: MessagesSquare },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(localStorage.getItem("gc-reduce-motion") === "1");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduce);
  }, [reduce]);
  const current = NAV.find((n) => path.startsWith(n.to));
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-secondary md:flex">
        <div className="border-b border-border px-4 py-4">
          <div className="text-sm font-semibold tracking-tight">GREY COMPANY</div>
          <div className="font-mono text-[11px] text-muted-foreground">RESEARCH LAB</div>
        </div>
        <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-2 rounded-sm border border-transparent px-3 py-2 text-sm text-muted-foreground hover:border-border hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring" activeProps={{ className: "!border-foreground !text-foreground bg-card" }}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-border p-4 font-mono text-[11px] text-muted-foreground">
          <div>STATUS · SYNTHETIC MODE</div>
          <div>NO SIGN-IN · SHARED DATA</div>
          <button onClick={() => { const v = !reduce; setReduce(v); localStorage.setItem("gc-reduce-motion", v ? "1" : "0"); }} className="flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline" aria-pressed={reduce}>
            <Contrast className="h-3 w-3" aria-hidden /> Reduced motion: {reduce ? "ON" : "OFF"}
          </button>
        </div>
      </aside>
      <div className="md:pl-56">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
          <h1 className="text-sm font-semibold">{current?.label ?? "Research Lab"}</h1>
          <span className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">SYNTHETIC / UNVALIDATED</span>
        </header>
        <main className="p-3 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-secondary md:hidden" aria-label="Primary mobile">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-foreground" }}>
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Panel({ title, children, actions, className = "" }: { title: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider">{title}</h2>
        {actions}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-block border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">{children}</span>
);
