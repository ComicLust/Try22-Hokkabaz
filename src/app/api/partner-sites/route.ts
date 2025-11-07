import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export async function GET() {
  // Tüm partner siteleri al ve frontend ile tutarlı olması için
  // features.order (grid sırası) öncelikli olacak şekilde sırala.
  const items = await db.partnerSite.findMany()
  const sorted = [...items].sort((a: any, b: any) => {
    const ao = (a?.features?.order ?? 999)
    const bo = (b?.features?.order ?? 999)
    if (ao !== bo) return ao - bo
    // Aynı order için rating'e göre (desc) yedek sıralama
    const ar = a?.rating ?? 0
    const br = b?.rating ?? 0
    return br - ar
  })
  return NextResponse.json(sorted)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await db.partnerSite.create({ data: body })
    // Anasayfa partner-sites cache'ini temizle
    revalidateTag('home:partner-sites')
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}