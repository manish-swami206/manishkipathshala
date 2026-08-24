import { describe, it, expect } from "vitest";
import {
  POINTS,
  addDaysStr,
  attemptRewardRef,
  classifyAttemptActivity,
  effectiveCurrentStreak,
  isActivityType,
  monthStartUtcStr,
  nextStreak,
  sanitizeDisplayName,
  sanitizeLimit,
  todayStr,
  utcDateStr,
  weekStartUtcStr,
  yesterdayStr,
} from "../../services/streakMath";

const TODAY = "2026-08-24"; // a Monday
const YESTERDAY = "2026-08-23";

describe("nextStreak", () => {
  it("keeps the streak when activity already happened today", () => {
    const r = nextStreak(7, TODAY, TODAY, YESTERDAY);
    expect(r).toEqual({ value: 7, incremented: false });
  });

  it("keeps the streak for a brand-new row created earlier today", () => {
    const r = nextStreak(0, TODAY, TODAY, YESTERDAY);
    expect(r).toEqual({ value: 1, incremented: false });
  });

  it("increments on the consecutive day", () => {
    const r = nextStreak(7, YESTERDAY, TODAY, YESTERDAY);
    expect(r).toEqual({ value: 8, incremented: true });
  });

  it("resets to 1 after a gap of two or more days", () => {
    const r = nextStreak(30, "2026-08-20", TODAY, YESTERDAY);
    expect(r).toEqual({ value: 1, incremented: true });
  });

  it("starts at 1 with no prior activity", () => {
    expect(nextStreak(0, null, TODAY, YESTERDAY)).toEqual({
      value: 1,
      incremented: true,
    });
  });
});

describe("effectiveCurrentStreak", () => {
  it("is alive when last activity was today", () => {
    expect(effectiveCurrentStreak(12, TODAY, TODAY, YESTERDAY)).toBe(12);
  });

  it("stays alive (extendable) when last activity was yesterday", () => {
    expect(effectiveCurrentStreak(12, YESTERDAY, TODAY, YESTERDAY)).toBe(12);
  });

  it("decays ghost streaks from inactivity", () => {
    expect(effectiveCurrentStreak(30, "2026-07-01", TODAY, YESTERDAY)).toBe(0);
  });

  it("decays when there is no recorded activity date", () => {
    expect(effectiveCurrentStreak(5, null, TODAY, YESTERDAY)).toBe(0);
  });

  it("never goes below zero", () => {
    expect(effectiveCurrentStreak(0, TODAY, TODAY, YESTERDAY)).toBe(0);
  });
});

describe("sanitizeLimit", () => {
  it("falls back on garbage input", () => {
    expect(sanitizeLimit(undefined)).toBe(20);
    expect(sanitizeLimit("")).toBe(20);
    expect(sanitizeLimit("abc")).toBe(20);
    expect(sanitizeLimit(Number.NaN)).toBe(20);
    // Number("infinity") is finite-parseable but not bounded
    expect(sanitizeLimit("Infinity")).toBe(20);
  });

  it("clamps into [1, max]", () => {
    expect(sanitizeLimit(-5)).toBe(1);
    expect(sanitizeLimit("0")).toBe(1);
    expect(sanitizeLimit(9999)).toBe(50);
    expect(sanitizeLimit("-3.9")).toBe(1);
  });

  it("accepts valid values including numeric strings and truncates floats", () => {
    expect(sanitizeLimit("10")).toBe(10);
    expect(sanitizeLimit(10)).toBe(10);
    expect(sanitizeLimit(7.9)).toBe(7);
    expect(sanitizeLimit(1)).toBe(1);
    expect(sanitizeLimit(50)).toBe(50);
  });

  it("honors custom fallback and max", () => {
    expect(sanitizeLimit("abc", 5, 100)).toBe(5);
    expect(sanitizeLimit(200, 5, 100)).toBe(100);
  });
});

