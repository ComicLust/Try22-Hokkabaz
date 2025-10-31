import React from 'react'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AnlasmaliSitelerClient from '@/components/AnlasmaliSitelerClient'
import SeoArticle from '@/components/SeoArticle'
import { getSeoRecord } from '@/lib/seo'

export default function AnlasmaliSitelerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-16 md:pt-8 pb-8 w-full flex-1 space-y-8 md:pl-72">
        <AnlasmaliSitelerClient />
      </main>
      <SeoArticle slug="anlasmali-siteler" />
      <Footer />
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/anlasmali-siteler', ['anlasmali-siteler']) as any
    const title = seo?.title ?? 'Anlaşmalı Siteler'
    const description = seo?.description ?? 'Güvenilir ve anlaşmalı bahis sitelerini keşfedin.'
    const keywords = seo?.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean)
    const ogTitle = seo?.ogTitle ?? title
    const ogDescription = seo?.ogDescription ?? description
    const twitterTitle = seo?.twitterTitle ?? title
    const twitterDescription = seo?.twitterDescription ?? description
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg']

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: 'https://hokkabaz.bet/anlasmali-siteler',
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description: twitterDescription,
        images: seo?.twitterImageUrl ? [seo.twitterImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      },
      robots: {
        index: seo?.robotsIndex ?? true,
        follow: seo?.robotsFollow ?? true,
      },
      other: seo?.structuredData ? { structuredData: JSON.stringify(seo.structuredData) } : undefined,
    }
  } catch {
    return {
      title: 'Anlaşmalı Siteler',
      description: 'Güvenilir ve anlaşmalı bahis sitelerini keşfedin.',
    }
  }
}