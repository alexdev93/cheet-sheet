import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listMostUsedNotes, listRecentNotes, listUnfinishedNotes } from "@/server/notes";
import { getDomainTree } from "@/server/tree";
import { NoteGrid } from "@/components/note/NoteCard";
import type { NoteSummary } from "@/types/note";

export default async function HomePage() {
  const session = await getSession();
  const [recent, mostUsed, unfinished, domains] = await Promise.all([
    listRecentNotes(6),
    listMostUsedNotes(6),
    session ? listUnfinishedNotes(6) : Promise.resolve([]),
    getDomainTree(),
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-10">
        <h1 className="text-[32px] mb-2">Knowledge & Memory Center</h1>
        <p className="text-[15px] text-[var(--color-text-3)] max-w-[62ch] mb-8">
          A workshop wall, not a filing cabinet. Browse the tree on the left, or just search — retrieval beats
          organisation.
        </p>

        {unfinished.length > 0 ? (
          <Board title="Needs finishing" notes={unfinished} empty="Nothing in draft." />
        ) : null}

        <Board title="Recently updated" notes={recent} empty="No notes yet — capture the first one." />
        <Board title="Most used" notes={mostUsed} empty="Nothing has been used yet." />

        <section className="mb-10">
          <h2 className="text-[11px] font-mono font-bold tracking-[0.14em] uppercase text-[var(--color-text-3)] mb-3">
            Domains
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
            {domains.map((d) => (
              <Link
                key={d.id}
                href={`/d/${d.slug}`}
                className="bg-[var(--color-panel)] p-4 no-underline hover:bg-[var(--color-panel-3)]"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-sans font-extrabold text-[15px] text-[var(--color-text)]">{d.name}</span>
                  <span className="font-mono text-[11px] text-[var(--color-muted-2)]">{d.noteCount}</span>
                </div>
                <div className="mt-1 text-[12px] text-[var(--color-muted)]">
                  {d.collections.map((c) => c.name).join(" · ") || "empty"}
                </div>
              </Link>
            ))}
            {domains.length === 0 ? (
              <div className="bg-[var(--color-panel)] p-6 text-sm text-[var(--color-muted)]">
                No domains yet. Capturing your first note creates one automatically.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Board({ title, notes, empty }: { title: string; notes: NoteSummary[]; empty: string }) {
  return (
    <section className="mb-10">
      <h2 className="text-[11px] font-mono font-bold tracking-[0.14em] uppercase text-[var(--color-text-3)] mb-3">
        {title}
      </h2>
      <NoteGrid notes={notes} empty={empty} />
    </section>
  );
}
