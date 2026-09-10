import { formatBytes } from "@/lib/format";
import type { AttachmentData } from "@/types/note";

export function Attachments({ attachments }: { attachments: AttachmentData[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mb-7">
      <h5 className="font-mono text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-2.5">Attachments</h5>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {attachments.map((a) => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="block border border-[var(--color-border)] bg-[var(--color-bg)] no-underline hover:border-[var(--color-border-strong)]"
          >
            {a.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element -- locally served, dynamic upload; next/image's remote loader adds no value here.
              <img src={a.url} alt={a.filename} className="w-full h-24 object-cover" />
            ) : (
              <div className="w-full h-24 flex items-center justify-center font-mono text-[10px] text-[var(--color-muted)]">
                PDF
              </div>
            )}
            <div className="px-2 py-1.5 border-t border-[var(--color-border)]">
              <div className="text-[11.5px] text-[var(--color-text-2)] truncate">{a.filename}</div>
              <div className="font-mono text-[10px] text-[var(--color-muted-2)]">{formatBytes(a.size)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
