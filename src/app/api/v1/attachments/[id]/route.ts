import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteAttachmentFile, keyFromUrl } from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await deleteAttachmentFile(keyFromUrl(attachment.url));
  await db.attachment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
