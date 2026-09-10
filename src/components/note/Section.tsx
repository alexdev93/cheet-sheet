import { TextBody } from "@/components/note/TextBody";
import { StepList } from "@/components/note/StepList";
import { CodeBlock } from "@/components/note/CodeBlock";
import { WarningBox } from "@/components/note/WarningBox";
import { TabsCode } from "@/components/note/TabsCode";
import type { SectionData } from "@/types/note";

export function Section({ section, noteSlug }: { section: SectionData; noteSlug: string }) {
  return (
    <div className="mb-7" id={sectionAnchor(section.heading)}>
      <h5 className="font-mono text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-2.5">
        {section.heading}
      </h5>
      {section.body ? <TextBody>{section.body}</TextBody> : null}
      {section.items.length > 0 ? <StepList items={section.items} /> : null}
      {section.code ? (
        <CodeBlock
          code={section.code}
          lang={section.codeLang || "text"}
          title={section.codeTitle ?? undefined}
          highlightLines={section.highlightLines}
          noteSlug={noteSlug}
        />
      ) : null}
      {section.warning ? <WarningBox>{section.warning}</WarningBox> : null}
      {section.tabs.length > 0 ? <TabsCode tabs={section.tabs} noteSlug={noteSlug} /> : null}
    </div>
  );
}

export function sectionAnchor(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
