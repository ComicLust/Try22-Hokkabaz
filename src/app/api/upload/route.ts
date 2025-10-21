import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const allowedMimeToExt: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const ext = allowedMimeToExt[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const fullPath = path.join(uploadsDir, filename)
    await writeFile(fullPath, buffer)

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