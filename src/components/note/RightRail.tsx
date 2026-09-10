import Link from "next/link";
import { relativeTime } from "@/lib/format";
import { sectionAnchor } from "@/components/note/Section";
import type { NoteDetail } from "@/types/note";

export function RightRail({ note }: { note: NoteDetail }) {
  return (
    <aside className="w-[296px] flex-none border-l border-[var(--color-border)] bg-[var(--color-panel-3)] overflow-y-auto p-4 pb-10 hidden xl:block">
      {note.sections.length > 0 ? (
        <RailBlock title="On this page">
          {note.sections.map((s) => (
            <a
              key={s.id}
              href={`#${sectionAnchor(s.heading)}`}
              className="block text-[12.5px] text-[var(--color-text-3)] py-[3px] pl-2.5 border-l border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-accent no-underline"
            >
              {s.heading}
            </a>
          ))}
        </RailBlock>
      ) : null}

      <RailBlock title="Referenced by" count={note.linksIn.length}>
        {note.linksIn.map((l) => (
          <Link
            key={l.note.slug + l.relation}
            href={`/n/${l.note.slug}`}
            className="block border-l-2 border-[var(--color-border)] pl-2.5 py-1.5 mb-2 no-underline hover:border-accent"
          >
            <div className="text-[13px] text-[var(--color-text)] leading-[1.35] mb-0.5">{l.note.title}</div>
            {l.note.summary ? (
              <div className="font-mono text-[11px] leading-[1.45] text-[var(--color-muted)] truncate">
                {l.note.summary}
              </div>
            ) : null}
          </Link>
        ))}
      </RailBlock>

      <RailBlock title="Leads to">
        {note.linksOut.map((l) => (
          <Link
            key={l.note.slug + l.relation}
            href={`/n/${l.note.slug}`}
            className="flex items-center gap-2 py-[5px] text-[13px] text-[var(--color-text-2)] no-underline hover:text-accent"
          >
            <span className="font-mono text-[10px] text-[var(--color-muted-2)] w-[56px] flex-none">{l.relation}</span>
            <span className="flex-1 truncate">{l.note.title}</span>
          </Link>
        ))}
      </RailBlock>

      {note.history.length > 0 ? (
        <RailBlock title="History">
          {note.history.map((h) => (
            <div key={h.id} className="flex gap-2.5 font-mono text-[11.5px] leading-[1.6] text-[var(--color-muted)]">
              <span className="text-[var(--color-muted-2)] w-11 flex-none">{relativeTime(h.createdAt).replace(" ago", "")}</span>
              <span className="flex-1 text-[var(--color-text-3)]">{h.summary}</span>
            </div>
          ))}
        </RailBlock>
      ) : null}
    </aside>
  );
}

function RailBlock({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="font-sans font-bold text-[10px] tracking-[0.12em] uppercase text-[var(--color-text-3)]">{title}</span>
        {count !== undefined ? (
          <span className="font-mono text-[10px] text-[var(--color-muted-2)]">{count}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
