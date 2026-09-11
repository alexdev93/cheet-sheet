"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  // Lock background scroll while the drawer covers the screen, and let
  // Escape close it — same affordances as the command palette.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);
  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within a MobileNavProvider.");
  return ctx;
}
