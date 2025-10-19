import { db } from "@/lib/db";
import AnlasmaliSitelerClient from "@/components/AnlasmaliSitelerClient";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await db.seoSetting.findFirst({ where: { page: "anlasmali-siteler" } });
    if (!seo) {
      return { title: "Anlaşmalı Siteler", description: "Anlaşmalı siteler ve öne çıkan bonuslar" };
    }
    return {
      title: seo.title ?? "Anlaşmalı Siteler",
      description: seo.description ?? undefined,
      keywords: seo.keywords ?? undefined,
      alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: seo.ogTitle ?? seo.title ?? undefined,
        description: seo.ogDescription ?? seo.description ?? undefined,
        images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
      },
      twitter: {
        title: seo.twitterTitle ?? seo.title ?? undefined,
        description: seo.twitterDescription ?? seo.description ?? undefined,
        images: seo.twitterImageUrl ? [seo.twitterImageUrl] : undefined,
        card: "summary_large_image",
      },
      robots: {
        index: seo.robotsIndex ?? true,
        follow: seo.robotsFollow ?? true,
      },
    };
  } catch (e) {
    return { title: "Anlaşmalı Siteler" };
  }
}

export default function AnlasmaliSitelerPage() {
  return <AnlasmaliSitelerClient />;
}