// A small, dependency-free tokenizer for the handful of languages knowledge
// snippets actually use (shell, sql, yaml, json). It trades broad language
// coverage for exact control over the token colors defined in
// src/styles/tokens.css — a real grammar-based highlighter (Shiki, Prism)
// would need its own theme reconciled against those tokens anyway, and adds
// a WASM/grammar bundle to the Docker image for little benefit at this scale.

export type CodeLang = "shell" | "sql" | "yaml" | "json" | "text";

export type Token = { text: string; kind: TokenKind };
export type TokenKind = "default" | "comment" | "string" | "flag" | "keyword" | "number";

const KEYWORDS: Record<CodeLang, string[]> = {
  shell: ["docker", "kubectl", "git", "mvn", "npm", "journalctl", "df", "head", "tail", "sudo", "psql"],
  sql: ["create", "index", "on", "using", "gin", "vacuum", "analyze", "select", "from", "where", "insert", "update", "delete"],
  yaml: [],
  json: [],
  text: [],
};

export function normalizeLang(lang: string | null | undefined): CodeLang {
  const l = (lang || "").toLowerCase();
  if (l === "shell" || l === "bash" || l === "sh" || l === "zsh" || l === "fish" || l === "powershell") return "shell";
  if (l === "sql" || l === "postgres" || l === "postgresql") return "sql";
  if (l === "yaml" || l === "yml") return "yaml";
  if (l === "json") return "json";
  return "text";
}

function tokenizeLine(line: string, lang: CodeLang): Token[] {
  const keywords = KEYWORDS[lang];
  let body = line;
  let tail = "";

  const commentMarker = lang === "sql" ? "--" : lang === "shell" ? "#" : lang === "yaml" ? "#" : null;
  if (commentMarker) {
    const idx = line.indexOf(commentMarker);
    const beforeHasOpenQuote = lang === "shell" && /["']/.test(line.slice(0, idx));
    if (idx >= 0 && !beforeHasOpenQuote) {
      body = line.slice(0, idx);
      tail = line.slice(idx);
    }
  }

  const parts = body.match(/("[^"]*"|'[^']*'|\s+|[^\s]+)/g) ?? [];
  const tokens: Token[] = parts.map((t, i) => {
    if (/^["']/.test(t)) return { text: t, kind: "string" };
    if (lang !== "sql" && /^-{1,2}[A-Za-z]/.test(t)) return { text: t, kind: "flag" };
    if (keywords.includes(t.toLowerCase())) return { text: t, kind: "keyword" };
    if (/^\$?\d+[a-zA-Z%]*$/.test(t)) return { text: t, kind: "number" };
    if (lang === "yaml" && i === 0 && /:$/.test(t)) return { text: t, kind: "keyword" };
    if (lang === "json" && /^"[^"]*":$/.test(t)) return { text: t, kind: "keyword" };
    return { text: t, kind: "default" };
  });

  if (tail) tokens.push({ text: tail, kind: "comment" });
  return tokens.length ? tokens : [{ text: " ", kind: "default" }];
}

export type HighlightedLine = { number: number; tokens: Token[]; highlighted: boolean };

export function highlightCode(
  code: string,
  lang: string,
  highlightLines: number[] = []
): HighlightedLine[] {
  const normalized = normalizeLang(lang);
  const hi = new Set(highlightLines);
  return code.split("\n").map((line, i) => ({
    number: i + 1,
    tokens: tokenizeLine(line, normalized),
    highlighted: hi.has(i),
  }));
}
