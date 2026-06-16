import type { CSSProperties, ReactNode } from "react";

export const C = {
  bg: "#f5f3ef",
  dark: "#1a1814",
  light: "#f5f3ef",
  accent: "#c97d2e",
  line: "rgba(26,24,20,0.1)",
  muted: "rgba(26,24,20,0.55)",
};

export const fonts = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
};

export function Label({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 9,
        color: C.accent,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${C.line}`,
  background: "#fff",
  fontFamily: fonts.body,
  fontSize: 14,
  color: C.dark,
  outline: "none",
  borderRadius: 2,
  boxSizing: "border-box",
};

export function Btn({
  children,
  onClick,
  type = "button",
  variant = "solid",
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "solid" | "ghost" | "danger";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    fontFamily: fonts.display,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.06em",
    padding: "10px 18px",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    borderRadius: 2,
    transition: "opacity .15s",
    ...style,
  };
  const variants: Record<string, CSSProperties> = {
    solid: { background: C.accent, color: C.light },
    ghost: { background: "transparent", color: C.dark, borderColor: C.line },
    danger: { background: "transparent", color: "#b3361f", borderColor: "rgba(179,54,31,0.4)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.line}`,
        borderRadius: 3,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {sub && <Label>{sub}</Label>}
      <h1
        style={{
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: 30,
          color: C.dark,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {title}
      </h1>
    </div>
  );
}
