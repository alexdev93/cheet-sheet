import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listNotesByTag } from "@/server/notes";
import { FilterableNoteList } from "@/components/note/FilterableNoteList";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const data = await listNotesByTag(tag);
  return { title: data ? `#${data.tagName}` : "Tag" };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const data = await listNotesByTag(tag);
  if (!data) notFound();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-10">
        <div className="font-mono text-[11px] text-[var(--color-muted)] mb-2">TAG</div>
        <h1 className="text-[30px] mb-6 font-mono">#{data.tagName}</h1>
        <FilterableNoteList notes={data.notes} empty="No published notes with this tag yet." />
      </div>
    </div>
  );
}
