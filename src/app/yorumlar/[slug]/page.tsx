import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSeoRecord } from '@/lib/seo'
import YorumDetayClient from '@/components/YorumDetayClient'
const prisma: any = db

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const brand = await prisma.reviewBrand.findUnique({ where: { slug } })
    if (!brand) return { title: 'Site Yorumları' }
    // SEO kayıtları: Admin > SEO ayarlarından /yorumlar/{slug} için override
    const seo = await getSeoRecord(`/yorumlar/${slug}`, [`yorumlar/${slug}`])

    function buildDefaultBrandTitle(name: string): string {
      return `${name} Yorumları ve Şikayetleri Hokkabaz'da!`
    }

    function buildDefaultBrandDescription(name: string): string {
      return `${name} hakkında gerçek kullanıcı yorumları ve şikayetleri Hokkabaz'da. Güvenilirlik, ödeme, bonuslar ve destek deneyimleri tek sayfada!`
    }

    const canonical = seo?.canonicalUrl || `https://hokkabaz.bet/yorumlar/${slug}`
    const title = seo?.title ?? brand.seoTitle ?? buildDefaultBrandTitle(brand.name)
    const description = seo?.description ?? brand.seoDescription ?? brand.editorialSummary ?? buildDefaultBrandDescription(brand.name)
    const images = (seo?.ogImageUrl ? [seo.ogImageUrl] : (brand.logoUrl ? [brand.logoUrl] : ['/uploads/1760732951329-fzch33159aq.jpg']))

    // Aggregate rating ve örnek review’lar
    let averageRating: number | undefined = undefined
    let ratingCount = 0
    let latestReviews: Array<{ author?: string | null, isAnonymous?: boolean, rating?: number | null, content: string, createdAt: string }> = []
    try {
      const agg = await prisma.siteReview.aggregate({
        where: { brandId: brand.id, isApproved: true, rating: { not: null } },
        _avg: { rating: true },
        _count: { rating: true },
      })
      averageRating = agg?._avg?.rating ?? undefined
      ratingCount = agg?._count?.rating ?? 0
      const reviews = await prisma.siteReview.findMany({
        where: { brandId: brand.id, isApproved: true },
        select: { author: true, isAnonymous: true, rating: true, content: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      })
      latestReviews = (reviews || []).map(r => ({
        author: r.author,
        isAnonymous: r.isAnonymous,
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }))
    } catch {}

    const structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url: canonical,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: brand.name,
        url: brand.siteUrl || canonical,
        logo: brand.logoUrl || undefined,
        description: brand.editorialSummary || undefined,
        ...(averageRating && ratingCount ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating,
            ratingCount: ratingCount,
          }
        } : {}),
        ...(latestReviews.length ? {
          review: latestReviews.map(r => ({
            '@type': 'Review',
            reviewBody: r.content,
            reviewRating: r.rating ? { '@type': 'Rating', ratingValue: r.rating } : undefined,
            author: r.isAnonymous ? undefined : (r.author ? { '@type': 'Person', name: r.author } : undefined),
            datePublished: r.createdAt,
          }))
        } : {}),
      },
    ]

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title: seo?.ogTitle ?? title,
        description: seo?.ogDescription ?? description,
        url: canonical,
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: seo?.twitterTitle ?? title,
        description: seo?.twitterDescription ?? description,
        images: seo?.twitterImageUrl ? [seo.twitterImageUrl] : images,
      },
      other: { structuredData: JSON.stringify(structuredData) },
    }
  } catch {
    return { title: 'Site Yorumları' }
  }
}

export default async function YorumDetayPage({ params }: Props) {
  const { slug } = await params
  // Server-side data fetch with ISR and tag-based caching
  let initialSite: any = null
  let initialReviews: any[] = []

  try {
    const siteRes = await fetch(`/api/review-brands/by-slug/${slug}`, { next: { tags: [`review-brand:${slug}`], revalidate } })
    initialSite = siteRes.ok ? await siteRes.json() : null
    if (initialSite?.id) {
      const listRes = await fetch(`/api/site-reviews?brandSlug=${slug}&sort=newest`, { next: { tags: [`site-reviews:${initialSite.id}`], revalidate } })
      const listData = listRes.ok ? await listRes.json() : { items: [] }
      initialReviews = listData?.items || []
    }
  } catch {}

  return <YorumDetayClient slug={slug} initialSite={initialSite} initialReviews={initialReviews} />
}