import Link from "next/link";
import type { Metadata } from "next";
import { listRecentVersions } from "@/server/notes";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const versions = await listRecentVersions(50);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[820px] px-6 sm:px-10 py-8">
        <h1 className="text-[24px] mb-6">History</h1>
        {versions.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No edits recorded yet.</p>
        ) : (
          <div className="border-t border-[var(--color-border)]">
            {versions.map((v) => (
              <Link
                key={v.id}
                href={`/n/${v.note.slug}`}
                className="flex items-center gap-4 py-3 border-b border-[var(--color-border)] no-underline hover:bg-[var(--color-panel-2)]"
              >
                <span className="font-mono text-[11px] text-[var(--color-muted-2)] w-20 flex-none">
                  {relativeTime(v.createdAt)}
                </span>
                <span className="flex-1 text-sm text-[var(--color-text-2)] truncate">{v.summary}</span>
                <span className="font-mono text-[11px] text-[var(--color-muted)]">{v.note.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
