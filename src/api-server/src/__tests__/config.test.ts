import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Configuration Validation", () => {
  it("should validate daily quiz payload schema", async () => {
    const schema = z.object({
      title: z.string().min(1),
      scheduledDate: z.string().min(1),
      scheduledTime: z.string().min(1),
      durationMinutes: z.coerce.number().int().min(1).default(30),
      totalQuestions: z.coerce.number().int().min(0).default(0),
      questionIds: z.array(z.string()).default([]),
      isPublished: z.boolean().default(false),
    });

    // Valid payload
    const valid = schema.safeParse({
      title: "Daily GK Quiz",
      scheduledDate: "2025-06-10",
      scheduledTime: "10:00",
      durationMinutes: 30,
    });
    expect(valid.success).toBe(true);

    // Invalid payload - missing title
    const invalid = schema.safeParse({
      scheduledDate: "2025-06-10",
      scheduledTime: "10:00",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate question payload schema", async () => {
    const schema = z.object({
      text: z.string().min(1),
      type: z.enum(["quiz", "pyq", "ncert", "mock"]).default("quiz"),
      optionA: z.string().default(""),
      optionB: z.string().default(""),
      correctIndex: z.coerce.number().int().min(0).max(3).default(0),
      subject: z.string().nullable().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
    });

    const valid = schema.safeParse({
      text: "What is the capital of France?",
      optionA: "Paris",
      optionB: "London",
      correctIndex: 0,
      subject: "Geography",
    });
    expect(valid.success).toBe(true);
  });
});
