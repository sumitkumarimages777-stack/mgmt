import { describe, expect, it } from "vitest";
import { meets } from "./access";

describe("meets", () => {
  it("compares access levels", () => {
    expect(meets("manage", "edit")).toBe(true);
    expect(meets("edit", "edit")).toBe(true);
    expect(meets("view", "edit")).toBe(false);
    expect(meets("own", "view")).toBe(false);
    expect(meets(undefined, "own")).toBe(false);
  });
});
