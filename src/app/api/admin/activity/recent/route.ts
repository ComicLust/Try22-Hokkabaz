import { db } from '@/lib/db'

export async function GET() {
  const [brands, reviews, bonuses, campaigns, telegrams, logos] = await Promise.all([
    db.reviewBrand.findMany({ select: { id: true, name: true, slug: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.siteReview.findMany({ select: { id: true, author: true, content: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.bonus.findMany({ select: { id: true, title: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.campaign.findMany({ select: { id: true, title: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.telegramGroup.findMany({ select: { id: true, name: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.marqueeLogo.findMany({ select: { id: true, imageUrl: true, href: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
  ])

  const items: { model: string; id: string; title: string; updatedAt: string }[] = []
  items.push(
    ...brands.map((b) => ({ model: 'ReviewBrand', id: b.id, title: b.name, updatedAt: b.updatedAt.toISOString() })),
    ...reviews.map((r) => ({ model: 'SiteReview', id: r.id, title: r.author || r.content?.slice(0, 50) || 'Yorum', updatedAt: r.updatedAt.toISOString() })),
    ...bonuses.map((b) => ({ model: 'Bonus', id: b.id, title: b.title || 'Bonus', updatedAt: b.updatedAt.toISOString() })),
    ...campaigns.map((c) => ({ model: 'Campaign', id: c.id, title: c.title || 'Kampanya', updatedAt: c.updatedAt.toISOString() })),
    ...telegrams.map((t) => ({ model: 'TelegramGroup', id: t.id, title: t.name || 'Telegram', updatedAt: t.updatedAt.toISOString() })),
    ...logos.map((l) => ({
      model: 'MarqueeLogo',
      id: l.id,
      title: l.href || (l.imageUrl ? l.imageUrl.split('/').pop() || 'Logo' : 'Logo'),
      updatedAt: l.updatedAt.toISOString(),
    }))
  )

  const sorted = items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 10)
  return Response.json({ ok: true, items: sorted })
}