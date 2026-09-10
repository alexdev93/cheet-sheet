import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Docker System Prune")).toBe("docker-system-prune");
  });

  it("strips punctuation", () => {
    expect(slugify("VACUUM vs VACUUM FULL")).toBe("vacuum-vs-vacuum-full");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugify("  --Hello   World!!--  ")).toBe("hello-world");
  });

  it("caps length", () => {
    const long = "a".repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(96);
  });
});
