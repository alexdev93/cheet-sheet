/**
 * Seeds two example notes — one COMMAND, one TROUBLESHOOTING — that between
 * them demonstrate every section kind (text, code, list, warning, tabs) so a
 * fresh install has a real, working example to capture your own notes from.
 * Safe to re-run: notes are upserted by slug, existing notes are never
 * touched or deleted. Run with `npm run db:seed`.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
// Relative, not "@/generated/...": tsx runs this file standalone, outside
// Next's module resolution, so the path alias isn't available here.
import { PrismaClient } from "../src/generated/prisma/client";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

type SeedSection = {
  h: string;
  body?: string;
  items?: string[];
  warn?: string;
  codeTitle?: string;
  lang?: string;
  code?: string;
  hi?: number[];
  tabs?: { label: string; lang: string; code: string }[];
};

type SeedNote = {
  id: string;
  title: string;
  type:
    | "NOTE" | "COMMAND" | "CODE_SNIPPET" | "PROCEDURE" | "RUNBOOK" | "ALGORITHM"
    | "CONCEPT" | "TROUBLESHOOTING" | "REFERENCE" | "FLASHCARD" | "CHECKLIST" | "PATH";
  domain: string;
  coll: string;
  agoDays: number;
  uses: number;
  summary: string;
  tags: string[];
  links: { id: string; rel: string }[];
  sections: SeedSection[];
};

const notes: SeedNote[] = [
  {
    id: "docker-prune", title: "docker system prune", type: "COMMAND", domain: "Docker", coll: "Cleanup", agoDays: 4, uses: 11,
    summary: "Removes stopped containers, unused networks, dangling images and the build cache in a single pass. The flags decide how much of your disk you get back — and how much you lose.",
    tags: ["docker", "disk", "cleanup"],
    links: [{ id: "crashloop", rel: "related" }],
    sections: [
      { h: "Purpose", body: 'Reclaim disk on a machine where images and layers have accumulated. On CI agents this is usually the difference between a green build and "no space left on device".' },
      { h: "Command", codeTitle: "Full clean, no prompt", lang: "shell", hi: [1],
        code: "# everything unused, including named volumes\ndocker system prune -af --volumes\n\n# safer: containers, networks, dangling images only\ndocker system prune" },
      { h: "Warning", warn: "--volumes deletes named volumes that are not attached to a running container. A stopped Postgres container counts as not running. Check `docker volume ls` first." },
      { h: "Check before you run", codeTitle: "What would be freed", lang: "shell", code: "docker system df -v | head -20\ndocker volume ls -f dangling=true" },
      { h: "Example output", codeTitle: "Typical CI agent", lang: "shell", code: "Total reclaimed space: 24.71GB" },
      { h: "Other shells", tabs: [
        { label: "bash / zsh", lang: "shell", code: "docker system prune -af --volumes" },
        { label: "PowerShell", lang: "shell", code: "docker system prune -af --volumes" },
        { label: "fish", lang: "shell", code: "docker system prune -af --volumes" } ] },
    ],
  },
  {
    id: "crashloop", title: "Pod stuck in CrashLoopBackOff", type: "TROUBLESHOOTING", domain: "Kubernetes", coll: "Workloads", agoDays: 1, uses: 9,
    summary: "The container starts, exits, and Kubernetes backs off before restarting it. The pod is a symptom — the cause is almost always in the previous container log or the probe config.",
    tags: ["kubernetes", "pods", "debug"], links: [{ id: "docker-prune", rel: "related" }],
    sections: [
      { h: "Symptoms", body: "kubectl get pods shows CrashLoopBackOff with a rising restart count. Backoff doubles up to five minutes, so late in an incident the pod looks frozen rather than crashing." },
      { h: "Diagnostics", codeTitle: "Read the log of the run that died", lang: "shell", hi: [0],
        code: "kubectl logs pod/api-7d9f -n prod --previous\nkubectl describe pod api-7d9f -n prod | tail -25\nkubectl get events -n prod --sort-by=.lastTimestamp" },
      { h: "Possible causes", items: ["Exit 1 — the application threw during startup. Read the previous log.", "Exit 137 — OOMKilled. The memory limit is below real usage.", "Exit 0 in a loop — the entrypoint finished; it is not a long-running process.", "Liveness probe failing before the app is ready — the probe needs an initialDelay or a startupProbe."] },
      { h: "Solutions", codeTitle: "Give a slow starter room", lang: "yaml",
        code: "startupProbe:\n  httpGet: { path: /healthz, port: 8080 }\n  failureThreshold: 30   # 30 x 5s = 150s to boot\n  periodSeconds: 5" },
      { h: "Prevention", body: "Separate liveness from readiness, and never point liveness at an endpoint that touches the database." },
    ],
  },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH || (await bcrypt.hash("changeme", 12));

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Admin", passwordHash: adminHash },
  });

  const idToSlug = new Map(notes.map((n) => [n.id, slugify(n.title)]));

  for (const n of notes) {
    const domainSlug = slugify(n.domain);
    const domain = await db.domain.upsert({
      where: { slug: domainSlug },
      update: {},
      create: { name: n.domain, slug: domainSlug },
    });

    const collectionSlug = slugify(n.coll);
    const collection = await db.collection.upsert({
      where: { domainId_slug: { domainId: domain.id, slug: collectionSlug } },
      update: {},
      create: { name: n.coll, slug: collectionSlug, domainId: domain.id },
    });

    const slug = idToSlug.get(n.id)!;
    const updatedAt = new Date(Date.now() - n.agoDays * 86400_000);

    const tagIds: string[] = [];
    for (const tagName of n.tags) {
      const tagSlug = slugify(tagName);
      const tag = await db.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { name: tagName, slug: tagSlug },
      });
      tagIds.push(tag.id);
    }

    await db.note.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: n.title,
        summary: n.summary,
        type: n.type,
        status: "PUBLISHED",
        useCount: n.uses,
        collectionId: collection.id,
        authorId: admin.id,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        sections: {
          create: n.sections.map((s, order) => ({
            order,
            heading: s.h,
            kind: s.code ? "CODE" : s.items ? "LIST" : s.warn ? "WARNING" : s.tabs ? "TABS" : "TEXT",
            body: s.body ?? null,
            items: s.items ?? [],
            warning: s.warn ?? null,
            codeTitle: s.codeTitle ?? null,
            codeLang: s.lang ?? null,
            code: s.code ?? null,
            highlightLines: s.hi ?? [],
            tabs: { create: (s.tabs ?? []).map((t, tOrder) => ({ order: tOrder, label: t.label, lang: t.lang, code: t.code })) },
          })),
        },
      },
    });

    await db.$executeRaw`UPDATE "notes" SET "updatedAt" = ${updatedAt} WHERE slug = ${slug}`;
  }

  // Links reference notes by seed id — resolve to slugs once every note exists.
  for (const n of notes) {
    const sourceSlug = idToSlug.get(n.id)!;
    const source = await db.note.findUniqueOrThrow({ where: { slug: sourceSlug }, select: { id: true } });
    for (const link of n.links) {
      const targetSlug = idToSlug.get(link.id);
      if (!targetSlug) continue;
      const target = await db.note.findUnique({ where: { slug: targetSlug }, select: { id: true } });
      if (!target) continue;
      await db.link.upsert({
        where: { sourceId_targetId_relation: { sourceId: source.id, targetId: target.id, relation: link.rel } },
        update: {},
        create: { sourceId: source.id, targetId: target.id, relation: link.rel },
      });
    }
  }

  // The insert trigger only covers title/summary — fold in tags/section text too,
  // the same way src/lib/search.ts's refreshNoteSearchVector does at runtime.
  for (const n of notes) {
    const slug = idToSlug.get(n.id)!;
    await db.$executeRaw`
      UPDATE "notes" nt
      SET "searchVector" =
        setweight(to_tsvector('english', coalesce(nt.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(nt.summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce((
          SELECT string_agg(t.name, ' ') FROM "note_tags" ntg JOIN "tags" t ON t.id = ntg."tagId" WHERE ntg."noteId" = nt.id
        ), '')), 'B') ||
        setweight(to_tsvector('english', coalesce((
          SELECT string_agg(coalesce(s.heading, '') || ' ' || coalesce(s.body, '') || ' ' || array_to_string(s.items, ' '), ' ')
          FROM "sections" s WHERE s."noteId" = nt.id
        ), '')), 'C') ||
        setweight(to_tsvector('english', coalesce((
          SELECT string_agg(coalesce(s.code, ''), ' ') FROM "sections" s WHERE s."noteId" = nt.id
        ), '')), 'D')
      WHERE nt.slug = ${slug}
    `;
  }

  console.log(`Seeded ${notes.length} notes across ${new Set(notes.map((n) => n.domain)).size} domains.`);
  console.log(`Admin login: ${adminEmail} / ${process.env.ADMIN_PASSWORD_HASH ? "(your configured password)" : "changeme"}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
