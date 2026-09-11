"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePalette } from "@/components/palette/PaletteProvider";
import { useMobileNav } from "@/components/layout/MobileNavProvider";
import { toggleTheme } from "@/lib/theme";
import { logoutAction } from "@/server/auth-actions";
import { NOTE_TYPE_LABELS } from "@/lib/detect";
import type { NoteType } from "@/generated/prisma/client";

type LiteNote = { slug: string; title: string; type: NoteType };

export function TopBar({ authed }: { authed: boolean }) {
  const router = useRouter();
  const { toggle } = usePalette();
  const { toggle: toggleMobileNav } = useMobileNav();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<LiteNote[]>([]);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Search-as-you-type: a small debounced dropdown under the search box.
  // Enter (or clicking SEARCH) still goes to the full /search page with
  // filters/sorting — this is just the fast path to a note you already know.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/v1/notes?lite=1&q=${encodeURIComponent(q.trim())}&limit=6`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.notes ?? []);
        }
      } catch {
        // aborted or offline — leave previous suggestions in place
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
  }

  function goToNote(slug: string) {
    setOpen(false);
    setQ("");
    router.push(`/n/${slug}`);
  }

  return (
    <header className="h-[52px] flex-none flex items-center gap-2.5 sm:gap-3.5 px-2.5 sm:px-3.5 border-b border-[var(--color-border)] bg-[var(--color-panel)]">
      <button
        type="button"
        onClick={toggleMobileNav}
        aria-label="Open menu"
        className="md:hidden w-9 h-9 flex-none flex items-center justify-center bg-transparent border-0 cursor-pointer text-[var(--color-text-2)] font-mono text-base"
      >
        ☰
      </button>

      <Link href="/" className="flex items-center gap-2 no-underline">
        <span className="block w-[22px] h-[22px] flex-none bg-accent" />
        <span className="hidden min-[380px]:inline font-sans font-extrabold text-sm tracking-[-0.01em] text-[var(--color-text)] whitespace-nowrap">
          memory<span className="text-[var(--color-muted)]">/center</span>
        </span>
      </Link>

      <div className="w-0.5 h-6 bg-[var(--color-border)] hidden sm:block" />

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="relative flex-1 flex items-center gap-2 max-w-[520px] h-8 px-2.5 bg-[var(--color-panel-3)] border border-[var(--color-border)]"
      >
        <span className="font-mono text-[13px] text-[var(--color-muted)]">◐</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search knowledge"
          className="flex-1 bg-transparent border-0 outline-none text-[var(--color-text)] font-mono text-[13px]"
        />
        <span className="font-mono font-medium text-[10px] text-[var(--color-muted)] border border-[var(--color-border)] px-[5px] py-0.5">/</span>

        {open && q.trim() && suggestions.length > 0 ? (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[var(--color-panel-3)] border border-[var(--color-border-strong)] shadow-2xl z-40">
            {suggestions.map((n) => (
              <button
                key={n.slug}
                type="button"
                onClick={() => goToNote(n.slug)}
                className="w-full flex items-center gap-2.5 h-8 px-2.5 text-left cursor-pointer bg-transparent border-0 hover:bg-[var(--color-panel-2)]"
              >
                <span className="flex-1 truncate text-[13px] text-[var(--color-text-2)]">{n.title}</span>
                <span className="font-mono text-[10px] text-[var(--color-muted-2)] flex-none">{NOTE_TYPE_LABELS[n.type]}</span>
              </button>
            ))}
            <button
              type="submit"
              className="w-full h-8 px-2.5 text-left cursor-pointer bg-transparent border-0 border-t border-[var(--color-border)] font-mono text-[11px] text-accent hover:bg-[var(--color-panel-2)]"
            >
              See all results for &ldquo;{q}&rdquo; →
            </button>
          </div>
        ) : null}
      </form>

      <div className="flex-1" />

      <button
        onClick={toggleTheme}
        title="Toggle theme"
        className="hidden sm:flex items-center justify-center h-8 w-8 border border-[var(--color-border-strong)] text-[var(--color-text-2)] bg-transparent cursor-pointer hover:bg-[var(--color-panel-3)]"
      >
        ◐
      </button>

      <button
        onClick={toggle}
        className="hidden md:flex items-center gap-2 h-8 px-2.5 bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-2)] font-sans font-bold text-[11px] tracking-[0.06em] cursor-pointer hover:bg-[var(--color-panel-3)]"
      >
        COMMANDS <span className="font-mono text-[10px] text-[var(--color-muted)]">⌘K</span>
      </button>

      <Link
        href="/capture"
        className="h-8 flex items-center px-3.5 bg-accent text-[var(--color-panel)] no-underline font-sans font-extrabold text-xs tracking-[0.04em] hover:bg-[var(--color-accent-hover)]"
      >
        + CAPTURE
      </Link>

      {authed ? (
        <form action={logoutAction}>
          <button
            type="submit"
            className="hidden sm:block font-sans font-bold text-[11px] tracking-[0.04em] text-[var(--color-muted)] bg-transparent border-0 cursor-pointer hover:text-accent"
          >
            LOG OUT
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className="hidden sm:block font-sans font-bold text-[11px] tracking-[0.04em] text-[var(--color-muted)] no-underline hover:text-accent"
        >
          LOG IN
        </Link>
      )}
    </header>
  );
}
