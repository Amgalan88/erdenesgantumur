import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { C, fonts, Label, inputStyle, Btn, Card, PageTitle } from "../ui";
import { Modal } from "./Documents";
import {
  type MediaFile,
  isImage,
  isPdf,
  isVideo,
  MAX_UPLOAD_MB,
  resumableUpload,
  IMAGE_ACCEPT,
  PDF_ACCEPT,
  FILE_ACCEPT,
  safeName,
  compressImage,
  withUrls,
  FileTile,
  VideoThumb,
  LocalThumb,
  Gallery,
  Videos,
  FileLinks,
  Lightbox,
  linkBtn,
  gallery,
  thumbImg,
  removeBtn,
  newBadge,
} from "../media";

type Status = "planned" | "in_progress" | "done" | "on_hold";
type Currency = "MNT" | "USD" | "CNY";

interface Item {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: Status;
  responsible: string | null;
  start_date: string | null;
  target_date: string | null;
  progress: number;
  currency: Currency;
  budget: number | null;
  spent: number | null;
  created_at: string;
}

interface Att extends MediaFile {
  item_id: string;
}

const statusInfo: Record<Status, { label: string; color: string; bg: string }> = {
  planned: { label: "Төлөвлөсөн", color: "#5c5850", bg: "rgba(26,24,20,0.08)" },
  in_progress: { label: "Хэрэгжиж буй", color: C.accent, bg: "rgba(201,125,46,0.14)" },
  done: { label: "Дууссан", color: "#2e7d32", bg: "rgba(46,125,50,0.12)" },
  on_hold: { label: "Түр зогссон", color: "#b3361f", bg: "rgba(179,54,31,0.1)" },
};

const currencies: Currency[] = ["MNT", "USD", "CNY"];
const curSymbol: Record<Currency, string> = { MNT: "₮", USD: "$", CNY: "¥" };

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}
function fmtMoney(n: number | null | undefined, cur: Currency) {
  if (n === null || n === undefined) return "—";
  return cur === "MNT" ? `${fmtNum(n)}₮` : `${curSymbol[cur]}${fmtNum(n)}`;
}
// Мөнгөн дүнгийн талбар: "1,250,000" гэж харуулж, цэвэр тоо хадгална
function parseMoney(s: string) {
  const clean = s.replace(/[^\d.]/g, "");
  return clean === "" ? "" : clean;
}

// Хугацааны бүлэг: зорилтот (эсвэл эхлэх) огнооны он, улирал
function periodOf(i: Item) {
  const d = i.target_date || i.start_date;
  if (!d) return { key: "9999-9", label: "Хугацаа тодорхойгүй" };
  const [y, m] = d.split("-").map(Number);
  const q = Math.floor((m - 1) / 3) + 1;
  return { key: `${y}-${q}`, label: `${y} он · ${q}-р улирал` };
}

const empty = {
  title: "",
  description: "",
  category: "",
  status: "planned" as Status,
  responsible: "",
  start_date: "",
  target_date: "",
  progress: 0,
  currency: "MNT" as Currency,
  budget: "",
  spent: "",
};

async function fetchAtts(itemId: string) {
  const { data } = await supabase.from("roadmap_attachments").select("*").eq("item_id", itemId).order("created_at");
  return withUrls((data as Att[]) ?? []);
}

