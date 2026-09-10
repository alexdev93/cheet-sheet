"use client";

import { useEffect } from "react";
import { usePalette } from "@/components/palette/PaletteProvider";

/** Drops a server-rendered page's title into the palette's "in context: …" line. Renders nothing. */
export function SetPaletteContext({ title }: { title: string | null }) {
  const { setContextTitle } = usePalette();

  useEffect(() => {
    setContextTitle(title);
    return () => setContextTitle(null);
  }, [title, setContextTitle]);

  return null;
}
