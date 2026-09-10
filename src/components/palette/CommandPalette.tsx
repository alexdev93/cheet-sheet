"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePalette } from "@/components/palette/PaletteProvider";
import { NOTE_TYPE_LABELS } from "@/lib/detect";
import { toggleTheme } from "@/lib/theme";
import type { NoteType } from "@/generated/prisma/client";

type LiteNote = { slug: string; title: string; type: NoteType };

export function CommandPalette() {
  const { open, setOpen, noteContext } = usePalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<LiteNote[]>([]);

  const mode: "commands" | "notes" | "mixed" = query.startsWith(">")
    ? "commands"
    : query.startsWith("@")
      ? "notes"
      : "mixed";
  const searchTerm = query.replace(/^[>@]\s*/, "");

  useEffect(() => {
    if (!open) return;
    if (mode === "commands") {
      setNotes([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/notes?lite=1&q=${encodeURIComponent(searchTerm)}&limit=8`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes ?? []);
        }
      } catch {
        // aborted or offline — leave the previous results in place
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, mode, searchTerm]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 bg-black/72 flex justify-center pt-[10vh] z-50 px-4"
    >
      <Command
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        shouldFilter={false}
        className="w-full max-w-[640px] h-fit max-h-[70vh] bg-[var(--color-panel-3)] border-2 border-[var(--color-border-strong)] shadow-2xl flex flex-col animate-[var(--animate-kmc-in)]"
        label="Command palette"
      >
        <div className="flex items-center gap-2.5 h-12 flex-none px-3.5 border-b-2 border-[var(--color-border)]">
          <span className="font-mono font-bold text-xs text-accent">
            {query.startsWith(">") ? ">" : query.startsWith("@") ? "@" : "◆"}
          </span>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Type a command, or search knowledge…"
            className="flex-1 bg-transparent border-0 outline-none text-[var(--color-text)] font-mono text-sm"
          />
          <span className="font-mono text-[10px] text-[var(--color-muted-2)] border border-[var(--color-border)] px-[5px] py-1">ESC</span>
        </div>

        {noteContext ? (
          <div className="px-3.5 py-2 border-b border-[var(--color-border)] font-mono text-[11px] text-[var(--color-muted)]">
            In context: <span className="text-[var(--color-text-2)]">{noteContext.title}</span>
          </div>
        ) : null}

        <Command.List className="flex-1 overflow-y-auto py-1.5">
          <Command.Empty className="px-3.5 py-6 text-center text-sm text-[var(--color-muted)]">
            Nothing matches.
          </Command.Empty>

          {mode !== "notes" ? (
            <Command.Group>
              {noteContext ? (
                <>
                  <PaletteItem glyph="✎" label="Edit this note" hint="E" onSelect={() => go(`/n/${noteContext.slug}/edit`)} />
                  <PaletteItem glyph="◎" label={`Open graph around ${noteContext.title}`} hint="G" onSelect={() => go(`/graph?focus=${noteContext.slug}`)} />
                </>
              ) : null}
              <PaletteItem glyph="⌁" label="New capture" hint="N" onSelect={() => go("/capture")} />
              <PaletteItem glyph="◐" label="Search knowledge" hint="/" onSelect={() => go("/search")} />
              {!noteContext ? <PaletteItem glyph="◎" label="Open graph explorer" hint="G" onSelect={() => go("/graph")} /> : null}
              <PaletteItem glyph="⌂" label="Go home" hint="" onSelect={() => go("/")} />
              <PaletteItem glyph="◧" label="Toggle theme" hint="" onSelect={() => { toggleTheme(); setOpen(false); }} />
            </Command.Group>
          ) : null}

          {mode !== "commands" && notes.length > 0 ? (
            <Command.Group heading={mode === "notes" ? undefined : "NOTES"}>
              {notes.map((n) => (
                <PaletteItem
                  key={n.slug}
                  glyph="·"
                  label={n.title}
                  hint={NOTE_TYPE_LABELS[n.type]}
                  onSelect={() => go(`/n/${n.slug}`)}
                />
              ))}
            </Command.Group>
          ) : null}
        </Command.List>

        <div className="h-8 flex-none flex items-center gap-4 px-3.5 border-t border-[var(--color-border)] font-mono text-[10.5px] text-[var(--color-muted-2)]">
          <span>↑↓ move</span>
          <span>⏎ run</span>
          <span>&gt; commands only</span>
          <span>@ jump to note</span>
        </div>
      </Command>
    </div>
  );
}

function PaletteItem({
  glyph,
  label,
  hint,
  onSelect,
}: {
  glyph: string;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 h-[34px] px-3.5 cursor-pointer border-l-2 border-transparent text-[13.5px] text-[var(--color-text-2)] aria-selected:bg-[var(--color-panel-2)] aria-selected:border-accent aria-selected:text-[var(--color-text)]"
    >
      <span className="w-3.5 flex-none font-mono text-xs text-[var(--color-muted-2)]">{glyph}</span>
      <span className="flex-1 truncate">{label}</span>
      <span className="font-mono text-[11px] text-[var(--color-muted-2)]">{hint}</span>
    </Command.Item>
  );
}
