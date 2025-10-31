import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readFile, stat, access } from 'fs/promises'

function getContentType(ext: string) {
  const e = ext.toLowerCase()
  if (e === '.png') return 'image/png'
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg'
  if (e === '.webp') return 'image/webp'
  if (e === '.gif') return 'image/gif'
  if (e === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ file?: string[] }> }
) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const { file = [] } = await ctx.params
    const rel = Array.isArray(file) ? file.join('/') : ''
    const resolved = path.resolve(uploadsDir, rel)
    if (!resolved.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }
    let target = resolved
    const ext = path.extname(resolved).toLowerCase()
    // If jpg/png requested and a .webp sibling exists, serve webp
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const base = resolved.slice(0, resolved.length - ext.length)
      const webp = `${base}.webp`
      const exists = await access(webp).then(() => true).catch(() => false)
      if (exists) target = webp
    }

    const s = await stat(target).catch(() => null)
    if (!s || !s.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const buf = await readFile(target)
    const outExt = path.extname(target)
    const ct = getContentType(outExt)
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

export async function HEAD(
  _req: NextRequest,
  ctx: { params: Promise<{ file?: string[] }> }
) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const { file = [] } = await ctx.params
    const rel = Array.isArray(file) ? file.join('/') : ''
    const resolved = path.resolve(uploadsDir, rel)
    if (!resolved.startsWith(uploadsDir)) {
      return new Response(null, { status: 400 })
    }
    let target = resolved
    const ext = path.extname(resolved).toLowerCase()
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const base = resolved.slice(0, resolved.length - ext.length)
      const webp = `${base}.webp`
      const exists = await access(webp).then(() => true).catch(() => false)
      if (exists) target = webp
    }

    const s = await stat(target).catch(() => null)
    if (!s || !s.isFile()) {
      return new Response(null, { status: 404 })
    }

    const outExt = path.extname(target)
    const ct = getContentType(outExt)
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