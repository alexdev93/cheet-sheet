import Link from "next/link";
import { TypeBadge } from "@/components/ui/Badge";
import { FavoriteButton } from "@/components/note/FavoriteButton";
import { relativeTime } from "@/lib/format";
import type { NoteDetail } from "@/types/note";

export function NoteHeader({
  note,
  canEdit,
  onEditClick,
}: {
  note: NoteDetail;
  canEdit: boolean;
  /** When provided, EDIT switches the detail page into inline edit mode
   * instead of navigating to the separate /edit route. */
  onEditClick?: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--color-muted)] mb-4">
        {note.domain ? (
          <>
            <Link href={`/d/${note.domain.slug}`} className="no-underline hover:text-accent">
              {note.domain.name}
            </Link>
            <span className="text-[var(--color-border-strong)]">/</span>
          </>
        ) : null}
        {note.collection ? <span>{note.collection.name}</span> : null}
        {note.collection ? <span className="text-[var(--color-border-strong)]">/</span> : null}
        <span className="text-[var(--color-text-2)]">{note.title}</span>
      </div>

      <div className="flex items-center flex-wrap gap-2.5 mb-2.5">
        <TypeBadge type={note.type} />
        <span className="font-mono text-[11.5px] text-[var(--color-muted)]">
          Updated {relativeTime(note.updatedAt)}
          {note.useCount > 0 ? ` · used ${note.useCount}× this month` : ""}
        </span>
        {note.status !== "PUBLISHED" ? (
          <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--color-muted)] border border-[var(--color-border-strong)] px-1.5 py-0.5">
            {note.status.toLowerCase()}
          </span>
        ) : null}
        <span className="flex-1 hidden sm:block" />
        <FavoriteButton slug={note.slug} initial={note.favorite} canEdit={canEdit} />
        {canEdit ? (
          onEditClick ? (
            <button
              type="button"
              onClick={onEditClick}
              className="font-sans font-bold text-[10px] tracking-[0.06em] text-[var(--color-text-3)] border border-[var(--color-border-strong)] px-2 py-1.5 cursor-pointer bg-transparent hover:border-accent hover:text-accent"
            >
              EDIT
            </button>
          ) : (
            <Link
              href={`/n/${note.slug}/edit`}
              className="font-sans font-bold text-[10px] tracking-[0.06em] text-[var(--color-text-3)] border border-[var(--color-border-strong)] px-2 py-1.5 no-underline hover:border-accent hover:text-accent"
            >
              EDIT
            </Link>
          )
        ) : null}
      </div>

      <h1 className="text-[34px] mb-3 text-balance">{note.title}</h1>
      {note.summary ? (
        <p className="text-[16.5px] leading-[1.6] text-[var(--color-text-2)] m-0 mb-4 max-w-[66ch] text-pretty">
          {note.summary}
        </p>
      ) : null}

      {note.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <Link
              key={tag}
              href={`/t/${tag.toLowerCase().replace(/\s+/g, "-")}`}
              className="font-mono text-[11px] text-[var(--color-text-3)] border border-[var(--color-border)] px-[7px] py-[5px] no-underline hover:border-accent hover:text-accent"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      <hr className="h-0.5 border-0 bg-[var(--color-border)] mt-5 mb-0" />
    </div>
  );
}
