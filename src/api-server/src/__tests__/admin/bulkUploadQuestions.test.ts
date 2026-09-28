import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// ── Mocks (vi.hoisted to avoid hoisting issues with vi.mock) ───────────────────

const { mockInsert, mockInsertValuesReturning } = vi.hoisted(() => {
  const mockInsertValuesReturning = vi.fn();
  const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockInsertValuesReturning }) });
  return { mockInsert, mockInsertValuesReturning };
});

vi.mock("../../db", () => ({
  db: { insert: mockInsert },
}));

const { mockInvalidateEntity } = vi.hoisted(() => ({
  mockInvalidateEntity: vi.fn(),
}));

vi.mock("../../services/cacheInvalidation", () => ({
  invalidateEntity: mockInvalidateEntity,
}));

// ── SUT ───────────────────────────────────────────────────────────────────────

import { bulkUploadQuestions } from "../../controllers/admin/questionsController";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockReq(body: unknown): Partial<Request> {
  return { body } as Partial<Request>;
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// ── Tests: bulkUploadQuestions ────────────────────────────────────────────────

describe("bulkUploadQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: mockInsertValuesReturning }),
    });
  });

  it("responds 201 with count 0, empty createdIds, and per-row failures when ALL rows fail validation", async () => {
    const req = mockReq({ questions: [{ text: "" }, { text: 42 }] });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await bulkUploadQuestions(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 0,
      createdIds: [],
      failed: [
        { index: 1, errors: expect.arrayContaining([expect.stringContaining("text")]) },
        { index: 2, errors: expect.arrayContaining([expect.stringContaining("text")]) },
      ],
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("responds 201 with createdIds and the failing rows when SOME rows fail validation", async () => {
    mockInsertValuesReturning.mockResolvedValue([{ id: "q-1" }]);
    const req = mockReq({ questions: [{ text: "Valid?" }, { text: "" }] });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await bulkUploadQuestions(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      createdIds: ["q-1"],
      failed: [{ index: 2, errors: expect.arrayContaining([expect.stringContaining("text")]) }],
    });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInvalidateEntity).toHaveBeenCalledWith("questions");
  });

  it("still returns 400 for a malformed body (questions not a non-empty array)", async () => {
    const req = mockReq({ questions: [] });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await bulkUploadQuestions(req as Request, res as Response, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
