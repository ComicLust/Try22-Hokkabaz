"use client"

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const pages: { slug: string; label: string }[] = [
  { slug: 'kampanyalar', label: 'Kampanyalar' },
  { slug: 'bonuslar', label: 'Bonuslar' },
  { slug: 'yorumlar', label: 'Yorumlar' },
  { slug: 'anlasmali-siteler', label: 'Güvenilir Siteler' },
  { slug: 'banko-kuponlar', label: 'Banko Kuponlar' },
  { slug: 'canli-mac-izle', label: 'Canlı Maç İzle' },
  { slug: 'vpn-onerileri', label: 'VPN Önerileri' },
  { slug: 'guvenilir-telegram', label: 'Telegram Grupları' },
]

export default function AdminPageArticles() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sayfa Makaleleri</h1>
      <p className="text-muted-foreground">Her sayfa için SEO makalesini düzenleyin. Tek bir makale kaydı tutulur.</p>
      <Card>
        <CardHeader>
          <CardTitle>Sayfalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pages.map(p => (
              <div key={p.slug} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </div>
                <Link href={`/admin/page-articles/${p.slug}`}>
                  <Button variant="outline" size="sm">Düzenle</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}