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
    // ArrayBuffer → Uint8Array (Node fs ve sharp ile uyumlu, generik Buffer tip çakışmalarını önler)
    const bytes = new Uint8Array(arrayBuffer);

    const mime = (file as File).type || "";
    const isPng = mime === "image/png";
    const isJpeg = mime === "image/jpeg";
    const isWebp = mime === "image/webp";

    let finalName = generateFileName(file.name);
    let finalBytes: Uint8Array | Buffer = bytes;

    if (isPng || isJpeg) {
      // Otomatik WebP dönüşümü ve kalite 70
      finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
      finalBytes = await sharp(bytes).webp({ quality: 70, effort: 4 }).toBuffer();
    } else if (isWebp) {
      // Doğrudan kaydet
      finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
      // bytes olduğu gibi
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