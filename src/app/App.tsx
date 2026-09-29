import { useState, type CSSProperties, type FormEvent } from "react";
import {
  Menu, X, ArrowUpRight, ArrowRight, Check, Factory, CalendarClock, ShieldCheck, Truck,
  Phone, Mail, MapPin, FileSignature, Zap,
} from "lucide-react";

const C = {
  navy: "#0b1f3a",
  navyDeep: "#07162b",
  blue: "#2f6bff",
  blueSoft: "#9db8ff",
  orange: "#f37021",
  bg: "#f4f6fa",
  card: "#ffffff",
  ink: "#0f1b2d",
  muted: "#5b6b82",
  line: "rgba(15,27,45,0.09)",
  green: "#16a34a",
  red: "#dc2626",
};

const NAV = [
  { id: "about", label: "Бидний тухай" },
  { id: "product", label: "Бүтээгдэхүүн" },
  { id: "production", label: "Үйлдвэрлэл" },
  { id: "advantages", label: "Давуу тал" },
  { id: "contact", label: "Холбоо барих" },
];

const PHONES = ["8801-9166", "8520-5258", "9908-4178"];
const EMAIL = "erdenesgantumur@gmail.com";
const ADDRESS = "Дархан-Уул аймаг, Орхон сум, 2-р баг, Их булгийн хөндий 1-106 тоот";

const HERO_STATS = [
  { value: "2,000 тн", label: "сарын үйлдвэрлэлийн хүчин чадал" },
  { value: "90–95%", label: "0.045 мм-д нэвтрэлт" },
  { value: "≥95%", label: "соронзон чанар" },
  { value: "4 улирал", label: "тасралтгүй нийлүүлэлт, өвөл ч саадгүй" },
];

const SPECS = [
  { label: "Ширхэглэг — 0.045 мм нэвтрэлт", value: "90–95%" },
  { label: "Соронзон чанар", value: "≥ 95%" },
  { label: "Чийг", value: "≤ 5%", note: "ердийн 1–2%" },
  { label: "Нягт", value: "4.5 г/см³" },
  { label: "Савлагаа", value: "1.5–2 тн том шуудай" },
  { label: "Хүчин чадал", value: "2,000 тн/сар" },
];

const CLUSTER_STEPS = [
  { title: "Бутлах цех", cap: "1,000 тн/хоног", sub: "Хацарт, алхан бутлуур" },
  { title: "Хуурай баяжуулах", cap: "1,000 тн/хоног", sub: "Соронзон сепаратор" },
  { title: "Нойтон баяжуулах", cap: "1,600 тн/хоног", sub: "2 үйлдвэр" },
  { title: "Хатаах цех", cap: "2,300 тн/хоног", sub: "3 цех" },
  { title: "Магнетит нунтаглах", cap: "2,000 тн/сар", sub: "Хэт нарийн тээрэм" },
];

const PLANTS = [
  { name: "Бутлах цех", cap: "1,000 тн/хоног", equip: "1200 хацарт, 900 алхан бутлуур; 3×6 м шигшүүр" },
  { name: "Хуурай баяжуулах үйлдвэр", cap: "1,000 тн/хоног", equip: "1530 сепаратор ×2; 1212 алхан бутлуур ×2" },
  { name: "Нойтон баяжуулах үйлдвэр №1", cap: "600 тн/хоног", equip: "2145, 1675 тээрэм; 1330 сепаратор ×3" },
  { name: "Нойтон баяжуулах үйлдвэр №2", cap: "1,000 тн/хоног", equip: "2460, 1.8×9 тээрэм; 1330 сепаратор ×6" },
  { name: "Хатаах цех №1 / №2 / №3", cap: "500 / 800 / 1,000 тн/хоног", equip: "Бөмбөрөн хатаагуур" },
  { name: "Магнетит нунтаглах үйлдвэр", cap: "2,000 тн/сар", equip: "Хэт нарийн тээрэм, соронзон ялгагч", highlight: true },
];

