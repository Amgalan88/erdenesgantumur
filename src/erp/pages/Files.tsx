import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { C, fonts, Label, inputStyle, Btn, Card, PageTitle } from "../ui";

interface FileRow {
  id: string;
  name: string;
  category: string | null;
  storage_path: string;
  size_bytes: number | null;
  created_at: string;
}

function fmtSize(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

export default function Files() {
  const { can } = useAuth();
  const [rows, setRows] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setRows((data as FileRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    const path = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("docs").upload(path, file);
    if (upErr) {
      setErr(upErr.message);
      setBusy(false);
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from("files").insert({
      name: file.name,
      category: category || null,
      storage_path: path,
      size_bytes: file.size,
      uploaded_by: u.user?.id,
    });
    if (insErr) setErr(insErr.message);
    setBusy(false);
    e.target.value = "";
    load();
  }

  async function download(f: FileRow) {
    const { data, error } = await supabase.storage.from("docs").createSignedUrl(f.storage_path, 60);
    if (error) {
      alert(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(f: FileRow) {
    if (!confirm(`"${f.name}" файлыг устгах уу?`)) return;
    await supabase.storage.from("docs").remove([f.storage_path]);
    const { error } = await supabase.from("files").delete().eq("id", f.id);
    if (error) alert(error.message);
    else load();
  }

  const canCreate = can("files", "create");
  const isAdmin = can("files", "edit"); // устгахыг доор superadmin-аар RLS хязгаарлана

  return (
    <div>
      <PageTitle title="Бичиг баримт" sub="Файл сан" />

      {canCreate && (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <Label>Ангилал (заавал биш)</Label>
              <input style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Гэрээ, гэрчилгээ..." />
            </div>
            <label>
              <input type="file" onChange={upload} disabled={busy} style={{ display: "none" }} />
              <span
                style={{
                  display: "inline-block",
                  background: C.accent,
                  color: C.light,
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.06em",
                  padding: "11px 18px",
                  borderRadius: 2,
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? "БАЙРШУУЛЖ БАЙНА…" : "+ ФАЙЛ БАЙРШУУЛАХ"}
              </span>
            </label>
          </div>
        </Card>
      )}

      {err && <div style={{ color: "#b3361f", marginBottom: 12, fontFamily: fonts.body }}>{err}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24, fontFamily: fonts.mono, color: C.muted }}>Ачааллаж байна…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, fontFamily: fonts.body, color: C.muted }}>Файл алга байна.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#faf8f4" }}>
                {["Нэр", "Ангилал", "Хэмжээ", "Огноо", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontFamily: fonts.mono, fontSize: 9, letterSpacing: "0.12em", color: C.accent, borderBottom: `1px solid ${C.line}` }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "11px 14px", color: C.dark }}>{f.name}</td>
                  <td style={{ padding: "11px 14px", color: C.muted }}>{f.category || "—"}</td>
                  <td style={{ padding: "11px 14px", fontFamily: fonts.mono, fontSize: 12, color: C.muted }}>{fmtSize(f.size_bytes)}</td>
                  <td style={{ padding: "11px 14px", color: C.muted }}>{new Date(f.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => download(f)} style={linkBtn}>
                      Татах
                    </button>
                    {isAdmin && (
                      <button onClick={() => remove(f)} style={{ ...linkBtn, color: "#b3361f", marginLeft: 14 }}>
                        Устгах
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: C.accent,
  fontFamily: fonts.body,
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
};
