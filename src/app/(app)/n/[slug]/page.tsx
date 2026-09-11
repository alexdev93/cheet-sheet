import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNoteBySlug, listAllTags } from "@/server/notes";
import { listDomainOptions } from "@/server/tree";
import { db } from "@/lib/db";
import { NoteDetailView } from "@/components/note/NoteDetailView";
import { RightRail } from "@/components/note/RightRail";
import { SetPaletteContext } from "@/components/palette/SetPaletteContext";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNoteBySlug(slug, { includeUnpublished: true });
  if (!note) return {};
  return { title: note.title, description: note.summary ?? undefined };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const note = await getNoteBySlug(slug, { includeUnpublished: !!session });
  if (!note) notFound();

  const canEdit = !!session;
  let domainOptions: { name: string; collections: { name: string }[] }[] = [];
  let noteOptions: { slug: string; title: string }[] = [];
  let tagSuggestions: string[] = [];
  if (canEdit) {
    const [domains, tags, notes] = await Promise.all([
      listDomainOptions(),
      listAllTags(),
      db.note.findMany({ where: { slug: { not: slug } }, select: { slug: true, title: true }, orderBy: { title: "asc" } }),
    ]);
    domainOptions = domains.map((d) => ({ name: d.name, collections: d.collections }));
    tagSuggestions = tags.map((t) => t.name);
    noteOptions = notes;
  }

  return (
    <div className="flex-1 flex min-h-0">
      <SetPaletteContext slug={note.slug} title={note.title} />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[780px] px-6 sm:px-10 py-6 pb-20 mx-auto lg:mx-0">
          <NoteDetailView
            note={note}
            canEdit={canEdit}
            domainOptions={domainOptions}
            noteOptions={noteOptions}
            tagSuggestions={tagSuggestions}
          />
        </div>
      </div>
      <RightRail note={note} />
    </div>
  );
}
