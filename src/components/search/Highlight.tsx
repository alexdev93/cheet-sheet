/**
 * Renders Postgres ts_headline() output safely. ts_headline wraps matches in
 * literal "<b>...</b>" and leaves everything else as plain text from the
 * note's own summary field — splitting on those markers and rendering the
 * rest as text (not dangerouslySetInnerHTML) means arbitrary HTML in a
 * summary can never execute, even if write access is opened up later.
 */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/(<b>|<\/b>)/);
  const segments: { text: string; bold: boolean }[] = [];
  let bolding = false;
  for (const part of parts) {
    if (part === "<b>") {
      bolding = true;
      continue;
    }
    if (part === "</b>") {
      bolding = false;
      continue;
    }
    if (!part) continue;
    segments.push({ text: part, bold: bolding });
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <mark key={i} className="bg-transparent text-accent font-semibold">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}
