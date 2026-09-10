import "server-only";
import { db } from "@/lib/db";

export type TreeNote = { id: string; slug: string; title: string };
export type TreeCollection = {
  id: string;
  slug: string;
  name: string;
  notes: TreeNote[];
};
export type TreeDomain = {
  id: string;
  slug: string;
  name: string;
  collections: TreeCollection[];
  noteCount: number;
};

/** Sidebar tree: Domain -> Collection -> Note, published notes only. */
export async function getDomainTree(): Promise<TreeDomain[]> {
  const domains = await db.domain.findMany({
    orderBy: { order: "asc" },
    include: {
      collections: {
        orderBy: { order: "asc" },
        include: {
          notes: {
            where: { status: "PUBLISHED" },
            orderBy: { title: "asc" },
            select: { id: true, slug: true, title: true },
          },
        },
      },
    },
  });

  return domains.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    collections: d.collections.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      notes: c.notes,
    })),
    noteCount: d.collections.reduce((sum, c) => sum + c.notes.length, 0),
  }));
}

export async function getTotalNoteCount(): Promise<number> {
  return db.note.count({ where: { status: "PUBLISHED" } });
}

export async function listDomainOptions() {
  return db.domain.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      collections: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } },
    },
  });
}
