import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeText, isSafeHttpUrl, isSafeLocalUploadPath, createIpRateLimiter, getClientIp } from '@/lib/security'

const allowPost = createIpRateLimiter(10, 60 * 60 * 1000) // 10 per hour per IP (brand UI is protected)

// Brand: list telegram suggestions for current brand (supports status filter)
export async function GET(req: NextRequest) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') || 'all') as 'pending' | 'approved' | 'rejected' | 'all'

    const where: any = { brandId }
    if (status === 'pending') { where.isApproved = false; where.isRejected = false }
    if (status === 'approved') where.isApproved = true
    if (status === 'rejected') where.isRejected = true

    const items = await (db as any).telegramSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 400 })
  }
}

// Brand: create a new Telegram group/channel suggestion with per-brand pending limit
export async function POST(req: NextRequest) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })

    const ip = getClientIp(req.headers)
    if (!allowPost(ip)) {
      return NextResponse.json({ error: 'Çok fazla deneme, lütfen daha sonra tekrar deneyin' }, { status: 429 })
    }

    // En fazla 3 adet onay bekleyen öneri
    const pendingCount = await (db as any).telegramSuggestion.count({
      where: { brandId, isApproved: false, isRejected: false },
    })
    if (pendingCount >= 3) {
      return NextResponse.json({ error: 'En fazla 3 öneri onay bekleyebilir' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { name, ctaUrl, adminUsername, members, imageUrl, type } = body || {}
    // Optional single badge (string) or badges array with max 1 item
    const badgeLabel: string | undefined = typeof body?.badge === 'string' ? body.badge : undefined
    const badgesInput: string[] | undefined = Array.isArray(body?.badges) ? body.badges.filter(Boolean) : undefined

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

    // normalize badges (max 1)
    let badges: string[] | null = null
    const single = badgeLabel?.trim()
    const arr = (badgesInput ?? []).map((b) => String(b).trim()).filter(Boolean)
    const raw = single ? [single] : arr
    if (raw.length > 1) {
      return NextResponse.json({ error: 'En fazla 1 rozet eklenebilir' }, { status: 400 })
    }
    if (raw.length === 1) {
      badges = [sanitizeText(raw[0], 30)]
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
        badges,
        brand: { connect: { id: brandId } },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 400 })
  }
}