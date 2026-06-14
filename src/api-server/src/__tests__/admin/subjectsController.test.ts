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

vi.mock("../../lib/db", () => ({
  db: {
    select: mockSelect,
    delete: mockDelete,
    update: mockUpdate,
  },
}));

const { mockCacheDel } = vi.hoisted(() => ({
  mockCacheDel: vi.fn(),
}));

vi.mock("../../lib/cache", () => ({
  cacheDel: mockCacheDel,
}));

const { mockRouteParam } = vi.hoisted(() => ({
  mockRouteParam: vi.fn(),
}));

vi.mock("../../lib/routeParams", () => ({
  routeParam: mockRouteParam,
}));

// ── SUT ───────────────────────────────────────────────────────────────────────

import { deleteSubject } from "../../controllers/admin/subjectsController";

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

// ── Tests: deleteSubject ──────────────────────────────────────────────────────

describe("deleteSubject", () => {
  const subjectId = "550e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteParam.mockReturnValue(subjectId);

    // Default: no references found (all count queries return 0)
    mockSelectWhere.mockResolvedValue([{ count: 0 }]);
    mockDeleteWhere.mockResolvedValue(undefined);
    mockUpdateWhere.mockResolvedValue(undefined);
  });

  it("should delete subject and clean up references when no records reference it", async () => {
    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    // Should count references in all 6 tables
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSelectFrom).toHaveBeenCalledTimes(6);

    // Should delete the subject
    expect(mockDelete).toHaveBeenCalledTimes(1);

    // Should clean up syllabus references
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    // Should invalidate caches
    expect(mockCacheDel).toHaveBeenCalledWith("admin:dashboard:stats");
    expect(mockCacheDel).toHaveBeenCalledWith("admin:analytics:overview");

    // Should respond with success
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 409 warning when references exist and no confirm flag", async () => {
    // One question references this subject
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    // Should NOT delete
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();

    // Should return 409 with warning
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        warning: true,
        references: expect.objectContaining({ total: 6 }), // 1 per table × 6 tables
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should proceed with deletion when references exist and confirm=true query param", async () => {
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({
      params: { id: subjectId },
      query: { confirm: "true" },
    }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    // Should delete despite references
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should proceed with deletion when references exist and confirm=true in body", async () => {
    mockSelectWhere.mockResolvedValue([{ count: 1 }]);

    const req = mockReq({
      params: { id: subjectId },
      body: { confirm: true },
    }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should clean up syllabus references after deletion", async () => {
    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    // db.update().set({ subjectId: null }).where(...)
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalled();
    expect(mockUpdateWhere).toHaveBeenCalled();
  });

  it("should still respond success if cleanup fails", async () => {
    mockUpdateWhere.mockRejectedValueOnce(new Error("DB error"));

    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should pass errors to next() when subject deletion fails", async () => {
    const dbError = new Error("DB connection lost");
    mockDeleteWhere.mockRejectedValueOnce(dbError);

    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should pass errors to next() when reference counting fails", async () => {
    const dbError = new Error("DB connection lost");
    mockSelectWhere.mockRejectedValueOnce(dbError);

    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should skip deletion and return success if subject does not exist (no error)", async () => {
    // Database returns success even if no rows were deleted
    mockDeleteWhere.mockResolvedValue(undefined);

    const req = mockReq({ params: { id: subjectId } }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("should count references in all 6 tables before allowing deletion", async () => {
    const req = mockReq({
      params: { id: subjectId },
      query: { confirm: "true" },
    }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    await deleteSubject(req, res, next);

    // Should have checked each table (select is called once per table)
    expect(mockSelect).toHaveBeenCalledTimes(6);
    expect(mockSelectFrom).toHaveBeenCalledTimes(6);
    // Should delete since confirm=true
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
