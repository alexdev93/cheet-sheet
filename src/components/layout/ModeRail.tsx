"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MODES = [
  { href: "/", glyph: "⌂", label: "Browse", exact: true },
  { href: "/search", glyph: "◐", label: "Search", exact: false },
  { href: "/graph", glyph: "◎", label: "Explore", exact: false },
  { href: "/capture", glyph: "⌁", label: "Capture", exact: false },
  { href: "/history", glyph: "↺", label: "History", exact: false },
];

export function ModeRail() {
  const pathname = usePathname();

  return (
    <div className="w-12 flex-none border-r border-[var(--color-border)] bg-[var(--color-panel)] hidden sm:flex flex-col items-center pt-2.5 gap-0.5">
      {MODES.map((m) => {
        const active = m.exact ? pathname === m.href : pathname?.startsWith(m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            title={m.label}
            className="w-[34px] h-[34px] flex items-center justify-center font-mono text-[15px] no-underline"
            style={{
              background: active ? "var(--color-panel-3)" : "transparent",
              color: active ? "var(--color-accent)" : "var(--color-muted)",
            }}
          >
            {m.glyph}
          </Link>
        );
      })}
    </div>
  );
}
