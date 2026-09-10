"use client";

import { useFormStatus } from "react-dom";

/**
 * useFormStatus only works from a component rendered *inside* the <form> it
 * reports on — it can't be called directly in the component that owns the
 * form. Splitting this out is what actually disables the button (and stops
 * double-submits creating duplicate notes) while the Server Action runs.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-9 px-4 bg-accent text-[var(--color-panel)] font-sans font-extrabold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
