import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { C, fonts, Card, PageTitle } from "../ui";

interface Row {
  id: number;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const actionLabel: Record<string, string> = { INSERT: "Үүсгэсэн", UPDATE: "Зассан", DELETE: "Устгасан" };
const tableLabel: Record<string, string> = { documents: "Ирсэн/явсан бичиг", files: "Бичиг баримт" };

export default function AuditLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRows((data as Row[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageTitle title="Үйлдлийн бүртгэл" sub="Хэн юу хийсэн" />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24, fontFamily: fonts.mono, color: C.muted }}>Ачааллаж байна…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, fontFamily: fonts.body, color: C.muted }}>Бүртгэл алга байна.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#faf8f4" }}>
                {["Огноо/цаг", "Хэрэглэгч", "Үйлдэл", "Хэсэг", "Гарчиг"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontFamily: fonts.mono, fontSize: 9, letterSpacing: "0.12em", color: C.accent, borderBottom: `1px solid ${C.line}` }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "10px 14px", fontFamily: fonts.mono, fontSize: 12, color: C.muted }}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: C.dark }}>{r.user_email || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: 11, color: r.action === "DELETE" ? "#b3361f" : r.action === "INSERT" ? "#2e7d32" : C.accent }}>
                      {actionLabel[r.action] || r.action}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: C.muted }}>{tableLabel[r.table_name] || r.table_name}</td>
                  <td style={{ padding: "10px 14px", color: C.muted }}>{(r.details?.title as string) || (r.details?.name as string) || r.record_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
