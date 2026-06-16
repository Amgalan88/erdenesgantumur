import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { C, fonts, Card, PageTitle } from "../ui";

interface Stats {
  docsIn: number;
  docsOut: number;
  files: number;
  users: number | null;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <div style={{ fontFamily: fonts.mono, fontSize: 9, color: C.accent, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 40, color: C.dark, lineHeight: 1 }}>{value}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { profile, can } = useAuth();
  const [s, setS] = useState<Stats>({ docsIn: 0, docsOut: 0, files: 0, users: null });

  useEffect(() => {
    async function run() {
      const count = (q: any) => q.then((r: any) => r.count ?? 0);
      const [docsIn, docsOut, files] = await Promise.all([
        can("documents", "view") ? count(supabase.from("documents").select("*", { count: "exact", head: true }).eq("direction", "in")) : 0,
        can("documents", "view") ? count(supabase.from("documents").select("*", { count: "exact", head: true }).eq("direction", "out")) : 0,
        can("files", "view") ? count(supabase.from("files").select("*", { count: "exact", head: true })) : 0,
      ]);
      let users: number | null = null;
      if (profile?.role === "superadmin" || profile?.role === "director") {
        users = await count(supabase.from("profiles").select("*", { count: "exact", head: true }));
      }
      setS({ docsIn, docsOut, files, users });
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const greeting = profile?.role === "superadmin" ? "Супер админ" : profile?.role === "director" ? "Захирал" : "Ажилтан";

  return (
    <div>
      <PageTitle title={`Сайн байна уу, ${profile?.full_name || ""}`} sub={`${greeting} · Хяналтын самбар`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {can("documents", "view") && <Stat label="Ирсэн бичиг" value={s.docsIn} />}
        {can("documents", "view") && <Stat label="Явсан бичиг" value={s.docsOut} />}
        {can("files", "view") && <Stat label="Бичиг баримт" value={s.files} />}
        {s.users !== null && <Stat label="Хэрэглэгч" value={s.users} />}
      </div>

      <Card style={{ marginTop: 24 }}>
        <div style={{ fontFamily: fonts.body, color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          Зүүн талын цэснээс модулиа сонгож ажиллана. Таны эрхэд тохирсон хэсгүүд л харагдана.
          {profile?.role === "superadmin" && " Та супер админ тул бүх хэсэгт хандах, хэрэглэгч үүсгэх, эрх олгох боломжтой."}
        </div>
      </Card>
    </div>
  );
}