const COMPARISON = [
  { label: "0.045 мм нэвтрэлт", std: "5–10%", ours: "90–95%" },
  { label: "0.075 мм нэвтрэлт", std: "50–70%", ours: "100%" },
  { label: "Чийг", std: "8–9%", ours: "≤ 5% (ердийн 1–2%)" },
  { label: "Өвлийн хэрэглээ", std: "Хөлдөх эрсдэлтэй", ours: "Саадгүй" },
  { label: "Хоолой, насосны элэгдэл", std: "Их", ours: "Бага" },
  { label: "Нягт орчны тогтвортой байдал", std: "Тогтворгүй", ours: "Тогтвортой" },
  { label: "Зарцуулалт", std: "Их", ours: "Бага" },
];

const PROCESS = [
  { title: "Түүхий эд", text: "Өөрийн үйлдвэрийн баяжмал" },
  { title: "Хатаалт", text: "Чийгийг 1–2% хүртэл бууруулна" },
  { title: "Хэт нарийн нунтаглалт", text: "0.045 мм-д 90–95% нэвтрэлт" },
  { title: "Соронзон ялгалт", text: "≥95% соронзон чанар, шуудайлалт" },
];

const WHY = [
  { icon: Factory, title: "Өөрийн үйлдвэр, түүхий эд", text: "Импорт, хил гаалийн саатлаас хамаарахгүй." },
  { icon: CalendarClock, title: "Жилийн 4 улиралд тасралтгүй үйлдвэрлэл", text: "Хуурай бүтээгдэхүүн өвөл хөлдөхгүй." },
  { icon: ShieldCheck, title: "Тохирлын гэрчилгээтэй", text: "Лабораторийн шинжилгээгээр баталгаажсан." },
  { icon: Truck, title: "Хүргэлттэй", text: "Тавцант машин болон вагоноор хүргэнэ." },
];

const OFFERS = [
  {
    icon: FileSignature,
    title: "Гэрээт нийлүүлэлт",
    text: "Урт хугацааны гэрээ, сарын хуваарьт нийлүүлэлт. Тогтвортой үнэ, баталгаат хэмжээ — сард 2,000 тн хүртэл.",
  },
  {
    icon: Zap,
    title: "Шууд худалдан авалт",
    text: "Агуулахад бэлэн байгаа нөөцөөс шуурхай ачуулна. Нэг удаагийн болон яаралтай захиалгад тохиромжтой.",
  },
];

const wrap: CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };
const eyebrow = (color: string = C.blue): CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-brand)", fontWeight: 700,
  fontSize: 11, letterSpacing: "0.22em", color, marginBottom: 14, textTransform: "uppercase",
});
const h2 = (color: string = C.ink): CSSProperties => ({
  fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)",
  color, lineHeight: 1.15, letterSpacing: "-0.01em",
});

function Eyebrow({ children, color }: { children: string; color?: string }) {
  return (
    <div style={eyebrow(color)}>
      <span style={{ width: 22, height: 2, background: color ?? C.blue, display: "inline-block" }} />
      {children}
    </div>
  );
}

