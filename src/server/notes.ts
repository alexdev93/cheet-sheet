import "server-only";
import { db } from "@/lib/db";
import { refreshNoteSearchVector } from "@/lib/search";
import { slugify, uniqueSuffix } from "@/lib/slug";
import type { NoteInput, SectionInput } from "@/lib/validation";
import type { NoteDetail, NoteSummary } from "@/types/note";
import type { Prisma } from "@/generated/prisma/client";

const summarySelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  type: true,
  status: true,
  favorite: true,
  updatedAt: true,
  useCount: true,
  collection: {
    select: { name: true, slug: true, domain: { select: { name: true, slug: true } } },
  },
  tags: { select: { tag: { select: { name: true } } } },
} satisfies Prisma.NoteSelect;

type RawSummary = Prisma.NoteGetPayload<{ select: typeof summarySelect }>;

function toSummary(n: RawSummary): NoteSummary {
  return {
    id: n.id,
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    type: n.type,
    status: n.status,
    favorite: n.favorite,
    updatedAt: n.updatedAt,
    useCount: n.useCount,
    domain: n.collection?.domain ? { name: n.collection.domain.name, slug: n.collection.domain.slug } : null,
    collection: n.collection ? { name: n.collection.name, slug: n.collection.slug } : null,
    tags: n.tags.map((t) => t.tag.name),
  };
}

