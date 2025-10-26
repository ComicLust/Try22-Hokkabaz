import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const runtime = 'nodejs'

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)] }
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

export async function POST(req: Request) {
  try {
    const DEFAULT_COUNT = 20;
    const idSuffix = Date.now();

    // PartnerSite (Güvenilir Siteler)
    const partnerSites = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      name: `Demo Site ${i + 1}`,
      slug: `${slugify(`demo-site-${i + 1}`)}-${idSuffix}`,
      logoUrl: "/logo.svg",
      rating: Number((Math.random() * 5).toFixed(1)),
      features: { hero: i < 5, heroOrder: i + 1, badge: pick(["Önerilen", "Yeni", "Bonuslu"]), order: i + 1 },
      siteUrl: `https://example.com/${i + 1}`,
      isActive: true,
    }))

    // Campaign (Aktif Kampanyalar)
    const campaigns = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      title: `Demo Kampanya ${i + 1}`,
      slug: `${slugify(`demo-kampanya-${i + 1}`)}-${idSuffix}`,
      description: `Demo kampanya açıklaması ${i + 1}`,
      imageUrl: "/uploads/1760732951329-fzch33159aq.jpg",
      ctaUrl: `/kampanyalar`,
      badgeLabel: pick(["Yeni", "Sıcak", "Popüler"]),
      bonusText: pick(["%100 İlk Yatırım Bonusu", "Freebet Fırsatı", "Kayıpsız Bet"]),
      bonusAmount: randInt(10, 500),
      tags: ["demo", "kampanya"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      isActive: true,
      isFeatured: i < 3,
      priority: DEFAULT_COUNT - i,
    }))

    // ReviewBrand (Yorumlar) - 20 marka
    const reviewBrands = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      name: `Demo Marka ${i + 1}`,
      slug: `${slugify(`demo-marka-${i + 1}`)}-${idSuffix}`,
      logoUrl: "/logo.svg",
      siteUrl: `https://brand.example/${i + 1}`,
      isActive: true,
      editorialSummary: `Demo marka özeti ${i + 1}`,
    }))

    // SiteReview - 20 yorum, markalara dağıt
    const siteReviews = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      brandId: "__TO_BIND__", // later replace
      author: `Kullanıcı ${i + 1}`,
      isAnonymous: Math.random() < 0.3,
      rating: randInt(1, 5),
      isPositive: Math.random() < 0.6,
      content: `Demo kullanıcı yorumu içerik ${i + 1}`,
      isApproved: true,
      helpfulCount: randInt(0, 50),
      notHelpfulCount: randInt(0, 20),
    }))

    // BankoCoupon (Banko Kuponlar) - 20 kupon
    const bankoCoupons = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      title: `Demo Kupon ${i + 1}`,
      date: new Date(Date.now() - i * 24 * 3600 * 1000),
      publishedAt: new Date(),
      isActive: true,
      totalOdd: Number((Math.random() * 10 + 1).toFixed(2)),
      status: pick(["PENDING", "WON", "LOST"]) as any,
      upVotes: randInt(0, 100),
      downVotes: randInt(0, 50),
    }))
    const bankoMatchesPerCoupon = 3;
    const bankoMatches = [] as any[];

    // TelegramGroup - 20 grup
    const telegramGroups = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      name: `Demo Telegram ${i + 1}`,
      members: randInt(100, 5000),
      membersText: undefined,
      imageUrl: "/logo.svg",
      ctaUrl: `https://t.me/demo_${i + 1}`,
      type: pick(["GROUP", "CHANNEL"]),
      isFeatured: i < 5,
      badges: [pick(["Güvenilir", "Aktif", "Yeni"])],
    }))

    // Bonus - 20 bonus
    const bonuses = Array.from({ length: DEFAULT_COUNT }).map((_, i) => ({
      title: `Demo Bonus ${i + 1}`,
      slug: `${slugify(`demo-bonus-${i + 1}`)}-${idSuffix}`,
      description: `Demo bonus açıklaması ${i + 1}`,
      shortDescription: `Kısa açıklama ${i + 1}`,
      bonusType: pick(["ilk yatırım", "freebet", "kayıp iadesi"]),
      gameCategory: pick(["spor", "casino", "poker"]),
      amount: randInt(10, 1000),
      wager: randInt(1, 20),
      minDeposit: randInt(10, 200),
      imageUrl: "/uploads/1760732951329-fzch33159aq.jpg",
      postImageUrl: "/uploads/1760732951329-fzch33159aq.jpg",
      ctaUrl: `/bonuslar`,
      badges: [pick(["Önerilen", "Popüler", "Sıcak"])],
      validityText: "Bu ay sonuna kadar geçerli",
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      features: ["demo", "bonus"],
      isActive: true,
      isFeatured: i < 4,
      priority: DEFAULT_COUNT - i,
      isApproved: true,
    }))

    // Write to DB, preserving unique constraints
    // PartnerSite upserts by slug
    await db.$transaction(partnerSites.map((p) => db.partnerSite.upsert({ where: { slug: p.slug }, create: p, update: p })))
    // Campaign upserts by slug
    await db.$transaction(campaigns.map((c) => db.campaign.upsert({ where: { slug: c.slug }, create: c, update: c })))
    // ReviewBrand upserts by slug
    const createdBrands = await db.$transaction(reviewBrands.map((b) => db.reviewBrand.upsert({ where: { slug: b.slug }, create: b, update: b })))

    // Bind SiteReviews to existing brands
    const brandIds = createdBrands.map((b) => b.id)
    const boundReviews = siteReviews.map((r, i) => ({ ...r, brandId: brandIds[i % brandIds.length] }))
    await db.$transaction(boundReviews.map((r) => db.siteReview.create({ data: r })))

    // Create BankoCoupons and Matches
    const createdCoupons = await db.$transaction(bankoCoupons.map((c) => (db as any).bankoCoupon.create({ data: c }) as any))
    for (const coupon of createdCoupons as any[]) {
      for (let j = 0; j < bankoMatchesPerCoupon; j++) {
        bankoMatches.push({
          couponId: coupon.id,
          homeTeam: `Takım A${j + 1}`,
          awayTeam: `Takım B${j + 1}`,
          league: pick(["Süper Lig", "Premier League", "La Liga", "Serie A"]),
          startTime: new Date(Date.now() + j * 3600 * 1000),
          prediction: pick(["MS 1", "MS 2", "KG Var", "Üst 2.5"]),
          odd: Number((Math.random() * 3 + 1).toFixed(2)),
          resultScore: Math.random() < 0.4 ? `${randInt(0,3)}-${randInt(0,3)}` : null,
          result: pick(["PENDING", "WON", "LOST", "DRAW"]) as any,
        })
      }
    }
    await db.$transaction(bankoMatches.map((m) => (db as any).bankoMatch.create({ data: m }) as any))

    // TelegramGroup create (no unique fields except id)
    const tgData = telegramGroups.map((g) => ({ ...g, type: g.type as any }))
    await db.$transaction(tgData.map((g) => db.telegramGroup.create({ data: g })))

    // TelegramGroup upserts by ctaUrl
    // await db.$transaction(telegramGroups.map((g) => db.telegramGroup.upsert({ where: { ctaUrl: g.ctaUrl }, create: g, update: g })))

    // Bonus upserts by slug
    await db.$transaction(bonuses.map((b) => db.bonus.upsert({ where: { slug: b.slug }, create: b, update: b })))

    return NextResponse.json({ ok: true, created: {
      partnerSites: partnerSites.length,
      campaigns: campaigns.length,
      reviewBrands: reviewBrands.length,
      siteReviews: siteReviews.length,
      bankoCoupons: bankoCoupons.length,
      bankoMatches: bankoMatches.length,
      telegramGroups: telegramGroups.length,
      bonuses: bonuses.length,
    } })
  } catch (e: any) {
    console.error("Demo seed error:", e)
    return NextResponse.json({ error: e?.message || "Demo seed failed" }, { status: 500 })
  }
}