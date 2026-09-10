/**
 * Seeds demo content ported from the original design mock (Docker, Kubernetes,
 * PostgreSQL, Git, Spring Boot, Linux) so a fresh install has something real
 * to browse, search and graph immediately. Safe to re-run: notes are upserted
 * by slug. Run with `npm run db:seed`.
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
    links: [{ id: "volume-prune", rel: "narrower" }, { id: "build-agent", rel: "used by" }, { id: "crashloop", rel: "related" }],
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
    id: "volume-prune", title: "docker volume prune", type: "COMMAND", domain: "Docker", coll: "Cleanup", agoDays: 4, uses: 3,
    summary: "Deletes volumes not referenced by any container. Narrower and safer than a full system prune.",
    tags: ["docker", "volumes"], links: [{ id: "docker-prune", rel: "broader" }],
    sections: [{ h: "Command", codeTitle: "Prune volumes", lang: "shell", code: 'docker volume prune -f\n\n# keep anything labelled keep=true\ndocker volume prune --filter "label!=keep=true"' }],
  },
  {
    id: "image-prune", title: "docker image prune", type: "COMMAND", domain: "Docker", coll: "Cleanup", agoDays: 14, uses: 6,
    summary: "Removes dangling images; with -a, every image not used by a container.",
    tags: ["docker", "images"], links: [{ id: "docker-prune", rel: "broader" }],
    sections: [{ h: "Command", codeTitle: "Age-filtered prune", lang: "shell", code: 'docker image prune -a --filter "until=168h"' }],
  },
  {
    id: "build-agent", title: "Reclaim disk space on a build agent", type: "PROCEDURE", domain: "Docker", coll: "Cleanup", agoDays: 6, uses: 2,
    summary: "The order to run cleanup in when a runner is out of disk mid-pipeline, without killing an in-flight build.",
    tags: ["ci", "docker", "disk"], links: [{ id: "docker-prune", rel: "uses" }, { id: "journalctl", rel: "related" }],
    sections: [
      { h: "Prerequisites", items: ["SSH access to the runner", "No build currently in the push stage", "A record of which volumes hold caches worth keeping"] },
      { h: "Steps", items: ["Drain the runner so no new job is scheduled.", "Run docker system df -v and note the largest reclaimable group.", "Prune build cache first — it is always safe.", "Prune images older than a week.", "Only then consider volumes."] },
      { h: "Command", codeTitle: "Safe order", lang: "shell", code: 'docker builder prune -af\ndocker image prune -a --filter "until=168h"\ndf -h /var/lib/docker' },
      { h: "Verification", body: "df -h shows the Docker root below 70%. Re-enable the runner and watch the first job complete end to end." },
    ],
  },
  {
    id: "crashloop", title: "Pod stuck in CrashLoopBackOff", type: "TROUBLESHOOTING", domain: "Kubernetes", coll: "Workloads", agoDays: 1, uses: 9,
    summary: "The container starts, exits, and Kubernetes backs off before restarting it. The pod is a symptom — the cause is almost always in the previous container log or the probe config.",
    tags: ["kubernetes", "pods", "debug"], links: [{ id: "rollout-restart", rel: "related" }, { id: "hikari", rel: "cause of" }, { id: "k8s-path", rel: "part of" }],
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
  {
    id: "rollout-restart", title: "kubectl rollout restart", type: "COMMAND", domain: "Kubernetes", coll: "Workloads", agoDays: 7, uses: 14,
    summary: "Rolls pods one at a time, respecting readiness probes. The correct way to pick up a changed secret or config map.",
    tags: ["kubectl", "deploy"], links: [{ id: "crashloop", rel: "related" }],
    sections: [
      { h: "Command", codeTitle: "Restart and watch", lang: "shell", code: "kubectl rollout restart deploy/api -n prod\nkubectl rollout status deploy/api -n prod --watch" },
      { h: "Rollback", codeTitle: "Undo", lang: "shell", code: "kubectl rollout undo deploy/api -n prod" },
    ],
  },
  {
    id: "k8s-path", title: "Kubernetes networking, in order", type: "PATH", domain: "Kubernetes", coll: "Networking", agoDays: 21, uses: 4,
    summary: "Seven notes, read in this order, that take you from a single pod IP to ingress routing without the usual detours.",
    tags: ["kubernetes", "networking", "learning"], links: [{ id: "crashloop", rel: "includes" }, { id: "rollout-restart", rel: "includes" }],
    sections: [{ h: "Order", items: ["Pod IPs and the flat network assumption", "Services as stable virtual IPs", "kube-proxy and iptables rules", "Cluster DNS and search domains", "Headless services and StatefulSets", "Ingress controllers", "Network policies"] }],
  },
  {
    id: "jsonb", title: "PostgreSQL JSONB operators", type: "REFERENCE", domain: "PostgreSQL", coll: "Types", agoDays: 5, uses: 17,
    summary: "The operator table you actually need, plus which of them a GIN index can use.",
    tags: ["postgres", "jsonb", "sql"], links: [{ id: "vacuum", rel: "related" }],
    sections: [
      { h: "Operators", codeTitle: "The ones worth memorising", lang: "sql",
        code: "-- object field, returns jsonb\ndata -> 'user'\n-- object field, returns text\ndata ->> 'email'\n-- path\ndata #> '{user,address,city}'\n-- containment (GIN-indexable)\ndata @> '{\"active\": true}'\n-- key exists\ndata ? 'email'" },
      { h: "Indexing", body: "A default GIN index supports @>, ? and ?&. It does not help -> or ->> comparisons; for those, index the expression directly.",
        codeTitle: "Two shapes of index", lang: "sql", code: "CREATE INDEX ON events USING GIN (data);\nCREATE INDEX ON events ((data ->> 'email'));" },
      { h: "Trade-offs", body: "jsonb_path_ops indexes are smaller and faster for containment, but support only @>. Choose it when every query is a containment query." },
    ],
  },
  {
    id: "vacuum", title: "VACUUM vs VACUUM FULL", type: "REFERENCE", domain: "PostgreSQL", coll: "Operations", agoDays: 30, uses: 5,
    summary: "One reclaims space for reuse inside the table; the other rewrites the table and takes an exclusive lock.",
    tags: ["postgres", "maintenance"], links: [{ id: "jsonb", rel: "related" }],
    sections: [
      { h: "Difference", codeTitle: "Two very different operations", lang: "sql", code: "VACUUM (ANALYZE) events;      -- online, marks space reusable\nVACUUM FULL events;           -- rewrites, ACCESS EXCLUSIVE lock" },
      { h: "Warning", warn: "VACUUM FULL blocks reads and writes for the whole rewrite. On a large table use pg_repack instead." },
    ],
  },
  {
    id: "reflog", title: "Recover a commit you thought you lost", type: "PROCEDURE", domain: "Git", coll: "Recovery", agoDays: 60, uses: 8,
    summary: "A hard reset, a bad rebase, a deleted branch — the commit is still there for about 90 days.",
    tags: ["git", "recovery"], links: [{ id: "rebase-onto", rel: "related" }],
    sections: [
      { h: "Steps", items: ["Find the commit in the reflog by its message or time.", "Create a branch at that hash before doing anything else.", "Verify the tree, then merge or cherry-pick."] },
      { h: "Command", codeTitle: "Find and rescue", lang: "shell", code: "git reflog --date=iso | head -30\ngit branch rescue/lost-work 9f3c1ab\ngit log --stat rescue/lost-work -1" },
    ],
  },
  {
    id: "rebase-onto", title: "git rebase --onto", type: "COMMAND", domain: "Git", coll: "History", agoDays: 90, uses: 4,
    summary: "Move a range of commits onto a different base — the one rebase flag worth learning properly.",
    tags: ["git", "rebase"], links: [{ id: "reflog", rel: "related" }],
    sections: [{ h: "Command", codeTitle: "Read it as: onto, from, what", lang: "shell", code: "# take feature commits off develop, put them on main\ngit rebase --onto main develop feature" }],
  },
  {
    id: "hikari", title: "HikariCP connection pool exhausted", type: "TROUBLESHOOTING", domain: "Spring Boot", coll: "Data", agoDays: 14, uses: 7,
    summary: "Requests hang for 30 seconds then fail with a timeout. The pool is not too small — something is holding connections.",
    tags: ["spring", "jdbc", "debug"], links: [{ id: "crashloop", rel: "symptom of" }, { id: "spring-deploy", rel: "related" }],
    sections: [
      { h: "Symptoms", body: "HikariPool-1 - Connection is not available, request timed out after 30000ms. Thread count climbs; the database shows idle-in-transaction sessions." },
      { h: "Diagnostics", codeTitle: "Turn on leak detection", lang: "yaml", code: "spring:\n  datasource:\n    hikari:\n      leak-detection-threshold: 20000\n      maximum-pool-size: 20" },
      { h: "Common causes", items: ["A @Transactional method calling a slow HTTP client while holding the connection.", "Streaming a large result set without a fetch size.", "Pool size larger than the database max_connections divided by instance count."] },
    ],
  },
  {
    id: "spring-deploy", title: "Deploy a Spring Boot service to Kubernetes", type: "PROCEDURE", domain: "Spring Boot", coll: "Delivery", agoDays: 21, uses: 6,
    summary: "Build, tag, push, roll, verify — the sequence with the checks that catch problems before traffic does.",
    tags: ["spring", "kubernetes", "deploy"], links: [{ id: "rollout-restart", rel: "uses" }, { id: "hikari", rel: "related" }],
    sections: [
      { h: "Steps", items: ["Build a layered image so dependency layers cache.", "Tag with the git sha, never with latest.", "Push, then set the image on the deployment.", "Watch the rollout to completion.", "Hit /actuator/health on the new pod before declaring it done."] },
      { h: "Command", codeTitle: "Build and roll", lang: "shell", code: "mvn -q spring-boot:build-image -Dspring-boot.build-image.imageName=reg/api:$(git rev-parse --short HEAD)\nkubectl set image deploy/api api=reg/api:$(git rev-parse --short HEAD) -n prod" },
      { h: "Rollback", codeTitle: "If health never goes green", lang: "shell", code: "kubectl rollout undo deploy/api -n prod" },
    ],
  },
  {
    id: "journalctl", title: "systemd journal queries", type: "REFERENCE", domain: "Linux", coll: "Observability", agoDays: 30, uses: 5,
    summary: "Filtering the journal by unit, time and priority instead of scrolling.",
    tags: ["linux", "systemd", "logs"], links: [{ id: "build-agent", rel: "related" }],
    sections: [{ h: "Queries", codeTitle: "Common filters", lang: "shell", code: 'journalctl -u docker --since "1 hour ago"\njournalctl -p err -b -1        # errors, previous boot\njournalctl -f -u api.service' }],
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
