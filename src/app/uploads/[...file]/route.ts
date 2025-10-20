import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readFile, stat } from 'fs/promises'

function getContentType(ext: string) {
  const e = ext.toLowerCase()
  if (e === '.png') return 'image/png'
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg'
  if (e === '.webp') return 'image/webp'
  if (e === '.gif') return 'image/gif'
  if (e === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

export async function GET(_req: NextRequest, { params }: { params: { file: string[] } }) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const rel = params.file?.join('/') || ''
    const resolved = path.resolve(uploadsDir, rel)
    if (!resolved.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const s = await stat(resolved).catch(() => null)
    if (!s || !s.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const buf = await readFile(resolved)
    const ext = path.extname(resolved)
    const ct = getContentType(ext)
    const u8 = new Uint8Array(buf)
    return new Response(u8, {
      status: 200,
      headers: {
        'content-type': ct,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Read error' }, { status: 500 })
  }
}

export async function HEAD(_req: NextRequest, { params }: { params: { file: string[] } }) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const rel = params.file?.join('/') || ''
    const resolved = path.resolve(uploadsDir, rel)
    if (!resolved.startsWith(uploadsDir)) {
      return new Response(null, { status: 400 })
    }

    const s = await stat(resolved).catch(() => null)
    if (!s || !s.isFile()) {
      return new Response(null, { status: 404 })
    }

    const ext = path.extname(resolved)
    const ct = getContentType(ext)
    return new Response(null, {
      status: 200,
      headers: {
        'content-type': ct,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response(null, { status: 500 })
  }
}