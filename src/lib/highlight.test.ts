import { describe, expect, it } from "vitest";
import { highlightCode } from "./highlight";

describe("highlightCode", () => {
  it("numbers lines starting at 1 and marks requested highlights", () => {
    const lines = highlightCode("echo a\necho b\necho c", "shell", [1]);
    expect(lines.map((l) => l.number)).toEqual([1, 2, 3]);
    expect(lines.map((l) => l.highlighted)).toEqual([false, true, false]);
  });

  it("colors long flags distinctly from plain words", () => {
    const [line] = highlightCode("docker system prune -af --volumes", "shell");
    const flagTokens = line!.tokens.filter((t) => t.kind === "flag");
    expect(flagTokens.map((t) => t.text)).toEqual(["-af", "--volumes"]);
  });

  it("treats a shell comment after the command as a comment token", () => {
    const [line] = highlightCode("docker ps # list containers", "shell");
    const last = line!.tokens.at(-1);
    expect(last?.kind).toBe("comment");
    expect(last?.text).toContain("list containers");
  });
});
