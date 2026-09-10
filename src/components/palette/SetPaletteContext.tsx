"use client";

import { useEffect } from "react";
import { usePalette } from "@/components/palette/PaletteProvider";

/** Drops a server-rendered note's slug/title into the palette's context. Renders nothing. */
export function SetPaletteContext({ slug, title }: { slug: string; title: string }) {
  const { setNoteContext } = usePalette();

  useEffect(() => {
    setNoteContext({ slug, title });
    return () => setNoteContext(null);
  }, [slug, title, setNoteContext]);

  return null;
}
