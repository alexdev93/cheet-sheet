"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { TreeDomain } from "@/server/tree";
import type { NoteSummary } from "@/types/note";

export function Sidebar({
  tree,
  recent,
  noteCount,
}: {
  tree: TreeDomain[];
  recent: NoteSummary[];
  noteCount: number;
}) {
  const pathname = usePathname();
  const activeSlug = pathname?.startsWith("/n/") ? pathname.split("/")[2] : null;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tree.map((d) => [d.id, true]))
  );

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  return (
    <div className="w-[274px] flex-none border-r border-[var(--color-border)] bg-[var(--color-panel-2)] flex-col min-h-0 hidden md:flex">
      <div className="h-[34px] flex-none flex items-center justify-between px-3 border-b border-[var(--color-border)]">
        <span className="font-sans font-bold text-[10px] tracking-[0.12em] text-[var(--color-text-3)]">BROWSE</span>
        <span className="font-mono text-[10px] text-[var(--color-muted-2)]">{noteCount} notes</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-1.5" aria-label="Knowledge tree">
        {tree.map((domain) => (
          <div key={domain.id}>
            <button
              onClick={() => toggle(domain.id)}
              className="w-full flex items-center gap-1.5 h-[26px] pr-2.5 pl-2.5 cursor-pointer bg-transparent border-0 border-l-2 border-transparent hover:bg-[var(--color-panel-3)] text-left"
            >
              <span className="w-2.5 flex-none font-mono text-[9px] text-[var(--color-muted-2)]">
                {expanded[domain.id] ? "▾" : "▸"}
              </span>
              <span className="flex-1 truncate font-sans font-extrabold text-[13px] tracking-[-0.01em] text-[var(--color-text)]">
                {domain.name}
              </span>
              <span className="font-mono text-[10px] text-[var(--color-muted-2)]">{domain.noteCount}</span>
            </button>

            {expanded[domain.id]
              ? domain.collections.map((col) => (
                  <CollectionRow key={col.id} collection={col} activeSlug={activeSlug} />
                ))
              : null}
          </div>
        ))}
      </nav>

      {recent.length > 0 ? (
        <div className="flex-none border-t border-[var(--color-border)] py-2 pb-2.5">
          <div className="px-3 pb-1.5 font-sans font-bold text-[10px] tracking-[0.12em] text-[var(--color-text-3)]">
            RECENT
          </div>
          {recent.slice(0, 4).map((n) => (
            <Link
              key={n.id}
              href={`/n/${n.slug}`}
              className="flex items-center gap-2 h-6 px-3 truncate text-[12.5px] no-underline text-[var(--color-text-3)] hover:bg-[var(--color-panel-3)] hover:text-[var(--color-text)]"
            >
              {n.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CollectionRow({
  collection,
  activeSlug,
}: {
  collection: TreeDomain["collections"][number];
  activeSlug: string | null;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-1.5 h-[26px] pr-2.5 pl-6 cursor-pointer bg-transparent border-0 border-l-2 border-transparent hover:bg-[var(--color-panel-3)] text-left"
      >
        <span className="w-2.5 flex-none font-mono text-[9px] text-[var(--color-muted-2)]">
          {expanded ? "▾" : "▸"}
        </span>
        <span className="flex-1 truncate text-[12.5px] text-[var(--color-text-2)]">{collection.name}</span>
        <span className="font-mono text-[10px] text-[var(--color-muted-2)]">{collection.notes.length}</span>
      </button>

      {expanded ? (
        collection.notes.length ? (
          collection.notes.map((note) => {
            const active = note.slug === activeSlug;
            return (
              <Link
                key={note.id}
                href={`/n/${note.slug}`}
                className="flex items-center h-[26px] pl-[38px] pr-2.5 truncate font-mono text-xs no-underline border-l-2"
                style={{
                  color: active ? "var(--color-text)" : "var(--color-text-3)",
                  background: active ? "var(--color-panel-3)" : "transparent",
                  borderColor: active ? "var(--color-accent)" : "transparent",
                }}
              >
                {note.title}
              </Link>
            );
          })
        ) : (
          <div className="pl-[46px] pr-2.5 h-[26px] flex items-center text-xs text-[var(--color-muted-2)]">
            empty
          </div>
        )
      ) : null}
    </div>
  );
}
