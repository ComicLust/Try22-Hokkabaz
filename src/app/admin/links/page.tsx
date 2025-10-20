/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import Link from 'next/link'

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

  return (
    <div className="min-h-screen p-6 space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Links</h1>
        <CreateLinkButton />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Toplam Link" value={stats.totalLinks} />
        <StatCard title="Toplam Tıklama" value={stats.totalClicks} />
        <StatCard title="Bugünkü" value={stats.todayClicks} />
        <StatCard title="Bu Hafta" value={stats.weekClicks} />
        <StatCard title="Bu Ay" value={stats.monthClicks} />
        <StatCard title="Bu Yıl" value={stats.yearClicks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 lg:col-span-2">
          <h2 className="font-semibold mb-2">Zaman Bazlı Grafik (Son 30 Gün)</h2>
          <ClientChart series={stats.seriesDaily} />
        </div>
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">En Çok Tıklananlar</h2>
          <TableList items={stats.topLinks} />
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4">
        <h2 className="font-semibold mb-2">Son Eklenenler</h2>
        <TableList items={stats.recentLinks} />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function TableList({ items }: { items: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
            <th className="py-2 pr-4">Başlık</th>
            <th className="py-2 pr-4">Kısa Linkler</th>
            <th className="py-2 pr-4">Tıklama</th>
            <th className="py-2 pr-4">Oluşturma</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((l) => (
            <tr key={l.id} className="border-b border-neutral-200 dark:border-neutral-800">
              <td className="py-2 pr-4"><Link className="text-primary" href={`/admin/links/${l.id}`}>{l.title}</Link></td>
              <td className="py-2 pr-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <Link className="text-muted-foreground" href={`/${l.slug}`}>/{l.slug}</Link>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <Link className="text-muted-foreground" href={`/out/${l.slug}`}>/out/{l.slug}</Link>
                </div>
              </td>
              <td className="py-2 pr-4">{l.clicks}</td>
              <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import ClientChart from './components/ClientChart'
import CreateLinkButton from './components/CreateLinkButton'