"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMobileNav } from "@/components/layout/MobileNavProvider";
import { MODES } from "@/components/layout/ModeRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { toggleTheme } from "@/lib/theme";
import { logoutAction } from "@/server/auth-actions";
import type { TreeDomain } from "@/server/tree";
import type { NoteSummary } from "@/types/note";

/**
 * Everything the desktop layout splits across the ModeRail + Sidebar + a few
 * TopBar buttons that are `hidden` below their breakpoints, collected into
 * one slide-over so small screens have a working equivalent for all of it —
 * mode switching, the domain tree, theme, and login/logout.
 */
export function MobileNavDrawer({
  authed,
  tree,
  recent,
  noteCount,
}: {
  authed: boolean;
  tree: TreeDomain[];
  recent: NoteSummary[];
  noteCount: number;
}) {
  const { open, setOpen } = useMobileNav();
  const pathname = usePathname();

  // Close on navigation — derived during render (see Sidebar/CommandPalette
  // for the same pattern) rather than an effect, since a plain <Link> click
  // doesn't give us a hook to close the drawer from directly.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 border-0 cursor-pointer"
      />

      <div className="relative w-[82vw] max-w-[300px] h-full flex flex-col bg-[var(--color-panel)] border-r border-[var(--color-border)] animate-[var(--animate-kmc-slide-in)]">
        <div className="h-[52px] flex-none flex items-center justify-between px-3.5 border-b border-[var(--color-border)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="block w-[20px] h-[20px] flex-none bg-accent" />
            <span className="font-sans font-extrabold text-sm text-[var(--color-text)]">
              memory<span className="text-[var(--color-muted)]">/center</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 flex-none flex items-center justify-center bg-transparent border-0 cursor-pointer text-[var(--color-text-2)] font-mono text-base"
          >
            ✕
          </button>
        </div>

        <nav className="flex-none border-b border-[var(--color-border)] py-1.5" aria-label="Modes">
          {MODES.map((m) => {
            const active = m.exact ? pathname === m.href : pathname?.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className="flex items-center gap-3 h-11 px-3.5 no-underline border-l-2"
                style={{
                  color: active ? "var(--color-text)" : "var(--color-text-2)",
                  background: active ? "var(--color-panel-3)" : "transparent",
                  borderColor: active ? "var(--color-accent)" : "transparent",
                }}
              >
                <span
                  className="w-5 flex-none font-mono text-[15px] text-center"
                  style={{ color: active ? "var(--color-accent)" : "var(--color-muted)" }}
                >
                  {m.glyph}
                </span>
                <span className="font-sans font-bold text-[13.5px] tracking-[-0.01em]">{m.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Sidebar tree={tree} recent={recent} noteCount={noteCount} variant="drawer" />
        </div>

        <div className="flex-none border-t border-[var(--color-border)] flex items-center justify-between px-3.5 h-[52px]">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--color-text-2)] bg-transparent border-0 cursor-pointer h-9"
          >
            <span aria-hidden="true">◐</span> THEME
          </button>
          {authed ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="font-sans font-bold text-[11px] tracking-[0.04em] text-[var(--color-muted)] bg-transparent border-0 cursor-pointer hover:text-accent h-9"
              >
                LOG OUT
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="font-sans font-bold text-[11px] tracking-[0.04em] text-[var(--color-muted)] no-underline hover:text-accent"
            >
              LOG IN
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
