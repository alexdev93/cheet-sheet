import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Local-disk attachment storage — deliberately not S3/object storage, so a
 * single self-hosted Docker Compose stack has zero external dependencies and
 * zero cost. The one thing that matters for a swap-in replacement later is
 * this module's shape (save/delete/resolve by key); nothing else in the app
 * knows attachments live on disk.
 */

const ATTACHMENTS_DIR = process.env.ATTACHMENTS_DIR || "./data/attachments";

// Deliberately excludes image/svg+xml (inline SVG can carry <script>) and
// anything executable — screenshots, diagrams-as-image, and PDFs cover the
// stated use case without opening a stored-XSS hole via the serving route.
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export function maxAttachmentBytes(): number {
  const mb = Number(process.env.MAX_ATTACHMENT_SIZE_MB) || 10;
  return mb * 1024 * 1024;
}

/** Matches exactly what saveAttachmentFile generates — the only keys the serving/delete routes should ever trust. */
const KEY_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.[a-z0-9]{2,4}$/;

export function isValidAttachmentKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

export async function saveAttachmentFile(file: File): Promise<{ key: string; url: string; size: number }> {
  const ext = ALLOWED_ATTACHMENT_TYPES[file.type];
  if (!ext) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  await mkdir(ATTACHMENTS_DIR, { recursive: true });
  const key = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(ATTACHMENTS_DIR, key), buffer);

  return { key, url: `/api/v1/attachments/${key}`, size: buffer.length };
}

export async function deleteAttachmentFile(key: string): Promise<void> {
  if (!isValidAttachmentKey(key)) return;
  await unlink(path.join(ATTACHMENTS_DIR, key)).catch(() => undefined);
}

export function attachmentFilePath(key: string): string {
  return path.join(ATTACHMENTS_DIR, key);
}

export function keyFromUrl(url: string): string {
  return path.basename(url);
}
