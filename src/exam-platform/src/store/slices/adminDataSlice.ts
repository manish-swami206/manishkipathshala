import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { customFetch } from "@/lib/api";
import type { RootState } from "../store";

// ── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: number;
  name: string;
  examCategory: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Question {
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

interface CacheEntry<T> {
  data: T[];
  fetchedAt: number;
}

export interface AdminDataState {
  subjects: CacheEntry<Subject>;
  questions: CacheEntry<Question>;
  questionsLoading: boolean;
  subjectsLoading: boolean;
  error: string | null;
}

// ── Cache duration (5 minutes) ────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;

const initialState: AdminDataState = {
  subjects: { data: [], fetchedAt: 0 },
  questions: { data: [], fetchedAt: 0 },
  questionsLoading: false,
  subjectsLoading: false,
  error: null,
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchSubjects = createAsyncThunk<
  Subject[],
  void,
  { rejectValue: string }
>(
  "adminData/fetchSubjects",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { adminData: AdminDataState };
    const cache = state.adminData.subjects;
    // Use cached data if within TTL
    if (cache.data.length > 0 && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return cache.data;
    }
    try {
      const data = await customFetch<Subject[]>("/api/admin/subjects");
      return data;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to fetch subjects",
      );
    }
  },
);

export const fetchQuestions = createAsyncThunk<
  Question[],
  { page?: number; limit?: number; search?: string; type?: string } | undefined,
  { rejectValue: string }
>(
  "adminData/fetchQuestions",
  async (params, { getState, rejectWithValue }) => {
    const state = getState() as { adminData: AdminDataState };
    const cache = state.adminData.questions;
    // Use cached data for full list if within TTL and no search params
    if (
      !params &&
      cache.data.length > 0 &&
      Date.now() - cache.fetchedAt < CACHE_TTL
    ) {
      return cache.data;
    }
    try {
      const sp = new URLSearchParams();
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.search) sp.set("search", params.search);
      if (params?.type) sp.set("type", params.type);
      const query = sp.toString();
      const result = await customFetch<{
        data: Question[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/questions${query ? `?${query}` : ""}`);
      return result.data;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to fetch questions",
      );
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const adminDataSlice = createSlice({
  name: "adminData",
  initialState,
  reducers: {
    invalidateSubjectsCache(state) {
      state.subjects.fetchedAt = 0;
    },
    invalidateQuestionsCache(state) {
      state.questions.fetchedAt = 0;
    },
    addQuestionToCache(state, action: PayloadAction<Question>) {
      state.questions.data.unshift(action.payload);
    },
    updateQuestionInCache(state, action: PayloadAction<Question>) {
      const idx = state.questions.data.findIndex(
        (q) => q.id === action.payload.id,
      );
      if (idx !== -1) {
        state.questions.data[idx] = action.payload;
      }
    },
    removeQuestionFromCache(state, action: PayloadAction<string>) {
      state.questions.data = state.questions.data.filter(
        (q) => q.id !== action.payload,
      );
    },
    addSubjectToCache(state, action: PayloadAction<Subject>) {
      state.subjects.data.unshift(action.payload);
    },
    updateSubjectInCache(state, action: PayloadAction<Subject>) {
      const idx = state.subjects.data.findIndex(
        (s) => s.id === action.payload.id,
      );
      if (idx !== -1) {
        state.subjects.data[idx] = action.payload;
      }
    },
    removeSubjectFromCache(state, action: PayloadAction<number | string>) {
      state.subjects.data = state.subjects.data.filter(
        (s) => String(s.id) !== String(action.payload),
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.subjectsLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.subjects.data = action.payload;
        state.subjects.fetchedAt = Date.now();
        state.subjectsLoading = false;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.subjectsLoading = false;
        state.error = action.payload ?? "Unknown error";
      })
      // Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.questionsLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questions.data = action.payload;
        state.questions.fetchedAt = Date.now();
        state.questionsLoading = false;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.questionsLoading = false;
        state.error = action.payload ?? "Unknown error";
      });
  },
});

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectSubjects = (state: RootState) => state.adminData.subjects.data;
export const selectSubjectsLoading = (state: RootState) =>
  state.adminData.subjectsLoading;
export const selectQuestions = (state: RootState) =>
  state.adminData.questions.data;
export const selectQuestionsLoading = (state: RootState) =>
  state.adminData.questionsLoading;

export const {
  invalidateSubjectsCache,
  invalidateQuestionsCache,
  addQuestionToCache,
  updateQuestionInCache,
  removeQuestionFromCache,
  addSubjectToCache,
  updateSubjectInCache,
  removeSubjectFromCache,
} = adminDataSlice.actions;

export default adminDataSlice.reducer;
