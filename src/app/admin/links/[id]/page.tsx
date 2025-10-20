/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'

import { headers } from 'next/headers'

async function getDetail(slug: string) {
  const headerList = await headers()
  const host = headerList.get('host') || '0.0.0.0:3000'
  const protocol = host.includes('localhost') || host.includes('0.0.0.0') ? 'http' : 'https'
  const base = `${protocol}://${host}`
  const res = await fetch(`${base}/api/affiliate-links/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function LinkDetailPage({ params }: { params: { id: string } }) {
  // Prisma Client üzerinde model delegesi type hatası için kısmi type bypass uygulanıyor.
  const link = await (db as any).affiliateLink.findUnique({ where: { id: params.id } })
  if (!link) return <div className="p-6">Link bulunamadı</div>

  const detail = await getDetail(link.slug)
  const series = detail?.seriesDaily ?? []
  const last50 = detail?.last50 ?? []
  const countryCounts = (detail?.countryCounts ?? {}) as Record<string, number>

  const countryList = Object.entries(countryCounts).map(([country, count]) => ({ country, count }))

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{link.title}</h1>
          <div className="text-sm text-muted-foreground">Kısa Linkler: <Link href={`/${link.slug}`} className="text-primary">/{link.slug}</Link> • <Link href={`/out/${link.slug}`} className="text-primary">/out/{link.slug}</Link></div>
          <div className="text-sm text-muted-foreground">Gerçek URL: <a href={link.targetUrl} className="text-primary" target="_blank" rel="noreferrer">{link.targetUrl}</a></div>
        </div>
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4">
          <div className="text-sm text-muted-foreground">Toplam Tıklama</div>
          <div className="text-2xl font-bold">{link.clicks}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 lg:col-span-2">
          <h2 className="font-semibold mb-2">Günlük Tıklama (Son 30 Gün)</h2>
          <ClientLine data={series} />
        </div>
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Ülke Bazlı İstatistik</h2>
          <ClientPie data={countryList} />
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4">
        <h2 className="font-semibold mb-2">Son 50 Tıklama</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-4">Ülke</th>
                <th className="py-2 pr-4">Tarih</th>
                <th className="py-2 pr-4">User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {last50.map((c: any) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-2 pr-4">{c.country || 'Unknown'}</td>
                  <td className="py-2 pr-4">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{c.userAgent || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import ClientLine from '../components/ClientLine'
import ClientPie from '../components/ClientPie'