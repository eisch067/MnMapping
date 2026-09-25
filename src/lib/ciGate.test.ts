import { expect, it } from "vitest";

it("fails on purpose to prove CI blocks the merge", () => {
  expect(1).toBe(2);
});
