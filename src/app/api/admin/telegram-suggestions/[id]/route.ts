import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single suggestion
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await (db as any).telegramSuggestion.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(item)
}

// PATCH /api/admin/telegram-suggestions/:id
// Body: { action: 'approve' | 'reject' | 'unapprove' | 'unreject' }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action } = body || {}
    if (!['approve','reject','unapprove','unreject'].includes(action)) {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    if (action === 'approve') {
      const suggestion = await (db as any).telegramSuggestion.findUnique({ where: { id: params.id } })
      if (!suggestion) return NextResponse.json({ error: 'Öneri bulunamadı' }, { status: 404 })

      // Create TelegramGroup from suggestion
      await (db as any).telegramGroup.create({
        data: {
          name: suggestion.name,
          members: suggestion.members,
          membersText: null,
          imageUrl: suggestion.imageUrl,
          ctaUrl: suggestion.ctaUrl,
          type: suggestion.type,
          isFeatured: false,
          badges: [],
        },
      })

      const updated = await (db as any).telegramSuggestion.update({
        where: { id: params.id },
        data: { isApproved: true, isRejected: false },
      })
      return NextResponse.json(updated)
    }

    if (action === 'reject') {
      const updated = await (db as any).telegramSuggestion.update({
        where: { id: params.id },
        data: { isApproved: false, isRejected: true },
      })
      return NextResponse.json(updated)
    }

    if (action === 'unapprove') {
      const updated = await (db as any).telegramSuggestion.update({
        where: { id: params.id },
        data: { isApproved: false },
      })
      return NextResponse.json(updated)
    }

    if (action === 'unreject') {
      const updated = await (db as any).telegramSuggestion.update({
        where: { id: params.id },
        data: { isRejected: false },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'İşlem uygulanamadı' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 400 })
  }
}