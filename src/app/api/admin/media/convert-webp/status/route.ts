import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import { readFile } from 'fs/promises'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reportId = searchParams.get('id')
    const progressFile = path.join(process.cwd(), 'db', 'convert-webp-progress.json')
    const buf = await readFile(progressFile).catch(() => null)
    if (!buf) return NextResponse.json({ ok: false, status: 'none' })
    const map = JSON.parse(buf.toString('utf-8')) as Record<string, any>
    const data = reportId ? map[reportId] : map
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'status_error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'