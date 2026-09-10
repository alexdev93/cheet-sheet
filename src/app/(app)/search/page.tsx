import Link from "next/link";
import type { Metadata } from "next";
import { searchNotes, type SearchSort } from "@/lib/search";
import { parseSort, parseTypeFilter } from "@/lib/validation";
import { NOTE_TYPE_LABELS } from "@/lib/detect";
import { relativeTime } from "@/lib/format";
import { Highlight } from "@/components/search/Highlight";
import type { NoteType } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Search" };

const TYPES: (NoteType | "ALL")[] = ["ALL", "COMMAND", "PROCEDURE", "TROUBLESHOOTING", "REFERENCE", "PATH", "NOTE"];
const SORTS: SearchSort[] = ["relevance", "most-used", "recent"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const type = parseTypeFilter(params.type);
  const sort: SearchSort = parseSort(params.sort);

  const [allHits, results] = q
    ? await Promise.all([
        searchNotes({ query: q, type: "ALL", sort: "relevance", limit: 200 }),
        searchNotes({ query: q, type, sort, limit: 60 }),
      ])
    : [[], []];

  const counts = new Map<string, number>();
  for (const hit of allHits) counts.set(hit.type, (counts.get(hit.type) ?? 0) + 1);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[900px] px-6 sm:px-10 py-6 pb-20">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[22px]">{q ? `Results for “${q}”` : "Search knowledge"}</h1>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {q ? `${results.length} of ${allHits.length} matches` : "type to search — try “docker clean”"}
          </span>
        </div>

        <form action="/search" className="flex gap-2 my-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search knowledge"
            className="flex-1 h-9 px-3 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text)] font-mono text-sm outline-none focus-visible:border-accent"
          />
          <button className="h-9 px-4 bg-accent text-[var(--color-panel)] font-sans font-bold text-xs">SEARCH</button>
        </form>

        {q ? (
          <>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {TYPES.map((t) => {
                const active = type === t;
                const count = t === "ALL" ? allHits.length : (counts.get(t) ?? 0);
                return (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(q)}&type=${t}&sort=${sort}`}
                    className="font-mono text-[10px] font-bold tracking-[0.08em] px-2 py-[7px] border no-underline"
                    style={{
                      background: active ? "var(--color-accent)" : "transparent",
                      color: active ? "var(--color-panel)" : "var(--color-text-2)",
                      borderColor: active ? "var(--color-accent)" : "var(--color-border-strong)",
                    }}
                  >
                    {t === "ALL" ? "ALL" : NOTE_TYPE_LABELS[t].toUpperCase()} <span className="opacity-70">{count}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-[11px] text-[var(--color-muted-2)] tracking-[0.04em]">SORT</span>
              {SORTS.map((s) => {
                const active = sort === s;
                return (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(q)}&type=${type}&sort=${s}`}
                    className="font-mono text-[10px] font-bold tracking-[0.06em] px-2 py-1.5 border no-underline"
                    style={{
                      background: active ? "var(--color-accent)" : "transparent",
                      color: active ? "var(--color-panel)" : "var(--color-text-2)",
                      borderColor: active ? "var(--color-accent)" : "var(--color-border-strong)",
                    }}
                  >
                    {s.replace("-", " ").toUpperCase()}
                  </Link>
                );
              })}
            </div>

            <hr className="h-0.5 border-0 bg-[var(--color-border)] mb-1" />

            {results.map((r) => (
              <Link
                key={r.id}
                href={`/n/${r.slug}`}
                className="grid grid-cols-[92px_minmax(0,1fr)] gap-5 py-4 border-b border-[var(--color-border)] no-underline hover:bg-[var(--color-panel-2)]"
              >
                <div>
                  <div className="font-mono text-[10px] font-bold tracking-[0.08em] text-accent mb-1.5">{r.type}</div>
                  <div className="font-mono text-[11px] text-[var(--color-muted-2)]">{r.domainName ?? ""}</div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2.5 mb-1">
                    <span className="font-sans font-extrabold text-[17px] text-[var(--color-text)]">{r.title}</span>
                    <span className="font-mono text-[10.5px] text-[var(--color-muted-2)]">{relativeTime(r.updatedAt)}</span>
                  </div>
                  {r.summary ? (
                    <div className="text-[13.5px] text-[var(--color-text-3)] leading-[1.55] mb-2 max-w-[78ch]">{r.summary}</div>
                  ) : null}
                  {r.snippet ? (
                    <div className="font-mono text-xs leading-[1.7] text-[var(--color-text-2)] bg-[var(--color-bg)] border-l-2 border-[var(--color-border-strong)] px-2.5 py-1.5 mb-2 truncate">
                      <Highlight text={r.snippet} />
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}

            {q && results.length === 0 ? (
              <div className="pt-11 max-w-[520px]">
                <h4 className="text-[19px] mb-2">Nothing here matches “{q}”.</h4>
                <p className="text-[var(--color-text-3)] text-sm mb-4">
                  Either this knowledge isn&apos;t captured yet, or it&apos;s filed under a term you don&apos;t use
                  any more. Both are worth fixing now, while you remember the question.
                </p>
                <Link
                  href="/capture"
                  className="inline-flex items-center h-[34px] px-4 bg-accent text-[var(--color-panel)] no-underline font-sans font-extrabold text-[12px]"
                >
                  CAPTURE IT NOW
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
