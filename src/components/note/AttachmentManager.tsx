"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/format";
import type { AttachmentData } from "@/types/note";

export function AttachmentManager({ noteSlug, initial }: { noteSlug: string; initial: AttachmentData[] }) {
  const [attachments, setAttachments] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`/api/v1/notes/${noteSlug}/attachments`, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        setAttachments((prev) => [...prev, data.attachment]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/v1/attachments/${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  return (
    <div className="mb-3">
      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
          {attachments.map((a) => (
            <div key={a.id} className="border border-[var(--color-border)] bg-[var(--color-panel-3)] p-2 flex items-center gap-2">
              <span className="flex-1 text-[11.5px] text-[var(--color-text-2)] truncate">{a.filename}</span>
              <span className="font-mono text-[10px] text-[var(--color-muted-2)] flex-none">{formatBytes(a.size)}</span>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="font-mono text-xs text-[var(--color-muted)] hover:text-accent bg-transparent border-0 cursor-pointer flex-none"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
        className="text-sm text-[var(--color-text-2)] file:mr-3 file:h-8 file:px-3 file:bg-transparent file:border file:border-[var(--color-border-strong)] file:text-[var(--color-text-2)] file:font-sans file:font-bold file:text-xs file:cursor-pointer"
      />
      {uploading ? <p className="text-[12px] text-[var(--color-muted)] mt-2">Uploading…</p> : null}
      {error ? <p className="text-[12px] text-accent mt-2">{error}</p> : null}
      <p className="text-[12.5px] text-[var(--color-muted)] mt-2 leading-[1.6]">
        PNG, JPEG, WebP, GIF, or PDF — up to the size limit configured in <code>MAX_ATTACHMENT_SIZE_MB</code>.
      </p>
    </div>
  );
}
