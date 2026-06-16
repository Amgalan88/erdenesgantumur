import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "../lib/auth";
import { C, fonts } from "./ui";
import Login from "./Login";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Files from "./pages/Files";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";

function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: fonts.mono, color: C.accent, letterSpacing: "0.2em", fontSize: 12 }}>АЧААЛЛАЖ БАЙНА…</div>
    </div>
  );
}

export default function ErpApp() {
  const { session, profile, loading } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <Login />;

  // Сесс байгаа ч профайл идэвхгүй бол хориглоно
  if (profile && !profile.is_active) {
    return (
      <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ fontFamily: fonts.body, color: C.light, textAlign: "center" }}>
          Таны эрх идэвхгүй болсон байна. Админд хандана уу.
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="files" element={<Files />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="users" element={<Users />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Layout>
  );
}
