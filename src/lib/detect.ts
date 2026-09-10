import type { NoteType } from "@/generated/prisma/client";

/**
 * Best-effort shape guess from raw capture text, shared by the client (for
 * instant feedback while typing) and the server (as the source of truth when
 * a note is actually saved). Deliberately shallow — capture must never block
 * on getting this right, see README "Capture never blocks on metadata".
 */
export function detectNoteType(text: string): NoteType {
  const trimmed = text.trim();
  if (!trimmed) return "NOTE";
  if (/^\s*(\$|docker|kubectl|git|psql|sudo|mvn|npm|curl|yarn|pnpm)\b/i.test(trimmed)) return "COMMAND";
  if (/^\s*\d+[.)]\s/m.test(trimmed)) return "PROCEDURE";
  if (/\b(error|failed|exception|timed out|crash(ed)?|traceback)\b/i.test(trimmed)) return "TROUBLESHOOTING";
  return "NOTE";
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  NOTE: "Note",
  COMMAND: "Command",
  CODE_SNIPPET: "Code snippet",
  PROCEDURE: "Procedure",
  RUNBOOK: "Runbook",
  ALGORITHM: "Algorithm",
  CONCEPT: "Concept",
  TROUBLESHOOTING: "Trouble",
  REFERENCE: "Reference",
  FLASHCARD: "Flashcard",
  CHECKLIST: "Checklist",
  PATH: "Path",
};

export const SHAPE_PRESETS: { type: NoteType; sections: { heading: string; kind: "TEXT" | "CODE" | "LIST" | "WARNING" }[] }[] = [
  { type: "COMMAND", sections: [
    { heading: "Purpose", kind: "TEXT" },
    { heading: "Command", kind: "CODE" },
    { heading: "Warning", kind: "WARNING" },
  ]},
  { type: "PROCEDURE", sections: [
    { heading: "Prerequisites", kind: "LIST" },
    { heading: "Steps", kind: "LIST" },
    { heading: "Verification", kind: "TEXT" },
  ]},
  { type: "TROUBLESHOOTING", sections: [
    { heading: "Symptoms", kind: "TEXT" },
    { heading: "Diagnostics", kind: "CODE" },
    { heading: "Possible causes", kind: "LIST" },
    { heading: "Solutions", kind: "CODE" },
  ]},
  { type: "REFERENCE", sections: [
    { heading: "Reference", kind: "CODE" },
    { heading: "Notes", kind: "TEXT" },
  ]},
  { type: "PATH", sections: [
    { heading: "Order", kind: "LIST" },
  ]},
];
