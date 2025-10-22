import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeText, isSafeHttpUrl, isSafeLocalUploadPath, createIpRateLimiter, getClientIp } from '@/lib/security'

const allowPost = createIpRateLimiter(5, 60 * 60 * 1000) // 5 per hour

// Public: create a new Telegram group/channel suggestion
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    if (!allowPost(ip)) {
      return NextResponse.json({ error: 'Çok fazla deneme, lütfen daha sonra tekrar deneyin' }, { status: 429 })
    }

    const body = await req.json()
    const { name, ctaUrl, adminUsername, members, imageUrl, type } = body || {}

    if (!name || !ctaUrl || !adminUsername || members === undefined || members === null || !imageUrl) {
      return NextResponse.json({ error: 'name, ctaUrl, adminUsername, members ve imageUrl zorunlu' }, { status: 400 })
    }

    if (typeof ctaUrl !== 'string' || !isSafeHttpUrl(ctaUrl, { allowHttp: false })) {
      return NextResponse.json({ error: 'Geçerli bir https ctaUrl girin' }, { status: 400 })
    }

    const membersNum = Number(members)
    if (!Number.isFinite(membersNum) || membersNum <= 0) {
      return NextResponse.json({ error: 'members pozitif bir sayı olmalı' }, { status: 400 })
    }

    if (typeof imageUrl !== 'string' || !isSafeLocalUploadPath(imageUrl)) {
      return NextResponse.json({ error: 'imageUrl /uploads/ ile başlamalı' }, { status: 400 })
    }

    try {
      const filename = imageUrl.replace('/uploads/', '')
      if (!filename || filename.includes('/') || filename.includes('..')) {
        return NextResponse.json({ error: 'Geçersiz imageUrl' }, { status: 400 })
      }
      const full = require('path').join(process.cwd(), 'public', 'uploads', filename)
      const s = await require('fs/promises').stat(full).catch(() => null)
      if (!s) return NextResponse.json({ error: 'Görsel bulunamadı' }, { status: 400 })
      if (s.size > 100 * 1024) return NextResponse.json({ error: 'Görsel boyutu 100KB sınırını aşmış' }, { status: 400 })
    } catch {
      return NextResponse.json({ error: 'Görsel doğrulanamadı' }, { status: 400 })
    }

    const created = await (db as any).telegramSuggestion.create({
      data: {
        name: sanitizeText(name, 120),
        ctaUrl: String(ctaUrl),
        adminUsername: sanitizeText(adminUsername, 120),
        members: membersNum,
        imageUrl: String(imageUrl),
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