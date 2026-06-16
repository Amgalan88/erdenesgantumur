import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { C, fonts, Label, inputStyle, Btn, Card, PageTitle } from "../ui";
import { Modal } from "./Documents";

type Role = "superadmin" | "director" | "staff";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
}
interface Perm {
  user_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
}

const MODULES: { key: string; label: string }[] = [
  { key: "documents", label: "Ирсэн / явсан бичиг" },
  { key: "files", label: "Бичиг баримт" },
];
const roleLabel: Record<Role, string> = { superadmin: "Супер админ", director: "Захирал", staff: "Ажилтан" };

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [perms, setPerms] = useState<Perm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: us }, { data: ps }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("module_permissions").select("*"),
    ]);
    setUsers((us as Profile[]) ?? []);
    setPerms((ps as Perm[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setRole(u: Profile, role: Role) {
    await supabase.from("profiles").update({ role }).eq("id", u.id);
    load();
  }
  async function toggleActive(u: Profile) {
    await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <PageTitle title="Хэрэглэгч / эрх" sub="Хандалтын удирдлага" />
        <Btn onClick={() => setShowCreate(true)}>+ ХЭРЭГЛЭГЧ ҮҮСГЭХ</Btn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24, fontFamily: fonts.mono, color: C.muted }}>Ачааллаж байна…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#faf8f4" }}>
                {["Нэр", "И-мэйл", "Роль", "Төлөв", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontFamily: fonts.mono, fontSize: 9, letterSpacing: "0.12em", color: C.accent, borderBottom: `1px solid ${C.line}` }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "11px 14px", color: C.dark }}>{u.full_name || "—"}</td>
                  <td style={{ padding: "11px 14px", color: C.muted, fontFamily: fonts.mono, fontSize: 12 }}>{u.email}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u, e.target.value as Role)}
                      style={{ ...inputStyle, padding: "6px 8px", width: "auto", fontSize: 13 }}
                    >
                      {(["staff", "director", "superadmin"] as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {roleLabel[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={() => toggleActive(u)} style={{ ...pill, background: u.is_active ? "rgba(46,125,50,0.12)" : "rgba(179,54,31,0.12)", color: u.is_active ? "#2e7d32" : "#b3361f" }}>
                      {u.is_active ? "Идэвхтэй" : "Хаагдсан"}
                    </button>
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "right" }}>
                    <button onClick={() => setEditUser(u)} style={linkBtn} disabled={u.role === "superadmin"}>
                      Эрх тохируулах
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted, marginTop: 14 }}>
        Супер админ бүх модульд бүрэн эрхтэй. Захирал бүх модулийг үзэх эрхтэй. Ажилтанд доорх "Эрх тохируулах"-аар модуль бүрийн үзэх/үүсгэх/засах эрхийг оноо.
      </p>

      {editUser && (
        <PermModal
          user={editUser}
          perms={perms.filter((p) => p.user_id === editUser.id)}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            load();
          }}
        />
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function PermModal({ user, perms, onClose, onSaved }: { user: Profile; perms: Perm[]; onClose: () => void; onSaved: () => void }) {
  const [state, setState] = useState<Record<string, { v: boolean; c: boolean; e: boolean }>>(() => {
    const init: Record<string, { v: boolean; c: boolean; e: boolean }> = {};
    for (const m of MODULES) {
      const p = perms.find((x) => x.module === m.key);
      init[m.key] = { v: p?.can_view ?? false, c: p?.can_create ?? false, e: p?.can_edit ?? false };
    }
    return init;
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const rows = MODULES.map((m) => ({
      user_id: user.id,
      module: m.key,
      can_view: state[m.key].v,
      can_create: state[m.key].c,
      can_edit: state[m.key].e,
    }));
    await supabase.from("module_permissions").upsert(rows, { onConflict: "user_id,module" });
    setBusy(false);
    onSaved();
  }

  return (
    <Modal title={`Эрх — ${user.full_name || user.email}`} onClose={onClose}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8, fontFamily: fonts.mono, fontSize: 9, color: C.accent, letterSpacing: "0.1em" }}>МОДУЛЬ</th>
            {["Үзэх", "Үүсгэх", "Засах"].map((h) => (
              <th key={h} style={{ padding: 8, fontFamily: fonts.mono, fontSize: 9, color: C.accent, letterSpacing: "0.1em" }}>{h.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((m) => (
            <tr key={m.key} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ padding: 8, color: C.dark }}>{m.label}</td>
              {(["v", "c", "e"] as const).map((k) => (
                <td key={k} style={{ padding: 8, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={state[m.key][k]}
                    onChange={(ev) => setState({ ...state, [m.key]: { ...state[m.key], [k]: ev.target.checked } })}
                    style={{ width: 18, height: 18, accentColor: C.accent }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
        <Btn variant="ghost" onClick={onClose}>Болих</Btn>
        <Btn onClick={save} disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</Btn>
      </div>
    </Modal>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.functions.invoke("create-user", {
      body: { email: email.trim(), password, full_name: fullName, role },
    });
    setBusy(false);
    if (error) {
      setErr(
        "Хэрэглэгч үүсгэхэд алдаа гарлаа. 'create-user' Edge Function-ийг deploy хийсэн эсэхээ шалгана уу. (" + error.message + ")",
      );
      return;
    }
    onCreated();
  }

  return (
    <Modal title="Шинэ хэрэглэгч" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <Label>Бүтэн нэр</Label>
          <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>И-мэйл *</Label>
          <input type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Нууц үг *</Label>
          <input type="text" required minLength={6} style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Хамгийн багадаа 6 тэмдэгт" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Роль</Label>
          <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(["staff", "director", "superadmin"] as Role[]).map((r) => (
              <option key={r} value={r}>{roleLabel[r]}</option>
            ))}
          </select>
        </div>
        {err && <div style={{ color: "#b3361f", marginBottom: 12, fontFamily: fonts.body, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Болих</Btn>
          <Btn type="submit" disabled={busy}>{busy ? "Үүсгэж байна…" : "Үүсгэх"}</Btn>
        </div>
      </form>
    </Modal>
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
const pill: React.CSSProperties = {
  border: "none",
  borderRadius: 2,
  fontFamily: fonts.mono,
  fontSize: 11,
  padding: "4px 10px",
  cursor: "pointer",
};
