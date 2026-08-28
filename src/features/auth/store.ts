import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Persona = "admin" | "analyst" | "viewer";

/** Mirrors the scope model the FastAPI backend will enforce for real. */
export const SCOPES: Record<Persona, string[]> = {
  admin: [
    "people:read",
    "messages:read",
    "runs:read",
    "runs:write",
    "config:read",
    "org:read",
    "org:write",
  ],
  analyst: ["people:read", "messages:read", "runs:read", "org:read"],
  viewer: [],
};

export const PERSONAS: Persona[] = ["admin", "analyst", "viewer"];

export interface AuthSession {
  email: string;
  name: string;
  persona: Persona;
  signed_in_at: string;
}

interface AuthState {
  session: AuthSession | null;
  signIn: (email: string, persona: Persona) => void;
  signOut: () => void;
  setPersona: (persona: Persona) => void;
}

const nameFromEmail = (email: string) =>
  email
    .split("@")[0]!
    .split(/[._-]/)
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase() + s.slice(1))
    .join(" ") || "Threadline User";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (email, persona) =>
        set({
          session: {
            email: email || `${persona}@threadline.dev`,
            name: nameFromEmail(email || `${persona}@threadline.dev`),
            persona,
            signed_in_at: new Date().toISOString(),
          },
        }),
      signOut: () => set({ session: null }),
      setPersona: (persona) =>
        set((state) => ({ session: state.session ? { ...state.session, persona } : null })),
    }),
    { name: "threadline-auth" },
  ),
);

export function useHasScope(scope: string): boolean {
  const persona = useAuthStore((s) => s.session?.persona);
  return persona ? SCOPES[persona].includes(scope) : false;
}
