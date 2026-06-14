import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
}

interface AdminState {
  adminUser: AdminUser | null;
  selectedQuestions: number[];
  selectedExams: number[];
  bulkMode: boolean;
}

const initialState: AdminState = {
  adminUser: null,
  selectedQuestions: [],
  selectedExams: [],
  bulkMode: false,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdminUser(state, action: PayloadAction<AdminUser>) {
      state.adminUser = action.payload;
    },
    toggleQuestionSelection(state, action: PayloadAction<number>) {
      const id = action.payload;
      const idx = state.selectedQuestions.indexOf(id);
      if (idx === -1) {
        state.selectedQuestions.push(id);
      } else {
        state.selectedQuestions.splice(idx, 1);
      }
    },
    selectAllQuestions(state, action: PayloadAction<number[]>) {
      state.selectedQuestions = action.payload;
    },
    clearQuestionSelection(state) {
      state.selectedQuestions = [];
    },
    toggleBulkMode(state) {
      state.bulkMode = !state.bulkMode;
      if (!state.bulkMode) {
        state.selectedQuestions = [];
        state.selectedExams = [];
      }
    },
  },
});

export const { setAdminUser, toggleQuestionSelection, selectAllQuestions, clearQuestionSelection, toggleBulkMode } = adminSlice.actions;
export default adminSlice.reducer;
