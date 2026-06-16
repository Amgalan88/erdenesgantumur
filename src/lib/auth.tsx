import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Role = "superadmin" | "director" | "staff";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
}

export interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  permissions: Permission[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (module: string, action: "view" | "create" | "edit") => boolean;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const [{ data: prof }, { data: perms }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("module_permissions").select("*").eq("user_id", userId),
    ]);
    setProfile((prof as Profile) ?? null);
    setPermissions((perms as Permission[]) ?? []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess);
      if (sess) await loadProfile(sess.user.id);
      else {
        setProfile(null);
        setPermissions([]);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthState["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refresh = async () => {
    if (session) await loadProfile(session.user.id);
  };

  const can: AuthState["can"] = (module, action) => {
    if (!profile) return false;
    if (profile.role === "superadmin") return true;
    if (action === "view" && profile.role === "director") return true;
    const p = permissions.find((x) => x.module === module);
    if (!p) return false;
    return action === "view" ? p.can_view : action === "create" ? p.can_create : p.can_edit;
  };

  return (
    <Ctx.Provider value={{ session, profile, permissions, loading, signIn, signOut, refresh, can }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
