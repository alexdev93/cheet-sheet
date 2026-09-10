"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function StepList({ items }: { items: string[] }) {
  const isSteppable = items.length >= 3;
  const [stepMode, setStepMode] = useState(isSteppable);
  const [idx, setIdx] = useState(0);

  if (!isSteppable || !stepMode) {
    return (
      <ol className="m-0 mb-3 pl-5 text-[15px] leading-[1.75] text-[var(--color-text-2)] list-decimal">
        {items.map((it, i) => (
          <li key={i} className="pl-0.5">
            {it}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-bg)] mb-3">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <span className="font-mono font-bold text-[10px] tracking-[0.06em] text-[var(--color-text-3)]">
          STEP {idx + 1} OF {items.length}
        </span>
        <button
          onClick={() => setStepMode(false)}
          className="border border-[var(--color-border-strong)] text-[var(--color-text-3)] font-sans font-bold text-[10px] tracking-[0.06em] px-2 py-[5px] cursor-pointer hover:border-accent hover:text-accent"
        >
          VIEW ALL
        </button>
      </div>
      <div className="px-3.5 py-4 min-h-[44px]">
        <p className="m-0 text-[15px] leading-[1.6] text-[var(--color-text-2)]">{items[idx]}</p>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-border)]">
        <div className="flex gap-[5px]">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Step ${i + 1}`}
              onClick={() => setIdx(i)}
              className="w-[7px] h-[7px] cursor-pointer"
              style={{ background: i === idx ? "var(--color-accent)" : "var(--color-border)" }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="h-auto py-1.5 px-2.5 text-[10px]" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
            BACK
          </Button>
          <Button className="h-auto py-1.5 px-2.5 text-[10px]" disabled={idx === items.length - 1} onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}>
            NEXT
          </Button>
        </div>
      </div>
    </div>
  );
}
