import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public: create a new Telegram group/channel suggestion
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, ctaUrl, adminUsername, members, imageUrl, type } = body || {}
    if (!name || !ctaUrl) {
      return NextResponse.json({ error: 'name ve ctaUrl gerekli' }, { status: 400 })
    }

    const created = await (db as any).telegramSuggestion.create({
      data: {
        name: String(name),
        ctaUrl: String(ctaUrl),
        adminUsername: adminUsername ? String(adminUsername) : null,
        members: typeof members === 'number' ? members : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
        type: type === 'CHANNEL' ? 'CHANNEL' : 'GROUP',
        isApproved: false,
        isRejected: false,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 400 })
  }
}

// Optional: list suggestions (defaults to pending)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'rejected' | 'all'

  const where: any = {}
  if (status === 'pending') { where.isApproved = false; where.isRejected = false }
  if (status === 'approved') where.isApproved = true
  if (status === 'rejected') where.isRejected = true

  const items = await (db as any).telegramSuggestion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(items)
}