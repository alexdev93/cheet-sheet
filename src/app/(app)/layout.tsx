import { getSession } from "@/lib/auth";
import { getDomainTree, getTotalNoteCount } from "@/server/tree";
import { listRecentNotes } from "@/server/notes";
import { TopBar } from "@/components/layout/TopBar";
import { ModeRail } from "@/components/layout/ModeRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavProvider } from "@/components/layout/MobileNavProvider";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { PaletteProvider } from "@/components/palette/PaletteProvider";
import { CommandPalette } from "@/components/palette/CommandPalette";

// Every page under this layout reads live data (tree, search, graph) straight
// from Postgres — force-dynamic keeps it that way and, just as importantly,
// keeps `next build` from trying to prerender these routes against a database
// that doesn't exist yet at build time (see .github/workflows/ci.yml).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, tree, recent, noteCount] = await Promise.all([
    getSession(),
    getDomainTree(),
    listRecentNotes(4),
    getTotalNoteCount(),
  ]);

  return (
    <PaletteProvider>
      <MobileNavProvider>
        <div className="h-dvh flex flex-col bg-[var(--color-bg)]">
          <TopBar authed={!!session} />
          <div className="flex-1 flex min-h-0">
            <ModeRail />
            <Sidebar tree={tree} recent={recent} noteCount={noteCount} />
            <main className="flex-1 min-w-0 flex flex-col bg-[var(--color-bg)]">{children}</main>
          </div>
        </div>
        <MobileNavDrawer authed={!!session} tree={tree} recent={recent} noteCount={noteCount} />
      </MobileNavProvider>
      <CommandPalette />
    </PaletteProvider>
  );
}
