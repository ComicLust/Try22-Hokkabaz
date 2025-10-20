import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, stat, access } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const allowedMimeToExt: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

// Coolify deployment için uploads klasörünü kontrol et ve oluştur
async function ensureUploadsDir() {
  const cwd = process.cwd()
  const uploadsDir = path.join(cwd, 'public', 'uploads')
  try {
    await access(uploadsDir)
  } catch {
    await mkdir(uploadsDir, { recursive: true })
    console.log('📁 Uploads directory created:', uploadsDir)
  }
  console.log('🔎 Using uploads dir:', uploadsDir, 'cwd:', cwd)
  return uploadsDir
}

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

    // Coolify deployment için güvenli uploads klasörü oluşturma
    const uploadsDir = await ensureUploadsDir()

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const fullPath = path.join(uploadsDir, filename)
    await writeFile(fullPath, buffer)

    console.log('📸 File uploaded:', filename, 'Size:', file.size, 'bytes')

    const url = `/uploads/${filename}`
    return NextResponse.json({ url }, { status: 201 })
  } catch (e: any) {
    console.error('❌ Upload error:', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Upload error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Coolify deployment için güvenli uploads klasörü oluşturma
    const uploadsDir = await ensureUploadsDir()

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

    console.log('📂 Listed files:', sorted.length, 'total files')
    return NextResponse.json({ total: sorted.length, files: sorted })
  } catch (e: any) {
    console.error('❌ List error:', e?.message)
    return NextResponse.json({ error: e?.message ?? 'List error' }, { status: 500 })
  }
}