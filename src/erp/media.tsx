// Тайлан, Roadmap зэрэг модулиудын хамтын зураг / PDF / видео хавсралтын хэрэгслүүд
import { useEffect, useState } from "react";
import { Upload } from "tus-js-client";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";
import { C, fonts } from "./ui";

// Storage-д хадгалсан хавсралтын ерөнхий хэлбэр
export interface MediaFile {
  id: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  url?: string; // signed URL (харуулахад)
}

export const isImage = (a: { content_type?: string | null; file_name: string }) =>
  (a.content_type ?? "").startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(a.file_name);

export const isPdf = (a: { content_type?: string | null; file_name: string }) =>
  a.content_type === "application/pdf" || /\.pdf$/i.test(a.file_name);

export const isVideo = (a: { content_type?: string | null; file_name: string }) =>
  (a.content_type ?? "").startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp|avi|mkv)$/i.test(a.file_name);

// Supabase Free багцын нэг файлын дээд хэмжээ. Pro бол Storage → Settings-ээс өсгөөд энд тааруулна.
export const MAX_UPLOAD_MB = 50;

// 6MB-аас том файлыг (видео г.м.) TUS-ээр хэсэгчлэн байршуулна — тасарвал үргэлжилнэ, явц харагдана
export async function resumableUpload(path: string, file: File, onPct: (pct: number) => void) {
  const { data } = await supabase.auth.getSession();
  const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
  return new Promise<void>((resolve, reject) => {
    const up = new Upload(file, {
      endpoint: `https://${ref}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${data.session?.access_token ?? ""}`,
        apikey: SUPABASE_ANON_KEY,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "docs",
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // Supabase шаардлага — өөрчлөхгүй
      onError: (e) => reject(e),
      onProgress: (sent, total) => onPct(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });
    up.findPreviousUploads().then((prev) => {
      if (prev.length) up.resumeFromPreviousUpload(prev[0]);
      up.start();
    });
  });
}

export const IMAGE_ACCEPT = "image/*";
export const PDF_ACCEPT = "application/pdf,.pdf";
export const VIDEO_ACCEPT = "video/*";
export const FILE_ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export function safeName(name: string) {
  return name.replace(/[^\w.\-]/g, "_");
}

// Утасны том зургийг байршуулахаас өмнө жижигрүүлнэ (урт тал ≤ 2000px, JPEG 82%).
// GIF/HEIC, жижиг файл, эсвэл шахаад томорсон бол эх файлыг нь үлдээнэ.
export const MAX_SIDE = 2000;
export async function compressImage(file: File): Promise<File> {
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
export async function withUrls<T extends { storage_path: string }>(atts: T[]): Promise<(T & { url?: string })[]> {
  if (atts.length === 0) return atts;
  const { data } = await supabase.storage.from("docs").createSignedUrls(
    atts.map((a) => a.storage_path),
    60 * 60,
  );
  return atts.map((a, i) => ({ ...a, url: data?.[i]?.signedUrl ?? undefined }));
}

// Зураг биш файлын (PDF г.м.) дүрс
export function FileTile({ name, pdf }: { name: string; pdf: boolean }) {
  const video = isVideo({ file_name: name });
  return (
    <div style={{ ...fileTile, flexDirection: "column", gap: 6 }}>
      <span style={{ ...pdfBadge, background: pdf ? "#b3361f" : video ? "#1f5fb3" : C.muted }}>
        {pdf ? "PDF" : video ? "ВИДЕО" : (name.split(".").pop() ?? "").toUpperCase()}
      </span>
      <span style={{ fontSize: 10, lineHeight: 1.3, maxHeight: "3.9em", overflow: "hidden" }}>{name}</span>
    </div>
  );
}

// Видеоны эхний кадрыг жижиг зураг болгон харуулна
export function VideoThumb({ src, name }: { src: string; name: string }) {
  return (
    <div style={{ position: "relative" }}>
      <video src={src} preload="metadata" muted playsInline style={{ ...thumbImg, background: "#000" }} />
      <span style={{ ...pdfBadge, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.6)", fontSize: 14 }} title={name}>
        ▶
      </span>
    </div>
  );
}

// Шинээр сонгосон файлын урьдчилсан харагдац (object URL-ийг цэвэрлэнэ)
export function LocalThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  const video = isVideo({ content_type: file.type, file_name: file.name });
  useEffect(() => {
    if (!file.type.startsWith("image/") && !video) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, video]);
  if (url && video) return <VideoThumb src={url} name={file.name} />;
  return url ? <img src={url} alt={file.name} style={thumbImg} /> : <FileTile name={file.name} pdf={isPdf({ content_type: file.type, file_name: file.name })} />;
}

export function Gallery<T extends MediaFile>({ imgs, onOpen }: { imgs: T[]; onOpen: (a: T) => void }) {
  if (imgs.length === 0) return null;
  return (
    <div style={{ ...gallery, marginTop: 10 }}>
      {imgs.map((a) => (
        <button key={a.id} onClick={() => onOpen(a)} title={a.file_name} style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in" }}>
          {a.url ? <img src={a.url} alt={a.file_name} loading="lazy" style={thumbImg} /> : <div style={fileTile}>…</div>}
        </button>
      ))}
    </div>
  );
}

export function Videos({ vids }: { vids: MediaFile[] }) {
  if (vids.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginTop: 10 }}>
      {vids.map((a) => (
        <video key={a.id} src={a.url} controls preload="metadata" playsInline title={a.file_name} style={{ width: "100%", maxHeight: 360, background: "#000", borderRadius: 3 }} />
      ))}
    </div>
  );
}

export function FileLinks<T extends MediaFile>({ files, onDownload }: { files: T[]; onDownload: (a: T) => void }) {
  if (files.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {files.map((a) => (
        <button key={a.id} onClick={() => onDownload(a)} style={fileChip} title="Нээх">
          <span style={{ ...pdfBadge, background: isPdf(a) ? "#b3361f" : C.muted }}>{isPdf(a) ? "PDF" : (a.file_name.split(".").pop() ?? "").toUpperCase()}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.file_name}</span>
        </button>
      ))}
    </div>
  );
}

export function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: MediaFile[];
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
      data-lightbox
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

export const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: C.accent,
  fontFamily: fonts.body,
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
};

export const gallery: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
  gap: 10,
};

export const thumbImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  display: "block",
  borderRadius: 3,
  border: `1px solid ${C.line}`,
  background: "#fff",
};

export const fileTile: React.CSSProperties = {
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

export const removeBtn: React.CSSProperties = {
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

export const newBadge: React.CSSProperties = {
  position: "absolute",
  left: 4,
  top: 4,
  background: C.accent,
  color: C.light,
  fontFamily: fonts.mono,
  fontSize: 9,
  letterSpacing: "0.1em",
  padding: "2px 5px",
  borderRadius: 2,
};

export const pdfBadge: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "#fff",
  padding: "2px 6px",
  borderRadius: 2,
  flexShrink: 0,
};

export const fileChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  maxWidth: "100%",
  padding: "7px 10px",
  background: "#faf8f4",
  border: `1px solid ${C.line}`,
  borderRadius: 3,
  cursor: "pointer",
  fontFamily: fonts.body,
  fontSize: 13,
  color: C.dark,
};
