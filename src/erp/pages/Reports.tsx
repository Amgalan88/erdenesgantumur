import { useEffect, useRef, useState } from "react";
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
  file_path: string | null; // хуучин ганц хавсралт (одоо report_attachments ашиглана)
  file_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  report_attachments?: { count: number }[];
}

interface Attachment {
  id: string;
  report_id: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  url?: string; // signed URL (харуулахад)
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

const isImage = (a: { content_type?: string | null; file_name: string }) =>
  (a.content_type ?? "").startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(a.file_name);

function safeName(name: string) {
  return name.replace(/[^\w.\-]/g, "_");
}

// Утасны том зургийг байршуулахаас өмнө жижигрүүлнэ (урт тал ≤ 2000px, JPEG 82%).
// GIF/HEIC, жижиг файл, эсвэл шахаад томорсон бол эх файлыг нь үлдээнэ.
const MAX_SIDE = 2000;
async function compressImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // PNG-ийн тунгалаг хэсэг хар болохоос сэргийлнэ
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

// Signed URL-уудыг нэг дор авч хавсралтад залгана
async function withUrls(atts: Attachment[]): Promise<Attachment[]> {
  if (atts.length === 0) return atts;
  const { data } = await supabase.storage.from("docs").createSignedUrls(
    atts.map((a) => a.storage_path),
    60 * 60,
  );
  return atts.map((a, i) => ({ ...a, url: data?.[i]?.signedUrl ?? undefined }));
}

async function fetchAtts(reportId: string) {
  const { data } = await supabase.from("report_attachments").select("*").eq("report_id", reportId).order("created_at");
  return withUrls((data as Attachment[]) ?? []);
}

// Шинээр сонгосон файлын урьдчилсан харагдац (object URL-ийг цэвэрлэнэ)
function LocalThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url ? <img src={url} alt={file.name} style={thumbImg} /> : <div style={fileTile}>{file.name}</div>;
}

