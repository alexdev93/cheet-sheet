import "server-only";
import { db } from "@/lib/db";
import type { GraphData } from "@/types/note";

export type GraphScope = "neighbours" | "domain" | "all";

/**
 * Neighbours/domain scope both need the full edge list to compute
 * neighbours-of-neighbours cheaply — with the note counts this app targets
 * (hundreds, not millions) pulling everything and filtering in memory is
 * simpler and fast enough; a huge public instance would want this pushed
 * into SQL with a recursive CTE instead.
 */
export async function getGraphData(scope: GraphScope, focusSlug?: string): Promise<GraphData> {
  const notes = await db.note.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      collection: { select: { domain: { select: { name: true } } } },
    },
  });

  const links = await db.link.findMany({
    select: { sourceId: true, targetId: true, relation: true },
  });

  const byId = new Map(notes.map((n) => [n.id, n]));
  const focus = focusSlug ? notes.find((n) => n.slug === focusSlug) : undefined;

  let allowedIds: Set<string> | null = null;

  if (scope === "domain" && focus) {
    const domainName = byId.get(focus.id)?.collection?.domain?.name ?? null;
    allowedIds = new Set(notes.filter((n) => n.collection?.domain?.name === domainName).map((n) => n.id));
  } else if (scope === "neighbours" && focus) {
    const neighbourIds = new Set<string>([focus.id]);
    for (const l of links) {
      if (l.sourceId === focus.id) neighbourIds.add(l.targetId);
      if (l.targetId === focus.id) neighbourIds.add(l.sourceId);
    }
    allowedIds = neighbourIds;
  }

  const nodeList = allowedIds ? notes.filter((n) => allowedIds!.has(n.id)) : notes;
  const nodeIds = new Set(nodeList.map((n) => n.id));

  return {
    nodes: nodeList.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      summary: n.summary,
      domain: n.collection?.domain?.name ?? null,
    })),
    edges: links
      .filter((l) => nodeIds.has(l.sourceId) && nodeIds.has(l.targetId))
      .map((l) => ({ source: l.sourceId, target: l.targetId, relation: l.relation })),
  };
}
