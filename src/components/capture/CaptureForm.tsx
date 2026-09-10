"use client";

import { useMemo, useState } from "react";
import { detectNoteType, NOTE_TYPE_LABELS } from "@/lib/detect";
import { quickCaptureAction } from "@/server/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { NoteType } from "@/generated/prisma/client";

const SHAPES: NoteType[] = ["COMMAND", "PROCEDURE", "TROUBLESHOOTING", "REFERENCE", "PATH"];

export function CaptureForm({
  domainOptions,
  tagSuggestions,
}: {
  domainOptions: { name: string; collections: { name: string }[] }[];
  tagSuggestions: string[];
}) {
  const [text, setText] = useState("");
  const [shape, setShape] = useState<NoteType | null>(null);
  const [domain, setDomain] = useState("");
  const [collection, setCollection] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  const detected = useMemo(() => detectNoteType(text), [text]);
  const effectiveType = shape ?? detected;
  const step1 = text.trim().length > 0;
  const step2 = !!shape;
  const step3 = tags.length > 0;

  const suggested = useMemo(() => {
    const lower = text.toLowerCase();
    return tagSuggestions.filter((t) => lower.includes(t.toLowerCase())).slice(0, 6);
  }, [text, tagSuggestions]);

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function addTagFromDraft() {
    const v = tagDraft.trim();
    if (v && !tags.includes(v)) setTags((t) => [...t, v]);
    setTagDraft("");
  }

  const collectionsForDomain = domainOptions.find((d) => d.name === domain)?.collections ?? [];

  return (
    <form action={quickCaptureAction} className="max-w-[820px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[22px]">Capture</h3>
      </div>
      <p className="text-[13.5px] text-[var(--color-muted)] mb-4.5">
        Write first. Everything below the rule is optional and can be filled in later.
      </p>

      <div className="flex items-center mb-5 gap-2.5">
        {[
          { n: 1, label: "WRITE", done: step1 },
          { n: 2, label: "SHAPE", done: step2 },
          { n: 3, label: "CONNECT", done: step3 },
        ].map((s, i, arr) => (
          <div key={s.n} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 flex-none flex items-center justify-center font-mono font-bold text-[10px] border"
                style={{
                  background: s.done ? "var(--color-accent)" : "transparent",
                  color: s.done ? "var(--color-panel)" : "var(--color-muted-2)",
                  borderColor: s.done ? "var(--color-accent)" : "var(--color-border-strong)",
                }}
              >
                {s.n}
              </span>
              <span
                className="font-sans font-bold text-[11px] tracking-[0.04em]"
                style={{ color: s.done ? "var(--color-text)" : "var(--color-muted-2)" }}
              >
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 ? <span className="w-6.5 h-px bg-[var(--color-border)] mx-2.5" /> : null}
          </div>
        ))}
      </div>

      <textarea
        name="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the command, or start typing what you just learned…"
        required
        className="w-full min-h-[250px] bg-[var(--color-bg)] border border-[var(--color-border)] border-l-2 border-l-accent text-[var(--color-text)] font-mono text-sm leading-[1.75] p-3.5 outline-none resize-y"
      />
      <input type="hidden" name="type" value={effectiveType} />

      <div className="flex items-center gap-2.5 mt-2.5 font-mono text-[11.5px] text-[var(--color-muted)] flex-wrap">
        <span className="text-[var(--color-muted-2)]">{text.length} characters</span>
        <span className="text-[var(--color-border-strong)]">·</span>
        <span>
          Detected shape: <span className="text-accent">{NOTE_TYPE_LABELS[effectiveType]}</span>
        </span>
        <span className="text-[var(--color-border-strong)]">·</span>
        <span>⌘⏎ to save</span>
      </div>

      <hr className="h-0.5 border-0 bg-[var(--color-border)] my-5.5" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="font-sans font-bold text-[10px] tracking-[0.12em] text-[var(--color-text-3)] mb-2.5">SHAPE</div>
          <div className="flex flex-wrap gap-1.5">
            {SHAPES.map((s) => {
              const active = shape === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setShape(active ? null : s)}
                  className="font-mono text-[10px] font-bold tracking-[0.08em] px-2.5 py-2 border cursor-pointer"
                  style={{
                    background: active ? "var(--color-accent)" : "transparent",
                    color: active ? "var(--color-panel)" : "var(--color-text-2)",
                    borderColor: active ? "var(--color-accent)" : "var(--color-border-strong)",
                  }}
                >
                  {NOTE_TYPE_LABELS[s].toUpperCase()}
                </button>
              );
            })}
          </div>
          <p className="text-[12.5px] text-[var(--color-muted)] mt-3 leading-[1.6]">
            Picking a shape only sets the note type. It never blocks saving.
          </p>
        </div>

        <div>
          <div className="font-sans font-bold text-[10px] tracking-[0.12em] text-[var(--color-text-3)] mb-2.5">FILE IT (OPTIONAL)</div>
          <div className="flex gap-2 mb-2.5">
            <input
              name="domainName"
              list="domain-options"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setCollection("");
              }}
              placeholder="Domain (e.g. Docker)"
              className="flex-1 h-8 px-2.5 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text-2)] font-mono text-xs outline-none"
            />
            <input
              name="collectionName"
              list="collection-options"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="Collection"
              disabled={!domain}
              className="flex-1 h-8 px-2.5 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text-2)] font-mono text-xs outline-none disabled:opacity-50"
            />
            <datalist id="domain-options">
              {domainOptions.map((d) => (
                <option key={d.name} value={d.name} />
              ))}
            </datalist>
            <datalist id="collection-options">
              {collectionsForDomain.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {suggested.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="font-mono text-[11px] px-2 py-1.5 border cursor-pointer"
                  style={{
                    background: on ? "var(--color-warn-bg)" : "transparent",
                    color: on ? "var(--color-accent)" : "var(--color-text-3)",
                    borderColor: on ? "var(--color-accent)" : "var(--color-border)",
                  }}
                >
                  #{tag}
                </button>
              );
            })}
            {tags
              .filter((t) => !suggested.includes(t))
              .map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="font-mono text-[11px] px-2 py-1.5 border border-accent text-accent bg-[var(--color-warn-bg)] cursor-pointer"
                >
                  #{tag} ×
                </button>
              ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTagFromDraft();
                }
              }}
              onBlur={addTagFromDraft}
              placeholder="+ tag"
              className="w-20 h-[26px] px-1.5 bg-transparent border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-2)] font-mono text-[11px] outline-none"
            />
          </div>
          {tags.map((t) => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}
          <p className="text-[12.5px] text-[var(--color-muted)] mt-3 leading-[1.6]">
            Tags suggested from the text. Nothing is applied until you click.
          </p>
        </div>
      </div>

      <div className="flex gap-2.5 mt-6.5">
        <SubmitButton pendingLabel="SAVING…" disabled={!step1}>
          SAVE NOTE
        </SubmitButton>
      </div>
    </form>
  );
}
