/* eslint-disable */
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  // Seed Campaigns
  const campaigns = [
    {
      title: '500₺ Deneme Bonusu Kampanyası',
      slug: '500-deneme-kampanyasi',
      description: 'Yeni üyelere özel 500₺ deneme fırsatı. Kısıtlı süre! ',
      imageUrl: '/uploads/1760656700909-auw44u2mw35.png',
      ctaUrl: 'https://example.com/campaign/500-deneme',
      badgeLabel: 'Öne Çıkan',
      bonusText: '500₺ Deneme',
      bonusAmount: 500,
      tags: ['casino', 'deneme', 'yeni-uye'],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: true,
      priority: 100,
    },
    {
      title: 'Haftalık %50 Yatırım Bonusu',
      slug: 'haftalik-yatirim-50',
      description: 'Haftada bir, %50 yatırım bonusu ile oyun keyfi.',
      imageUrl: '/uploads/1760656614908-uy6y73mv21n.png',
      ctaUrl: 'https://example.com/campaign/yatirim-50',
      badgeLabel: 'Haftalık',
      bonusText: '%50',
      bonusAmount: 50,
      tags: ['casino', 'slot', 'yatirim'],
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: true,
      priority: 90,
    },
    {
      title: 'Free Spin Festivali (100 FS)',
      slug: 'free-spin-festivali-100fs',
      description: 'Popüler slotlarda toplam 100 ücretsiz dönüş.',
      imageUrl: '/uploads/1760732946995-ueaubihif6i.png',
      ctaUrl: 'https://example.com/campaign/free-spin-100',
      badgeLabel: 'Free Spin',
      bonusText: '100 FS',
      bonusAmount: 100,
      tags: ['slot', 'free-spin'],
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: false,
      priority: 60,
    },
    {
      title: 'Çoklu Kupon Boost +20%',
      slug: 'coklu-kupon-boost-20',
      description: 'Birden fazla maç seçeneğinde kazanç artırma.',
      imageUrl: '/uploads/1760732951329-fzch33159aq.jpg',
      ctaUrl: 'https://example.com/campaign/kupon-boost-20',
      badgeLabel: 'Spor',
      bonusText: '+20%',
      bonusAmount: 20,
      tags: ['spor', 'kupon', 'boost'],
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: false,
      priority: 40,
    },
    {
      title: 'VIP Cashback %10',
      slug: 'vip-cashback-10',
      description: 'VIP üyeler için haftalık %10 kayıp iadesi.',
      imageUrl: '/uploads/1760657878298-1e9xw9zce0j.png',
      ctaUrl: 'https://example.com/campaign/vip-cashback',
      badgeLabel: 'VIP',
      bonusText: '%10 Cashback',
      bonusAmount: 10,
      tags: ['vip', 'cashback', 'casino'],
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: true,
      priority: 70,
    },
    {
      title: 'E-Spor Kombine %15',
      slug: 'espor-kombine-15',
      description: 'E-spor maçlarında kombine kuponlara ekstra %15.',
      imageUrl: '/uploads/1760742348493-0kyvvulnmrb.png',
      ctaUrl: 'https://example.com/campaign/espor-15',
      badgeLabel: 'E-Spor',
      bonusText: '%15',
      bonusAmount: 15,
      tags: ['espor', 'spor', 'kombine'],
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      isActive: true,
      isFeatured: false,
      priority: 50,
    },
  ]

  for (const c of campaigns) {
    await db.campaign.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    })
  }

  // Seed Bonuses (çeşitli türler)
  const bonuses = [
    {
      title: 'Deneme Bonusu 250₺',
      slug: 'deneme-bonusu-250',
      description: 'Yeni üyeler için anında 250₺ deneme bakiyesi.',
      shortDescription: 'Hızlı kayıt, anında deneme.',
      bonusType: 'Deneme Bonusu',
      gameCategory: 'Casino',
      amount: 250,
      wager: 10,
      minDeposit: 0,
      imageUrl: '/uploads/1760212397380-xoz99gl4hc.png',
      postImageUrl: '/uploads/1760212175979-dn3km72cte.png',
      ctaUrl: 'https://example.com/bonus/deneme-250',
      badges: ['hot', 'trusted'],
      validityText: 'Sadece yeni üyeler için, 7 gün geçerli',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      features: ['Hızlı onay', 'Çevrim 10x', 'Kayıt gerek'],
      isActive: true,
      isFeatured: true,
      priority: 90,
    },
    {
      title: 'Yatırım Bonusu %50 (Casino)',
      slug: 'yatirim-bonusu-50-casino',
      description: 'İlk yatırımlara %50 casino bonusu.',
      shortDescription: '%50 ek bakiye',
      bonusType: 'Yatırım Bonusu',
      gameCategory: 'Casino',
      amount: 50,
      wager: 20,
      minDeposit: 100,
      imageUrl: '/uploads/1760211654940-0xb5dpe5rrd.png',
      postImageUrl: '/uploads/1760211759502-y8g6mkbzvv.png',
      ctaUrl: 'https://example.com/bonus/yatirim-50-casino',
      badges: ['popular'],
      validityText: 'Aylık kampanya',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      features: ['Çevrim 20x', 'Slot oyunları'],
      isActive: true,
      isFeatured: true,
      priority: 85,
    },
    {
      title: 'Kayıp Bonusu %20 (Spor)',
      slug: 'kayip-bonusu-20-spor',
      description: 'Spor bahislerinde net kayıplara %20 iade.',
      shortDescription: 'Haftalık iade',
      bonusType: 'Kayıp Bonusu',
      gameCategory: 'Spor',
      amount: 20,
      wager: 1,
      minDeposit: 0,
      imageUrl: '/uploads/1760212277297-juwby60iph.png',
      ctaUrl: 'https://example.com/bonus/kayip-20-spor',
      badges: ['cashback'],
      validityText: 'Her hafta, Pazartesi hesaplanır',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      features: ['Net kayıp üzerinden', 'Kupon şartı yok'],
      isActive: true,
      isFeatured: false,
      priority: 70,
    },
    {
      title: 'Free Spin 100 (Slot)',
      slug: 'free-spin-100-slot',
      description: 'Seçili slotlarda toplam 100 ücretsiz dönüş.',
      shortDescription: 'Favori slotlarda 100FS',
      bonusType: 'Free Spin',
      gameCategory: 'Slot',
      amount: 100,
      wager: 15,
      minDeposit: 50,
      imageUrl: '/uploads/1760210302787-8fa0zlzharm.png',
      ctaUrl: 'https://example.com/bonus/free-spin-100',
      badges: ['new'],
      validityText: 'Hafta sonu geçerli',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      features: ['Seçili sağlayıcılar', 'Max cashout 2000₺'],
      isActive: true,
      isFeatured: false,
      priority: 60,
    },
    {
      title: 'Arkadaşını Getir 75₺',
      slug: 'arkadasini-getir-75',
      description: 'Davet ettiğin her arkadaş için 75₺ bonus.',
      shortDescription: 'Davet başına 75₺',
      bonusType: 'Referans Bonusu',
      gameCategory: 'Genel',
      amount: 75,
      wager: 5,
      minDeposit: 0,
      imageUrl: '/uploads/1760211895454-jf77bj6zf4a.png',
      ctaUrl: 'https://example.com/bonus/arkadas-75',
      badges: ['social'],
      validityText: 'Sınırsız davet',
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      features: ['Davet linki', 'Kimlik doğrulama'],
      isActive: true,
      isFeatured: false,
      priority: 55,
    },
    {
      title: 'VIP Bonus - Canlı Casino %25',
      slug: 'vip-bonus-canli-casino-25',
      description: 'VIP üyeler için canlı casinoda %25 ek bakiye.',
      shortDescription: 'VIP özel kampanya',
      bonusType: 'VIP Bonusu',
      gameCategory: 'Canlı Casino',
      amount: 25,
      wager: 20,
      minDeposit: 250,
      imageUrl: '/uploads/1760656011696-z8h4vt5aetc.png',
      postImageUrl: '/uploads/1760656077922-1izqxopgu4m.png',
      ctaUrl: 'https://example.com/bonus/vip-25-live',
      badges: ['vip'],
      validityText: 'VIP üyelik gerekli',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      features: ['Canlı masalar', 'Çevrim 20x'],
      isActive: true,
      isFeatured: true,
      priority: 80,
    },
    {
      title: 'Doğum Günü Bonusu 200₺',
      slug: 'dogum-gunu-bonusu-200',
      description: 'Doğum gününde 200₺ hediye!',
      shortDescription: 'Özel gün kampanyası',
      bonusType: 'Özel Gün Bonusu',
      gameCategory: 'Genel',
      amount: 200,
      wager: 5,
      minDeposit: 0,
      imageUrl: '/uploads/1760732983846-ukbov7xncfk.jpg',
      ctaUrl: 'https://example.com/bonus/dogum-200',
      badges: ['gift'],
      validityText: 'Kimlik doğrulama sonrası',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      features: ['Doğru tarih', 'Tek sefer'],
      isActive: true,
      isFeatured: false,
      priority: 50,
    },
    {
      title: 'Crypto Yatırım Bonusu %30',
      slug: 'crypto-yatirim-bonusu-30',
      description: 'Kripto ile yapılan yatırımlara %30 ek bonus.',
      shortDescription: '%30 crypto bonus',
      bonusType: 'Yatırım Bonusu',
      gameCategory: 'Casino',
      amount: 30,
      wager: 25,
      minDeposit: 200,
      imageUrl: '/logo.svg',
      postImageUrl: '/logo.svg',
      ctaUrl: 'https://example.com/bonus/crypto-30',
      badges: ['crypto','popular'],
      validityText: 'Sadece kripto yatırımlarında geçerli',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      features: ['BTC/USDT destekli', 'Çevrim 25x'],
      isActive: true,
      isFeatured: true,
      priority: 75,
    },
    {
      title: 'Blackjack Cashback %12',
      slug: 'blackjack-cashback-12',
      description: 'Blackjack masalarında haftalık %12 kayıp iadesi.',
      shortDescription: 'Haftalık %12 cashback',
      bonusType: 'Kayıp Bonusu',
      gameCategory: 'Canlı Casino',
      amount: 12,
      wager: 1,
      minDeposit: 0,
      imageUrl: '/logo.svg',
      ctaUrl: 'https://example.com/bonus/blackjack-cashback-12',
      badges: ['cashback','live'],
      validityText: 'Her Pazar hesaplanır',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      features: ['Canlı blackjack masaları', 'Net kayıp üzerinden'],
      isActive: true,
      isFeatured: false,
      priority: 65,
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

  // Seed Telegram Groups (5 önerilen)
  const telegramGroups = [
    { name: 'Bahis Strateji Topluluğu', ctaUrl: 'https://t.me/bahis_strateji', type: 'GROUP', isFeatured: true, members: 3250, membersText: '3.2k+ üye', imageUrl: '/logo.svg', badges: ['önerilen','güvenilir'] },
    { name: 'Canlı Maç Sohbeti', ctaUrl: 'https://t.me/canli_mac_sohbet', type: 'GROUP', isFeatured: true, members: 4820, membersText: '4.8k+ üye', imageUrl: '/logo.svg', badges: ['aktif','sohbet'] },
    { name: 'Kupon Paylaşım Kulübü', ctaUrl: 'https://t.me/kupon_kulubu', type: 'GROUP', isFeatured: true, members: 6120, membersText: '6.1k+ üye', imageUrl: '/logo.svg', badges: ['topluluk','paylaşım'] },
    { name: 'Casino Deneyimleri', ctaUrl: 'https://t.me/casino_deneyim', type: 'GROUP', isFeatured: true, members: 2750, membersText: '2.7k+ üye', imageUrl: '/logo.svg', badges: ['casino','deneyim'] },
    { name: 'Bonus ve Fırsatlar', ctaUrl: 'https://t.me/bonus_firsatlar', type: 'GROUP', isFeatured: true, members: 5390, membersText: '5.3k+ üye', imageUrl: '/logo.svg', badges: ['bonus','kampanya'] },
  ]
  for (const g of telegramGroups) {
    const existing = await db.telegramGroup.findFirst({ where: { ctaUrl: g.ctaUrl } })
    if (existing) {
      await db.telegramGroup.update({ where: { id: existing.id }, data: g })
    } else {
      await db.telegramGroup.create({ data: g })
    }
  }

  // Seed Review Brands (6 marka)
  const reviewBrands = [
    { name: 'Betewin', slug: 'betewin', logoUrl: '/logo.svg', siteUrl: 'https://example.com/betewin', editorialSummary: 'Geniş oyun yelpazesi ve hızlı ödemeler.' },
    { name: 'Dopingbet', slug: 'dopingbet', logoUrl: '/logo.svg', siteUrl: 'https://example.com/dopingbet', editorialSummary: 'Spor bahisleri ve canlı maç deneyimi odaklı.' },
    { name: 'Restbet', slug: 'restbet', logoUrl: '/logo.svg', siteUrl: 'https://example.com/restbet', editorialSummary: 'Kampanyalar güçlü, müşteri desteği hızlı.' },
    { name: 'Superbahis', slug: 'superbahis', logoUrl: '/logo.svg', siteUrl: 'https://example.com/superbahis', editorialSummary: 'Yüksek oranlar, düzenli promosyonlar.' },
    { name: 'Casinowin', slug: 'casinowin', logoUrl: '/logo.svg', siteUrl: 'https://example.com/casinowin', editorialSummary: 'Slot ve masa oyunlarında geniş içerik.' },
    { name: 'Fortunabet', slug: 'fortunabet', logoUrl: '/logo.svg', siteUrl: 'https://example.com/fortunabet', editorialSummary: 'Yeni kullanıcıya uygun, anlaşılır arayüz.' },
  ]
  for (const b of reviewBrands) {
    await db.reviewBrand.upsert({ where: { slug: b.slug }, update: b, create: b })
  }

  // Seed Site Reviews (her markaya 5-20 yorum)
  const reviewTextsPositive = [
    'Ödemeler hızlı geldi, canlı destek de ilgiliydi.',
    'Oranlar iyi, mobilde akıcı çalışıyor.',
    'Bonus şartları makul, çekim sorunsuzdu.',
    'Casino oyun çeşitliliği tatmin edici.',
    'Kampanyalar düzenli, memnun kaldım.'
  ]
  const reviewTextsNegative = [
    'Çekim süresi beklediğimden uzun sürdü.',
    'Canlı destek yoğun saatlerde yavaş.',
    'Bazı slotlarda donma yaşadım.',
    'Bonus çevrim şartları biraz zorlayıcı.',
    'Arayüz yer yer karışık.'
  ]
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)] }

  for (const brand of reviewBrands) {
    const dbBrand = await db.reviewBrand.findUnique({ where: { slug: brand.slug } })
    if (!dbBrand) continue
    const existingCount = await db.siteReview.count({ where: { brandId: dbBrand.id } })
    const target = Math.floor(Math.random() * 16) + 5 // 5-20 arası
    const toCreate = Math.max(0, target - existingCount)
    for (let i = 0; i < toCreate; i++) {
      const isPositive = Math.random() < 0.7
      await db.siteReview.create({
        data: {
          brandId: dbBrand.id,
          author: isPositive ? 'Anonim' : 'Ziyaretçi',
          isAnonymous: true,
          rating: isPositive ? 4 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2),
          isPositive,
          content: isPositive ? pickOne(reviewTextsPositive) : pickOne(reviewTextsNegative),
          isApproved: true,
        },
      })
    }
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