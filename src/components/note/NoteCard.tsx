import Link from "next/link";
import { TypeBadge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/format";
import type { NoteSummary } from "@/types/note";

export function NoteCard({ note }: { note: NoteSummary }) {
  return (
    <Link
      href={`/n/${note.slug}`}
      className="block border border-[var(--color-border)] p-3.5 no-underline hover:border-[var(--color-border-strong)] bg-[var(--color-panel)]"
    >
      <div className="flex items-center justify-between mb-2">
        <TypeBadge type={note.type} />
        <span className="font-mono text-[10.5px] text-[var(--color-muted-2)]">{relativeTime(note.updatedAt)}</span>
      </div>
      <div className="font-sans font-bold text-[15px] text-[var(--color-text)] mb-1 truncate">{note.title}</div>
      {note.summary ? <div className="text-[13px] text-[var(--color-text-3)] line-clamp-2">{note.summary}</div> : null}
    </Link>
  );
}

export function NoteGrid({ notes, empty }: { notes: NoteSummary[]; empty: string }) {
  if (notes.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} />
      ))}
    </div>
  );
}