export async function listRecentNotes(limit = 8): Promise<NoteSummary[]> {
  const rows = await db.note.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function listMostUsedNotes(limit = 8): Promise<NoteSummary[]> {
  const rows = await db.note.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { useCount: "desc" },
    take: limit,
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function listUnfinishedNotes(limit = 8): Promise<NoteSummary[]> {
  const rows = await db.note.findMany({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function listNotesByDomain(domainSlug: string): Promise<{ domainName: string; notes: NoteSummary[] } | null> {
  const domain = await db.domain.findUnique({ where: { slug: domainSlug } });
  if (!domain) return null;
  const rows = await db.note.findMany({
    where: { status: "PUBLISHED", collection: { domainId: domain.id } },
    orderBy: { title: "asc" },
    select: summarySelect,
  });
  return { domainName: domain.name, notes: rows.map(toSummary) };
}

export async function listNotesByTag(tagSlug: string): Promise<{ tagName: string; notes: NoteSummary[] } | null> {
  const tag = await db.tag.findUnique({ where: { slug: tagSlug } });
  if (!tag) return null;
  const rows = await db.note.findMany({
    where: { status: "PUBLISHED", tags: { some: { tagId: tag.id } } },
    orderBy: { title: "asc" },
    select: summarySelect,
  });
  return { tagName: tag.name, notes: rows.map(toSummary) };
}

export async function listAllTags(): Promise<{ name: string; slug: string; count: number }[]> {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true, _count: { select: { notes: true } } },
  });
  return tags.map((t) => ({ name: t.name, slug: t.slug, count: t._count.notes })).filter((t) => t.count > 0);
}

export async function getNoteBySlug(slug: string, opts: { includeUnpublished?: boolean } = {}): Promise<NoteDetail | null> {
  const note = await db.note.findUnique({
    where: { slug },
    include: {
      collection: { include: { domain: true } },
      tags: { include: { tag: true } },
      sections: { orderBy: { order: "asc" }, include: { tabs: { orderBy: { order: "asc" } } } },
      linksOut: { include: { target: { select: { slug: true, title: true, summary: true, type: true } } } },
      linksIn: { include: { source: { select: { slug: true, title: true, summary: true, type: true } } } },
      versions: { orderBy: { createdAt: "desc" }, take: 6, select: { id: true, summary: true, createdAt: true } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!note) return null;
  if (note.status !== "PUBLISHED" && !opts.includeUnpublished) return null;

  return {
    id: note.id,
    slug: note.slug,
    title: note.title,
    summary: note.summary,
    type: note.type,
    status: note.status,
    favorite: note.favorite,
    updatedAt: note.updatedAt,
    useCount: note.useCount,
    domain: note.collection?.domain ? { name: note.collection.domain.name, slug: note.collection.domain.slug } : null,
    collection: note.collection ? { name: note.collection.name, slug: note.collection.slug } : null,
    tags: note.tags.map((t) => t.tag.name),
    sections: note.sections.map((s) => ({
      id: s.id,
      order: s.order,
      heading: s.heading,
      kind: s.kind,
      body: s.body,
      items: s.items,
      warning: s.warning,
      codeTitle: s.codeTitle,
      codeLang: s.codeLang,
      code: s.code,
      highlightLines: s.highlightLines,
      tabs: s.tabs.map((t) => ({ label: t.label, lang: t.lang, code: t.code })),
    })),
    linksOut: note.linksOut.map((l) => ({ relation: l.relation, note: l.target })),
    linksIn: note.linksIn.map((l) => ({ relation: l.relation, note: l.source })),
    history: note.versions,
    attachments: note.attachments,
  };
}

async function resolveCollectionId(
  tx: Prisma.TransactionClient,
  domainName: string | null | undefined,
  collectionName: string | null | undefined
): Promise<string | null> {
  if (!domainName) return null;

  const domainSlug = slugify(domainName);
  const domain = await tx.domain.upsert({
    where: { slug: domainSlug },
    update: {},
    create: { name: domainName, slug: domainSlug },
  });

  if (!collectionName) return null;

  const collectionSlug = slugify(collectionName);
  const collection = await tx.collection.upsert({
    where: { domainId_slug: { domainId: domain.id, slug: collectionSlug } },
    update: {},
    create: { name: collectionName, slug: collectionSlug, domainId: domain.id },
  });

  return collection.id;
}

async function resolveTagIds(tx: Prisma.TransactionClient, names: string[]): Promise<string[]> {
  const unique = Array.from(new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean)));
  const ids: string[] = [];
  for (const name of unique) {
    const slug = slugify(name);
    const tag = await tx.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

async function generateUniqueSlug(tx: Prisma.TransactionClient, base: string, excludeId?: string): Promise<string> {
  let candidate = slugify(base) || "note";
  for (let i = 0; i < 5; i++) {
    const existing = await tx.note.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slugify(base)}-${uniqueSuffix()}`;
  }
  return `${slugify(base)}-${uniqueSuffix()}`;
}

export async function createNote(input: NoteInput, authorId: string | null): Promise<NoteDetail> {
  const noteId = await db.$transaction(async (tx) => {
    const collectionId = await resolveCollectionId(tx, input.domainName ?? undefined, input.collectionName ?? undefined);
    const tagIds = await resolveTagIds(tx, input.tags);
    const slug = await generateUniqueSlug(tx, input.slug || input.title);

    const note = await tx.note.create({
      data: {
        slug,
        title: input.title,
        summary: input.summary ?? null,
        type: input.type,
        status: input.status,
        collectionId,
        authorId,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        sections: { create: input.sections.map((s, order) => sectionCreateData(s, order)) },
      },
      select: { id: true },
    });

    if (input.links.length) {
      await createLinksForNote(tx, note.id, input.links);
    }

    return note.id;
  });

  await refreshNoteSearchVector(noteId);
  const detail = await getNoteBySlug((await db.note.findUniqueOrThrow({ where: { id: noteId }, select: { slug: true } })).slug, {
    includeUnpublished: true,
  });
  if (!detail) throw new Error("Note vanished immediately after creation.");
  return detail;
}

function sectionCreateData(s: SectionInput, order: number): Prisma.SectionCreateWithoutNoteInput {
  return {
    order,
    heading: s.heading,
    kind: s.kind,
    body: s.body ?? null,
    items: s.items,
    warning: s.warning ?? null,
    codeTitle: s.codeTitle ?? null,
    codeLang: s.codeLang ?? null,
    code: s.code ?? null,
    highlightLines: s.highlightLines,
    tabs: { create: s.tabs.map((t, tOrder) => ({ order: tOrder, label: t.label, lang: t.lang, code: t.code })) },
  };
}

async function createLinksForNote(
  tx: Prisma.TransactionClient,
  sourceId: string,
  links: { targetSlug: string; relation: string }[]
) {
  for (const link of links) {
    const target = await tx.note.findUnique({ where: { slug: link.targetSlug }, select: { id: true } });
    if (!target || target.id === sourceId) continue;
    await tx.link.upsert({
      where: { sourceId_targetId_relation: { sourceId, targetId: target.id, relation: link.relation } },
      update: {},
      create: { sourceId, targetId: target.id, relation: link.relation },
    });
  }
}

export async function updateNote(
  slug: string,
  input: NoteInput,
  authorId: string | null
): Promise<NoteDetail> {
  const noteId = await db.$transaction(async (tx) => {
    const existing = await tx.note.findUnique({
      where: { slug },
      include: { sections: { include: { tabs: true } }, tags: { include: { tag: true } } },
    });
    if (!existing) throw new Error(`Note "${slug}" not found.`);

    await tx.noteVersion.create({
      data: {
        noteId: existing.id,
        authorId,
        summary: `Edited "${existing.title}"`,
        snapshot: JSON.parse(JSON.stringify(existing)),
      },
    });

    const collectionId = await resolveCollectionId(tx, input.domainName ?? undefined, input.collectionName ?? undefined);
    const tagIds = await resolveTagIds(tx, input.tags);
    const nextSlug = input.slug && input.slug !== slug ? await generateUniqueSlug(tx, input.slug, existing.id) : slug;

    await tx.section.deleteMany({ where: { noteId: existing.id } });
    await tx.noteTag.deleteMany({ where: { noteId: existing.id } });

    await tx.note.update({
      where: { id: existing.id },
      data: {
        slug: nextSlug,
        title: input.title,
        summary: input.summary ?? null,
        type: input.type,
        status: input.status,
        collectionId,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        sections: { create: input.sections.map((s, order) => sectionCreateData(s, order)) },
      },
    });

    if (input.links.length) {
      await tx.link.deleteMany({ where: { sourceId: existing.id } });
      await createLinksForNote(tx, existing.id, input.links);
    }

    return existing.id;
  });

  await refreshNoteSearchVector(noteId);
  const note = await db.note.findUniqueOrThrow({ where: { id: noteId }, select: { slug: true } });
  const detail = await getNoteBySlug(note.slug, { includeUnpublished: true });
  if (!detail) throw new Error("Note vanished immediately after update.");
  return detail;
}

export async function setNoteStatus(slug: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  await db.note.update({ where: { slug }, data: { status } });
}

export async function toggleFavorite(slug: string): Promise<boolean> {
  const note = await db.note.findUniqueOrThrow({ where: { slug }, select: { id: true, favorite: true } });
  const updated = await db.note.update({ where: { id: note.id }, data: { favorite: !note.favorite } });
  return updated.favorite;
}

export async function recordNoteUse(slug: string): Promise<void> {
  await db.note.update({ where: { slug }, data: { useCount: { increment: 1 } } }).catch(() => undefined);
}

export async function deleteNote(slug: string): Promise<void> {
  await db.note.delete({ where: { slug } });
}

export async function listRecentVersions(limit = 30) {
  return db.noteVersion.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      summary: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
      note: { select: { slug: true, title: true } },
    },
  });
}
