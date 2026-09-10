import { describe, expect, it } from "vitest";
import { detectNoteType } from "./detect";

describe("detectNoteType", () => {
  it("recognizes shell commands", () => {
    expect(detectNoteType("docker system prune -af")).toBe("COMMAND");
    expect(detectNoteType("kubectl rollout restart deploy/api")).toBe("COMMAND");
  });

  it("recognizes numbered procedures", () => {
    expect(detectNoteType("1. Drain the runner\n2. Prune the cache")).toBe("PROCEDURE");
  });

  it("recognizes troubleshooting language", () => {
    expect(detectNoteType("Requests fail with a timed out exception")).toBe("TROUBLESHOOTING");
  });

  it("falls back to NOTE for plain text and empty input", () => {
    expect(detectNoteType("Just some thoughts on caching")).toBe("NOTE");
    expect(detectNoteType("")).toBe("NOTE");
  });
});
