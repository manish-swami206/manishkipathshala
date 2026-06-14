import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// ── Mocks (vi.hoisted to avoid hoisting issues with vi.mock) ───────────────────

const { mockSelectWhere, mockSelectFrom, mockSelect, mockDeleteWhere, mockDelete, mockUpdateWhere, mockUpdateSet, mockUpdate } = vi.hoisted(() => {
  const mockSelectWhere = vi.fn();
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  return { mockSelectWhere, mockSelectFrom, mockSelect, mockDeleteWhere, mockDelete, mockUpdateWhere, mockUpdateSet, mockUpdate };
});

vi.mock("../../db", () => ({
  db: {
    select: mockSelect,
    delete: mockDelete,
    update: mockUpdate,
  },
}));

const { mockCacheDel, mockCacheFlushPattern } = vi.hoisted(() => ({
  mockCacheDel: vi.fn(),
  mockCacheFlushPattern: vi.fn(),
}));

vi.mock("../../lib/cache", () => ({
  cacheDel: mockCacheDel,
  cacheFlushPattern: mockCacheFlushPattern,
}));

const { mockRouteParam } = vi.hoisted(() => ({
  mockRouteParam: vi.fn(),
}));

vi.mock("../../lib/routeParams", () => ({
  routeParam: mockRouteParam,
}));

// ── SUT ───────────────────────────────────────────────────────────────────────

import { deleteQuestion, bulkDeleteQuestions } from "../../controllers/admin/questionsController";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as Partial<Request>;
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// ── Tests: deleteQuestion ─────────────────────────────────────────────────────

describe("deleteQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhere.mockResolvedValue([{ count: 0 }]); // No references → proceed
    mockDeleteWhere.mockResolvedValue(undefined);
    mockUpdateWhere.mockResolvedValue(undefined);
    mockRouteParam.mockReturnValue("550e8400-e29b-41d4-a716-446655440001");
  });

  it("should check references, then delete and clean up orphaned references", async () => {
    const req = mockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440001" } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteQuestion(req, res, next);

    // Should check references across all 3 tables
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSelectFrom).toHaveBeenCalledTimes(3);

    // Should delete from questions table
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteWhere).toHaveBeenCalled();

    // Should clean up orphaned references in exam_sets, mock_tests, daily_quizzes
    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Should invalidate caches
    expect(mockCacheDel).toHaveBeenCalledWith("admin:dashboard:stats");
    expect(mockCacheDel).toHaveBeenCalledWith("admin:analytics:overview");
    expect(mockCacheFlushPattern).toHaveBeenCalledWith("ncert-mcq:");

    // Should respond with success
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 409 warning when references exist and no confirm flag", async () => {
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440001" } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteQuestion(req, res, next);

    // Should NOT delete
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();

    // Should return 409 with warning
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ warning: true }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should proceed with deletion when references exist and confirm=true", async () => {
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({
      params: { id: "550e8400-e29b-41d4-a716-446655440001" },
      query: { confirm: "true" },
    }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteQuestion(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should still respond success even if cleanup fails", async () => {
    mockUpdateWhere.mockRejectedValueOnce(new Error("DB error"));

    const req = mockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440001" } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteQuestion(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should pass errors to next() when reference counting fails", async () => {
    const dbError = new Error("DB connection lost");
    mockSelectWhere.mockRejectedValueOnce(dbError);

    const req = mockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440001" } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteQuestion(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should pass errors to next() when deletion fails", async () => {
    const dbError = new Error("DB connection lost");
    mockDeleteWhere.mockRejectedValueOnce(dbError);

    const req = mockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440001" } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteQuestion(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ── Tests: bulkDeleteQuestions ────────────────────────────────────────────────

describe("bulkDeleteQuestions", () => {
  const ids = [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhere.mockResolvedValue([{ count: 0 }]); // No references → proceed
    mockDeleteWhere.mockResolvedValue(undefined);
    mockUpdateWhere.mockResolvedValue(undefined);
  });

  it("should check references, then bulk delete and clean up orphaned references", async () => {
    const req = mockReq({ body: { ids } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    // Should check references across all 3 tables
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSelectFrom).toHaveBeenCalledTimes(3);

    // Should delete from questions table
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteWhere).toHaveBeenCalled();

    // Should clean up orphaned references in all 3 tables
    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Should invalidate caches
    expect(mockCacheDel).toHaveBeenCalledWith("admin:dashboard:stats");
    expect(mockCacheDel).toHaveBeenCalledWith("admin:analytics:overview");

    // Should respond with success and count
    expect(res.json).toHaveBeenCalledWith({ success: true, deletedCount: 2 });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 409 warning when references exist and no confirm flag", async () => {
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({ body: { ids } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(mockDelete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ warning: true }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should proceed with deletion when references exist and confirm=true in body", async () => {
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({ body: { ids, confirm: true } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true, deletedCount: 2 });
  });

  it("should pass validation error to next() when ids is empty", async () => {
    const req = mockReq({ body: { ids: [] } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(res.json).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should pass validation error to next() when ids is not an array", async () => {
    const req = mockReq({ body: { ids: "not-an-array" } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(res.json).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should pass validation error to next() when ids is missing from body", async () => {
    const req = mockReq({ body: {} }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it("should still respond success even if cleanup fails", async () => {
    mockUpdateWhere.mockRejectedValueOnce(new Error("DB error"));

    const req = mockReq({ body: { ids } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, deletedCount: 2 });
    expect(next).not.toHaveBeenCalled();
  });

  it("should pass errors to next() when reference counting fails", async () => {
    const dbError = new Error("DB connection lost");
    mockSelectWhere.mockRejectedValueOnce(dbError);

    const req = mockReq({ body: { ids } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should pass errors to next() when bulk deletion fails", async () => {
    const dbError = new Error("DB connection lost");
    mockDeleteWhere.mockRejectedValueOnce(dbError);

    const req = mockReq({ body: { ids } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should handle a single id in the array", async () => {
    const req = mockReq({ body: { ids: ["550e8400-e29b-41d4-a716-446655440001"] } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await bulkDeleteQuestions(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, deletedCount: 1 });
    expect(next).not.toHaveBeenCalled();
  });
});
