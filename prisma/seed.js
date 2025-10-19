/* eslint-disable */
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  // Seed Campaigns
  const campaigns = [
    {
      title: 'Slot Oyunları Festivali',
      slug: 'slot-oyunlari-festivali',
      description: 'Popüler slot oyunlarında özel fırsatlar.',
      imageUrl: '/logo.svg',
      ctaUrl: 'https://example.com/campaign/slot',
      isActive: true,
      priority: 10,
    },
    {
      title: 'Bahis Sitesi A Hoşgeldin Kampanyası',
      slug: 'bahis-sitesi-a-hosgeldin',
      description: 'Yeni kullanıcılara özel hoşgeldin bonusu.',
      imageUrl: '/logo.svg',
      ctaUrl: 'https://example.com/campaign/hosgeldin',
      isActive: true,
      priority: 5,
    },
  ]

  for (const c of campaigns) {
    await db.campaign.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    })
  }

  // Seed Bonuses
  const bonuses = [
    {
      title: 'Deneme Bonusu 100₺',
      slug: 'deneme-bonusu-100',
      amount: 100,
      wager: 10,
      minDeposit: 0,
      imageUrl: '/logo.svg',
      ctaUrl: 'https://example.com/bonus/deneme-100',
      isActive: true,
    },
    {
      title: 'Yatırım Bonusu %50',
      slug: 'yatirim-bonusu-50',
      amount: 50,
      wager: 20,
      minDeposit: 100,
      imageUrl: '/logo.svg',
      ctaUrl: 'https://example.com/bonus/yatirim-50',
      isActive: true,
    },
  ]

  for (const b of bonuses) {
    await db.bonus.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    })
  }

  // Seed Partner Sites (using uploads for demo logos)
  const partnerSites = [
    {
      name: 'Bahis Sitesi A',
      slug: 'bahis-sitesi-a',
      logoUrl: '/uploads/1760208951833-pzirqb47aeb.png',
      rating: 4.5,
      siteUrl: 'https://example.com/a',
      isActive: true,
    },
    {
      name: 'Bahis Sitesi B',
      slug: 'bahis-sitesi-b',
      logoUrl: '/uploads/1760135736018-solzy5zc0ec.jpg',
      rating: 4.2,
      siteUrl: 'https://example.com/b',
      isActive: true,
    },
    {
      name: 'Demo Site A',
      slug: 'demo-site-a',
      logoUrl: '/uploads/1760142508155-tg82xw9iaxc.png',
      rating: 4.7,
      siteUrl: 'https://example.com/site-a',
      isActive: true,
    },
    {
      name: 'Demo Site B',
      slug: 'demo-site-b',
      logoUrl: '/uploads/1760144719047-o3nxw03qufr.jpg',
      rating: 4.3,
      siteUrl: 'https://example.com/site-b',
      isActive: true,
    },
    // Ek demo veriler (en az 4 sıra = 16+ öğe için)
    { name: 'Demo Site C', slug: 'demo-site-c', logoUrl: '/logo.svg', rating: 4.1, siteUrl: 'https://example.com/site-c', isActive: true },
    { name: 'Demo Site D', slug: 'demo-site-d', logoUrl: '/logo.svg', rating: 3.9, siteUrl: 'https://example.com/site-d', isActive: true },
    { name: 'Demo Site E', slug: 'demo-site-e', logoUrl: '/logo.svg', rating: 4.0, siteUrl: 'https://example.com/site-e', isActive: true },
    { name: 'Demo Site F', slug: 'demo-site-f', logoUrl: '/logo.svg', rating: 3.8, siteUrl: 'https://example.com/site-f', isActive: true },
    { name: 'Demo Site G', slug: 'demo-site-g', logoUrl: '/logo.svg', rating: 4.4, siteUrl: 'https://example.com/site-g', isActive: true },
    { name: 'Demo Site H', slug: 'demo-site-h', logoUrl: '/logo.svg', rating: 3.7, siteUrl: 'https://example.com/site-h', isActive: true },
    { name: 'Demo Site I', slug: 'demo-site-i', logoUrl: '/logo.svg', rating: 3.6, siteUrl: 'https://example.com/site-i', isActive: true },
    { name: 'Demo Site J', slug: 'demo-site-j', logoUrl: '/logo.svg', rating: 4.6, siteUrl: 'https://example.com/site-j', isActive: true },
    { name: 'Demo Site K', slug: 'demo-site-k', logoUrl: '/logo.svg', rating: 4.2, siteUrl: 'https://example.com/site-k', isActive: true },
    { name: 'Demo Site L', slug: 'demo-site-l', logoUrl: '/logo.svg', rating: 3.5, siteUrl: 'https://example.com/site-l', isActive: true },
    { name: 'Demo Site M', slug: 'demo-site-m', logoUrl: '/logo.svg', rating: 4.8, siteUrl: 'https://example.com/site-m', isActive: true },
    { name: 'Demo Site N', slug: 'demo-site-n', logoUrl: '/logo.svg', rating: 3.4, siteUrl: 'https://example.com/site-n', isActive: true },
  ]

  for (const s of partnerSites) {
    await db.partnerSite.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    })
  }

  // Seed Carousel Slides
  const slides = [
    {
      title: 'Demo Slide A',
      subtitle: 'Uploads görseli',
      imageUrl: '/uploads/1760137839229-yam6716sfc.jpg',
      ctaLabel: 'İncele',
      ctaUrl: '/anlasmali-siteler',
      order: 1,
      isActive: true,
    },
    {
      title: 'Demo Slide B',
      subtitle: 'Uploads görseli',
      imageUrl: '/uploads/1760137210476-smkahwqjnz.jpg',
      ctaLabel: 'Detay',
      ctaUrl: '/anlasmali-siteler',
      order: 2,
      isActive: true,
    },
    {
      title: 'Demo Slide C',
      subtitle: 'Uploads görseli',
      imageUrl: '/uploads/1760142508155-tg82xw9iaxc.png',
      ctaLabel: 'Gör',
      ctaUrl: '/anlasmali-siteler',
      order: 3,
      isActive: true,
    },
    {
      title: 'Demo Slide D',
      subtitle: 'Uploads görseli',
      imageUrl: '/uploads/1760144719047-o3nxw03qufr.jpg',
      ctaLabel: 'Keşfet',
      ctaUrl: '/anlasmali-siteler',
      order: 4,
      isActive: true,
    },
  ]

  for (const sl of slides) {
    await db.carouselSlide.upsert({
      where: { order: sl.order },
      update: sl,
      create: sl,
    })
  }

  // Seed Marquee Logos
  // Only 2 marquee logos as requested, using existing uploads
  const marqueeLogos = [
    {
      imageUrl: '/uploads/1760142508155-tg82xw9iaxc.png',
      href: 'https://example.com/demo-a',
      order: 1,
      isActive: true,
    },
    {
      imageUrl: '/uploads/1760144719047-o3nxw03qufr.jpg',
      href: 'https://example.com/demo-b',
      order: 2,
      isActive: true,
    },
  ]

  for (const m of marqueeLogos) {
    await db.marqueeLogo.upsert({
      where: { order: m.order },
      update: m,
      create: m,
    })
  }
}

main()
  .then(async () => {
    await db.$disconnect()
    console.log('Seed completed')
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })