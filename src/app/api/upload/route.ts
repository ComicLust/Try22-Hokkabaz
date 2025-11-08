import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'

// Gerçek imza (magic number) tespiti
function detectImageType(bytes: Uint8Array): 'png' | 'jpeg' | 'webp' | null {
  if (bytes.length < 12) return null
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  const isPng = pngSig.every((v, i) => bytes[i] === v)
  if (isPng) return 'png'
  // JPEG: FF D8 FF at start
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  if (isJpeg) return 'jpeg'
  // WEBP (RIFF): 'RIFF' at 0..3 and 'WEBP' at 8..11
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
  if (riff === 'RIFF' && webp === 'WEBP') return 'webp'
  return null
}
const MAX_SIZE = 500 * 1024 // 500 KB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Maksimum dosya boyutu 500KB' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    // ArrayBuffer → Uint8Array (generik Buffer tip uyuşmazlıklarını önlemek için)
    let data = new Uint8Array(arrayBuffer)

    // Gerçek dosya türünü imza ile doğrula
    const detected = detectImageType(data)
    if (!detected) {
      return NextResponse.json({ error: 'Desteklenmeyen veya bozuk görsel' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const fullPath = path.join(uploadsDir, filename)
    // Otomatik WebP dönüşümü: PNG/JPEG ise dönüştür, WEBP ise olduğu gibi kaydet
    if (detected === 'png' || detected === 'jpeg') {
      const converted = await sharp(data).webp({ quality: 70, effort: 4 }).toBuffer()
      await writeFile(fullPath, converted)
    } else {
      // WEBP ise doğrudan kaydet (ek güvenlik için yeniden encode etmeyi de düşünebilirsiniz)
      await writeFile(fullPath, data)
    }

    const url = `/uploads/${filename}`
    return NextResponse.json({ url }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Upload error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const q = new URL(req.url).searchParams.get('q')?.toLowerCase() ?? ''

    const entries = await readdir(uploadsDir, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile())
        .map(async (e) => {
          const full = path.join(uploadsDir, e.name)
          const s = await stat(full)
          return {
            name: e.name,
            url: `/uploads/${e.name}`,
            size: s.size,
            mtime: s.mtime.toISOString(),
          }
        })
    )

    const filtered = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files
    const sorted = filtered.sort((a, b) => (a.mtime < b.mtime ? 1 : -1))

    return NextResponse.json({ total: sorted.length, files: sorted })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'List error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const name = url.searchParams.get('name')
    if (!name) return NextResponse.json({ error: 'name param gerekli' }, { status: 400 })

    // Sadece dosya adını kabul et, path traversal engelle
    if (name.includes('/') || name.includes('..')) {
      return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const full = path.join(uploadsDir, name)

    await unlink(full)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 500 })
  }
}