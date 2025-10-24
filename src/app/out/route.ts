import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

async function lookupCountry(ip: string | null): Promise<string | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.success === false) return null
    return data?.country || null
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const accept = req.headers.get('accept') || ''
  const wantsHTML = accept.includes('text/html')
  if (wantsHTML) {
    return new Response(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔒 Hokkabaz Aracılığıyla Yönlendiriliyorsunuz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Inter, Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0A0A0A;
      color: #FFFFFF;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 16px;
    }
    .card {
      width: 100%; max-width: 560px;
      background: #121212;
      border: 1px solid #1E1E1E;
      border-radius: 16px; padding: 28px;
      box-shadow: 0 12px 24px rgba(0,0,0,0.35);
    }
    .row { display: flex; align-items: center; gap: 12px; }
    .badge {
      height: 40px; width: 40px; border-radius: 9999px;
      display: flex; align-items: center; justify-content: center;
      background: #1E1E1E; color: #FFD600; font-size: 22px;
    }
    h1 { font-weight: 600; font-size: 20px; }
    @media (min-width:640px){ h1{ font-size: 22px; } }
    .subtitle { margin-top: 16px; color: #e5e5e5; font-size: 15px; }
    .small { margin-top: 8px; color: #9CA3AF; font-size: 12px; }
    .domain { margin-top: 16px; display: none; }
    .domain .label { color:#9CA3AF; font-size:12px; margin-bottom:4px; }
    .domain .value { color:#FFD600; font-weight:600; font-size:14px; }
    .progress { margin-top: 20px; height: 4px; background: #1E1E1E; border-radius: 4px; overflow: hidden; }
    .progress .fill { height: 100%; width: 0%; background: #FFD600; animation: fill 3s ease-out forwards; }
    @keyframes fill { 0% { width: 0% } 100% { width: 100% } }
    .footer { margin-top: 16px; display:flex; align-items:center; justify-content: space-between; }
    .logo { opacity: .85; }
  </style>
</head>
<body>
  <div class="card">
    <div class="row">
      <div class="badge">🔒</div>
      <h1>Hokkabaz Aracılığıyla Yönlendiriliyorsunuz</h1>
    </div>
    <p class="subtitle" id="subtitle">Hızlıca link güvenliği kontrol ediliyor…</p>
    <div class="domain" id="domain">
      <div class="label">Şu domaine yönlendirileceksiniz</div>
      <div class="value" id="domainName"></div>
    </div>
    <div class="progress"><div class="fill"></div></div>
    <div class="footer">
      <p class="small">Lütfen bekleyin, güvenliğiniz için kontrol ediliyor.</p>
      <img class="logo" src="/logo.svg" alt="Hokkabaz" height="18" />
    </div>
  </div>
  <script>
    (function(){
      const subtitle = document.getElementById('subtitle')
      const domainWrap = document.getElementById('domain')
      const domainName = document.getElementById('domainName')
      const url = new URL(location.href)
      const u = url.searchParams.get('u') || url.searchParams.get('url')
      setTimeout(() => { if(subtitle) subtitle.textContent = 'Güncel link adresi bulunuyor…' }, 1000)
      setTimeout(() => {
        try {
          if (u) {
            const h = new URL(u).hostname
            domainName.textContent = h
            domainWrap.style.display = 'block'
          }
        } catch(e) {
          if (u) {
            domainName.textContent = u
            domainWrap.style.display = 'block'
          }
        }
      }, 800)
      setTimeout(() => {
        fetch('/api/redirect?u='+encodeURIComponent(u || ''))
          .then(r => r.json())
          .then(data => {
            if (data?.targetUrl) location.href = data.targetUrl
          })
          .catch(() => { if(subtitle) subtitle.textContent = 'Yönlendirme hazırlanırken hata oluştu.' })
      }, 3000)
    })()
  </script>
</body>
</html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  // HTML istemeyen çağrılarda mevcut davranış (sunucu tarafı 302 ve loglama) korunur
  try {
    const { searchParams } = new URL(req.url)
    const u = searchParams.get('u') || searchParams.get('url')
    if (!u) return NextResponse.json({ error: 'url parametresi gerekli' }, { status: 400 })

    let target: URL
    try {
      target = new URL(u)
    } catch {
      return NextResponse.json({ error: 'Geçersiz URL' }, { status: 400 })
    }
    if (!(target.protocol === 'http:' || target.protocol === 'https:')) {
      return NextResponse.json({ error: 'Yalnızca http/https desteklenir' }, { status: 400 })
    }

    // Var olan kaydı hedef URL üzerinden bul
    let link = await db.affiliateLink.findFirst({ where: { targetUrl: u } })
    if (!link) {
      const base = (target.hostname+'-'+target.pathname).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
      let slug = base || 'link'
      let counter = 1
      while (counter < 50) {
        const exists = await db.affiliateLink.findUnique({ where: { slug } })
        if (!exists) break
        slug = `${base}-${counter++}`
      }
      link = await db.affiliateLink.create({ data: { title: target.hostname, slug, targetUrl: u, isManual: false } })
    }

    const fwd = req.headers.get('x-forwarded-for') || ''
    const ipHeader = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null
    const ip = (ipHeader || 'unknown')
    const userAgent = req.headers.get('user-agent') || null
    const country = await lookupCountry(ipHeader)

    // 24 saatlik tekillik penceresi
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Tekil IP kontrolü: aynı IP 24 saat içinde bu linke tıkladıysa clicks artmasın
    const existing = await db.affiliateClick.findFirst({ where: { linkId: link.id, ip, createdAt: { gte: since } } })

    const ops: any[] = [
      db.affiliateClick.create({
        data: {
          linkId: link.id,
          ip: ip || undefined,
          country: country || undefined,
          userAgent: userAgent || undefined,
        },
      }),
    ]
    if (!existing) {
      ops.push(
        db.affiliateLink.update({
          where: { id: link.id },
          data: { clicks: { increment: 1 } },
        })
      )
    }

    await db.$transaction(ops)

    return NextResponse.redirect(new URL(link.targetUrl, req.url), { status: 302 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Redirect error' }, { status: 500 })
  }
}