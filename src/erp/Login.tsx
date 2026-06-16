import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { C, fonts, Label, inputStyle, Btn } from "./ui";

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setError("Нэвтрэх нэр эсвэл нууц үг буруу байна.");
      return;
    }
    nav("/app");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        style={{ width: "100%", maxWidth: 380, background: C.bg, padding: 36, borderRadius: 4 }}
      >
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 18, color: C.dark, letterSpacing: "0.04em" }}>
          ЭРДЭНЭС ГАН ТӨМӨР ХХК
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: C.accent, letterSpacing: "0.18em", marginBottom: 28 }}>
          ДОТООД СИСТЕМ · НЭВТРЭХ
        </div>

        <div style={{ marginBottom: 16 }}>
          <Label>И-мэйл</Label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ажилтан@эрдэнэс.mn"
            autoComplete="username"
            required
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <Label>Нууц үг</Label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div style={{ color: "#b3361f", fontSize: 13, marginBottom: 16, fontFamily: fonts.body }}>{error}</div>
        )}

        <Btn type="submit" disabled={busy} style={{ width: "100%", padding: "13px 0", fontSize: 14 }}>
          {busy ? "Нэвтэрч байна…" : "НЭВТРЭХ"}
        </Btn>

        <button
          type="button"
          onClick={() => nav("/")}
          style={{
            display: "block",
            width: "100%",
            marginTop: 16,
            background: "transparent",
            border: "none",
            color: C.accent,
            fontFamily: fonts.mono,
            fontSize: 11,
            letterSpacing: "0.12em",
            cursor: "pointer",
          }}
        >
          ← НҮҮР ХУУДАС РУУ БУЦАХ
        </button>
      </form>
    </div>
  );
}
