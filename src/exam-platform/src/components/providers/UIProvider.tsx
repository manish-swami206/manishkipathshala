"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface UIState {
  adminSidebarCollapsed: boolean;
  mobileAdminSidebarOpen: boolean;
}

interface UIContextValue extends UIState {
  toggleAdminSidebar: () => void;
  setMobileAdminSidebarOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(false);
  const [mobileAdminSidebarOpen, setMobileOpen] = useState(false);

  const toggleAdminSidebar = useCallback(() => {
    setAdminSidebarCollapsed((prev) => !prev);
  }, []);

  const setMobileAdminSidebarOpen = useCallback((open: boolean) => {
    setMobileOpen(open);
  }, []);

  return (
    <UIContext.Provider
      value={{
        adminSidebarCollapsed,
        mobileAdminSidebarOpen,
        toggleAdminSidebar,
        setMobileAdminSidebarOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
