import type { Metadata } from "next";
import { listDomainOptions } from "@/server/tree";
import { listAllTags } from "@/server/notes";
import { CaptureForm } from "@/components/capture/CaptureForm";

export const metadata: Metadata = { title: "Capture" };

export default async function CapturePage() {
  const [domains, tags] = await Promise.all([listDomainOptions(), listAllTags()]);

  return (
    <div className="flex-1 overflow-y-auto flex justify-center">
      <div className="w-full px-6 sm:px-10 py-8 pb-16">
        <CaptureForm
          domainOptions={domains.map((d) => ({ name: d.name, collections: d.collections }))}
          tagSuggestions={tags.map((t) => t.name)}
        />
      </div>
    </div>
  );
}
