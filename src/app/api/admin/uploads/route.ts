import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_SIZE = 500 * 1024; // 500KB

function ensureUploadsDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateFileName(originalName: string) {
  const ext = path.extname(originalName || "") || ".webp";
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${stamp}-${rand}${ext}`;
}

// Gerçek imza (magic number) tespiti
function detectImageType(bytes: Uint8Array): "png" | "jpeg" | "webp" | null {
  if (bytes.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isPng = pngSig.every((v, i) => bytes[i] === v);
  if (isPng) return "png";
  // JPEG: FF D8 FF at start
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return "jpeg";
  // WEBP (RIFF): 'RIFF' at 0..3 and 'WEBP' at 8..11
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff === "RIFF" && webp === "WEBP") return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Maksimum dosya boyutu 500KB" }, { status: 413 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    ensureUploadsDir(uploadsDir);

    const arrayBuffer = await file.arrayBuffer();
    // ArrayBuffer → Uint8Array (Node fs ve sharp ile uyumlu)
    const bytes = new Uint8Array(arrayBuffer);

    // Gerçek dosya türünü imza ile doğrula
    const detected = detectImageType(bytes);
    if (!detected) {
      return NextResponse.json({ error: "Desteklenmeyen veya bozuk görsel" }, { status: 400 });
    }

    // Tüm çıktılar .webp olacak şekilde isimlendir
    const finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
    let finalBytes: Uint8Array | Buffer = bytes;

    if (detected === "png" || detected === "jpeg") {
      // Otomatik WebP dönüşümü ve kalite 70
      finalBytes = await sharp(bytes).webp({ quality: 70, effort: 4 }).toBuffer();
    } else if (detected === "webp") {
      // WebP ise doğrudan kaydet (isteğe bağlı: yeniden encode edilebilir)
      finalBytes = bytes;
    }

    const targetPath = path.join(uploadsDir, finalName);
    fs.writeFileSync(targetPath, finalBytes);

    const publicPath = `/uploads/${finalName}`;
    return NextResponse.json({ ok: true, path: publicPath });
  } catch (error) {
    console.error("[ADMIN_UPLOAD_POST]", error);
    return NextResponse.json({ error: "Yükleme hatası" }, { status: 500 });
  }
}