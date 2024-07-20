import { describe, it, expect } from "vitest";
import { getPrivateKey } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(getPrivateKey).toBeInstanceOf(Function);
  });

  it("getPrivateKey.VERSION is set", () => {
    expect(getPrivateKey.VERSION).toEqual("0.0.0-development");
  });
});
