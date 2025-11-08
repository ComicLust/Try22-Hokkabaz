import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { sanitizeText, createIpRateLimiter, getClientIp, isSafeLocalUploadPath } from '@/lib/security'
import { withCache, revalidateSiteReviewsTag } from '@/lib/cache'

function dicebearAvatar(seed: string) {
  const s = encodeURIComponent(seed)
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${s}&size=64&radius=50&backgroundType=gradientLinear`
}

// List approved reviews for a site (by slug) with sorting and pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brandSlug = searchParams.get('brandSlug') || searchParams.get('siteSlug') || undefined
  const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest'
  const page = Number(searchParams.get('page') || '1')
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')))
  const hasImage = (searchParams.get('hasImage') === 'true')

  if (!brandSlug) return NextResponse.json({ error: 'brandSlug is required' }, { status: 400 })

  const brand = await db.reviewBrand.findUnique({ where: { slug: brandSlug } })
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const orderBy = sort === 'newest' ? { createdAt: 'desc' as const } : { createdAt: 'asc' as const }
  const skip = (page - 1) * limit

  const { items, total } = await withCache(
    async () => {
      const [list, count] = await Promise.all([
        db.siteReview.findMany({
          where: {
            brandId: brand.id,
            isApproved: true,
            ...(hasImage ? {
              OR: [
                { imageUrl: { not: null } },
                { imageUrls: { not: null } },
              ],
            } : {}),
          },
          orderBy,
          skip,
          take: limit,
        }),
        db.siteReview.count({
          where: {
            brandId: brand.id,
            isApproved: true,
            ...(hasImage ? {
              OR: [
                { imageUrl: { not: null } },
                { imageUrls: { not: null } },
              ],
            } : {}),
          },
        }),
      ])
      return { items: list, total: count }
    },
    {
      key: ['site-reviews', brand.id, sort, String(page), String(limit), hasImage ? 'images-only' : 'all'],
      tags: [`site-reviews:${brand.id}`],
      revalidate: 300,
    }
  )

  // One-time backfill: Assign random avatar to reviews missing avatarUrl
  const toFill = items.filter((i: any) => !i.avatarUrl)
  if (toFill.length > 0) {
    await Promise.all(
      toFill.map((i: any) => {
        const url = dicebearAvatar(randomUUID())
        i.avatarUrl = url // reflect in response immediately
        return db.siteReview.update({ where: { id: i.id }, data: { avatarUrl: url } })
      })
    )
  }

  return NextResponse.json({ items, total, page, limit })
}

const allowPost = createIpRateLimiter(5, 60 * 60 * 1000) // 5 per hour

// Create a new review (goes into approval queue)
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    if (!allowPost(ip)) {
      return NextResponse.json({ error: 'Çok fazla deneme, lütfen daha sonra tekrar deneyin' }, { status: 429 })
    }

    const body = await req.json()
    const { brandSlug, siteSlug, author, isAnonymous, content, isPositive, imageUrl, imageUrls } = body || {}
    const slug = brandSlug || siteSlug
    if (!slug || !content) return NextResponse.json({ error: 'brandSlug ve content zorunlu' }, { status: 400 })

    const brand = await db.reviewBrand.findUnique({ where: { slug } })
    if (!brand) return NextResponse.json({ error: 'Marka bulunamadı' }, { status: 404 })

    const avatarUrl = dicebearAvatar(randomUUID())

    // Prisma Client tipleri henüz şema güncellemesini yansıtmayabilir.
    // imageUrl'i koşullu olarak ekleyip create data'yı geniş bir tip ile geçiriyoruz.
    const createData: any = {
      brandId: brand.id,
      author: isAnonymous ? null : sanitizeText(author ?? '', 50) || null,
      isAnonymous: Boolean(isAnonymous),
      rating: null,
      isPositive: typeof isPositive === 'boolean' ? isPositive : null,
      content: sanitizeText(content, 2000),
      isApproved: false,
      avatarUrl,
    }
    // Çoklu görsel: en fazla 3 güvenli yol, Json alanına yazılır
    const safeArray = Array.isArray(imageUrls)
      ? imageUrls
          .filter((u: unknown): u is string => typeof u === 'string')
          .filter((u: string) => isSafeLocalUploadPath(u))
      : []
    const uniqueSafe = Array.from(new Set(safeArray)).slice(0, 3)
    if (uniqueSafe.length > 0) {
      createData.imageUrls = uniqueSafe
      // Geriye uyumluluk için ilkini tekil alana da yaz
      createData.imageUrl = uniqueSafe[0]
    } else if (typeof imageUrl === 'string' && isSafeLocalUploadPath(imageUrl)) {
      // Tekil alan kullanımı (eski istemciler için)
      createData.imageUrl = imageUrl
      createData.imageUrls = [imageUrl]
    }
    const created = await db.siteReview.create({ data: createData })
    revalidateSiteReviewsTag(brand.id)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}