import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listNotesByDomain } from "@/server/notes";
import { NoteGrid } from "@/components/note/NoteCard";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const data = await listNotesByDomain(domain);
  return { title: data?.domainName ?? "Domain" };
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const data = await listNotesByDomain(domain);
  if (!data) notFound();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-10">
        <div className="font-mono text-[11px] text-[var(--color-muted)] mb-2">DOMAIN</div>
        <h1 className="text-[30px] mb-6">{data.domainName}</h1>
        <NoteGrid notes={data.notes} empty="No published notes in this domain yet." />
      </div>
    </div>
  );
}
