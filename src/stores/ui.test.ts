import { beforeEach, describe, expect, it } from "vitest";

import { useUIStore } from "./ui";

const initial = useUIStore.getState();

beforeEach(() => {
  useUIStore.setState({ sidebarCollapsed: false, theme: "light", language: "en" });
});

describe("theme", () => {
  it("starts light", () => {
    expect(useUIStore.getState().theme).toBe("light");
  });

  it("toggles between light and dark", () => {
    initial.toggleTheme();
    expect(useUIStore.getState().theme).toBe("dark");
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe("light");
  });

  it("sets a theme directly", () => {
    useUIStore.getState().setTheme("dark");
    expect(useUIStore.getState().theme).toBe("dark");
  });
});

describe("sidebar", () => {
  it("toggles collapsed state", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("sets collapsed state directly", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});

describe("language", () => {
  it("defaults to en", () => {
    expect(useUIStore.getState().language).toBe("en");
  });

  it("can be changed", () => {
    useUIStore.getState().setLanguage("en");
    expect(useUIStore.getState().language).toBe("en");
  });
});
