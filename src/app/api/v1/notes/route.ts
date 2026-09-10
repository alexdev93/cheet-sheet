import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { noteInputSchema, parseSort, parseTypeFilter } from "@/lib/validation";
import { searchNotes } from "@/lib/search";
import { createNote, listRecentNotes } from "@/server/notes";
import { db } from "@/lib/db";

/**
 * GET /api/v1/notes            -> most recently updated published notes
 * GET /api/v1/notes?q=docker   -> full-text search (delegates to lib/search)
 * GET /api/v1/notes?lite=1&q=  -> {slug,title,type} only, for the command palette
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const type = parseTypeFilter(searchParams.get("type"));
  const sort = parseSort(searchParams.get("sort"));
  const limit = Math.min(Number(searchParams.get("limit")) || 40, 200);
  const lite = searchParams.get("lite") === "1";

  if (lite) {
    const notes = await db.note.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(type !== "ALL" ? { type } : {}),
      },
      select: { slug: true, title: true, type: true },
      take: limit,
      orderBy: q ? { useCount: "desc" } : { updatedAt: "desc" },
    });
    return NextResponse.json({ notes });
  }

  if (!q) {
    const notes = await listRecentNotes(limit);
    return NextResponse.json({ notes });
  }

  const hits = await searchNotes({ query: q, type, sort, limit });
  return NextResponse.json({ notes: hits });
}

/** POST /api/v1/notes — create a note. Requires the admin session (enforced in src/proxy.ts). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = noteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note payload.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }

  const note = await createNote(parsed.data, session.sub);
  return NextResponse.json({ note }, { status: 201 });
}
