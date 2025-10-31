import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'

const allowedMimeToExt: Record<string, string> = {
  'image/png': '.webp',
  'image/jpeg': '.webp',
  'image/webp': '.webp',
}
const MAX_SIZE = 500 * 1024 // 500 KB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Maksimum dosya boyutu 500KB' }, { status: 413 })
    }

    const ext = allowedMimeToExt[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    // ArrayBuffer → Uint8Array (generik Buffer tip uyuşmazlıklarını önlemek için)
    let data = new Uint8Array(arrayBuffer)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const fullPath = path.join(uploadsDir, filename)
    // Otomatik WebP dönüşümü: PNG/JPEG ise dönüştür, WEBP ise olduğu gibi kaydet
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const converted = await sharp(data).webp({ quality: 70, effort: 4 }).toBuffer()
      await writeFile(fullPath, converted)
    } else {
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