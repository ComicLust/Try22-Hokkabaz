'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInput,
} from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Images,
  MessageSquare,
  List,
  Megaphone,
  Gift,
  Search as SearchIcon,
  Send,
  Sliders,
  Activity,
  Link2,
  Bell,
  Database,
  Trophy,
} from 'lucide-react'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const segments = pathname.split('/').filter(Boolean)
  const labelMap: Record<string, string> = {
    admin: 'Yönetim',
    seo: 'Genel SEO',
    users: 'Kullanıcılar',
    'marquee-logos': 'Anlaşmalı Siteler',
    media: 'Medya',
    'push-notifications': 'Push Notifications',
    campaigns: 'Kampanyalar',
    bonuses: 'Bonuslar',
    'banko-kuponlar': 'Banko Kuponlar',
    telegram: 'Telegram',
    yorumlar: 'Yorumlar',
    'yorum-onay': 'Yorum Onay',
    markalar: 'Markalar',
    approval: 'Onay',
    links: 'Links',
    backup: 'Yedekleme',
  }
  const labelFor = (seg: string) => labelMap[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const breadcrumb = segments.map((seg, idx) => ({ href: '/' + segments.slice(0, idx + 1).join('/'), label: labelFor(seg) }))

  if (pathname === '/admin/login') {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">{children}</div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    finally {
      setLoggingOut(false)
    }
    router.replace('/admin/login')
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <Link href="/admin" className="font-semibold text-lg">Yönetim</Link>
          <SidebarInput placeholder="Admin içinde ara" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Genel</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin"><LayoutDashboard className="size-4" /> Gösterge Paneli</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/seo')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/seo"><SearchIcon className="size-4" /> Genel SEO</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/analytics')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/analytics"><Activity className="size-4" /> Analytics & Meta Kodları</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/users')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/users"><List className="size-4" /> Kullanıcılar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/backup')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/backup"><Database className="size-4" /> Yedekleme</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Push Notifications menü öğesi kaldırıldı */}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>İçerik</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/marquee-logos')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/marquee-logos"><Images className="size-4" /> Anlaşmalı Siteler</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/media')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/media"><Images className="size-4" /> Medya</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Carousel sayfası kaldırıldı; marquee-logos altında yönetiliyor */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/campaigns')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/campaigns"><Megaphone className="size-4" /> Kampanyalar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/bonuses')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/bonuses"><Gift className="size-4" /> Bonuslar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/banko-kuponlar')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/banko-kuponlar"><Trophy className="size-4" /> Banko Kuponlar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/links')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/links"><Link2 className="size-4" /> Links</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/telegram')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/telegram"><Send className="size-4" /> Telegram</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/telegram/approval')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/telegram/approval"><Sliders className="size-4" /> Telegram Onay</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Yorumlar</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/yorumlar/markalar')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/yorumlar/markalar"><List className="size-4" /> Markalar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/admin/yorumlar/yorum-onay')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/admin/yorumlar/yorum-onay"><MessageSquare className="size-4" /> Yorum Onay</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/" className="text-sm">Site Ana Sayfa</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-semibold">GmanVibes Yönetim Paneli</span>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Hızlı arama..." className="h-8 w-40 md:w-64" />
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Siteye Git</Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış'}
              </Button>
            </div>
          </div>
        </header>
        <div className="p-4">
          {pathname.startsWith('/admin') && (
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                {breadcrumb.slice(0, -1).map((item) => (
                  <React.Fragment key={item.href}>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                ))}
                {breadcrumb.length > 0 && (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumb[breadcrumb.length - 1].label}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}