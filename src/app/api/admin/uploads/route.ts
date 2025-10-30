import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    ensureUploadsDir(uploadsDir);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = generateFileName(file.name);
    const targetPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(targetPath, buffer);

    const publicPath = `/uploads/${fileName}`;
    return NextResponse.json({ ok: true, path: publicPath });
  } catch (error) {
    console.error("[ADMIN_UPLOAD_POST]", error);
    return NextResponse.json({ error: "Yükleme hatası" }, { status: 500 });
  }
}