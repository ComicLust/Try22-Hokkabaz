import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSafeHttpUrl, sanitizeEmbedIframe } from "@/lib/security";

function normalizeYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname.startsWith("/embed/")) {
        const parts = u.pathname.split("/");
        return parts[2] ? `https://${host}/embed/${parts[2]}` : null;
      }
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const live = await db.liveMatch.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ live: live ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputUrl: string | undefined = body?.embedUrl;
    const inputCode: string | undefined = body?.embedCode;
    
    const hasUrl = inputUrl && typeof inputUrl === "string" && inputUrl.trim();
    const hasCode = inputCode && typeof inputCode === "string" && inputCode.trim();
    
    if (!hasUrl && !hasCode) {
      return NextResponse.json({ error: "Embed URL veya Embed Code gereklidir" }, { status: 400 });
    }

    // Normalize and validate URL
    const normalizedUrlRaw = hasUrl ? (normalizeYouTubeEmbed(inputUrl!) ?? inputUrl!) : null;
    const normalizedUrl = normalizedUrlRaw && isSafeHttpUrl(normalizedUrlRaw, { allowHttp: false }) ? normalizedUrlRaw : null;

    // Sanitize embedCode (only allow iframe to whitelisted hosts)
    const { html: safeCode, src: safeSrc } = hasCode ? sanitizeEmbedIframe(inputCode!) : { html: null, src: null };

    if (!normalizedUrl && !safeCode) {
      return NextResponse.json({ error: "Geçerli YouTube/Vimeo embed gerekli" }, { status: 400 });
    }

    // Deactivate previous active records
    await db.liveMatch.updateMany({ 
      where: { isActive: true }, 
      data: { isActive: false } 
    });

    const live = await db.liveMatch.create({
      data: {
        matchTitle: "Canlı Maç",
        embedUrl: normalizedUrl ?? safeSrc,
        embedCode: safeCode,
        date: new Date(),
        isActive: true,
      },
    });

    return NextResponse.json({ live });
  } catch (e: any) {
    console.error("LiveMatch POST error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}