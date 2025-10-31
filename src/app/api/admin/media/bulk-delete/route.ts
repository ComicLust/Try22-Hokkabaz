import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { unlink, stat } from 'fs/promises'

export const runtime = 'nodejs'

interface DeleteBody { names: string[] }

function sanitizeName(name: string) {
  if (!name || name.includes('/') || name.includes('..')) return null
  return name
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as DeleteBody | null
    if (!body || !Array.isArray(body.names) || body.names.length === 0) {
      return NextResponse.json({ error: 'names array gerekli' }, { status: 400 })
    }
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    let deleted = 0
    const errors: { name: string; error: string }[] = []
    for (const raw of body.names) {
      const name = sanitizeName(String(raw))
      if (!name) { errors.push({ name: String(raw), error: 'invalid_name' }); continue }
      const full = path.join(uploadsDir, name)
      try {
        const s = await stat(full).catch(() => null)
        if (!s || !s.isFile()) { errors.push({ name, error: 'not_found' }); continue }
        await unlink(full)
        deleted++
      } catch (e: any) {
        errors.push({ name, error: e?.message ?? 'delete_failed' })
      }
    }
    return NextResponse.json({ ok: true, deleted, total: body.names.length, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'bulk_delete_error' }, { status: 500 })
  }
}