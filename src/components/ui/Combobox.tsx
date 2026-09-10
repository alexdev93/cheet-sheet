"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * A searchable, keyboard-navigable dropdown over a list of string options —
 * replaces the native <input list> + <datalist> combo (which Chrome renders
 * with browser-chrome styling that can't be themed and has no keyboard
 * affordance beyond arrow-down). Free text is still allowed: this filters
 * suggestions as you type, it doesn't restrict input to the option list.
 * Options beyond `maxVisible` stay reachable by scrolling the list rather
 * than being cut off, which is enough "pagination" at personal-project scale
 * (tens to low hundreds of domains/collections) without server-side paging.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  name,
  className,
  maxVisible = 8,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  maxVisible?: number;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, value]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative flex-1">
      <input
        name={name}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            if (filtered[highlight]) {
              e.preventDefault();
              select(filtered[highlight]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
      />
      {open && filtered.length > 0 ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-20 top-full left-0 right-0 mt-1 max-h-[calc(2rem*var(--kmc-combobox-max-visible))] overflow-y-auto bg-[var(--color-panel-3)] border border-[var(--color-border-strong)] shadow-2xl"
          style={{ "--kmc-combobox-max-visible": maxVisible } as React.CSSProperties}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                select(opt);
              }}
              onMouseEnter={() => setHighlight(i)}
              className="h-8 flex items-center px-2.5 font-mono text-xs cursor-pointer"
              style={{
                background: i === highlight ? "var(--color-panel-2)" : "transparent",
                color: i === highlight ? "var(--color-text)" : "var(--color-text-2)",
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
