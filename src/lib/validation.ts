import { z } from "zod";

export const noteTypeSchema = z.enum([
  "NOTE",
  "COMMAND",
  "CODE_SNIPPET",
  "PROCEDURE",
  "RUNBOOK",
  "ALGORITHM",
  "CONCEPT",
  "TROUBLESHOOTING",
  "REFERENCE",
  "FLASHCARD",
  "CHECKLIST",
  "PATH",
]);

export const noteStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const sectionTabSchema = z.object({
  label: z.string().min(1).max(60),
  lang: z.string().min(1).max(30),
  code: z.string().min(1),
});

export const sectionSchema = z.object({
  heading: z.string().min(1).max(120),
  kind: z.enum(["TEXT", "LIST", "CODE", "WARNING", "TABS"]).default("TEXT"),
  body: z.string().max(20000).optional().nullable(),
  items: z.array(z.string().min(1).max(2000)).max(60).default([]),
  warning: z.string().max(4000).optional().nullable(),
  codeTitle: z.string().max(120).optional().nullable(),
  codeLang: z.string().max(30).optional().nullable(),
  code: z.string().max(20000).optional().nullable(),
  highlightLines: z.array(z.number().int().nonnegative()).default([]),
  tabs: z.array(sectionTabSchema).max(10).default([]),
});

export const linkInputSchema = z.object({
  targetSlug: z.string().min(1),
  relation: z.string().min(1).max(40),
});

export const noteInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated")
    .optional(),
  summary: z.string().max(600).optional().nullable(),
  type: noteTypeSchema.default("NOTE"),
  status: noteStatusSchema.default("PUBLISHED"),
  domainName: z.string().min(1).optional().nullable(),
  collectionName: z.string().min(1).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(30).default([]),
  sections: z.array(sectionSchema).max(40).default([]),
  links: z.array(linkInputSchema).max(60).default([]),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;

export const captureInputSchema = z.object({
  text: z.string().min(1).max(20000),
  type: noteTypeSchema.default("NOTE"),
  domainName: z.string().min(1).optional().nullable(),
  collectionName: z.string().min(1).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(30).default([]),
});

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const typeFilterSchema = noteTypeSchema.or(z.literal("ALL"));

/** Whitelists a `?type=` query param against the real enum, defaulting to "ALL" for anything else. */
export function parseTypeFilter(raw: string | null | undefined): z.infer<typeof typeFilterSchema> {
  const parsed = typeFilterSchema.safeParse(raw ?? "ALL");
  return parsed.success ? parsed.data : "ALL";
}

const sortSchema = z.enum(["relevance", "recent", "most-used"]);

/** Whitelists a `?sort=` query param, defaulting to "relevance" for anything else. */
export function parseSort(raw: string | null | undefined): z.infer<typeof sortSchema> {
  const parsed = sortSchema.safeParse(raw ?? "relevance");
  return parsed.success ? parsed.data : "relevance";
}
