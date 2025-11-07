import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ROBOTS_PATH = path.join(process.cwd(), 'public', 'robots.txt')

export async function GET() {
  try {
    const content = await fs.readFile(ROBOTS_PATH, 'utf8')
    return Response.json({ ok: true, content })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'robots.txt okunamadı' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const content = String(body?.content ?? '')
    if (!content) {
      return Response.json({ ok: false, error: 'İçerik boş olamaz' }, { status: 400 })
    }
    await fs.writeFile(ROBOTS_PATH, content, 'utf8')
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'robots.txt kaydedilemedi' }, { status: 500 })
  }
}