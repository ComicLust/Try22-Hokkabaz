import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

async function ensureTable() {
  try {
    await db.$executeRaw`CREATE TABLE IF NOT EXISTS "BrandSuggestion" (
      id TEXT PRIMARY KEY,
      brandName TEXT NOT NULL,
      email TEXT,
      siteUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      isReviewed INTEGER DEFAULT 0
    )`
  } catch (e) {
    // ignore if exists or sqlite quirks
  }
}

export async function GET(_req: NextRequest) {
  try {
    await ensureTable()
    const items = await db.$queryRaw<Array<{ id: string; brandName: string; email?: string | null; siteUrl?: string | null; createdAt: string; isReviewed: number }>>`
      SELECT id, brandName, email, siteUrl, createdAt, isReviewed FROM "BrandSuggestion" ORDER BY datetime(createdAt) DESC LIMIT 200
    `
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const body = await req.json().catch(() => ({}))
    const brandName = String(body?.brandName ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const siteUrl = String(body?.siteUrl ?? '').trim()
    if (!brandName) return NextResponse.json({ error: 'Marka adı zorunlu' }, { status: 400 })

    const id = crypto.randomUUID()
    // parameterized insert
    await db.$executeRaw(Prisma.sql`INSERT INTO "BrandSuggestion" (id, brandName, email, siteUrl) VALUES (${id}, ${brandName}, ${email || null}, ${siteUrl || null})`)
    return NextResponse.json({ id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Gönderim hatası' }, { status: 500 })
  }
}