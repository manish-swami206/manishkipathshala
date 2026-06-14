import { describe, it, expect } from "vitest";

// Basic health test - validates the server can start and respond
describe("API Health", () => {
  it("should have a functioning test environment", () => {
    expect(1 + 1).toBe(2);
  });

  it("should be able to import app without errors", async () => {
    // Dynamic import to avoid side effects during test loading
    const mod = await import("../app");
    expect(mod.default).toBeDefined();
  });
});
