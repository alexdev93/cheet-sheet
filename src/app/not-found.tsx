import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <span className="font-mono text-xs tracking-[0.14em] text-accent mb-3">404</span>
      <h1 className="text-2xl mb-2">Nothing filed here.</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6 max-w-[46ch]">
        This note doesn&apos;t exist, or it hasn&apos;t been captured yet.
      </p>
      <Link
        href="/"
        className="h-9 px-4 inline-flex items-center bg-[var(--color-accent)] text-[var(--color-panel)] no-underline font-sans font-extrabold text-xs"
      >
        BACK TO KNOWLEDGE CENTER
      </Link>
    </div>
  );
}
