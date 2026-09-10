"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { usePalette } from "@/components/palette/PaletteProvider";
import { toggleTheme } from "@/lib/theme";
import { logoutAction } from "@/server/auth-actions";

export function TopBar({ authed }: { authed: boolean }) {
  const router = useRouter();
  const { toggle } = usePalette();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
  }

  return (
    <header className="h-[52px] flex-none flex items-center gap-3.5 px-3.5 border-b border-[var(--color-border)] bg-[var(--color-panel)]">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <span className="block w-[22px] h-[22px] bg-accent" />
        <span className="font-sans font-extrabold text-sm tracking-[-0.01em] text-[var(--color-text)]">
          memory<span className="text-[var(--color-muted)]">/center</span>
        </span>
      </Link>

      <div className="w-0.5 h-6 bg-[var(--color-border)] hidden sm:block" />

      <form onSubmit={onSubmit} className="flex-1 flex items-center gap-2 max-w-[520px] h-8 px-2.5 bg-[var(--color-panel-3)] border border-[var(--color-border)]">
        <span className="font-mono text-[13px] text-[var(--color-muted)]">◐</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search knowledge"
          className="flex-1 bg-transparent border-0 outline-none text-[var(--color-text)] font-mono text-[13px]"
        />
        <span className="font-mono font-medium text-[10px] text-[var(--color-muted)] border border-[var(--color-border)] px-[5px] py-0.5">/</span>
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
