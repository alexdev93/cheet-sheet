"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { detectNoteType } from "@/lib/detect";
import { captureInputSchema, noteInputSchema } from "@/lib/validation";
import * as notesService from "@/server/notes";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Authentication required.");
  return session;
}

export async function quickCaptureAction(formData: FormData) {
  const session = await requireSession();

  const raw = {
    text: String(formData.get("text") ?? ""),
    type: (formData.get("type") as string) || detectNoteType(String(formData.get("text") ?? "")),
    domainName: (formData.get("domainName") as string) || null,
    collectionName: (formData.get("collectionName") as string) || null,
    tags: formData.getAll("tags").map(String),
  };
  const parsed = captureInputSchema.parse(raw);

  const isCommand = parsed.type === "COMMAND";
  const title = parsed.text.trim().split("\n")[0]!.slice(0, 120) || "Untitled capture";

  const note = await notesService.createNote(
    {
      title,
      summary: null,
      type: parsed.type,
      status: "PUBLISHED",
      domainName: parsed.domainName,
      collectionName: parsed.collectionName,
      tags: parsed.tags,
      sections: [
        isCommand
          ? { heading: "Command", kind: "CODE", code: parsed.text.trim(), codeLang: "shell", items: [], tabs: [], highlightLines: [] }
          : { heading: "Notes", kind: "TEXT", body: parsed.text.trim(), items: [], tabs: [], highlightLines: [] },
      ],
      links: [],
    },
    session.sub
  );

  revalidatePath("/", "layout");
  redirect(`/n/${note.slug}`);
}

export async function createNoteAction(input: unknown) {
  const session = await requireSession();
  const parsed = noteInputSchema.parse(input);
  const note = await notesService.createNote(parsed, session.sub);
  revalidatePath("/", "layout");
  return note;
}

export async function updateNoteAction(slug: string, input: unknown) {
  const session = await requireSession();
  const parsed = noteInputSchema.parse(input);
  const note = await notesService.updateNote(slug, parsed, session.sub);
  revalidatePath("/", "layout");
  revalidatePath(`/n/${note.slug}`);
  return note;
}

export async function archiveNoteAction(slug: string) {
  await requireSession();
  await notesService.setNoteStatus(slug, "ARCHIVED");
  revalidatePath("/", "layout");
}

export async function toggleFavoriteAction(slug: string) {
  await requireSession();
  const favorite = await notesService.toggleFavorite(slug);
  revalidatePath(`/n/${slug}`);
  return favorite;
}

/** Public: recording "used Nx" doesn't require auth, it just tracks read-time usage (e.g. copying a command). */
export async function recordNoteUseAction(slug: string) {
  await notesService.recordNoteUse(slug);
  revalidatePath(`/n/${slug}`);
}
