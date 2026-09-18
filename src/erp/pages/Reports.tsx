import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { C, fonts, Label, inputStyle, Btn, Card, PageTitle } from "../ui";
import { Modal } from "./Documents";

type ReportType = "trip" | "monthly" | "project" | "other";

interface Report {
  id: string;
  title: string;
  report_type: ReportType;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const typeLabel: Record<ReportType, string> = {
  trip: "Томилолт",
  monthly: "Сарын",
  project: "Төслийн",
  other: "Бусад",
};

// Томилолтын тайлангийн бэлэн бүтэц — "Загвар оруулах" товчоор агуулгад тавина
const TRIP_TEMPLATE = `1. ТОМИЛОЛТЫН ЗОРИЛГО
-

2. ОРОЛЦСОН ХҮМҮҮС
-

3. ХИЙСЭН АЖЛЫН ТОВЧОО (өдөр бүрээр)
- 1-р өдөр:
- 2-р өдөр:

4. УУЛЗСАН БАЙГУУЛЛАГА, ХАРИЛЦАГЧ
-

5. ГАРСАН ҮР ДҮН, ТОХИРОЛЦОО
-

6. ЗАРДАЛ
-

7. САНАЛ, ДҮГНЭЛТ, ЦААШДЫН АЛХАМ
-
`;

const empty = {
  title: "",
  report_type: "trip" as ReportType,
  location: "",
  start_date: "",
  end_date: "",
  body: "",
};

function fmtRange(r: Pick<Report, "start_date" | "end_date">) {
  if (!r.start_date && !r.end_date) return "—";
  if (r.start_date && r.end_date && r.start_date !== r.end_date) return `${r.start_date} → ${r.end_date}`;
  return r.start_date || r.end_date || "—";
}

export default function Reports() {
  const { can, profile } = useAuth();
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ReportType>("all");
  const [viewing, setViewing] = useState<Report | null>(null);
  const [editing, setEditing] = useState<Report | null>(null);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let q = supabase.from("reports").select("*").order("start_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("report_type", filter);
    const { data, error } = await q;
    if (error) setErr(error.message);
    setRows((data as Report[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFile(null);
    setShowForm(true);
    setErr(null);
  }
  function openEdit(r: Report) {
    setViewing(null);
    setEditing(r);
    setForm({
      title: r.title,
      report_type: r.report_type,
      location: r.location ?? "",
      start_date: r.start_date ?? "",
      end_date: r.end_date ?? "",
      body: r.body ?? "",
    });
    setFile(null);
    setShowForm(true);
    setErr(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setErr("Дуусах огноо эхлэх огнооноос өмнө байж болохгүй.");
      return;
    }
    setBusy(true);

    const payload: Record<string, string | null> = {
      title: form.title,
      report_type: form.report_type,
      location: form.location || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      body: form.body || null,
    };

    if (file) {
      const path = `reports/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("docs").upload(path, file);
      if (upErr) {
        setErr(upErr.message);
        setBusy(false);
        return;
      }
      payload.file_path = path;
      payload.file_name = file.name;
    }

    let error;
    if (editing) {
      ({ error } = await supabase.from("reports").update(payload).eq("id", editing.id));
      // Шинэ хавсралт орсон бол хуучныг нь цэвэрлэнэ
      if (!error && file && editing.file_path) await supabase.storage.from("docs").remove([editing.file_path]);
    } else {
      const { data: u } = await supabase.auth.getUser();
      ({ error } = await supabase.from("reports").insert({ ...payload, created_by: u.user?.id }));
    }
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(r: Report) {
    if (!confirm(`"${r.title}" тайланг устгах уу?`)) return;
    const { error } = await supabase.from("reports").delete().eq("id", r.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (r.file_path) await supabase.storage.from("docs").remove([r.file_path]);
    setShowForm(false);
    setViewing(null);
    load();
  }

  async function download(r: Report) {
    if (!r.file_path) return;
    const { data, error } = await supabase.storage.from("docs").createSignedUrl(r.file_path, 60);
    if (error) {
      alert(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const canCreate = can("reports", "create");
  const canEdit = can("reports", "edit");
  const canDelete = profile?.role === "superadmin";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <PageTitle title="Тайлан" sub="Томилолт, ажлын тайлан" />
        {canCreate && <Btn onClick={openCreate}>+ ШИНЭ ТАЙЛАН</Btn>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {([["all", "Бүгд"], ...Object.entries(typeLabel)] as [string, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k as "all" | ReportType)}
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "7px 14px",
              cursor: "pointer",
              borderRadius: 2,
              border: `1px solid ${filter === k ? C.accent : C.line}`,
              background: filter === k ? C.accent : "transparent",
              color: filter === k ? C.light : C.muted,
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {err && !showForm && <div style={{ color: "#b3361f", marginBottom: 12, fontFamily: fonts.body }}>{err}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24, fontFamily: fonts.mono, color: C.muted }}>Ачааллаж байна…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, fontFamily: fonts.body, color: C.muted }}>Тайлан алга байна.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#faf8f4", textAlign: "left" }}>
                  {["Төрөл", "Гарчиг", "Газар", "Хугацаа", ""].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "11px 14px", fontFamily: fonts.mono, fontSize: 9, letterSpacing: "0.12em", color: C.accent, borderBottom: `1px solid ${C.line}` }}
                    >
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontFamily: fonts.mono, fontSize: 10, padding: "3px 8px", borderRadius: 2, background: "rgba(201,125,46,0.14)", color: C.accent }}>
                        {typeLabel[r.report_type]?.toUpperCase() ?? r.report_type}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", color: C.dark }}>
                      <button onClick={() => setViewing(r)} style={{ ...linkBtn, color: C.dark, textDecoration: "none", fontSize: 14, textAlign: "left", padding: 0 }}>
                        {r.title}
                      </button>
                      {r.file_name && <span style={{ marginLeft: 8, fontFamily: fonts.mono, fontSize: 10, color: C.muted }}>📎</span>}
                    </td>
                    <td style={{ padding: "11px 14px", color: C.muted }}>{r.location || "—"}</td>
                    <td style={{ padding: "11px 14px", color: C.muted, whiteSpace: "nowrap" }}>{fmtRange(r)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => setViewing(r)} style={linkBtn}>
                        Үзэх
                      </button>
                      {canEdit && (
                        <button onClick={() => openEdit(r)} style={{ ...linkBtn, marginLeft: 14 }}>
                          Засах
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {viewing && (
        <Modal onClose={() => setViewing(null)} title={viewing.title} maxWidth={760}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <Label>Төрөл</Label>
              <div style={{ fontFamily: fonts.body, color: C.dark }}>{typeLabel[viewing.report_type]}</div>
            </div>
            <div>
              <Label>Газар</Label>
              <div style={{ fontFamily: fonts.body, color: C.dark }}>{viewing.location || "—"}</div>
            </div>
            <div>
              <Label>Хугацаа</Label>
              <div style={{ fontFamily: fonts.body, color: C.dark }}>{fmtRange(viewing)}</div>
            </div>
          </div>
          <Card>
            <div style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 1.7, color: C.dark, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {viewing.body || <span style={{ color: C.muted }}>Агуулга оруулаагүй байна.</span>}
            </div>
          </Card>
          {viewing.file_name && (
            <div style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 14 }}>
              <Label>Хавсралт</Label>
              <button onClick={() => download(viewing)} style={linkBtn}>
                📎 {viewing.file_name}
              </button>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <Btn variant="ghost" onClick={() => window.print()}>
              Хэвлэх
            </Btn>
            {canEdit && <Btn onClick={() => openEdit(viewing)}>Засах</Btn>}
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Тайлан засах" : "Шинэ тайлан"} maxWidth={760}>
          <form onSubmit={save}>
            <div>
              <Label>Гарчиг *</Label>
              <input
                style={inputStyle}
                required
                value={form.title}
                placeholder="Жишээ: Шанхай хот руу хийсэн томилолтын тайлан"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 14 }}>
              <div>
                <Label>Төрөл</Label>
                <select style={inputStyle} value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value as ReportType })}>
                  {Object.entries(typeLabel).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Газар</Label>
                <input style={inputStyle} value={form.location} placeholder="Шанхай, Хятад" onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>Эхэлсэн огноо</Label>
                <input type="date" style={inputStyle} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Дууссан огноо</Label>
                <input type="date" style={inputStyle} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Label>Тайлангийн агуулга</Label>
                {form.report_type === "trip" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (form.body.trim() && !confirm("Одоогийн агуулгыг загвараар солих уу?")) return;
                      setForm({ ...form, body: TRIP_TEMPLATE });
                    }}
                    style={{ ...linkBtn, fontSize: 12, marginBottom: 6 }}
                  >
                    Томилолтын загвар оруулах
                  </button>
                )}
              </div>
              <textarea
                style={{ ...inputStyle, minHeight: 320, resize: "vertical", lineHeight: 1.6 }}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <Label>Хавсралт (зураг, PDF, Excel г.м. — заавал биш)</Label>
              {editing?.file_name && !file && (
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.muted, marginBottom: 6 }}>Одоогийн: {editing.file_name} (шинэ файл сонговол солигдоно)</div>
              )}
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ fontFamily: fonts.body, fontSize: 13 }} />
            </div>
            {err && <div style={{ color: "#b3361f", marginTop: 12, fontFamily: fonts.body }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, gap: 10, flexWrap: "wrap" }}>
              <div>
                {editing && canDelete && (
                  <Btn variant="danger" onClick={() => remove(editing)}>
                    Устгах
                  </Btn>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setShowForm(false)}>
                  Болих
                </Btn>
                <Btn type="submit" disabled={busy}>
                  {busy ? "Хадгалж байна…" : "Хадгалах"}
                </Btn>
              </div>
            </div>
          </form>
        </Modal>
      )}
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
