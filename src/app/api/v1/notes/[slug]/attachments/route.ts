import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ALLOWED_ATTACHMENT_TYPES, maxAttachmentBytes, saveAttachmentFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const note = await db.note.findUnique({ where: { slug }, select: { id: true, status: true } });
  // Same visibility rule as getNoteBySlug: a draft/archived note's existence
  // (and its attachment filenames) isn't public just because its slug leaked.
  if (!note || (note.status !== "PUBLISHED" && !session)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const attachments = await db.attachment.findMany({
    where: { noteId: note.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ attachments });
}

/** POST /api/v1/notes/:slug/attachments — multipart upload, admin-only (enforced in src/proxy.ts). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { slug } = await params;
  const note = await db.note.findUnique({ where: { slug }, select: { id: true } });
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!(file.type in ALLOWED_ATTACHMENT_TYPES)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Allowed: ${Object.keys(ALLOWED_ATTACHMENT_TYPES).join(", ")}.` },
      { status: 400 }
    );
  }

  if (file.size > maxAttachmentBytes()) {
    return NextResponse.json({ error: "File is larger than the configured limit." }, { status: 413 });
  }

  const saved = await saveAttachmentFile(file);
  const attachment = await db.attachment.create({
    data: {
      noteId: note.id,
      filename: file.name || saved.key,
      url: saved.url,
      mimeType: file.type,
      size: saved.size,
    },
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
