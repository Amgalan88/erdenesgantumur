import { useState } from "react";
import { Menu, X, ArrowUpRight, CheckCircle } from "lucide-react";

const NAV = ["Тухай", "Бүтээгдэхүүн", "Холбоо барих"];

const SPECS = [
  { label: "Ширхэглэг", value: "0.045мм — 90–95%" },
  { label: "Соронзон чанар", value: "≥ 95%" },
  { label: "Чийг", value: "≤ 5%" },
  { label: "Нягт", value: "4.5 гр/см³" },
  { label: "Баглаа боодол", value: "1.5–2 тн шуудай" },
];

const ADVANTAGES = [
  "Өөрийн үйлдвэртэй — дотоодын нийлүүлэгч",
  "Жилийн 4 улиралд тогтвортой нийлүүлэлт",
  "Хүргэлт тээвэрлэлттэй",
  "Тохирлын гэрчилгээтэй",
  "Лабораторын шинжилгээгээр баталгаажсан",
  "DMS олон улсын стандарт хангасан",
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "#f5f3ef", color: "#1a1814", fontFamily: "var(--font-body)", minHeight: "100vh" }}>

      {/* HEADER */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(245,243,239,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(26,24,20,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "0.06em", color: "#1a1814", lineHeight: 1 }}>ЭРДЭНЭС ГАН ТӨМӨР ХХК</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#c97d2e", letterSpacing: "0.16em" }}>МАГНЕТИТ УРВАЛЖ</div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <button key={n} onClick={() => scrollTo(n === "Тухай" ? "about" : n === "Бүтээгдэхүүн" ? "product" : "contact")}
                style={{ fontSize: 13, color: "#6b6458", fontWeight: 500, transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1a1814")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b6458")}>
                {n}
              </button>
            ))}
            <button onClick={() => scrollTo("contact")}
              style={{ background: "#1a1814", color: "#f5f3ef", padding: "8px 18px", fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.07em" }}>
              ЗАХИАЛГА
            </button>
          </nav>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: "#f5f3ef", padding: "16px 24px 24px", borderTop: "1px solid rgba(26,24,20,0.08)", display: "flex", flexDirection: "column", gap: 18 }}>
            {NAV.map(n => (
              <button key={n} onClick={() => scrollTo(n === "Тухай" ? "about" : n === "Бүтээгдэхүүн" ? "product" : "contact")}
                style={{ textAlign: "left", fontSize: 15, color: "#6b6458", fontWeight: 500 }}>{n}</button>
            ))}
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1523848309072-c199db53f137?w=1800&h=1000&fit=crop&auto=format"
          alt="Уул уурхайн ажиллагаа"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,9,8,0.35) 0%, rgba(10,9,8,0.55) 60%, rgba(10,9,8,0.85) 100%)" }} />

        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 72px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#c97d2e", letterSpacing: "0.22em", marginBottom: 20 }}>
              НҮҮРС БАЯЖУУЛАХ ҮЙЛДВЭРТ ЗОРИУЛСАН · 2024 ОН
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(48px, 7vw, 96px)", color: "#f5f3ef", lineHeight: 0.92, letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: 28 }}>
              Магнетит<br />
              <span style={{ color: "#c97d2e" }}>Урвалж</span><br />
              Нунтаг
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <p style={{ color: "rgba(245,243,239,0.65)", fontSize: 16, lineHeight: 1.7, maxWidth: 480 }}>
                DMS баяжуулалтын олон улсын стандарт хангасан — жилийн 4 улиралд тасралтгүй нийлүүлэлт, хүргэлттэй.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => scrollTo("product")}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "#c97d2e", color: "#f5f3ef", padding: "13px 24px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>
                  БҮТЭЭГДЭХҮҮН <ArrowUpRight size={15} />
                </button>
                <button onClick={() => scrollTo("contact")}
                  style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(245,243,239,0.3)", color: "#f5f3ef", padding: "13px 24px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", background: "transparent" }}>
                  ХОЛБОО БАРИХ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT + PRODUCT combined */}
      <section id="about" style={{ background: "#f5f3ef" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>

          {/* Section header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 64, alignItems: "end" }} className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#c97d2e", letterSpacing: "0.2em", marginBottom: 14 }}>БИДНИЙ ТУХАЙ</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 44px)", color: "#1a1814", textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
                Дотоодын<br />нийлүүлэгч
              </h2>
            </div>
            <p style={{ color: "#6b6458", fontSize: 15, lineHeight: 1.85 }}>
              Эрдэнэс Ган Төмөр ХХК нь 2024 онд нүүрс баяжуулах үйлдвэрт туршилтын нийлүүлэлт хийж <strong style={{ color: "#1a1814" }}>"Хэвийн сайн"</strong> үнэлгээ авсан. Өөрийн үйлдвэртэй, тогтвортой чанартай бүтээгдэхүүн нийлүүлдэг.
            </p>
          </div>

          {/* Product */}
          <div id="product" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(26,24,20,0.08)" }} className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: image */}
            <div style={{ position: "relative", overflow: "hidden", minHeight: 360 }}>
              <img src="https://images.unsplash.com/photo-1496247749665-49cf5b1022e9?w=800&h=600&fit=crop&auto=format"
                alt="Үйлдвэр" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 28px", background: "linear-gradient(to top, rgba(10,9,8,0.9) 0%, transparent 100%)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#c97d2e", letterSpacing: "0.2em", marginBottom: 6 }}>МАГНЕТИТ УРВАЛЖ НУНТАГ</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#f5f3ef", lineHeight: 1.1 }}>
                  DMS Баяжуулалтын<br />Стандарт Хангасан
                </div>
              </div>
            </div>

            {/* Right: specs */}
            <div style={{ background: "#1a1814", padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#c97d2e", letterSpacing: "0.2em", marginBottom: 24 }}>ТЕХНИКИЙН ҮЗҮҮЛЭЛТ</div>
                {SPECS.map((sp, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 13, color: "rgba(245,243,239,0.5)" }}>{sp.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#c97d2e", fontWeight: 500 }}>{sp.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ADVANTAGES.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <CheckCircle size={13} color="#c97d2e" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "rgba(245,243,239,0.5)", lineHeight: 1.5 }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: "#1a1814" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "start" }} className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#c97d2e", letterSpacing: "0.2em", marginBottom: 14 }}>ХОЛБОО БАРИХ</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 44px)", color: "#f5f3ef", textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "-0.01em", marginBottom: 32 }}>
                Захиалга<br />
                <span style={{ color: "#c97d2e" }}>өгөх</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Вэбсайт", value: "Erdenesgantumur.mn" },
                  { label: "Имэйл", value: "erdenesgantumur@gmail.com" },
                  { label: "Утас", value: "88019166, 85205258" },
                  { label: "Хаяг", value: "Улаанбаатар, Монгол Улс" },
                ].map((c, i) => (
                  <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid rgba(245,243,239,0.07)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#c97d2e", letterSpacing: "0.16em", marginBottom: 5 }}>{c.label.toUpperCase()}</div>
                    <div style={{ fontSize: 15, color: "rgba(245,243,239,0.7)" }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert("Захиалга хүлээн авлаа. Удахгүй холбогдох болно."); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "НЭР", type: "text", placeholder: "Таны нэр" },
                { label: "УТАС", type: "tel", placeholder: "+976 XXXX-XXXX" },
                { label: "БАЙГУУЛЛАГА", type: "text", placeholder: "Компанийн нэр" },
                { label: "ТОО ХЭМЖЭЭ (ТН/ЖИЛ)", type: "text", placeholder: "Жилд шаардагдах хэмжээ" },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#c97d2e", letterSpacing: "0.18em", display: "block", marginBottom: 7 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f5f3ef", padding: "12px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .2s" }}
                    onFocus={e => (e.target.style.borderColor = "#c97d2e")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#c97d2e", letterSpacing: "0.18em", display: "block", marginBottom: 7 }}>МЕССЕЖ</label>
                <textarea rows={3} placeholder="Захиалга эсвэл асуулт..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f5f3ef", padding: "12px 14px", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", transition: "border-color .2s" }}
                  onFocus={e => (e.target.style.borderColor = "#c97d2e")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
              <button type="submit" style={{ background: "#c97d2e", color: "#1a1814", padding: "14px 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13, letterSpacing: "0.1em", transition: "opacity .2s" }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}>
                ИЛГЭЭХ
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111009", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "#f5f3ef", letterSpacing: "0.05em" }}>ЭРДЭНЭС ГАН ТӨМӨР ХХК</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#c97d2e", letterSpacing: "0.12em", marginLeft: 14 }}>Erdenesgantumur.mn</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(245,243,239,0.25)" }}>© 2026 · Улаанбаатар, Монгол Улс</span>
        </div>
      </footer>
    </div>
  );
}
