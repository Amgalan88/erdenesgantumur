import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { C, fonts, Label, inputStyle, Btn, Card, PageTitle } from "../ui";

interface Doc {
  id: string;
  direction: "in" | "out";
  doc_number: string | null;
  doc_date: string | null;
  title: string;
  counterparty: string | null;
  notes: string | null;
  created_at: string;
}

const empty = { direction: "in" as "in" | "out", doc_number: "", doc_date: "", title: "", counterparty: "", notes: "" };

export default function Documents() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let q = supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("direction", filter);
    const { data, error } = await q;
    if (error) setErr(error.message);
    setRows((data as Doc[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
    setErr(null);
  }
  function openEdit(d: Doc) {
    setEditing(d);
    setForm({
      direction: d.direction,
      doc_number: d.doc_number ?? "",
      doc_date: d.doc_date ?? "",
      title: d.title,
      counterparty: d.counterparty ?? "",
      notes: d.notes ?? "",
    });
    setShowForm(true);
    setErr(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload = {
      direction: form.direction,
      doc_number: form.doc_number || null,
      doc_date: form.doc_date || null,
      title: form.title,
      counterparty: form.counterparty || null,
      notes: form.notes || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("documents").update(payload).eq("id", editing.id));
    } else {
      const { data: u } = await supabase.auth.getUser();
      ({ error } = await supabase.from("documents").insert({ ...payload, created_by: u.user?.id }));
    }
    if (error) {
      setErr(error.message);
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(d: Doc) {
    if (!confirm(`"${d.title}" бичгийг устгах уу?`)) return;
    const { error } = await supabase.from("documents").delete().eq("id", d.id);
    if (error) alert(error.message);
    else load();
  }

  const canCreate = can("documents", "create");
  const canEdit = can("documents", "edit");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <PageTitle title="Ирсэн / явсан бичиг" sub="Албан бичгийн бүртгэл" />
        {canCreate && <Btn onClick={openCreate}>+ ШИНЭ БИЧИГ</Btn>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {([
          ["all", "Бүгд"],
          ["in", "Ирсэн"],
          ["out", "Явсан"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
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

      {err && <div style={{ color: "#b3361f", marginBottom: 12, fontFamily: fonts.body }}>{err}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24, fontFamily: fonts.mono, color: C.muted }}>Ачааллаж байна…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, fontFamily: fonts.body, color: C.muted }}>Бичиг алга байна.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#faf8f4", textAlign: "left" }}>
                {["Чиглэл", "Дугаар", "Огноо", "Гарчиг", "Харилцагч", ""].map((h) => (
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
              {rows.map((d) => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 2,
                        background: d.direction === "in" ? "rgba(46,125,50,0.12)" : "rgba(201,125,46,0.14)",
                        color: d.direction === "in" ? "#2e7d32" : C.accent,
                      }}
                    >
                      {d.direction === "in" ? "ИРСЭН" : "ЯВСАН"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontFamily: fonts.mono, fontSize: 13 }}>{d.doc_number || "—"}</td>
                  <td style={{ padding: "11px 14px", color: C.muted }}>{d.doc_date || "—"}</td>
                  <td style={{ padding: "11px 14px", color: C.dark }}>{d.title}</td>
                  <td style={{ padding: "11px 14px", color: C.muted }}>{d.counterparty || "—"}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {canEdit && (
                      <button onClick={() => openEdit(d)} style={linkBtn}>
                        Засах
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Бичиг засах" : "Шинэ бичиг"}>
          <form onSubmit={save}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Label>Чиглэл</Label>
                <select
                  style={inputStyle}
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value as "in" | "out" })}
                >
                  <option value="in">Ирсэн</option>
                  <option value="out">Явсан</option>
                </select>
              </div>
              <div>
                <Label>Бичгийн дугаар</Label>
                <input style={inputStyle} value={form.doc_number} onChange={(e) => setForm({ ...form, doc_number: e.target.value })} />
              </div>
              <div>
                <Label>Огноо</Label>
                <input type="date" style={inputStyle} value={form.doc_date} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} />
              </div>
              <div>
                <Label>Харилцагч (илгээгч/хүлээн авагч)</Label>
                <input style={inputStyle} value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Label>Гарчиг *</Label>
              <input style={inputStyle} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Label>Тэмдэглэл</Label>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {err && <div style={{ color: "#b3361f", marginTop: 12, fontFamily: fonts.body }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
              <div>
                {editing && (
                  <Btn variant="danger" onClick={() => remove(editing)}>
                    Устгах
                  </Btn>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setShowForm(false)}>
                  Болих
                </Btn>
                <Btn type="submit">Хадгалах</Btn>
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

export function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", zIndex: 50, overflowY: "auto" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: 4, padding: 28, width: "100%", maxWidth: 560 }}>
        <h2 style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 20, color: C.dark, textTransform: "uppercase", marginTop: 0, marginBottom: 20 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
