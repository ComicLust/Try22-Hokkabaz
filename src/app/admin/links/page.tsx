/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import Link from 'next/link'
import { Link2, TrendingUp, BarChart2, Star } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

import { headers } from 'next/headers'

async function getData() {
  const headerList = await headers()
  const host = headerList.get('host') || '0.0.0.0:3000'
  const protocol = host.includes('localhost') || host.includes('0.0.0.0') ? 'http' : 'https'
  const base = `${protocol}://${host}`
  const res = await fetch(`${base}/api/affiliate-links`, { cache: 'no-store' })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export default async function LinksDashboardPage() {
  const data = await getData()
  const stats = data ? {
    totalLinks: data.totalLinks ?? 0,
    totalClicks: data.totalClicks ?? 0,
    todayClicks: data.todayClicks ?? 0,
    weekClicks: data.weekClicks ?? 0,
    monthClicks: data.monthClicks ?? 0,
    yearClicks: data.yearClicks ?? 0,
    seriesDaily: data.seriesDaily ?? [],
    topLinks: data.topLinks ?? [],
    recentLinks: data.recentLinks ?? [],
  } : {
    totalLinks: 0,
    totalClicks: 0,
    todayClicks: 0,
    weekClicks: 0,
    monthClicks: 0,
    yearClicks: 0,
    seriesDaily: [],
    topLinks: [],
    recentLinks: [],
  }

  const links = data?.links ?? []
  const manualLinks = links.filter((l: any) => l.isManual)
  const autoLinks = links.filter((l: any) => !l.isManual)

  return (
    <div className="min-h-screen p-6 space-y-6 bg-background text-foreground">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2"><Link2 className="w-4 h-4" /> Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <CreateLinkButton />
          <ResetStatsButton />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Toplam Link" value={stats.totalLinks} icon={<Link2 className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Toplam Tıklama" value={stats.totalClicks} icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Bugünkü" value={stats.todayClicks} icon={<BarChart2 className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Bu Hafta" value={stats.weekClicks} icon={<BarChart2 className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Bu Ay" value={stats.monthClicks} icon={<BarChart2 className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Bu Yıl" value={stats.yearClicks} icon={<BarChart2 className="w-4 h-4 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Zaman Bazlı Grafik (Son 30 Gün)</CardTitle></CardHeader>
          <CardContent>
            <ClientChart series={stats.seriesDaily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4" /> En Çok Tıklananlar</CardTitle></CardHeader>
          <CardContent>
            <TableList items={stats.topLinks} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" /> Manuel Linkler</CardTitle></CardHeader>
        <CardContent>
          <TableList items={manualLinks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" /> Otomatik Linkler</CardTitle></CardHeader>
        <CardContent>
          <TableList items={autoLinks} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-sm text-muted-foreground flex items-center gap-2">{icon}{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function TableList({ items }: { items: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Başlık</TableHead>
          <TableHead>Kısa Linkler</TableHead>
          <TableHead>Tıklama</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Oluşturma</TableHead>
          <TableHead>İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items?.map((l) => (
          <TableRow key={l.id}>
            <TableCell>
              <Link className="text-primary font-medium" href={`/admin/links/${l.id}`}>{l.title}</Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Link prefetch={false} className="text-muted-foreground" href={`/${l.slug}`}>/{l.slug}</Link>
                <span className="text-muted-foreground hidden sm:inline">•</span>
                <Link prefetch={false} className="text-muted-foreground" href={`/out/${l.slug}`}>/out/{l.slug}</Link>
              </div>
            </TableCell>
            <TableCell>{l.clicks}</TableCell>
            <TableCell>
              <Badge variant={l.isManual ? 'default' : 'outline'}>{l.isManual ? 'Manuel' : 'Otomatik'}</Badge>
            </TableCell>
            <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
            <TableCell><RowActions id={l.id} slug={l.slug} isManual={l.isManual} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

import ClientChart from './components/ClientChart'
import CreateLinkButton from './components/CreateLinkButton'
import ResetStatsButton from './components/ResetStatsButton'
import RowActions from './components/RowActions'