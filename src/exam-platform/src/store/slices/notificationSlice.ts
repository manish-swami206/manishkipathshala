import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AppNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
}

const initialState: NotificationState = {
  items: [],
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<AppNotification, "id" | "createdAt" | "read">>) {
      state.items.unshift({
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        createdAt: new Date().toISOString(),
        read: false,
      });
      if (state.items.length > 50) state.items.pop();
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const n = state.items.find((i) => i.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead(state) {
      state.items.forEach((i) => (i.read = true));
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearNotifications(state) {
      state.items = [];
    },
  },
});

export const { addNotification, markNotificationRead, markAllRead, removeNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
