import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSeoRecord } from "@/lib/seo";
import BonuslarClient from "@/components/BonuslarClient";
import { Suspense } from "react";

export default async function BonuslarPage() {
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://hokkabaz.bet'
  let items: any[] = []
  try {
    items = await (db as any).bonus.findMany({
      where: { isActive: true, isApproved: true },
      orderBy: [
        { isFeatured: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    })
  } catch {}
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || []).map((b: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: String(b?.title || 'Bonus'),
      description: String(b?.description || b?.shortDescription || 'Güncel bonus fırsatları'),
      url: (typeof b?.ctaUrl === 'string' && b.ctaUrl.trim()) ? b.ctaUrl : `${BASE}/bonuslar`,
      image: b?.imageUrl ? (b.imageUrl.startsWith('http') ? b.imageUrl : `${BASE}${b.imageUrl}`) : `${BASE}/uploads/1760732951329-fzch33159aq.jpg`,
    })),
  }
  return (
    <Suspense fallback={<div />}> 
      <BonuslarClient />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord("/bonuslar", ["bonuslar"]) as any
    const title = seo?.title ?? "Bonuslar";
    const description = seo?.description ?? "Güncel bonuslar, fırsatlar ve promosyonlar.";
    const keywords = seo?.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean);
    const ogTitle = seo?.ogTitle ?? title;
    const ogDescription = seo?.ogDescription ?? description;
    const twitterTitle = seo?.twitterTitle ?? title;
    const twitterDescription = seo?.twitterDescription ?? description;
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'];

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
    url: "https://hokkabaz.bet/bonuslar",
        siteName: "Hokkabaz",
        type: "website",
        locale: "tr_TR",
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: twitterTitle,
        description: twitterDescription,
        images: seo?.twitterImageUrl ? [seo.twitterImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      },
      robots: {
        index: seo?.robotsIndex ?? true,
        follow: seo?.robotsFollow ?? true,
      },
      other: seo?.structuredData ? { structuredData: JSON.stringify(seo.structuredData) } : undefined,
    };
  } catch {
    return {
      title: "Bonuslar",
      description: "Güncel bonuslar, fırsatlar ve promosyonlar.",
    };
  }
}