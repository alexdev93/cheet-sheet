export function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 border-l-2 border-accent bg-[var(--color-warn-bg)] px-3 py-2.5 mb-3">
      <span className="font-mono font-bold text-[11px] leading-[1.5] text-accent">!</span>
      <p className="m-0 text-sm leading-[1.6] text-[var(--color-text-2)]">{children}</p>
    </div>
  );
}
