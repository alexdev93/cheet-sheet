"use client";

import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GraphData } from "@/types/note";

type ScopeOption = "all" | "domain" | "neighbours";
type LaidOutNode = { id: string; slug: string; title: string; domain: string | null; summary: string | null; x: number; y: number };

const WIDTH = 900;
const HEIGHT = 620;

function layout(data: GraphData): { nodes: LaidOutNode[]; edges: GraphData["edges"] } {
  const nodes = data.nodes.map((n) => ({ ...n, x: 0, y: 0 })) as (LaidOutNode & { vx?: number; vy?: number })[];
  // d3-force mutates link objects in place (replacing string source/target
  // with node references) — clone so it never touches `data.edges` itself.
  // Without this, React StrictMode's double-invoke of this useMemo would run
  // forceLink twice against edges already half-mutated by the first pass.
  const edges = data.edges.map((e) => ({ ...e }));
  const sim = forceSimulation(nodes as never[])
    .force(
      "link",
      forceLink(edges as never[])
        .id((d) => (d as { id: string }).id)
        .distance(100)
    )
    .force("charge", forceManyBody().strength(-160))
    .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
    .force("collide", forceCollide(30))
    .stop();

  for (let i = 0; i < 260; i++) sim.tick();

  return {
    nodes: nodes.map((n) => ({
      ...n,
      x: Math.max(30, Math.min(WIDTH - 30, n.x)),
      y: Math.max(30, Math.min(HEIGHT - 30, n.y)),
    })),
    edges: data.edges,
  };
}

export function GraphExplorer({ initialData, initialFocusSlug }: { initialData: GraphData; initialFocusSlug?: string }) {
  const router = useRouter();
  const [scope, setScope] = useState<ScopeOption>(initialFocusSlug ? "neighbours" : "all");
  const [focusSlug, setFocusSlug] = useState<string | undefined>(initialFocusSlug ?? initialData.nodes[0]?.slug);
  const [data, setData] = useState<GraphData>(initialData);

  useEffect(() => {
    const params = new URLSearchParams({ scope });
    if (focusSlug) params.set("focus", focusSlug);
    fetch(`/api/v1/graph?${params}`)
      .then((r) => r.json())
      .then((d: GraphData) => setData(d))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const laidOut = useMemo(() => layout(data), [data]);
  const selected = laidOut.nodes.find((n) => n.slug === focusSlug) ?? laidOut.nodes[0];
  const byId = useMemo(() => new Map(laidOut.nodes.map((n) => [n.id, n])), [laidOut.nodes]);
  const neighbourIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>();
    for (const e of laidOut.edges) {
      if (e.source === selected.id) set.add(typeof e.target === "string" ? e.target : (e.target as unknown as { id: string }).id);
      if (e.target === selected.id) set.add(typeof e.source === "string" ? e.source : (e.source as unknown as { id: string }).id);
    }
    return set;
  }, [selected, laidOut.edges]);

  const relations = laidOut.edges
    .filter((e) => selected && (e.source === selected.id || e.target === selected.id))
    .map((e) => {
      const otherId = e.source === selected!.id ? e.target : e.source;
      const other = byId.get(typeof otherId === "string" ? otherId : (otherId as unknown as { id: string }).id);
      return other ? { relation: e.relation, node: other } : null;
    })
    .filter((r): r is { relation: string; node: LaidOutNode } => !!r);

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 min-w-0 relative bg-[var(--color-panel)] overflow-hidden">
        <div className="absolute top-3.5 left-4 z-10 flex gap-1.5">
          {(["neighbours", "domain", "all"] as ScopeOption[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className="font-mono text-[10px] font-bold tracking-[0.08em] px-2 py-[7px] border cursor-pointer"
              style={{
                background: scope === s ? "var(--color-accent)" : "var(--color-panel-3)",
                color: scope === s ? "var(--color-panel)" : "var(--color-text-2)",
                borderColor: scope === s ? "var(--color-accent)" : "var(--color-border-strong)",
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="absolute bottom-3.5 left-4 z-10 font-mono text-[11px] leading-[1.6] text-[var(--color-muted-2)]">
          Graph is an exploration tool, not navigation.
          <br />
          Click a node to select it, open it from the panel.
        </div>

        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full block">
          {laidOut.edges.map((e, i) => {
            const s = byId.get(typeof e.source === "string" ? e.source : (e.source as unknown as { id: string }).id);
            const t = byId.get(typeof e.target === "string" ? e.target : (e.target as unknown as { id: string }).id);
            if (!s || !t) return null;
            const hot = selected && (s.id === selected.id || t.id === selected.id);
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={hot ? "var(--color-accent)" : "var(--color-border)"}
                strokeWidth={hot ? 1.6 : 1}
              />
            );
          })}
          {laidOut.nodes.map((n) => {
            const isSelected = selected?.id === n.id;
            const isNear = neighbourIds.has(n.id);
            return (
              <g key={n.id} onClick={() => setFocusSlug(n.slug)} className="cursor-pointer">
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isSelected ? 13 : isNear ? 9 : 6}
                  fill={isSelected ? "var(--color-accent)" : isNear ? "var(--color-panel-3)" : "var(--color-panel-2)"}
                  stroke={isSelected ? "var(--color-accent)" : isNear ? "var(--color-muted)" : "var(--color-border-strong)"}
                  strokeWidth={2}
                />
                <text
                  x={n.x}
                  y={n.y + 26}
                  textAnchor="middle"
                  fill={isSelected ? "var(--color-text)" : isNear ? "var(--color-text-3)" : "var(--color-muted-2)"}
                  style={{ font: "500 12px var(--font-mono)" }}
                >
                  {n.title.length > 26 ? n.title.slice(0, 24) + "…" : n.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="w-[296px] flex-none border-l border-[var(--color-border)] bg-[var(--color-panel-3)] p-4 hidden lg:block">
        {selected ? (
          <>
            <div className="font-sans font-bold text-[10px] tracking-[0.12em] text-[var(--color-text-3)] mb-2.5">SELECTED</div>
            <h4 className="text-[18px] mb-1.5">{selected.title}</h4>
            {selected.summary ? (
              <p className="text-[13px] text-[var(--color-text-3)] leading-[1.55] mb-3.5">{selected.summary}</p>
            ) : null}
            <button
              onClick={() => router.push(`/n/${selected.slug}`)}
              className="h-8 px-3 bg-accent text-[var(--color-panel)] font-sans font-extrabold text-[11px] cursor-pointer"
            >
              OPEN NOTE
            </button>
            <hr className="h-0.5 border-0 bg-[var(--color-border)] my-4.5" />
            <div className="font-sans font-bold text-[10px] tracking-[0.12em] text-[var(--color-text-3)] mb-2.5">RELATIONS</div>
            {relations.map((r, i) => (
              <button
                key={i}
                onClick={() => setFocusSlug(r.node.slug)}
                className="flex gap-2 py-1.5 w-full text-left cursor-pointer text-[13px] text-[var(--color-text-2)] hover:text-accent bg-transparent border-0"
              >
                <span className="font-mono text-[10px] text-[var(--color-muted-2)] w-[52px] flex-none">{r.relation}</span>
                <span className="flex-1 truncate">{r.node.title}</span>
              </button>
            ))}
          </>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Nothing to show yet — capture a note and link it to see it here.</p>
        )}
      </aside>
    </div>
  );
}
