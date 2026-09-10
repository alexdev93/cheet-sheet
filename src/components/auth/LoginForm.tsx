"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/auth-actions";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-[360px]">
      <input type="hidden" name="next" value={next} />
      <label className="block font-mono text-[10.5px] tracking-[0.06em] uppercase text-[var(--color-muted)] mb-1.5">
        Email
      </label>
      <input
        name="email"
        type="email"
        required
        autoFocus
        className="w-full mb-3 px-2.5 py-2 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text)] text-sm outline-none focus-visible:border-accent"
      />
      <label className="block font-mono text-[10.5px] tracking-[0.06em] uppercase text-[var(--color-muted)] mb-1.5">
        Password
      </label>
      <input
        name="password"
        type="password"
        required
        className="w-full mb-4 px-2.5 py-2 bg-[var(--color-panel-3)] border border-[var(--color-border)] text-[var(--color-text)] text-sm outline-none focus-visible:border-accent"
      />
      {state.error ? <p className="text-accent text-sm mb-3">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-10 bg-accent text-[var(--color-panel)] font-sans font-extrabold text-xs disabled:opacity-50"
      >
        {pending ? "SIGNING IN…" : "SIGN IN"}
      </button>
    </form>
  );
}
