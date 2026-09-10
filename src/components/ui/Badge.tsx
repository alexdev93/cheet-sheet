import { NOTE_TYPE_LABELS } from "@/lib/detect";
import type { NoteType } from "@/generated/prisma/client";

export function TypeBadge({ type, className = "" }: { type: NoteType; className?: string }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase bg-accent text-[var(--color-panel)] px-[7px] py-[5px] ${className}`}
    >
      {NOTE_TYPE_LABELS[type]}
    </span>
  );
}
