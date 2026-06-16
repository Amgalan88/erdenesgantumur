import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import { AuthProvider } from "./lib/auth.tsx";
import ErpApp from "./erp/ErpApp.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/app/*" element={<ErpApp />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>,
);