function Photo({ src, caption, style, className }: { src: string; caption?: string; style?: CSSProperties; className?: string }) {
  return (
    <figure className={className} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <div style={{ overflow: "hidden", borderRadius: 6, flex: 1, minHeight: 0, background: "#dde3ec" }}>
        <img src={src} alt={caption ?? ""} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      {caption && <figcaption style={{ fontSize: 12, color: C.muted }}>{caption}</figcaption>}
    </figure>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const body = [
      `Нэр: ${get("name")}`,
      `Утас: ${get("phone")}`,
      `Байгууллага: ${get("company")}`,
      `Нийлүүлэлтийн хэлбэр: ${get("type")}`,
      `Тоо хэмжээ: ${get("qty")}`,
      "",
      get("message"),
    ].join("\n");
    const subject = `Магнетит захиалга — ${get("company") || get("name")}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const inputStyle: CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", padding: "12px 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
    borderRadius: 4, transition: "border-color .2s",
  };
  const labelStyle: CSSProperties = {
    fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 10, color: C.blueSoft,
    letterSpacing: "0.18em", display: "block", marginBottom: 7,
  };
  const focus = (e: { target: HTMLElement }) => (e.target.style.borderColor = C.blue);
  const blur = (e: { target: HTMLElement }) => (e.target.style.borderColor = "rgba(255,255,255,0.12)");

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "var(--font-body)", minHeight: "100vh" }}>
      <style>{`@media (max-width: 640px) { .cmp th, .cmp td { padding: 12px 10px !important; font-size: 13px !important; } .cmp th { letter-spacing: 0.06em !important; font-size: 10px !important; } }`}</style>

      {/* HEADER */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(7,22,43,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ ...wrap, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
            <img src="/images/logo.svg" alt="" width={34} height={34} style={{ display: "block" }} />
            <div>
              <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 14, letterSpacing: "0.04em", color: "#fff", lineHeight: 1.1 }}>ЭРДЭНЭС ГАН ТӨМӨР ХХК</div>
              <div style={{ fontFamily: "var(--font-brand)", fontWeight: 600, fontSize: 8.5, color: "#c9d2de", letterSpacing: "0.2em" }}>ERDENES GAN TUMUR LLC · DARKHAN-UUL</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                style={{ fontSize: 13, color: "#c9d2de", fontWeight: 500, transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#c9d2de")}>
                {n.label}
              </button>
            ))}
            <button onClick={() => scrollTo("contact")}
              style={{ background: C.blue, color: "#fff", padding: "9px 18px", fontSize: 12, fontFamily: "var(--font-brand)", fontWeight: 700, letterSpacing: "0.06em", borderRadius: 4 }}>
              ЗАХИАЛГА ӨГӨХ
            </button>
            <a href="/app"
              style={{ fontSize: 12, color: C.blueSoft, fontFamily: "var(--font-brand)", fontWeight: 700, letterSpacing: "0.1em", textDecoration: "none" }}>
              НЭВТРЭХ →
            </a>
          </nav>

          <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: "#fff" }} aria-label="Цэс">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="lg:hidden" style={{ background: C.navyDeep, padding: "12px 24px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 16 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                style={{ textAlign: "left", fontSize: 15, color: "#c9d2de", fontWeight: 500 }}>{n.label}</button>
            ))}
            <a href="/app"
              style={{ textAlign: "left", fontSize: 15, color: C.blueSoft, fontFamily: "var(--font-brand)", fontWeight: 700, letterSpacing: "0.05em", textDecoration: "none" }}>
              НЭВТРЭХ →
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", background: C.navy, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <img src="/images/hero-building.jpg" alt="Эрдэнэс Ган Төмөр — магнетитийн үйлдвэр"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,31,58,0.96) 0%, rgba(11,31,58,0.82) 50%, rgba(11,31,58,0.55) 100%)" }} />

        <div style={{ ...wrap, position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 120, paddingBottom: 48, width: "100%", boxSizing: "border-box" }}>
          <Eyebrow color={C.blueSoft}>Компанийн танилцуулга · 2026</Eyebrow>
          <h1 style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "clamp(36px, 5.6vw, 72px)", color: "#fff", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 24, maxWidth: 820 }}>
            Магнетит нунтаг —<br />
            <span style={{ color: C.blue }}>тогтвортой чанар,</span><br />
            тасралтгүй нийлүүлэлт
          </h1>
          <p style={{ color: "#e8ecf2", fontSize: 17, lineHeight: 1.7, maxWidth: 600, marginBottom: 36 }}>
            Нүүрс баяжуулах үйлдвэрийн хүнд орчны урвалжийг өөрийн кластер үйлдвэрт үйлдвэрлэж, жилийн 4 улиралд найдвартай нийлүүлнэ. <strong>Гэрээт болон шууд худалдан авалтад бэлэн.</strong>
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => scrollTo("contact")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: C.blue, color: "#fff", padding: "14px 26px", fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 13, letterSpacing: "0.06em", borderRadius: 4 }}>
              ЗАХИАЛГА ӨГӨХ <ArrowUpRight size={15} />
            </button>
            <button onClick={() => scrollTo("product")}
              style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.35)", color: "#fff", padding: "14px 26px", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", background: "transparent", borderRadius: 4 }}>
              ТЕХНИКИЙН ҮЗҮҮЛЭЛТ
            </button>
          </div>
        </div>

        <div style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,0.14)", background: "rgba(7,22,43,0.55)" }}>
          <div style={{ ...wrap }} className="grid grid-cols-2 md:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div key={s.value} style={{ padding: "24px 12px 24px 0" }}>
                <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "clamp(22px, 2.6vw, 32px)", color: "#fff", lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: "#c9d2de", marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: "96px 0", scrollMarginTop: 64 }}>
        <div style={wrap} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow>Бидний тухай</Eyebrow>
            <h2 style={{ ...h2(), marginBottom: 24 }}>Өөрийн үйлдвэр, өөрийн түүхий эдтэй дотоодын нийлүүлэгч</h2>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.85, marginBottom: 16 }}>
              «Эрдэнэс Ган Төмөр» ХХК нь <strong style={{ color: C.ink }}>2012 оноос хойш</strong> Дархан-Уул аймагт төмрийн хүдэр баяжуулах үйлдвэрлэл эрхэлж буй <strong style={{ color: C.ink }}>100% дотоодын компани</strong> юм.
            </p>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.85 }}>
              2024 онд орчин үеийн тоног төхөөрөмж бүхий <strong style={{ color: C.ink }}>магнетит нунтаглах үйлдвэрээ</strong> ашиглалтад оруулсан бөгөөд одоо <strong style={{ color: C.ink }}>нүүрс баяжуулах үйлдвэрүүдэд тогтмол нийлүүлж байна.</strong> Бутлах, хуурай ба нойтон баяжуулах, хатаах цех бүхий кластер үйлдвэрлэлтэй тул түүхий эдээ бүрэн өөрсдөө хангадаг.
            </p>
            <div className="grid grid-cols-3 gap-4" style={{ marginTop: 32 }}>
              {[
                { v: "2012", l: "оноос хойш" },
                { v: "100%", l: "дотоодын хөрөнгө" },
                { v: "6", l: "үйлдвэр, цех" },
              ].map(x => (
                <div key={x.v} style={{ borderLeft: `3px solid ${C.blue}`, paddingLeft: 14 }}>
                  <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 26, color: C.ink }}>{x.v}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{x.l}</div>
                </div>
              ))}
            </div>
          </div>
          <Photo src="/images/complex-aerial.jpg" caption="Үйлдвэрийн цогцолбор, Орхон сум" style={{ height: 380 }} />
        </div>
      </section>

      {/* PRODUCT */}
      <section id="product" style={{ padding: "96px 0", background: C.card, scrollMarginTop: 64 }}>
        <div style={wrap}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12" style={{ marginBottom: 48, alignItems: "end" }}>
            <div>
              <Eyebrow>Бүтээгдэхүүн</Eyebrow>
              <h2 style={h2()}>Магнетит нунтаг — хүнд орчны урвалж</h2>
            </div>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8 }}>
              Нүүрс баяжуулах үйлдвэрийн хүнд орчны циклон, саванд нягт орчин бүрдүүлэхэд зориулсан хэт нарийн, хуурай нунтаг.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3" style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", background: C.navy, color: "#fff", padding: "14px 22px", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 11, letterSpacing: "0.16em" }}>
                <span>ҮЗҮҮЛЭЛТ</span><span>УТГА</span>
              </div>
              {SPECS.map((sp, i) => (
                <div key={sp.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 22px", background: i % 2 ? C.bg : C.card, borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <span style={{ fontSize: 14.5, color: C.muted }}>{sp.label}</span>
                  <span style={{ fontFamily: "var(--font-brand)", fontSize: 15, color: C.ink, fontWeight: 800, textAlign: "right", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {sp.value}
                    {sp.note && <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(47,107,255,0.1)", color: C.blue, padding: "3px 8px", borderRadius: 20 }}>{sp.note}</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-6">
              <div style={{ borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                <img src="/images/magnetite-powder.jpg" alt="Магнетит нунтаг" loading="lazy" style={{ maxWidth: "70%", maxHeight: 200 }} />
              </div>
              <Photo src="/images/bagging-station.jpg" caption="Том шуудай дүүргэх станц" style={{ height: 240 }} />
            </div>
          </div>
        </div>
      </section>

      {/* CLUSTER PRODUCTION */}
      <section id="production" style={{ padding: "96px 0", scrollMarginTop: 64 }}>
        <div style={wrap}>
          <Eyebrow>Кластер үйлдвэрлэл</Eyebrow>
          <h2 style={{ ...h2(), marginBottom: 20, maxWidth: 760 }}>Хүдрээс магнетит хүртэл — бүх шат нэг цогцолборт</h2>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8, maxWidth: 820, marginBottom: 48 }}>
            Бид бутлах цех, хуурай болон нойтон баяжуулах үйлдвэр, хатаах цех, магнетит нунтаглах үйлдвэрийг нэг дор хослуулсан кластер үйлдвэрлэл эрхэлдэг. Ингэснээр магнетитийн түүхий эдийг бүрэн өөрсдөө хангаж, чанар, хэмжээ, хугацааг эхнээс нь дуустал хянадаг.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" style={{ marginBottom: 40 }}>
            {CLUSTER_STEPS.map((s, i) => {
              const last = i === CLUSTER_STEPS.length - 1;
              return (
                <div key={s.title} style={{ position: "relative", background: last ? C.navy : C.card, color: last ? "#fff" : C.ink, border: `1px solid ${last ? C.navy : C.line}`, borderRadius: 8, padding: "22px 20px" }}>
                  <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 28, color: last ? C.blueSoft : C.blue, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15, marginTop: 14 }}>{s.title}</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: last ? "#c9d2de" : C.muted }}>{s.cap}</div>
                  <div style={{ fontSize: 12.5, color: last ? "#c9d2de" : C.muted }}>{s.sub}</div>
                  {!last && <ArrowRight size={16} className="hidden lg:block" style={{ position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)", color: C.blue, background: C.bg, borderRadius: 10, zIndex: 1 }} />}
                </div>
              );
            })}
          </div>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", background: C.card, marginBottom: 40 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: C.navy, color: "#fff", textAlign: "left" }}>
                    {["ҮЙЛДВЭР / ЦЕХ", "ХҮЧИН ЧАДАЛ", "ҮНДСЭН ТОНОГ ТӨХӨӨРӨМЖ"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLANTS.map((p, i) => (
                    <tr key={p.name} style={{ background: p.highlight ? "rgba(47,107,255,0.06)" : i % 2 ? C.bg : C.card, borderTop: `1px solid ${C.line}` }}>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: p.highlight ? 700 : 500 }}>{p.name}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-brand)", whiteSpace: "nowrap" }}>{p.cap}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: C.muted }}>{p.equip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Photo src="/images/wet-plant.jpg" caption="Нойтон баяжуулах үйлдвэр" style={{ height: 260 }} />
            <Photo src="/images/crushing-area.jpg" caption="Бутлах, хуурай баяжуулах талбай" style={{ height: 260 }} />
            <Photo src="/images/grinding-line.jpg" caption="Нунтаглах шугам" style={{ height: 260 }} />
          </div>
        </div>
      </section>

      {/* ADVANTAGES: comparison + process */}
      <section id="advantages" style={{ padding: "96px 0", background: C.card, scrollMarginTop: 64 }}>
        <div style={wrap}>
          <Eyebrow>Хэрэглэгчид өгөх үр ашиг</Eyebrow>
          <h2 style={{ ...h2(), marginBottom: 40 }}>Энгийн баяжмалаас ялгарах давуу тал</h2>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", marginBottom: 80 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="cmp" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#fff" }}>
                    <th style={{ padding: "14px 20px", background: C.navy, fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em" }}>ҮЗҮҮЛЭЛТ</th>
                    <th style={{ padding: "14px 20px", background: C.navy, fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em" }}>ЭНГИЙН БАЯЖМАЛ</th>
                    <th style={{ padding: "14px 20px", background: C.blue, fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em" }}>МАНАЙ МАГНЕТИТ</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((r, i) => (
                    <tr key={r.label} style={{ background: i % 2 ? C.bg : C.card, borderTop: `1px solid ${C.line}` }}>
                      <td style={{ padding: "14px 20px", fontSize: 14 }}>{r.label}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: C.red }}>{r.std}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: C.green, fontWeight: 700 }}>{r.ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Eyebrow>Үйлдвэрлэлийн процесс</Eyebrow>
          <h2 style={{ ...h2(), marginBottom: 32 }}>Хэт нарийн нунтаглах тээрэм ба тоос шүүгч</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 24 }}>
            {PROCESS.map((p, i) => (
              <div key={p.title} style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "22px 20px" }}>
                <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 28, color: C.blue, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15, marginTop: 14 }}>{p.title}</div>
                <div style={{ fontSize: 13, marginTop: 6, color: C.muted, lineHeight: 1.5 }}>{p.text}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Photo className="md:col-span-3" src="/images/grinding-mill.jpg" caption="Хэт нарийн нунтаглах тээрэм ба тоос шүүгч" style={{ height: 340 }} />
            <Photo src="/images/magnetite-workshop.jpg" className="md:col-span-2" caption="Магнетитийн үйлдвэрийн цех" style={{ height: 340 }} />
          </div>
        </div>
      </section>

      {/* WHY US + OFFERS */}
      <section id="why" style={{ padding: "96px 0", background: C.navy, color: "#fff" }}>
        <div style={wrap}>
          <Eyebrow color={C.blueSoft}>Найдвартай нийлүүлэлт</Eyebrow>
          <h2 style={{ ...h2("#fff"), marginBottom: 40 }}>Яагаад биднийг сонгох вэ?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 32 }}>
            {WHY.map(({ icon: Icon, title, text }) => (
              <div key={title} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 24 }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, background: "rgba(47,107,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={20} color={C.blueSoft} />
                </div>
                <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15, lineHeight: 1.35, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: "#c9d2de", lineHeight: 1.6 }}>{text}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 56 }}>
            <div className="md:col-span-2">
              <Photo src="/images/warehouse.jpg" style={{ height: 340 }} />
              <div style={{ fontSize: 12, color: "#c9d2de", marginTop: 8 }}>Бэлэн бүтээгдэхүүний агуулах</div>
            </div>
            <div>
              <div style={{ height: 340, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
                <img src="/images/certificate.jpg" alt="Тохирлын гэрчилгээ" loading="lazy" style={{ maxHeight: "100%", maxWidth: "100%", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }} />
              </div>
              <div style={{ fontSize: 12, color: "#c9d2de", marginTop: 8 }}>Тохирлын гэрчилгээ</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
            {OFFERS.map(({ icon: Icon, title, text }) => (
              <div key={title} style={{ background: "#fff", color: C.ink, borderRadius: 8, padding: 28, borderTop: `4px solid ${C.blue}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Icon size={22} color={C.blue} />
                  <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 18 }}>{title}</div>
                </div>
                <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>{text}</p>
                <button onClick={() => scrollTo("contact")} style={{ display: "flex", alignItems: "center", gap: 6, color: C.blue, fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13 }}>
                  Үнийн санал авах <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#86efac", fontSize: 14, fontWeight: 600 }}>
            <Check size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            Нүүрс баяжуулах үйлдвэрүүдэд тогтмол нийлүүлж байна · Гэрээт болон шууд худалдан авалтад бэлэн
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: C.navyDeep, scrollMarginTop: 64 }}>
        <div style={{ ...wrap, padding: "96px 24px" }} className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <Eyebrow color={C.blueSoft}>Холбоо барих</Eyebrow>
            <h2 style={{ ...h2("#fff"), marginBottom: 16 }}>
              Захиалга <span style={{ color: C.blue }}>өгөх</span>
            </h2>
            <p style={{ color: "#c9d2de", fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
              Гэрээт нийлүүлэлт болон шууд худалдан авалтын талаар бидэнтэй холбогдоорой. Үнийн санал, дээж, шинжилгээний дүнг шуурхай илгээнэ.
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <Phone size={18} color={C.blue} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={labelStyle}>УТАС</div>
                  <div style={{ display: "flex", gap: "4px 18px", flexWrap: "wrap" }}>
                    {PHONES.map(p => (
                      <a key={p} href={`tel:+976${p.replace("-", "")}`} style={{ fontSize: 16, color: "#fff", fontWeight: 600, textDecoration: "none" }}>{p}</a>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <Mail size={18} color={C.blue} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={labelStyle}>И-МЭЙЛ</div>
                  <a href={`mailto:${EMAIL}`} style={{ fontSize: 15, color: "#fff", textDecoration: "none", wordBreak: "break-all" }}>{EMAIL}</a>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <MapPin size={18} color={C.blue} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={labelStyle}>ХАЯГ</div>
                  <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.6 }}>{ADDRESS}</div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 28 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "name", label: "НЭР", type: "text", placeholder: "Таны нэр", required: true },
                { name: "phone", label: "УТАС", type: "tel", placeholder: "+976 XXXX-XXXX", required: true },
                { name: "company", label: "БАЙГУУЛЛАГА", type: "text", placeholder: "Компанийн нэр" },
                { name: "qty", label: "ТОО ХЭМЖЭЭ (ТН)", type: "text", placeholder: "Жишээ нь: 500 тн/сар" },
              ].map((f) => (
                <div key={f.name}>
                  <label htmlFor={f.name} style={labelStyle}>{f.label}</label>
                  <input id={f.name} name={f.name} type={f.type} placeholder={f.placeholder} required={f.required} style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="type" style={labelStyle}>НИЙЛҮҮЛЭЛТИЙН ХЭЛБЭР</label>
              <select id="type" name="type" defaultValue="Гэрээт нийлүүлэлт" style={{ ...inputStyle, appearance: "auto" }} onFocus={focus} onBlur={blur}>
                <option style={{ color: C.ink }}>Гэрээт нийлүүлэлт</option>
                <option style={{ color: C.ink }}>Шууд худалдан авалт</option>
                <option style={{ color: C.ink }}>Үнийн санал / дээж авах</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" style={labelStyle}>МЕССЕЖ</label>
              <textarea id="message" name="message" rows={4} placeholder="Хүргэлтийн хаяг, хугацаа болон бусад мэдээлэл..." style={{ ...inputStyle, resize: "vertical" }} onFocus={focus} onBlur={blur} />
            </div>
            <button type="submit" style={{ background: C.blue, color: "#fff", padding: "15px 0", fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 13, letterSpacing: "0.1em", borderRadius: 4, transition: "opacity .2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              ИЛГЭЭХ
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.blue, padding: "22px 0" }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/images/logo.svg" alt="" width={26} height={26} />
            <span style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>ЭРДЭНЭС ГАН ТӨМӨР ХХК</span>
          </div>
          <span style={{ fontFamily: "var(--font-brand)", fontWeight: 600, fontSize: 12, color: "#fff" }}>www.erdenesgantumur.mn · {PHONES.join(" · ")}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>© 2026 · Дархан-Уул, Монгол Улс</span>
        </div>
      </footer>
    </div>
  );
}
