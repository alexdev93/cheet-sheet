"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/server/actions";

export function FavoriteButton({ slug, initial, canEdit }: { slug: string; initial: boolean; canEdit: boolean }) {
  const [favorite, setFavorite] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (!canEdit) return null;

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setFavorite((f) => !f);
          const result = await toggleFavoriteAction(slug);
          setFavorite(result);
        })
      }
      aria-pressed={favorite}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
      className="font-mono text-[13px] leading-none cursor-pointer disabled:opacity-50"
      style={{ color: favorite ? "var(--color-accent)" : "var(--color-muted)" }}
    >
      {favorite ? "★" : "☆"}
    </button>
  );
}
