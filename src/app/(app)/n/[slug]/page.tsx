import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNoteBySlug } from "@/server/notes";
import { NoteHeader } from "@/components/note/NoteHeader";
import { Section } from "@/components/note/Section";
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

  return (
    <div className="flex-1 flex min-h-0">
      <SetPaletteContext title={note.title} />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[780px] px-6 sm:px-10 py-6 pb-20 mx-auto lg:mx-0">
          <NoteHeader note={note} canEdit={!!session} />
          <div className="mt-6">
            {note.sections.map((s) => (
              <Section key={s.id} section={s} noteSlug={note.slug} />
            ))}
          </div>
        </div>
      </div>
      <RightRail note={note} />
    </div>
  );
}
