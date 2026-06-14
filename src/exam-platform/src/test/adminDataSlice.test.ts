import { describe, it, expect } from "vitest";
import adminDataReducer, {
  invalidateSubjectsCache,
  invalidateQuestionsCache,
  addQuestionToCache,
  updateQuestionInCache,
  removeQuestionFromCache,
  addSubjectToCache,
  updateSubjectInCache,
  removeSubjectFromCache,
} from "@/store/slices/adminDataSlice";

interface TestQuestion {
  id: string;
  subjectId: string | null;
  classNum: number | null;
  subject: string | null;
  medium: string | null;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
  explanation: string | null;
  difficulty: string | null;
  negativeMarking: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mockQuestion(id: string | number, text?: string): TestQuestion {
  const strId = String(id);
  return {
    id: strId,
    subjectId: null,
    classNum: null,
    subject: null,
    medium: null,
    text: text ?? `Question ${strId}`,
    optionA: "A",
    optionB: "B",
    optionC: "C",
    optionD: "D",
    correctIndex: 0,
    explanation: null,
    difficulty: null,
    negativeMarking: null,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };
}

function mockSubject(id: number, name?: string): { id: number; name: string; examCategory: string | null; description: string | null; isActive: boolean; createdAt: string; updatedAt: string } {
  return {
    id,
    name: name ?? `Subject ${id}`,
    examCategory: "General",
    description: null,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };
}

describe("adminDataSlice", () => {
  it("should return the initial state", () => {
    const state = adminDataReducer(undefined, { type: "unknown" });
    expect(state.subjects).toEqual({ data: [], fetchedAt: 0 });
    expect(state.questions).toEqual({ data: [], fetchedAt: 0 });
    expect(state.questionsLoading).toBe(false);
    expect(state.subjectsLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle invalidateSubjectsCache", () => {
    const state1 = adminDataReducer(undefined, { type: "unknown" });
    const state2 = adminDataReducer(state1, addSubjectToCache(mockSubject(1)));
    expect(state2.subjects.data).toHaveLength(1);

    const state3 = adminDataReducer(state2, invalidateSubjectsCache());
    expect(state3.subjects.fetchedAt).toBe(0);
    expect(state3.subjects.data).toHaveLength(1);
  });

  it("should handle invalidateQuestionsCache", () => {
    const state1 = adminDataReducer(undefined, { type: "unknown" });
    const state2 = adminDataReducer(state1, addQuestionToCache(mockQuestion(1)));
    expect(state2.questions.data).toHaveLength(1);

    const state3 = adminDataReducer(state2, invalidateQuestionsCache());
    expect(state3.questions.fetchedAt).toBe(0);
    expect(state3.questions.data).toHaveLength(1);
  });

  it("should handle addQuestionToCache", () => {
    const state = adminDataReducer(
      undefined,
      addQuestionToCache(mockQuestion(1)),
    );
    expect(state.questions.data).toHaveLength(1);
    expect(state.questions.data[0].text).toBe("Question 1");
  });

  it("should handle updateQuestionInCache", () => {
    const state1 = adminDataReducer(
      undefined,
      addQuestionToCache(mockQuestion(1, "Old text")),
    );
    const state2 = adminDataReducer(
      state1,
      updateQuestionInCache({
        ...mockQuestion(1, "New text"),
        correctIndex: 2,
      }),
    );
    expect(state2.questions.data[0].text).toBe("New text");
    expect(state2.questions.data[0].correctIndex).toBe(2);
  });

  it("should handle removeQuestionFromCache", () => {
    const state1 = adminDataReducer(
      undefined,
      addQuestionToCache(mockQuestion(1)),
    );
    const state2 = adminDataReducer(state1, addQuestionToCache(mockQuestion(2)));
    expect(state2.questions.data).toHaveLength(2);

    const state3 = adminDataReducer(state2, removeQuestionFromCache("1"));
    expect(state3.questions.data).toHaveLength(1);
    expect(state3.questions.data[0].id).toBe("2");
  });

  it("should handle addSubjectToCache", () => {
    const state = adminDataReducer(undefined, addSubjectToCache(mockSubject(1)));
    expect(state.subjects.data).toHaveLength(1);
    expect(state.subjects.data[0].name).toBe("Subject 1");
  });

  it("should handle updateSubjectInCache", () => {
    const state1 = adminDataReducer(
      undefined,
      addSubjectToCache(mockSubject(1, "Old Name")),
    );
    const state2 = adminDataReducer(
      state1,
      updateSubjectInCache(mockSubject(1, "Updated Name")),
    );
    expect(state2.subjects.data[0].name).toBe("Updated Name");
  });

  it("should handle removeSubjectFromCache", () => {
    const state1 = adminDataReducer(
      undefined,
      addSubjectToCache(mockSubject(1)),
    );
    const state2 = adminDataReducer(state1, addSubjectToCache(mockSubject(2)));
    expect(state2.subjects.data).toHaveLength(2);

    const state3 = adminDataReducer(state2, removeSubjectFromCache(1));
    expect(state3.subjects.data).toHaveLength(1);
    expect(state3.subjects.data[0].id).toBe(2);
  });
});
