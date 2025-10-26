import { db } from "@/lib/db";
import AnlasmaliSitelerClient from "@/components/AnlasmaliSitelerClient";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const slugNew = "guvenilir-bahis-siteleri-listesi";
    const slugOld = "anlasmali-siteler";
    const seoNew = await (db as any).seoSetting.findFirst({ where: { page: slugNew }, select: {
      title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
    } });
    const seo = seoNew ?? await (db as any).seoSetting.findFirst({ where: { page: slugOld }, select: {
      title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
    } });

    const defaultTitle = "Güvenilir Bahis Siteleri Listesi";
    const defaultDesc = "Güvenilir bahis siteleri listesi ve öne çıkan bonuslar";
    const defaultImage = "/uploads/1760732951329-fzch33159aq.jpg";

    if (!seo) {
      return {
        title: defaultTitle,
        description: defaultDesc,
        openGraph: {
          title: defaultTitle,
          description: defaultDesc,
          images: [{ url: defaultImage }],
          type: "website",
        },
        twitter: {
          title: defaultTitle,
          description: defaultDesc,
          images: [defaultImage],
          card: "summary_large_image",
        },
      };
    }

    return {
      title: seo.title ?? defaultTitle,
      description: seo.description ?? undefined,
      keywords: seo.keywords ?? undefined,
      alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: seo.ogTitle ?? seo.title ?? undefined,
        description: seo.ogDescription ?? seo.description ?? undefined,
        images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : [{ url: defaultImage }],
        type: 'website',
      },
      twitter: {
        title: seo.twitterTitle ?? seo.title ?? undefined,
        description: seo.twitterDescription ?? seo.description ?? undefined,
        images: seo.twitterImageUrl ? [seo.twitterImageUrl] : [defaultImage],
        card: "summary_large_image",
      },
      robots: {
        index: seo.robotsIndex ?? true,
        follow: seo.robotsFollow ?? true,
      },
    };
  } catch (e) {
    return { title: "Güvenilir Bahis Siteleri Listesi" };
  }
}

export default function GuvenilirBahisSiteleriListesiPage() {
  return <AnlasmaliSitelerClient />;
}