import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function TextBody({ children }: { children: string }) {
  return (
    <div className="prose-note max-w-[70ch] text-[15px] leading-[1.65] text-[var(--color-text-2)] [&_p]:my-0 [&_p]:mb-3 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[var(--color-panel-2)] [&_code]:px-1 [&_code]:py-0.5 [&_a]:underline [&_strong]:text-[var(--color-text)] [&_ul]:pl-5 [&_ol]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
