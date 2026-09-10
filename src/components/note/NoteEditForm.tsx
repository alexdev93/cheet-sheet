"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NOTE_TYPE_LABELS } from "@/lib/detect";
import { createNoteAction, updateNoteAction } from "@/server/actions";
import { AttachmentManager } from "@/components/note/AttachmentManager";
import { Combobox } from "@/components/ui/Combobox";
import { MarkdownField } from "@/components/ui/MarkdownField";
import type { NoteInput, SectionInput } from "@/lib/validation";
import type { NoteDetail } from "@/types/note";
import type { NoteStatus, NoteType } from "@/generated/prisma/client";

type EditableSection = SectionInput & { tabsText: string };
type EditableLink = { targetSlug: string; relation: string };

const TYPES: NoteType[] = [
  "NOTE", "COMMAND", "CODE_SNIPPET", "PROCEDURE", "RUNBOOK", "ALGORITHM",
  "CONCEPT", "TROUBLESHOOTING", "REFERENCE", "FLASHCARD", "CHECKLIST", "PATH",
];
const STATUSES: NoteStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function emptySection(): EditableSection {
  return { heading: "", kind: "TEXT", body: "", items: [], warning: "", codeTitle: "", codeLang: "shell", code: "", highlightLines: [], tabs: [], tabsText: "" };
}

