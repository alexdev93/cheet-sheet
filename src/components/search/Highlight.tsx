/**
 * Renders Postgres ts_headline() output safely. ts_headline wraps matches in
 * literal "<b>...</b>" and leaves everything else as plain text from the
 * note's own summary field — splitting on those markers and rendering the
 * rest as text (not dangerouslySetInnerHTML) means arbitrary HTML in a
 * summary can never execute, even if write access is opened up later.
 */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/(<b>|<\/b>)/);
  let bolding = false;

  return (
    <>
      {parts.map((part, i) => {
        if (part === "<b>") {
          bolding = true;
          return null;
        }
        if (part === "</b>") {
          bolding = false;
          return null;
        }
        if (!part) return null;
        return bolding ? (
          <mark key={i} className="bg-transparent text-accent font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
