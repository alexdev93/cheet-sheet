import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { attachmentFilePath, isValidAttachmentKey } from "@/lib/storage";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

/**
 * Serves an uploaded attachment by its opaque key. `key` is attacker-reachable
 * (it's a URL path segment), so it's validated against the exact pattern
 * saveAttachmentFile() generates before ever touching the filesystem — this
 * is what actually prevents path traversal, not just the extension map.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  if (!isValidAttachmentKey(key)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ext = key.split(".").pop()!;
  const contentType = CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const buffer = await readFile(attachmentFilePath(key));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
