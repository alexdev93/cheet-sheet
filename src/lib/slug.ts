export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Appends a short random suffix, for when a slug collides. */
export function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}
