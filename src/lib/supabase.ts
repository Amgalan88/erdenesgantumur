import { createClient } from "@supabase/supabase-js";

// Project URL болон publishable (anon) key нь нийтэд ил, аюулгүй утгууд тул
// default болгон шууд тавьсан. .env байвал түүнийг давамгайлж ашиглана.
// (Secret key-г ХЭЗЭЭ Ч энд бичихгүй — зөвхөн серверийн Edge Function-д.)
const DEFAULT_URL = "https://fzlqlcaaryqmyrgsbbrs.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_KbJzYNgAeWCOSUwv-a1UzA_-ShiKjUG";

const url = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Модулийн нэрс — DB дахь module_permissions.module утгуудтай тохирно
export const MODULES = {
  documents: "documents", // Ирсэн / явсан бичиг
  files: "files", // Бичиг баримт
} as const;

export type ModuleKey = keyof typeof MODULES;
