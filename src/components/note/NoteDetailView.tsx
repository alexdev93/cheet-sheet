"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Attachments } from "@/components/note/Attachments";
import { NoteEditForm } from "@/components/note/NoteEditForm";
import { NoteHeader } from "@/components/note/NoteHeader";
import { Section } from "@/components/note/Section";
import type { NoteDetail } from "@/types/note";

/**
 * Toggles the note detail page between reading and editing in place —
 * clicking EDIT swaps in the same form the standalone /n/[slug]/edit route
 * uses, and saving (when the slug didn't change) swaps back to the read
 * view and refreshes server data, without a route navigation either way.
 */
export function NoteDetailView({
  note,
  canEdit,
  domainOptions,
  noteOptions,
  tagSuggestions,
}: {
  note: NoteDetail;
  canEdit: boolean;
  domainOptions: { name: string; collections: { name: string }[] }[];
  noteOptions: { slug: string; title: string }[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <NoteEditForm
        note={note}
        domainOptions={domainOptions}
        noteOptions={noteOptions}
        tagSuggestions={tagSuggestions}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <NoteHeader note={note} canEdit={canEdit} onEditClick={canEdit ? () => setEditing(true) : undefined} />
      <div className="mt-6">
        {note.sections.map((s) => (
          <Section key={s.id} section={s} noteSlug={note.slug} />
        ))}
        <Attachments attachments={note.attachments} />
      </div>
    </>
  );
}
