import { NavLink, useNavigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { C, fonts } from "./ui";

const roleLabel: Record<string, string> = {
  superadmin: "Супер админ",
  director: "Захирал",
  staff: "Ажилтан",
};

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut, can } = useAuth();
  const nav = useNavigate();

  const items = [
    { to: "/app", label: "Хяналтын самбар", end: true, show: true },
    { to: "/app/documents", label: "Ирсэн / явсан бичиг", show: can("documents", "view") },
    { to: "/app/files", label: "Бичиг баримт", show: can("files", "view") },
    { to: "/app/audit", label: "Үйлдлийн бүртгэл", show: profile?.role === "superadmin" || profile?.role === "director" },
    { to: "/app/users", label: "Хэрэглэгч / эрх", show: profile?.role === "superadmin" },
  ].filter((i) => i.show);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: C.dark,
          color: C.light,
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 14, letterSpacing: "0.05em" }}>
            ЭРДЭНЭС ГАН ТӨМӨР
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 9, color: C.accent, letterSpacing: "0.18em", marginTop: 4 }}>
            ДОТООД СИСТЕМ
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              style={({ isActive }) => ({
                display: "block",
                padding: "11px 24px",
                fontFamily: fonts.body,
                fontSize: 14,
                color: isActive ? C.light : "rgba(245,243,239,0.6)",
                background: isActive ? "rgba(201,125,46,0.18)" : "transparent",
                borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                textDecoration: "none",
              })}
            >
              {i.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 24px 0", borderTop: "1px solid rgba(245,243,239,0.1)" }}>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.light }}>{profile?.full_name || profile?.email}</div>
          <div style={{ fontFamily: fonts.mono, fontSize: 9, color: C.accent, letterSpacing: "0.14em", marginTop: 2 }}>
            {roleLabel[profile?.role ?? "staff"]?.toUpperCase()}
          </div>
          <button
            onClick={async () => {
              await signOut();
              nav("/app");
            }}
            style={{
              marginTop: 14,
              background: "transparent",
              border: "1px solid rgba(245,243,239,0.25)",
              color: "rgba(245,243,239,0.8)",
              fontFamily: fonts.display,
              fontSize: 12,
              letterSpacing: "0.06em",
              padding: "8px 14px",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            ГАРАХ
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 40px", overflowX: "auto" }}>{children}</main>
    </div>
  );
}
