"use client";

import { useState } from "react";
import { TextBody } from "@/components/note/TextBody";

/** A plain textarea with a Write/Preview toggle — the closest thing to a "Markdown editor" this app needs. */
export function MarkdownField({
  value,
  onChange,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-1">
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="font-mono text-[10px] font-bold tracking-[0.06em] text-[var(--color-muted)] hover:text-accent bg-transparent border-0 cursor-pointer"
        >
          {preview ? "WRITE" : "PREVIEW"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-[4.5rem] px-2.5 py-2 bg-[var(--color-panel-3)] border border-[var(--color-border)]">
          {value.trim() ? <TextBody>{value}</TextBody> : <p className="text-sm text-[var(--color-muted)] m-0">Nothing to preview yet.</p>}
        </div>
      ) : (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={className} />
      )}
    </div>
  );
}
