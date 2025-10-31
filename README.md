## Ortam Değişkenleri

- `NEXT_PUBLIC_SITE_URL` prod ve staging ortamlarında `https://hokkabaz.bet` olarak ayarlanmalıdır.
- Bu repo `.env*` dosyalarını git dışında tutar. Deploy platformunuzda (Vercel, Docker, PM2, Systemd, vb.) env değişkenlerini ortam bazlı tanımlayın.
- Yerel geliştirme için `.env.local` ya da `.env.staging.local` kullanabilirsiniz (git tarafından ignore edilir).

Örnek dosya: `.env.example`

```
NEXT_PUBLIC_SITE_URL=https://hokkabaz.bet
# DATABASE_URL (opsiyonel, üretim ortamında set edilmeli)
# DATABASE_URL="file:./prisma/db/custom.db"
```

## SEO Domain Migrasyonu

SEO ayarları DB’de kayıtlıysa (canonical, OG URL’leri) eski `hokkabaz.net` içeren kayıtlar güncellenmelidir. Bunun için bir script ekleyeceğiz ve aşağıda komut verilecektir.

### Çalıştırma

1. Ortama `DATABASE_URL` tanımlayın (prod/staging DB’yi işaret etmelidir).
2. Komut: `npm run seo:replace-domain`
3. Çalışma sonrası konsoldaki özetten kaç kaydın güncellendiğini doğrulayın.

## CDN/DNS/SSL Kontrol Listesi

- DNS A/AAAA ve/veya CNAME kayıtları `hokkabaz.bet` için doğru hedefe işaret eder.
- CDN (ör. Cloudflare) üzerinde `hokkabaz.bet` hostu eklenmiş ve aktif.
- SSL sertifikası `hokkabaz.bet` ve alt yolları kapsar; sertifika geçerli ve otomatik yenileme açık.
- Gerekli 301 yönlendirmeler eski domaine (hokkabaz.net) gelen istekleri `https://hokkabaz.bet`’e taşır.
- `robots.txt` ve `sitemap.xml` yeni domaini gösterir (bu repoda güncellendi).