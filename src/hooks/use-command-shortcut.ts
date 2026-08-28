import { useEffect } from "react";

/** Registers the ⌘K / Ctrl-K shortcut that toggles the command palette. */
export function useCommandShortcut(setOpen: (fn: (o: boolean) => boolean) => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setOpen]);
}
