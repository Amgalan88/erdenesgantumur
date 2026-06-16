import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase тохиргоо дутуу байна. .env файлд VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY-г бөглөнө үү.",
  );
}

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
