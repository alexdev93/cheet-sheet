import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { noteInputSchema } from "@/lib/validation";
import { deleteNote, getNoteBySlug, updateNote } from "@/server/notes";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const note = await getNoteBySlug(slug, { includeUnpublished: !!session });
  if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ note });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = noteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note payload.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }

  const note = await updateNote(slug, parsed.data, session.sub);
  return NextResponse.json({ note });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { slug } = await params;
  await deleteNote(slug);
  return NextResponse.json({ ok: true });
}
