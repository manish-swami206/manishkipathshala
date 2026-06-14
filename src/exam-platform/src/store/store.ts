import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import adminReducer from "./slices/adminSlice";
import uiReducer from "./slices/uiSlice";
import notificationReducer from "./slices/notificationSlice";
import adminDataReducer from "./slices/adminDataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    ui: uiReducer,
    notifications: notificationReducer,
    adminData: adminDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
