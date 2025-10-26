import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Suspense } from "react";
import BankoKuponlarArchiveClient from "@/components/BankoKuponlarArchiveClient";

export default function BankoKuponlarArchivePage() {
  return (
    <Suspense fallback={<div />}> 
      <BankoKuponlarArchiveClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await (db as any).seoSetting.findUnique({ where: { page: "/banko-kuponlar/arsiv" } });
    const title = seo?.title ?? "Banko Kuponlar Arşivi";
    const description = seo?.description ?? "Önceki günlerin kuponları ve başarı oranları.";
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
        url: "https://hokkabaz.net/banko-kuponlar/arsiv",
        siteName: "Hokkabaz",
        type: seo?.ogType ?? "website",
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
      title: "Banko Kuponlar Arşivi",
      description: "Önceki günlerin kuponları ve başarı oranları.",
    };
  }
}