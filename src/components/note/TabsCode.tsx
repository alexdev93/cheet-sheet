"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/note/CodeBlock";

export function TabsCode({
  tabs,
  noteSlug,
}: {
  tabs: { label: string; lang: string; code: string }[];
  noteSlug?: string;
}) {
  const [active, setActive] = useState(0);
  const tab = tabs[Math.min(active, tabs.length - 1)];
  if (!tab) return null;

  return (
    <div className="mb-3">
      <div className="flex items-stretch border border-b-0 border-[var(--color-border)] bg-[var(--color-panel-2)]">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className="px-3 py-2 cursor-pointer font-sans font-bold text-[11px] tracking-[0.04em] border-r border-[var(--color-border)] last:border-r-0"
            style={{
              background: i === active ? "var(--color-accent)" : "transparent",
              color: i === active ? "var(--color-panel)" : "var(--color-text-3)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock code={tab.code} lang={tab.lang} title={tab.label} noteSlug={noteSlug} />
    </div>
  );
}
