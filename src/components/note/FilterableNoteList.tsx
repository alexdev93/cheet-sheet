"use client";

import { useMemo, useState } from "react";
import { NoteGrid } from "@/components/note/NoteCard";
import { NOTE_TYPE_LABELS } from "@/lib/detect";
import type { NoteType } from "@/generated/prisma/client";
import type { NoteSummary } from "@/types/note";

const PAGE_SIZE = 12;

/**
 * Wraps NoteGrid with a client-side title/summary filter, a type filter, and
 * pagination — for domain/tag pages, which fetch their (already-published,
 * already reasonably-sized) note list in one shot server-side. Filtering the
 * already-fetched list in the browser is the right tradeoff at personal-kb
 * scale (tens to a few hundred notes per domain/tag); it avoids a
 * server round trip on every keystroke without needing real offset-based
 * pagination in the data layer.
 */
export function FilterableNoteList({ notes, empty }: { notes: NoteSummary[]; empty: string }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<NoteType | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const typesPresent = useMemo(() => {
    const present = new Set(notes.map((n) => n.type));
    return (Object.keys(NOTE_TYPE_LABELS) as NoteType[]).filter((t) => present.has(t));
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (type !== "ALL" && n.type !== type) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || (n.summary ?? "").toLowerCase().includes(q);
    });
  }, [notes, query, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (notes.length === 0) {
    return <NoteGrid notes={[]} empty={empty} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by title or summary…"
          className="flex-1 min-w-[160px] h-8 px-2.5 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text-2)] font-mono text-xs outline-none focus-visible:border-accent"
        />
        {typesPresent.length > 1 ? (
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as NoteType | "ALL");
              setPage(1);
            }}
            className="h-8 px-2 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text-2)] font-mono text-xs outline-none focus-visible:border-accent"
          >
            <option value="ALL">All types</option>
            {typesPresent.map((t) => (
              <option key={t} value={t}>
                {NOTE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        ) : null}
        <span className="font-mono text-[11px] text-[var(--color-muted-2)] ml-auto">
          {filtered.length} of {notes.length}
        </span>
      </div>

      <NoteGrid notes={pageItems} empty="Nothing matches." />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between mt-5 font-mono text-[11px] text-[var(--color-muted)]">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1.5 border border-[var(--color-border-strong)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent text-[var(--color-text-2)] hover:border-accent hover:text-accent"
          >
            ← PREV
          </button>
          <span>
            PAGE {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1.5 border border-[var(--color-border-strong)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent text-[var(--color-text-2)] hover:border-accent hover:text-accent"
          >
            NEXT →
          </button>
        </div>
      ) : null}
    </div>
  );
}