describe("sanitizeDisplayName", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeDisplayName("  Ada   Lovelace \n")).toBe("Ada Lovelace");
  });

  it("strips control characters", () => {
    expect(sanitizeDisplayName("An\u0000a\u001f Bell\u007f")).toBe("Ana Bell");
  });

  it("caps length at 40 chars", () => {
    const long = "a".repeat(100);
    expect(sanitizeDisplayName(long)).toHaveLength(40);
  });

  it("falls back to Learner for empty or non-string input", () => {
    expect(sanitizeDisplayName("   ")).toBe("Learner");
    expect(sanitizeDisplayName("")).toBe("Learner");
    expect(sanitizeDisplayName(undefined)).toBe("Learner");
    expect(sanitizeDisplayName(42)).toBe("Learner");
    expect(sanitizeDisplayName(null)).toBe("Learner");
  });
});

describe("UTC period boundaries", () => {
  it("weekStartUtcStr returns Monday of the UTC week", () => {
    // Mon 2026-08-24
    expect(weekStartUtcStr(new Date("2026-08-26T10:00:00Z"))).toBe("2026-08-24"); // Wed
    expect(weekStartUtcStr(new Date("2026-08-24T05:00:00Z"))).toBe("2026-08-24"); // Mon itself
    // Sunday rolls back to the prior Monday across the year boundary
    expect(weekStartUtcStr(new Date("2026-01-04T23:00:00Z"))).toBe("2025-12-29");
  });

  it("monthStartUtcStr returns the first of the current UTC month", () => {
    expect(monthStartUtcStr(new Date("2026-08-24T13:14:00Z"))).toBe("2026-08-01");
    expect(monthStartUtcStr(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
    expect(monthStartUtcStr(new Date("2025-12-31T23:59:59Z"))).toBe("2025-12-01");
  });

  it("date helpers are pure UTC (independent of server-local timezone)", () => {
    expect(utcDateStr(new Date("2026-08-24T23:59:59Z"))).toBe("2026-08-24");
    expect(addDaysStr("2026-08-01", -1)).toBe("2026-07-31");
    expect(addDaysStr("2026-02-28", 1)).toBe("2026-03-01"); // non-leap year
    expect(yesterdayStr(new Date("2026-01-01T00:30:00Z"))).toBe("2025-12-31");
    expect(todayStr(new Date("2026-08-24T09:00:00Z"))).toBe("2026-08-24");
  });
});

describe("classifyAttemptActivity", () => {
  it("prefers the explicit type from the player wrapper", () => {
    // A PYQ subject slug stored in quizId must NOT be misread as a daily quiz.
    expect(
      classifyAttemptActivity({ quizId: "indian-polity" }, "pyq"),
    ).toBe("pyq");
    expect(classifyAttemptActivity({ examId: "x" }, "quiz")).toBe("quiz");
  });

  it("ignores 'login' as an explicit attempt type", () => {
    expect(classifyAttemptActivity({}, "login")).toBeNull();
    expect(classifyAttemptActivity({ quizId: "q" }, "login")).toBe("quiz");
  });

  it("infers mock from examId", () => {
    expect(classifyAttemptActivity({ examId: "uuid-1" })).toBe("mock");
  });

  it("infers quiz from quizId", () => {
    expect(classifyAttemptActivity({ quizId: "uuid-2" })).toBe("quiz");
  });

  it("returns null when nothing identifies the attempt", () => {
    expect(classifyAttemptActivity({})).toBeNull();
  });
});

describe("attemptRewardRef", () => {
  it("uses examId for mocks", () => {
    expect(attemptRewardRef("mock", { examId: "e1", quizId: "q1" })).toEqual({
      column: "examId",
      id: "e1",
    });
  });

  it("uses quizId for quizzes and PYQs", () => {
    expect(attemptRewardRef("quiz", { quizId: "q1" })).toEqual({
      column: "quizId",
      id: "q1",
    });
    expect(attemptRewardRef("pyq", { quizId: "ancient-history" })).toEqual({
      column: "quizId",
      id: "ancient-history",
    });
  });

  it("returns null when the referenced id is missing", () => {
    expect(attemptRewardRef("mock", {})).toBeNull();
    expect(attemptRewardRef("pyq", {})).toBeNull();
  });
});

describe("points table", () => {
  it("matches the advertised reward values", () => {
    expect(POINTS).toEqual({ quiz: 5, mock: 50, pyq: 3, login: 0 });
  });

  it("guards the activity type whitelist", () => {
    expect(isActivityType("quiz")).toBe(true);
    expect(isActivityType("login")).toBe(true);
    expect(isActivityType("admin")).toBe(false);
    expect(isActivityType(1)).toBe(false);
  });
});
