import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n/config";

export type Theme = "light" | "dark";

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  language: Language;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (l: Language) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      language: DEFAULT_LANGUAGE,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setLanguage: (language) => set({ language }),
    }),
    { name: "mabinsoft-ui" },
  ),
);