export default function Roadmap() {
  const { can, profile } = useAuth();
  const [rows, setRows] = useState<Item[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [attCount, setAttCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [viewing, setViewing] = useState<Item | null>(null);
  const [viewAtts, setViewAtts] = useState<Att[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(empty);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<Att[]>([]);
  const [removed, setRemoved] = useState<Att[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("roadmap_items")
      .select("*")
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    setErr(error ? error.message : null);
    const items = ((data as Item[]) ?? []).map((i) => ({
      ...i,
      budget: i.budget === null ? null : Number(i.budget),
      spent: i.spent === null ? null : Number(i.spent),
    }));
    setRows(items);
    setLoading(false);

    // Карт бүрийн нүүр зураг (эхний зураг) ба хавсралтын тоо
    const { data: atts } = await supabase.from("roadmap_attachments").select("id,item_id,storage_path,file_name,content_type").order("created_at");
    const list = (atts as Att[]) ?? [];
    const counts: Record<string, number> = {};
    const firstImg = new Map<string, Att>();
    for (const a of list) {
      counts[a.item_id] = (counts[a.item_id] ?? 0) + 1;
      if (isImage(a) && !firstImg.has(a.item_id)) firstImg.set(a.item_id, a);
    }
    setAttCount(counts);
    const signed = await withUrls([...firstImg.values()]);
    setCovers(Object.fromEntries(signed.filter((a) => a.url).map((a) => [a.item_id, a.url!])));
  }

  useEffect(() => {
    load();
  }, []);

  async function openView(i: Item) {
    setViewing(i);
    setViewAtts([]);
    setViewAtts(await fetchAtts(i.id));
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const all = Array.from(list);
    const tooBig = all.filter((f) => !f.type.startsWith("image/") && f.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (tooBig.length) {
      alert(tooBig.map((f) => `"${f.name}" — ${(f.size / 1024 / 1024).toFixed(0)}MB`).join("\n") + `\n\nНэг файл ${MAX_UPLOAD_MB}MB-аас ихгүй байх ёстой.`);
    }
    const ok = all.filter((f) => !tooBig.includes(f));
    if (ok.length) setNewFiles((prev) => [...prev, ...ok]);
  }

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setNewFiles([]);
    setExisting([]);
    setRemoved([]);
    setProgressMsg("");
    setErr(null);
    setShowForm(true);
  }

  async function openEdit(i: Item) {
    setViewing(null);
    setEditing(i);
    setForm({
      title: i.title,
      description: i.description ?? "",
      category: i.category ?? "",
      status: i.status,
      responsible: i.responsible ?? "",
      start_date: i.start_date ?? "",
      target_date: i.target_date ?? "",
      progress: i.progress,
      currency: i.currency,
      budget: i.budget === null ? "" : String(i.budget),
      spent: i.spent === null ? "" : String(i.spent),
    });
    setNewFiles([]);
    setRemoved([]);
    setProgressMsg("");
    setErr(null);
    setShowForm(true);
    setExisting(await fetchAtts(i.id));
  }

  async function uploadAll(itemId: string, userId: string | undefined) {
    for (let n = 0; n < newFiles.length; n++) {
      const orig = newFiles[n];
      const label = `Байршуулж байна ${n + 1}/${newFiles.length}`;
      setProgressMsg(`${label}…`);
      const f = await compressImage(orig);
      const path = `roadmap/${itemId}/${Date.now()}_${n}_${safeName(f.name)}`;
      if (f.size > 6 * 1024 * 1024) {
        try {
          await resumableUpload(path, f, (pct) => setProgressMsg(`${label} — ${f.name}: ${pct}%`));
        } catch (e) {
          throw new Error(`"${f.name}": ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        const { error } = await supabase.storage.from("docs").upload(path, f, { contentType: f.type || undefined });
        if (error) throw new Error(`"${f.name}": ${error.message}`);
      }
      const { error: insErr } = await supabase.from("roadmap_attachments").insert({
        item_id: itemId,
        storage_path: path,
        file_name: f.name,
        content_type: f.type || null,
        size_bytes: f.size,
        created_by: userId,
      });
      if (insErr) throw new Error(`"${f.name}": ${insErr.message}`);
      setNewFiles((prev) => prev.filter((x) => x !== orig));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.start_date && form.target_date && form.target_date < form.start_date) {
      setErr("Дуусах огноо эхлэх огнооноос өмнө байж болохгүй.");
      return;
    }
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      status: form.status,
      responsible: form.responsible || null,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      progress: form.status === "done" ? 100 : form.progress,
      currency: form.currency,
      budget: form.budget === "" ? null : Number(form.budget),
      spent: form.spent === "" ? null : Number(form.spent),
    };

    try {
      const { data: u } = await supabase.auth.getUser();
      let itemId: string;
      if (editing) {
        const { error } = await supabase.from("roadmap_items").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
        itemId = editing.id;
      } else {
        const { data, error } = await supabase.from("roadmap_items").insert({ ...payload, created_by: u.user?.id }).select("*").single();
        if (error) throw new Error(error.message);
        itemId = (data as Item).id;
        // Байршуулалт алдаа гарвал давхар зорилт үүсгэхгүйн тулд засах горимд шилжинэ
        setEditing(data as Item);
      }
      if (removed.length) {
        const { error } = await supabase.from("roadmap_attachments").delete().in("id", removed.map((a) => a.id));
        if (error) throw new Error(error.message);
        await supabase.storage.from("docs").remove(removed.map((a) => a.storage_path));
        setRemoved([]);
      }
      await uploadAll(itemId, u.user?.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
      setProgressMsg("");
      load();
      return;
    }
    setBusy(false);
    setProgressMsg("");
    setShowForm(false);
    load();
  }

  async function remove(i: Item) {
    if (!confirm(`"${i.title}" зорилтыг устгах уу? Хавсаргасан зураг хамт устна.`)) return;
    const { data: atts } = await supabase.from("roadmap_attachments").select("storage_path").eq("item_id", i.id);
    const { error } = await supabase.from("roadmap_items").delete().eq("id", i.id);
    if (error) {
      alert(error.message);
      return;
    }
    const paths = ((atts as { storage_path: string }[]) ?? []).map((a) => a.storage_path);
    if (paths.length) await supabase.storage.from("docs").remove(paths);
    setShowForm(false);
    setViewing(null);
    load();
  }

  async function download(a: MediaFile) {
    const { data, error } = await supabase.storage.from("docs").createSignedUrl(a.storage_path, 60);
    if (error) {
      alert(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const canCreate = can("roadmap", "create");
  const canEdit = can("roadmap", "edit");
  const canDelete = profile?.role === "superadmin";

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const periods: { key: string; label: string; items: Item[] }[] = [];
  for (const it of shown) {
    const p = periodOf(it);
    let g = periods.find((x) => x.key === p.key);
    if (!g) periods.push((g = { ...p, items: [] }));
    g.items.push(it);
  }
  periods.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

  // Төсвийн нийлбэр валют тус бүрээр
  const totals = currencies
    .map((cur) => {
      const list = rows.filter((r) => r.currency === cur);
      return {
        cur,
        budget: list.reduce((s, r) => s + (r.budget ?? 0), 0),
        spent: list.reduce((s, r) => s + (r.spent ?? 0), 0),
        has: list.some((r) => r.budget !== null || r.spent !== null),
      };
    })
    .filter((t) => t.has);
  const doneCount = rows.filter((r) => r.status === "done").length;

  const viewImages = viewAtts.filter(isImage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <PageTitle title="Компанийн Roadmap" sub="Стратеги, зорилт, төсөв" />
        {canCreate && <Btn onClick={openCreate}>+ ШИНЭ ЗОРИЛТ</Btn>}
      </div>

      {/* Товч үзүүлэлт */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Card>
          <Label>Нийт зорилт</Label>
          <div style={bigNum}>{rows.length}</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted, marginTop: 6 }}>
            {doneCount} дууссан · {rows.filter((r) => r.status === "in_progress").length} хэрэгжиж буй
          </div>
        </Card>
        {totals.map((t) => (
          <Card key={t.cur}>
            <Label>Төсөв ({t.cur})</Label>
            <div style={{ ...bigNum, fontSize: 24 }}>{fmtMoney(t.budget, t.cur)}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted, marginTop: 6 }}>
              Зарцуулсан {fmtMoney(t.spent, t.cur)}
              {t.budget > 0 && ` · ${Math.round((t.spent / t.budget) * 100)}%`}
            </div>
            {t.budget > 0 && <Bar pct={(t.spent / t.budget) * 100} color={t.spent > t.budget ? "#b3361f" : C.accent} />}
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {([["all", "Бүгд"], ...Object.entries(statusInfo).map(([k, v]) => [k, v.label])] as [string, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k as "all" | Status)}
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

      {loading ? (
        <div style={{ padding: 24, fontFamily: fonts.mono, color: C.muted }}>Ачааллаж байна…</div>
      ) : shown.length === 0 ? (
        <Card>
          <div style={{ fontFamily: fonts.body, color: C.muted }}>Зорилт алга байна.{canCreate && " «+ ШИНЭ ЗОРИЛТ» дарж эхнийхээ зорилтыг нэмнэ үү."}</div>
        </Card>
      ) : (
        periods.map((p) => (
          <div key={p.key} style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            {/* Цагийн шугам */}
            <div style={{ width: 14, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.accent, marginTop: 4 }} />
              <div style={{ flex: 1, width: 2, background: C.line }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 18 }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 16, color: C.dark, textTransform: "uppercase", marginBottom: 10 }}>{p.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {p.items.map((it) => (
                  <ItemCard key={it.id} it={it} cover={covers[it.id]} count={attCount[it.id] ?? 0} onClick={() => openView(it)} />
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {viewing && (
        <Modal onClose={() => setViewing(null)} title={viewing.title} maxWidth={760}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <StatusChip s={viewing.status} />
            {viewing.category && <span style={{ fontFamily: fonts.body, fontSize: 13, color: C.muted }}>{viewing.category}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 16 }}>
            <Field label="Хариуцагч" value={viewing.responsible || "—"} />
            <Field label="Эхлэх" value={viewing.start_date || "—"} />
            <Field label="Дуусах" value={viewing.target_date || "—"} />
            <Field label="Гүйцэтгэл" value={`${viewing.progress}%`} />
            <Field label="Төсөв" value={fmtMoney(viewing.budget, viewing.currency)} />
            <Field label="Зарцуулсан" value={fmtMoney(viewing.spent, viewing.currency)} />
            {viewing.budget !== null && (
              <Field
                label="Үлдэгдэл"
                value={fmtMoney(viewing.budget - (viewing.spent ?? 0), viewing.currency)}
                danger={viewing.budget - (viewing.spent ?? 0) < 0}
              />
            )}
          </div>
          <Bar pct={viewing.progress} color={statusInfo[viewing.status].color} />
          {viewing.description && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 1.7, color: C.dark, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{viewing.description}</div>
            </Card>
          )}
          {viewAtts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Label>Зураг, хавсралт ({viewAtts.length})</Label>
              <Gallery imgs={viewImages} onOpen={(a) => setLightbox(viewImages.indexOf(a))} />
              <Videos vids={viewAtts.filter(isVideo)} />
              <FileLinks files={viewAtts.filter((a) => !isImage(a) && !isVideo(a))} onDownload={download} />
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            {canEdit && <Btn onClick={() => openEdit(viewing)}>Засах</Btn>}
          </div>
        </Modal>
      )}

      {lightbox !== null && viewImages[lightbox] && (
        <Lightbox images={viewImages} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />
      )}

      {showForm && (
        <Modal onClose={() => !busy && setShowForm(false)} title={editing ? "Зорилт засах" : "Шинэ зорилт"} maxWidth={760}>
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
            <Label>Зорилтын нэр *</Label>
            <input
              style={inputStyle}
              required
              value={form.title}
              placeholder="Жишээ: Шинэ цехийн барилга ашиглалтад оруулах"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <div style={grid}>
              <div>
                <Label>Чиглэл</Label>
                <input style={inputStyle} value={form.category} placeholder="Үйлдвэрлэл, борлуулалт…" onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label>Төлөв</Label>
                <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                  {Object.entries(statusInfo).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Хариуцагч</Label>
                <input style={inputStyle} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
              </div>
              <div>
                <Label>Эхлэх огноо</Label>
                <input type="date" style={inputStyle} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Дуусах огноо</Label>
                <input type="date" style={inputStyle} value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
              </div>
              <div>
                <Label>Гүйцэтгэл: {form.status === "done" ? 100 : form.progress}%</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={form.status === "done"}
                  value={form.status === "done" ? 100 : form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: C.accent, marginTop: 8 }}
                />
              </div>
            </div>

            <div style={grid}>
              <div>
                <Label>Валют</Label>
                <select style={inputStyle} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}>
                  <option value="MNT">₮ Төгрөг (MNT)</option>
                  <option value="USD">$ Доллар (USD)</option>
                  <option value="CNY">¥ Юань (CNY)</option>
                </select>
              </div>
              <div>
                <Label>Төсөв</Label>
                <MoneyInput value={form.budget} cur={form.currency} onChange={(v) => setForm({ ...form, budget: v })} />
              </div>
              <div>
                <Label>Зарцуулсан</Label>
                <MoneyInput value={form.spent} cur={form.currency} onChange={(v) => setForm({ ...form, spent: v })} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Label>Тайлбар</Label>
              <textarea
                style={{ ...inputStyle, minHeight: 160, resize: "vertical", lineHeight: 1.6 }}
                value={form.description}
                placeholder="Зорилго, хийх ажлууд, хүлээгдэж буй үр дүн…"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
                <Label>Зураг, хавсралт</Label>
                <div style={{ display: "flex", gap: 14, marginBottom: 6 }}>
                  {([
                    ["📷 + Зураг", IMAGE_ACCEPT],
                    ["📄 + PDF", PDF_ACCEPT],
                  ] as const).map(([label, accept]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (!fileInput.current) return;
                        fileInput.current.accept = accept;
                        fileInput.current.click();
                      }}
                      style={{ ...linkBtn, fontSize: 12, textDecoration: "none", fontWeight: 600, padding: 0 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={FILE_ACCEPT}
                style={{ display: "none" }}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
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
                style={{
                  border: `${dragOver ? 2 : 1}px ${dragOver ? "dashed" : "solid"} ${dragOver ? C.accent : C.line}`,
                  background: dragOver ? "rgba(201,125,46,0.06)" : "#fff",
                  borderRadius: 3,
                  padding: 12,
                }}
              >
                {existing.length === 0 && newFiles.length === 0 ? (
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted, textAlign: "center", padding: 8 }}>
                    Зураг, PDF-ээ энд чирч оруулах эсвэл Ctrl+V дарж буулгаж болно
                  </div>
                ) : (
                  <div style={{ ...gallery, gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
                    {existing.map((a) => (
                      <div key={a.id} style={{ position: "relative" }} title={a.file_name}>
                        {isImage(a) && a.url ? (
                          <img src={a.url} alt={a.file_name} style={thumbImg} />
                        ) : isVideo(a) && a.url ? (
                          <VideoThumb src={a.url} name={a.file_name} />
                        ) : (
                          <FileTile name={a.file_name} pdf={isPdf(a)} />
                        )}
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
                    {newFiles.map((f, n) => (
                      <div key={`${f.name}-${f.size}-${n}`} style={{ position: "relative" }} title={f.name}>
                        <LocalThumb file={f} />
                        <span style={newBadge}>ШИНЭ</span>
                        <button type="button" onClick={() => setNewFiles((prev) => prev.filter((x) => x !== f))} style={removeBtn} aria-label="Хасах">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {progressMsg && <div style={{ color: C.accent, marginTop: 12, fontFamily: fonts.mono, fontSize: 12 }}>{progressMsg}</div>}
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

function ItemCard({ it, cover, count, onClick }: { it: Item; cover?: string; count: number; onClick: () => void }) {
  const over = it.budget !== null && (it.spent ?? 0) > it.budget;
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 0,
        border: `1px solid ${C.line}`,
        borderRadius: 3,
        background: "#fff",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {cover && <img src={cover} alt="" loading="lazy" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <StatusChip s={it.status} />
          {count > 0 && <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.muted }}>📎 {count}</span>}
        </div>
        <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, color: C.dark, lineHeight: 1.3 }}>{it.title}</div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted }}>
          {[it.category, it.responsible, it.target_date && `→ ${it.target_date}`].filter(Boolean).join(" · ") || "—"}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.mono, fontSize: 11, color: C.muted }}>
            <span>Гүйцэтгэл</span>
            <span>{it.progress}%</span>
          </div>
          <Bar pct={it.progress} color={statusInfo[it.status].color} />
        </div>
        {(it.budget !== null || it.spent !== null) && (
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: over ? "#b3361f" : C.dark }}>
            {fmtMoney(it.spent ?? 0, it.currency)} / {fmtMoney(it.budget, it.currency)}
            {over && " · төсөв хэтэрсэн"}
          </div>
        )}
      </div>
    </button>
  );
}

function StatusChip({ s }: { s: Status }) {
  const i = statusInfo[s];
  return (
    <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 2, background: i.bg, color: i.color }}>
      {i.label.toUpperCase()}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: "rgba(26,24,20,0.08)", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

function Field({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ fontFamily: fonts.body, fontSize: 14, color: danger ? "#b3361f" : C.dark }}>{value}</div>
    </div>
  );
}

function MoneyInput({ value, cur, onChange }: { value: string; cur: Currency; onChange: (v: string) => void }) {
  const [int, dec] = value.split(".");
  const shown = value === "" ? "" : fmtNum(Number(int || 0)) + (dec !== undefined ? "." + dec : "");
  return (
    <div style={{ position: "relative" }}>
      <input
        style={{ ...inputStyle, paddingRight: 30, textAlign: "right", fontFamily: fonts.mono }}
        inputMode="decimal"
        placeholder="0"
        value={shown}
        onChange={(e) => onChange(parseMoney(e.target.value))}
      />
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontFamily: fonts.body, fontSize: 13 }}>
        {curSymbol[cur]}
      </span>
    </div>
  );
}

const bigNum: React.CSSProperties = { fontFamily: fonts.display, fontWeight: 800, fontSize: 34, color: C.dark, lineHeight: 1.1 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginTop: 14 };
