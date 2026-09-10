import { notFound } from "next/navigation";
import { getNoteBySlug } from "@/server/notes";
import { listDomainOptions } from "@/server/tree";
import { listAllTags } from "@/server/notes";
import { db } from "@/lib/db";
import { NoteEditForm } from "@/components/note/NoteEditForm";

export default async function EditNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [note, domains, tags, noteOptions] = await Promise.all([
    getNoteBySlug(slug, { includeUnpublished: true }),
    listDomainOptions(),
    listAllTags(),
    db.note.findMany({ where: { slug: { not: slug } }, select: { slug: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  if (!note) notFound();

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8">
      <NoteEditForm
        note={note}
        domainOptions={domains.map((d) => ({ name: d.name, collections: d.collections }))}
        noteOptions={noteOptions}
        tagSuggestions={tags.map((t) => t.name)}
      />
    </div>
  );
}
