// Supabase Edge Function: create-user
// Зөвхөн superadmin шинэ хэрэглэгч үүсгэнэ. Secret key зөвхөн энд (серверт) ашиглагдана.
// Deploy: supabase functions deploy create-user
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SERVICE_KEY")!; // secret key — Supabase secret-ээр тавина
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1) Дуудаж буй хэрэглэгчийг шалгах
    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await caller.auth.getUser();
    if (uErr || !user) return json({ error: "Нэвтрээгүй байна" }, 401);

    const { data: prof } = await caller.from("profiles").select("role").eq("id", user.id).single();
    if (prof?.role !== "superadmin") return json({ error: "Зөвхөн супер админ хэрэглэгч үүсгэнэ" }, 403);

    // 2) Шинэ хэрэглэгчийг service key-ээр үүсгэх
    const { email, password, full_name, role } = await req.json();
    if (!email || !password) return json({ error: "И-мэйл, нууц үг шаардлагатай" }, 400);

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? "", role: role ?? "staff" },
    });
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true, user_id: data.user?.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
