import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg)] px-6">
      <Link href="/" className="flex items-center gap-2 no-underline mb-8">
        <span className="block w-[22px] h-[22px] bg-accent" />
        <span className="font-sans font-extrabold text-sm text-[var(--color-text)]">
          memory<span className="text-[var(--color-muted)]">/center</span>
        </span>
      </Link>
      <h1 className="text-[22px] mb-1">Admin sign in</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">Browsing and search stay public — this just unlocks writing.</p>
      <LoginForm next={next && next.startsWith("/") ? next : "/"} />
    </div>
  );
}
