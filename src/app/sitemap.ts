import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://hokkabaz.com'

  // Static routes that exist in app directory (non-admin, non-api)
  const staticRoutes: string[] = [
    '/',
    '/kampanyalar',
    '/bonuslar',
    '/yorumlar',
    '/anlasmali-siteler',
    '/guvenilir-telegram',
  ]

  // Dynamic brand review pages under /yorumlar/[slug]
  let brandEntries: { url: string; lastModified?: string }[] = []
  try {
    const brands = await (db as any).reviewBrand.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    brandEntries = (brands || []).map((b: any) => ({
      url: `${base}/yorumlar/${b.slug}`,
      lastModified: (b?.updatedAt ? new Date(b.updatedAt) : new Date()).toISOString(),
    }))
  } catch {
    // If DB fails, still return static routes
    brandEntries = []
  }

  const nowIso = new Date().toISOString()

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: nowIso,
  }))

  return [...staticEntries, ...brandEntries]
}