export function NoteEditForm({
  note,
  domainOptions,
  noteOptions,
  tagSuggestions,
}: {
  note: NoteDetail | null;
  domainOptions: { name: string; collections: { name: string }[] }[];
  noteOptions: { slug: string; title: string }[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(note?.title ?? "");
  const [slug, setSlug] = useState(note?.slug ?? "");
  const [summary, setSummary] = useState(note?.summary ?? "");
  const [type, setType] = useState<NoteType>(note?.type ?? "NOTE");
  const [status, setStatus] = useState<NoteStatus>(note?.status ?? "PUBLISHED");
  const [domain, setDomain] = useState(note?.domain?.name ?? "");
  const [collection, setCollection] = useState(note?.collection?.name ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [sections, setSections] = useState<EditableSection[]>(
    note && note.sections.length > 0
      ? note.sections.map((s) => ({
          heading: s.heading,
          kind: s.kind,
          body: s.body ?? "",
          items: s.items,
          warning: s.warning ?? "",
          codeTitle: s.codeTitle ?? "",
          codeLang: s.codeLang ?? "shell",
          code: s.code ?? "",
          highlightLines: s.highlightLines,
          tabs: s.tabs,
          tabsText: s.tabs.map((t) => `${t.label}|${t.lang}|${t.code.replace(/\n/g, "\\n")}`).join("\n"),
        }))
      : [emptySection()]
  );
  const [links, setLinks] = useState<EditableLink[]>(
    note ? note.linksOut.map((l) => ({ targetSlug: l.note.slug, relation: l.relation })) : []
  );

  const collectionsForDomain = domainOptions.find((d) => d.name === domain)?.collections ?? [];

  function updateSection(i: number, patch: Partial<EditableSection>) {
    setSections((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function parseTabsText(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, lang, code] = line.split("|");
        return { label: label ?? "tab", lang: lang ?? "shell", code: (code ?? "").replace(/\\n/g, "\n") };
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: NoteInput = {
      title,
      slug: slug || undefined,
      summary: summary || null,
      type,
      status,
      domainName: domain || null,
      collectionName: collection || null,
      tags,
      sections: sections
        .filter((s) => s.heading.trim())
        .map((s) => ({
          heading: s.heading,
          kind: s.kind,
          body: s.body || null,
          items: s.items,
          warning: s.warning || null,
          codeTitle: s.codeTitle || null,
          codeLang: s.codeLang || null,
          code: s.code || null,
          highlightLines: s.highlightLines,
          tabs: parseTabsText(s.tabsText),
        })),
      links: links.filter((l) => l.targetSlug && l.relation),
    };

    startTransition(async () => {
      try {
        const result = note ? await updateNoteAction(note.slug, payload) : await createNoteAction(payload);
        router.push(`/n/${result.slug}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save the note.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[820px] pb-20">
      <h1 className="text-[24px] mb-5">{note ? `Edit “${note.title}”` : "New note"}</h1>

      {error ? <p className="mb-4 text-sm text-accent">{error}</p> : null}

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Slug (optional override)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" className={inputClass} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as NoteStatus)} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Summary">
        <textarea value={summary ?? ""} onChange={(e) => setSummary(e.target.value)} rows={2} className={inputClass} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as NoteType)} className={inputClass}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {NOTE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Domain">
          <Combobox
            value={domain}
            onChange={(v) => {
              setDomain(v);
              setCollection("");
            }}
            options={domainOptions.map((d) => d.name)}
            className={inputClass}
          />
        </Field>
        <Field label="Collection">
          <Combobox value={collection} onChange={setCollection} options={collectionsForDomain.map((c) => c.name)} className={inputClass} />
        </Field>
      </div>

      <Field label="Tags">
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTags((arr) => arr.filter((x) => x !== t))}
              className="font-mono text-[11px] px-2 py-1.5 border border-accent text-accent bg-[var(--color-warn-bg)] cursor-pointer"
            >
              #{t} ×
            </button>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const v = tagDraft.trim();
                if (v && !tags.includes(v)) setTags((arr) => [...arr, v]);
                setTagDraft("");
              }
            }}
            list="tag-suggestions"
            placeholder="+ tag"
            className="w-24 h-[26px] px-1.5 bg-transparent border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-2)] font-mono text-[11px] outline-none"
          />
          <datalist id="tag-suggestions">
            {tagSuggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </Field>

      <hr className="h-0.5 border-0 bg-[var(--color-border)] my-6" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-extrabold">Sections</h2>
        <button
          type="button"
          onClick={() => setSections((arr) => [...arr, emptySection()])}
          className="font-mono text-[10px] font-bold px-2 py-1.5 border border-[var(--color-border-strong)] text-[var(--color-text-2)] cursor-pointer"
        >
          + SECTION
        </button>
      </div>

      {sections.map((s, i) => (
        <div key={i} className="border border-[var(--color-border)] p-3.5 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={s.heading}
              onChange={(e) => updateSection(i, { heading: e.target.value })}
              placeholder="Heading (e.g. Command, Steps, Warning)"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => setSections((arr) => arr.filter((_, idx) => idx !== i))}
              className="font-mono text-xs text-[var(--color-muted)] px-2 h-8 border border-[var(--color-border-strong)] cursor-pointer"
            >
              remove
            </button>
          </div>

          <Field label="Body (markdown, optional)">
            <MarkdownField value={s.body ?? ""} onChange={(v) => updateSection(i, { body: v })} rows={3} className={inputClass} />
          </Field>

          <Field label="List items — one per line (3+ becomes a step-through)">
            <textarea
              value={s.items.join("\n")}
              onChange={(e) => updateSection(i, { items: e.target.value.split("\n") })}
              rows={3}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Code title">
              <input value={s.codeTitle ?? ""} onChange={(e) => updateSection(i, { codeTitle: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Language">
              <input value={s.codeLang ?? ""} onChange={(e) => updateSection(i, { codeLang: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Code">
            <textarea value={s.code ?? ""} onChange={(e) => updateSection(i, { code: e.target.value })} rows={4} className={`${inputClass} font-mono`} />
          </Field>

          <Field label="Warning (optional)">
            <textarea value={s.warning ?? ""} onChange={(e) => updateSection(i, { warning: e.target.value })} rows={2} className={inputClass} />
          </Field>

          <Field label="Shell variant tabs — one per line: label|lang|code (use \n for newlines)">
            <textarea
              value={s.tabsText}
              onChange={(e) => updateSection(i, { tabsText: e.target.value })}
              rows={2}
              placeholder="PowerShell|powershell|docker system prune -af"
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>
      ))}

      <hr className="h-0.5 border-0 bg-[var(--color-border)] my-6" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-extrabold">Links</h2>
        <button
          type="button"
          onClick={() => setLinks((arr) => [...arr, { targetSlug: "", relation: "related" }])}
          className="font-mono text-[10px] font-bold px-2 py-1.5 border border-[var(--color-border-strong)] text-[var(--color-text-2)] cursor-pointer"
        >
          + LINK
        </button>
      </div>
      {links.map((l, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            value={l.targetSlug}
            onChange={(e) => setLinks((arr) => arr.map((x, idx) => (idx === i ? { ...x, targetSlug: e.target.value } : x)))}
            list="note-options"
            placeholder="target note slug"
            className={`${inputClass} flex-1`}
          />
          <input
            value={l.relation}
            onChange={(e) => setLinks((arr) => arr.map((x, idx) => (idx === i ? { ...x, relation: e.target.value } : x)))}
            placeholder="relation (e.g. related, uses, cause of)"
            className={`${inputClass} w-56`}
          />
          <button
            type="button"
            onClick={() => setLinks((arr) => arr.filter((_, idx) => idx !== i))}
            className="font-mono text-xs text-[var(--color-muted)] px-2 border border-[var(--color-border-strong)] cursor-pointer"
          >
            remove
          </button>
        </div>
      ))}
      <datalist id="note-options">
        {noteOptions.map((n) => (
          <option key={n.slug} value={n.slug}>
            {n.title}
          </option>
        ))}
      </datalist>

      {note ? (
        <>
          <hr className="h-0.5 border-0 bg-[var(--color-border)] my-6" />
          <h2 className="text-[15px] font-extrabold mb-3">Attachments</h2>
          <AttachmentManager noteSlug={note.slug} initial={note.attachments} />
        </>
      ) : null}

      <div className="flex gap-2.5 mt-8">
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="h-9 px-4 bg-accent text-[var(--color-panel)] font-sans font-extrabold text-xs disabled:opacity-50"
        >
          {pending ? "SAVING…" : "SAVE NOTE"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-2.5 py-2 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text-2)] text-sm outline-none focus-visible:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block font-mono text-[10.5px] tracking-[0.06em] uppercase text-[var(--color-muted)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