export default function Reports() {
  const { can, profile } = useAuth();
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ReportType>("all");
  const [viewing, setViewing] = useState<Report | null>(null);
  const [viewAtts, setViewAtts] = useState<Attachment[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [editing, setEditing] = useState<Report | null>(null);
  const [form, setForm] = useState(empty);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<Attachment[]>([]);
  const [removed, setRemoved] = useState<Attachment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("reports")
      .select("*, report_attachments(count)")
      .order("start_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
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

  async function openView(r: Report) {
    setViewing(r);
    setViewAtts([]);
    setViewAtts(await fetchAtts(r.id));
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const arr = Array.from(list);
    if (arr.length) setNewFiles((prev) => [...prev, ...arr]);
  }

  function resetFiles() {
    setNewFiles([]);
    setExisting([]);
    setRemoved([]);
    setProgress("");
  }

  function openCreate() {
    setEditing(null);
    setForm(empty);
    resetFiles();
    setShowForm(true);
    setErr(null);
  }

  async function openEdit(r: Report) {
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
    resetFiles();
    setShowForm(true);
    setErr(null);
    setExisting(await fetchAtts(r.id));
  }

  async function uploadAll(reportId: string, userId: string | undefined) {
    for (let i = 0; i < newFiles.length; i++) {
      const orig = newFiles[i];
      setProgress(`Жижигрүүлж байна ${i + 1}/${newFiles.length}…`);
      const f = await compressImage(orig);
      setProgress(`Байршуулж байна ${i + 1}/${newFiles.length}…`);
      const path = `reports/${reportId}/${Date.now()}_${i}_${safeName(f.name)}`;
      const { error: upErr } = await supabase.storage.from("docs").upload(path, f, { contentType: f.type || undefined });
      if (upErr) throw new Error(`"${f.name}": ${upErr.message}`);
      const { error: insErr } = await supabase.from("report_attachments").insert({
        report_id: reportId,
        storage_path: path,
        file_name: f.name,
        content_type: f.type || null,
        size_bytes: f.size,
        created_by: userId,
      });
      if (insErr) throw new Error(`"${f.name}": ${insErr.message}`);
      // Амжилттай орсныг жагсаалтаас хасна — алдаа гарч дахин хадгалахад давхардахгүй
      setNewFiles((prev) => prev.filter((x) => x !== orig));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setErr("Дуусах огноо эхлэх огнооноос өмнө байж болохгүй.");
      return;
    }
    setBusy(true);

    const payload = {
      title: form.title,
      report_type: form.report_type,
      location: form.location || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      body: form.body || null,
    };

    try {
      const { data: u } = await supabase.auth.getUser();
      let reportId: string;
      if (editing) {
        const { error } = await supabase.from("reports").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
        reportId = editing.id;
      } else {
        const { data, error } = await supabase.from("reports").insert({ ...payload, created_by: u.user?.id }).select("id").single();
        if (error) throw new Error(error.message);
        reportId = (data as { id: string }).id;
        // Байршуулалт алдаа гарвал давхар тайлан үүсгэхгүйн тулд засах горимд шилжинэ
        setEditing({ ...(data as Report), ...payload, id: reportId } as Report);
      }

      // Хасахаар тэмдэглэсэн хавсралтуудыг устгах
      if (removed.length) {
        const { error } = await supabase.from("report_attachments").delete().in("id", removed.map((a) => a.id));
        if (error) throw new Error(error.message);
        await supabase.storage.from("docs").remove(removed.map((a) => a.storage_path));
        setRemoved([]);
      }

      await uploadAll(reportId, u.user?.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
      setProgress("");
      load();
      return;
    }

    setBusy(false);
    setProgress("");
    setShowForm(false);
    load();
  }

  async function remove(r: Report) {
    if (!confirm(`"${r.title}" тайланг устгах уу? Хавсаргасан бүх зураг хамт устна.`)) return;
    const { data: atts } = await supabase.from("report_attachments").select("storage_path").eq("report_id", r.id);
    const { error } = await supabase.from("reports").delete().eq("id", r.id);
    if (error) {
      alert(error.message);
      return;
    }
    const paths = ((atts as { storage_path: string }[]) ?? []).map((a) => a.storage_path);
    if (r.file_path) paths.push(r.file_path);
    if (paths.length) await supabase.storage.from("docs").remove(paths);
    setShowForm(false);
    setViewing(null);
    load();
  }

  async function download(path: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage.from("docs").createSignedUrl(path, 60);
    if (error) {
      alert(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const canCreate = can("reports", "create");
  const canEdit = can("reports", "edit");
  const canDelete = profile?.role === "superadmin";
  const viewImages = viewAtts.filter(isImage);
  const viewOthers = viewAtts.filter((a) => !isImage(a));

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
                {rows.map((r) => {
                  const n = r.report_attachments?.[0]?.count ?? 0;
                  return (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontFamily: fonts.mono, fontSize: 10, padding: "3px 8px", borderRadius: 2, background: "rgba(201,125,46,0.14)", color: C.accent }}>
                          {typeLabel[r.report_type]?.toUpperCase() ?? r.report_type}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: C.dark }}>
                        <button onClick={() => openView(r)} style={{ ...linkBtn, color: C.dark, textDecoration: "none", fontSize: 14, textAlign: "left", padding: 0 }}>
                          {r.title}
                        </button>
                        {n > 0 && <span style={{ marginLeft: 8, fontFamily: fonts.mono, fontSize: 11, color: C.muted }}>📷 {n}</span>}
                      </td>
                      <td style={{ padding: "11px 14px", color: C.muted }}>{r.location || "—"}</td>
                      <td style={{ padding: "11px 14px", color: C.muted, whiteSpace: "nowrap" }}>{fmtRange(r)}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button onClick={() => openView(r)} style={linkBtn}>
                          Үзэх
                        </button>
                        {canEdit && (
                          <button onClick={() => openEdit(r)} style={{ ...linkBtn, marginLeft: 14 }}>
                            Засах
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

          {viewImages.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <Label>Зураг ({viewImages.length})</Label>
              <div style={gallery}>
                {viewImages.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setLightbox(i)}
                    title={a.file_name}
                    style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in" }}
                  >
                    {a.url ? <img src={a.url} alt={a.file_name} loading="lazy" style={thumbImg} /> : <div style={fileTile}>…</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(viewOthers.length > 0 || viewing.file_name) && (
            <div style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 14 }}>
              <Label>Бусад хавсралт</Label>
              {viewOthers.map((a) => (
                <div key={a.id}>
                  <button onClick={() => download(a.storage_path)} style={linkBtn}>
                    📎 {a.file_name}
                  </button>
                </div>
              ))}
              {viewing.file_name && (
                <div>
                  <button onClick={() => download(viewing.file_path)} style={linkBtn}>
                    📎 {viewing.file_name}
                  </button>
                </div>
              )}
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

      {lightbox !== null && viewImages[lightbox] && (
        <Lightbox images={viewImages} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />
      )}

      {showForm && (
        <Modal onClose={() => !busy && setShowForm(false)} title={editing ? "Тайлан засах" : "Шинэ тайлан"} maxWidth={760}>
          <form
            onSubmit={save}
            onPaste={(e) => {
              const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
              if (imgs.length) {
                e.preventDefault();
                addFiles(imgs);
              }
            }}
          >
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
              <Label>Зураг, хавсралт (олныг зэрэг сонгож болно)</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInput.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? C.accent : C.line}`,
                  background: dragOver ? "rgba(201,125,46,0.06)" : "#fff",
                  borderRadius: 3,
                  padding: "18px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                📷 Зураг сонгох эсвэл энд чирч оруулах
                <div style={{ fontSize: 11, marginTop: 4 }}>Хуулсан зургаа Ctrl+V дарж шууд буулгаж болно</div>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {(existing.length > 0 || newFiles.length > 0) && (
                <div style={{ ...gallery, marginTop: 12 }}>
                  {existing.map((a) => (
                    <div key={a.id} style={{ position: "relative" }} title={a.file_name}>
                      {isImage(a) && a.url ? <img src={a.url} alt={a.file_name} style={thumbImg} /> : <div style={fileTile}>{a.file_name}</div>}
                      <button
                        type="button"
                        onClick={() => {
                          setExisting((prev) => prev.filter((x) => x.id !== a.id));
                          setRemoved((prev) => [...prev, a]);
                        }}
                        style={removeBtn}
                        aria-label="Хасах"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {newFiles.map((f, i) => (
                    <div key={`${f.name}-${f.size}-${i}`} style={{ position: "relative" }} title={f.name}>
                      <LocalThumb file={f} />
                      <span style={newBadge}>ШИНЭ</span>
                      <button type="button" onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))} style={removeBtn} aria-label="Хасах">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {editing?.file_name && (
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted, marginTop: 8 }}>Өмнөх хавсралт: {editing.file_name}</div>
              )}
            </div>

            {progress && <div style={{ color: C.accent, marginTop: 12, fontFamily: fonts.mono, fontSize: 12 }}>{progress}</div>}
            {err && <div style={{ color: "#b3361f", marginTop: 12, fontFamily: fonts.body }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, gap: 10, flexWrap: "wrap" }}>
              <div>
                {editing && canDelete && (
                  <Btn variant="danger" onClick={() => remove(editing)} disabled={busy}>
                    Устгах
                  </Btn>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
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

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: Attachment[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const n = images.length;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, n, onIndex, onClose]);

  const img = images[index];
  const navBtn: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(245,243,239,0.15)",
    color: C.light,
    border: "none",
    fontSize: 32,
    width: 48,
    height: 64,
    cursor: "pointer",
    borderRadius: 3,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,9,8,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <img
        src={img.url}
        alt={img.file_name}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "86vh", objectFit: "contain", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
      />
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: C.light, fontFamily: fonts.mono, fontSize: 12 }}>
        {index + 1} / {n} · {img.file_name}
      </div>
      {n > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + n) % n);
            }}
            style={{ ...navBtn, left: 12 }}
            aria-label="Өмнөх"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % n);
            }}
            style={{ ...navBtn, right: 12 }}
            aria-label="Дараах"
          >
            ›
          </button>
        </>
      )}
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: C.light, fontSize: 34, cursor: "pointer" }}
        aria-label="Хаах"
      >
        ×
      </button>
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

const gallery: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
  gap: 10,
};

const thumbImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  display: "block",
  borderRadius: 3,
  border: `1px solid ${C.line}`,
  background: "#fff",
};

const fileTile: React.CSSProperties = {
  ...thumbImg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  boxSizing: "border-box",
  fontFamily: fonts.mono,
  fontSize: 11,
  color: C.muted,
  textAlign: "center",
  wordBreak: "break-all",
  overflow: "hidden",
};

const removeBtn: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: "none",
  background: "rgba(26,24,20,0.75)",
  color: "#fff",
  fontSize: 16,
  lineHeight: "24px",
  cursor: "pointer",
  padding: 0,
};

const newBadge: React.CSSProperties = {
  position: "absolute",
  left: 4,
  bottom: 4,
  background: C.accent,
  color: C.light,
  fontFamily: fonts.mono,
  fontSize: 9,
  letterSpacing: "0.1em",
  padding: "2px 5px",
  borderRadius: 2,
};
