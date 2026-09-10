"use client";

import { useState, useTransition } from "react";
import { highlightCode, type TokenKind } from "@/lib/highlight";
import { recordNoteUseAction } from "@/server/actions";

const TOKEN_COLOR: Record<TokenKind, string> = {
  default: "var(--code-default)",
  comment: "var(--code-comment)",
  string: "var(--code-string)",
  flag: "var(--code-flag)",
  keyword: "var(--code-keyword)",
  number: "var(--code-number)",
};

export function CodeBlock({
  code,
  lang,
  title,
  highlightLines = [],
  noteSlug,
}: {
  code: string;
  lang: string;
  title?: string;
  highlightLines?: number[];
  noteSlug?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const lines = highlightCode(code, lang, highlightLines);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      if (noteSlug) startTransition(() => recordNoteUseAction(noteSlug));
    } catch {
      // Clipboard API can be unavailable (insecure context, permissions) — fail silently, the code is still selectable.
    }
  }

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-bg)] mb-3">
      <div className="flex items-center justify-between h-[30px] pl-[10px] pr-2 border-b border-[var(--color-border)] bg-[var(--color-panel-2)]">
        <span className="font-mono text-[11px] text-[var(--color-text-3)] truncate">{title || lang}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.08em] text-[var(--color-muted-2)]">{lang.toUpperCase()}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 h-[22px] px-2 border font-sans font-bold text-[10px] tracking-[0.08em] cursor-pointer transition-colors"
            style={{
              borderColor: copied ? "var(--color-accent)" : "var(--color-border-strong)",
              color: copied ? "var(--color-accent)" : "var(--color-text-3)",
            }}
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
      </div>
      <div className="py-[10px] overflow-x-auto">
        {lines.map((line) => (
          <div
            key={line.number}
            className="flex gap-3.5 px-3"
            style={{ background: line.highlighted ? "rgba(255,86,60,.09)" : "transparent" }}
          >
            <span className="flex-none w-[18px] text-right font-mono text-[12.5px] leading-[1.75] text-[var(--color-border-strong)] select-none">
              {line.number}
            </span>
            <span className="flex-1 font-mono text-[12.5px] leading-[1.75] whitespace-pre">
              {line.tokens.map((t, i) => (
                <span key={i} style={{ color: TOKEN_COLOR[t.kind] }}>
                  {t.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
