import { supabase, isSupabaseConfigured } from "./supabase";
import type { Profile, Role } from "./types";

const SESSION_KEY = "aw_demo_profile";

export const DEMO_PROFILES: Array<Pick<Profile, "name" | "role">> = [
  { name: "Arif", role: "owner" },
  { name: "Shafeeq", role: "supervisor" },
  { name: "Jaseem", role: "supervisor" },
];

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

// Anonymous auth: each device gets a stable auth.uid() on first load. Tapping
// a name upserts THAT device's own profiles row (id = auth.uid()) with the
// chosen name/role — see supabase/schema.sql for why this is demo-only.
export async function ensureAnonymousSession(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("Anonymous sign-in failed", error);
    return null;
  }
  return data.user.id;
}

export async function demoSignIn(name: string, role: Role): Promise<Profile | null> {
  if (isSupabaseConfigured && supabase) {
    const uid = await ensureAnonymousSession();
    if (uid) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: uid, name, role, active: true }, { onConflict: "id" })
        .select()
        .single();
      if (!error && data) {
        saveSession(data as Profile);
        return data as Profile;
      }
      console.error("Profile upsert failed", error);
    }
  }

  // No backend yet — fall back to a local-only session so the UI stays browsable.
  const localProfile: Profile = {
    id: `local-${role}-${name.toLowerCase()}`,
    name,
    phone: "",
    role,
    active: true,
  };
  saveSession(localProfile);
  return localProfile;
}

export function saveSession(profile: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export function getSession(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export async function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}
