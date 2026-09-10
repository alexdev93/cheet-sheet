import "server-only";
import { db } from "@/lib/db";
import { Prisma, type NoteType } from "@/generated/prisma/client";

/**
 * The insert/update trigger (prisma/migrations/0_init) only weights title (A)
 * and summary (B) — it fires per-row on the notes table and has no way to see
 * section/tag text living in other tables. Call this after any write that
 * touches a note's sections or tags so search stays in sync. A trigger-based
 * cross-table approach would need a second trigger on sections/note_tags plus
 * careful debouncing; for a single-admin app this explicit refresh is simpler
 * and just as correct.
 */
export async function refreshNoteSearchVector(noteId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "notes" n
    SET "searchVector" =
      setweight(to_tsvector('english', coalesce(n.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(n.summary, '')), 'B') ||
      setweight(to_tsvector('english', coalesce((
        SELECT string_agg(t.name, ' ')
        FROM "note_tags" nt JOIN "tags" t ON t.id = nt."tagId"
        WHERE nt."noteId" = n.id
      ), '')), 'B') ||
      setweight(to_tsvector('english', coalesce((
        SELECT string_agg(coalesce(s.heading, '') || ' ' || coalesce(s.body, '') || ' ' || array_to_string(s.items, ' '), ' ')
        FROM "sections" s WHERE s."noteId" = n.id
      ), '')), 'C') ||
      setweight(to_tsvector('english', coalesce((
        SELECT string_agg(coalesce(s.code, ''), ' ')
        FROM "sections" s WHERE s."noteId" = n.id
      ), '')), 'D')
    WHERE n.id = ${noteId}
  `;
}

export type LiteHit = { slug: string; title: string; type: NoteType };

/**
 * Search-as-you-type for the top bar and command palette. Building a prefix
 * tsquery ("dock:*") lets a partial word like "dock" match "Docker" while
 * still hitting the "notes_searchVector_idx" GIN index — unlike a plain
 * `title ILIKE '%q%'`, which can never use a btree/GIN index because of the
 * leading wildcard and forces a full table scan on every keystroke.
 *
 * The query text is tokenized through to_tsvector() first and only the
 * resulting lexemes (plain alphanumeric stems, never raw user input) are
 * spliced into the to_tsquery() string, so this is safe against tsquery
 * operator injection despite not going through Prisma.sql for that part.
 */
export async function searchNotesLite(opts: {
  query: string;
  type?: NoteType | "ALL";
  limit?: number;
}): Promise<LiteHit[]> {
  const { query, type = "ALL", limit = 8 } = opts;
  const q = query.trim();
  if (!q) return [];

  const typeFilter = type !== "ALL" ? Prisma.sql`AND n.type = ${type}::"NoteType"` : Prisma.empty;
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 50)) : 8;

  const rows = await db.$queryRaw<LiteHit[]>(Prisma.sql`
    WITH q AS (
      SELECT string_agg(lexeme || ':*', ' & ') AS tsq
      FROM unnest(tsvector_to_array(to_tsvector('english', ${q}))) AS lexeme
    )
    SELECT n.slug, n.title, n.type
    FROM "notes" n, q
    WHERE n.status = 'PUBLISHED'
      AND q.tsq IS NOT NULL
      AND n."searchVector" @@ to_tsquery('english', q.tsq)
      ${typeFilter}
    ORDER BY n."useCount" DESC
    LIMIT ${safeLimit}
  `);

  return rows;
}

export type SearchSort = "relevance" | "recent" | "most-used";

export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: NoteType;
  updatedAt: Date;
  useCount: number;
  domainName: string | null;
  collectionName: string | null;
  rank: number;
  snippet: string | null;
};

/**
 * websearch_to_tsquery tolerates natural phrasing ("docker clean", quoted
 * phrases, `-word` exclusion) without the caller building tsquery syntax —
 * the closest built-in Postgres gets to typo-tolerant free text search
 * without an extension like pg_trgm.
 */
export async function searchNotes(opts: {
  query: string;
  type?: NoteType | "ALL";
  sort?: SearchSort;
  limit?: number;
  offset?: number;
}): Promise<SearchHit[]> {
  const { query, type = "ALL", sort = "relevance", limit = 40, offset = 0 } = opts;
  const q = query.trim();
  if (!q) return [];

  // Built with Prisma.sql fragments (never raw string interpolation) so every
  // value — including `type`, which is attacker-reachable via a URL query
  // param — is sent to Postgres as a bound parameter, not concatenated SQL.
  const orderBy =
    sort === "recent"
      ? Prisma.sql`n."updatedAt" DESC`
      : sort === "most-used"
        ? Prisma.sql`n."useCount" DESC, rank DESC`
        : Prisma.sql`rank DESC, n."useCount" DESC`;

  const typeFilter =
    type !== "ALL" ? Prisma.sql`AND n.type = ${type}::"NoteType"` : Prisma.empty;

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 40;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

  const rows = await db.$queryRaw<
    Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      type: NoteType;
      updatedAt: Date;
      useCount: number;
      domainName: string | null;
      collectionName: string | null;
      rank: number;
      snippet: string | null;
    }>
  >(Prisma.sql`
    SELECT
      n.id, n.slug, n.title, n.summary, n.type, n."updatedAt", n."useCount",
      d.name AS "domainName", c.name AS "collectionName",
      ts_rank(n."searchVector", websearch_to_tsquery('english', ${q})) AS rank,
      ts_headline('english', coalesce(n.summary, ''), websearch_to_tsquery('english', ${q}),
        'MaxFragments=1, MaxWords=24, MinWords=8') AS snippet
    FROM "notes" n
    LEFT JOIN "collections" c ON c.id = n."collectionId"
    LEFT JOIN "domains" d ON d.id = c."domainId"
    WHERE n.status = 'PUBLISHED'
      AND n."searchVector" @@ websearch_to_tsquery('english', ${q})
      ${typeFilter}
    ORDER BY ${orderBy}
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `);

  return rows;
}
