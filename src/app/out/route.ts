import { NextResponse } from 'next/server'
import { db } from '@/lib/db'


function slugify(input: string) {
  return (input || '')
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64)
}

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

function getIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || ''
  return ip || 'unknown'
}

export async function GET(req: Request) {
  const accept = req.headers.get('accept') || ''
  const wantsHTML = accept.includes('text/html')
  if (wantsHTML) {
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Güvenli Yönlendirme - Hokkabaz</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
      background-size: 400% 400%;
      animation: gradientShift 8s ease infinite;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #ffffff;
      overflow: hidden;
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: patternMove 20s linear infinite;
    }
    
    @keyframes patternMove {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }
    
    .container {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 3rem 2rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      max-width: 480px;
      width: 90%;
      transform: translateY(0);
      animation: containerFloat 3s ease-in-out infinite alternate;
    }
    
    @keyframes containerFloat {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-10px); }
    }
    
    .logo-container {
      margin-bottom: 2rem;
      position: relative;
    }
    
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .logo::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: logoShine 2s ease-in-out infinite;
    }
    
    @keyframes logoShine {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    
    .logo-text {
      font-size: 2.5rem;
      font-weight: bold;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 2;
      position: relative;
    }
    
    .shield-icon {
      position: absolute;
      top: -5px;
      right: -5px;
      width: 30px;
      height: 30px;
      background: #FFD700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
      animation: shieldPulse 2s ease-in-out infinite;
    }
    
    @keyframes shieldPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    h1 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      font-weight: 700;
      line-height: 1.3;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      background: linear-gradient(135deg, #ffffff, #e8f4fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2.5rem;
      line-height: 1.5;
      font-weight: 500;
    }
    
    .domain-info {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: none;
    }
    
    .domain-label {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 0.5rem;
    }
    
    .domain-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: #FFD700;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #FFD700;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-dots {
      display: flex;
      gap: 4px;
    }
    
    .loading-dot {
      width: 8px;
      height: 8px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 50%;
      animation: dotPulse 1.4s ease-in-out infinite both;
    }
    
    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }
    .loading-dot:nth-child(3) { animation-delay: 0s; }
    
    @keyframes dotPulse {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.2); opacity: 1; }
    }
    
    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin-top: 2rem;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #FFD700, #FFA500);
      border-radius: 2px;
      width: 0%;
      animation: progressFill 2s ease-out forwards;
    }
    
    @keyframes progressFill {
      0% { width: 0%; }
      100% { width: 100%; }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 2rem 1.5rem;
        margin: 1rem;
      }
      
      h1 {
        font-size: 1.5rem;
      }
      
      .logo {
        width: 80px;
        height: 80px;
      }
      
      .logo-text {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="background-pattern"></div>
  <div class="container">
    <div class="logo-container">
      <div class="logo">
        <div class="logo-text">H</div>
      </div>
      <div class="shield-icon">🛡️</div>
    </div>
    
    <h1>🔒 Güvenli Yönlendirme</h1>
    <div class="subtitle" id="subtitle">Güncel link adresi kontrol ediliyor...</div>
    
    <div class="domain-info" id="domainInfo">
      <div class="domain-label">Yönlendirilecek site:</div>
      <div class="domain-name" id="domainName"></div>
    </div>
    
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>
  
  <script>
    (function(){
      const params = new URLSearchParams(location.search)
      const u = params.get('u') || params.get('url')
      const sub = document.getElementById('subtitle')
      
      // Extract domain from URL
      function extractDomain(url) {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname;
        } catch (e) {
          return url;
        }
      }
      
      // Show domain info after 500ms
      setTimeout(() => {
        if (u) {
          const domain = extractDomain(u);
          document.getElementById('domainName').textContent = domain;
          document.getElementById('domainInfo').style.display = 'block';
          if (sub) sub.textContent = 'Bağlantı güvenliği doğrulanıyor...';
        }
      }, 500);
      
      setTimeout(() => { if (sub) sub.textContent = 'Güvenli bağlantı kuruldu, yönlendiriliyor...' }, 1500)
      if (!u) return
      
      setTimeout(() => {
        fetch('/api/redirect?'+new URLSearchParams({ u })).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data && data.error || 'Yönlendirme hatası')
          setTimeout(() => { location.href = data.targetUrl }, 500)
        }).catch((e) => {
          if (sub) sub.textContent = (e && e.message) || 'Yönlendirme hazırlanırken hata oluştu.'
        })
      }, 2000)
    })()
  </script>
</body>
</html>`
    return new Response(`
          <!DOCTYPE html>
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
              function extractDomain(url){ try{ return new URL(url).hostname } catch(e){ return url } }
              const params = new URLSearchParams(location.search)
              const u = params.get('u') || params.get('url')
              const subtitle = document.getElementById('subtitle')
              const domainWrap = document.getElementById('domain')
              const domainName = document.getElementById('domainName')
              setTimeout(() => { if(subtitle) subtitle.textContent = 'Güncel link adresi bulunuyor…' }, 1000)
              setTimeout(() => {
                if (u && domainWrap && domainName) {
                  domainName.textContent = extractDomain(u)
                  domainWrap.style.display = 'block'
                }
              }, 800)
              setTimeout(async () => {
                if (!u) return;
                try {
                  const res = await fetch('/api/redirect?'+new URLSearchParams({ u }))
                  const data = await res.json();
                  if (!res.ok) throw new Error(data && data.error || 'Yönlendirme hatası')
                  location.href = data.targetUrl
                } catch(e){
                  if(subtitle) subtitle.textContent = (e && e.message) || 'Yönlendirme hazırlanırken hata oluştu.'
                }
              }, 3000)
            </script>
          </body>
          </html>
        `, { headers: { 'content-type': 'text/html; charset=utf-8' } })
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
      const base = slugify(`${target.hostname}-${target.pathname}`) || slugify(target.hostname)
      let slug = base || 'link'
      let counter = 1
      while (counter < 50) {
        const exists = await db.affiliateLink.findUnique({ where: { slug } })
        if (!exists) break
        slug = `${base}-${counter++}`
      }
      link = await db.affiliateLink.create({ data: { title: target.hostname, slug, targetUrl: u, isManual: false } })
    }

    const ipHeader = getIp(req)
    const ip = ipHeader || 'unknown'
    const userAgent = req.headers.get('user-agent') || null
    const country = await lookupCountry(ipHeader === 'unknown' ? null : ipHeader)

    // 24 saatlik tekillik penceresi
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Tekil IP kontrolü: aynı IP 24 saat içinde bu linke tıkladıysa clicks artmasın
    const existing = await db.affiliateClick.findFirst({ where: { linkId: link.id, ip, createdAt: { gte: since } } })

    const ops: import('@prisma/client').Prisma.PrismaPromise<unknown>[] = [
      db.affiliateClick.create({
        data: { linkId: link.id, ip: ip || undefined, country: country || undefined, userAgent: userAgent || undefined },
      }),
    ]
    if (!existing) {
      ops.push(db.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } }))
    }

    await db.$transaction(ops)

    return NextResponse.redirect(u, { status: 302 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Redirect error' }, { status: 500 })
  }
}