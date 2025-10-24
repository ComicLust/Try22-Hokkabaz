'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
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
} from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Gift, MessageCircle } from 'lucide-react'

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  useEffect(() => {
    let timer: any
    const check = async () => {
      try {
        const res = await fetch('/api/brand/session', { method: 'GET', credentials: 'include' })
        // Only force logout on explicit 401 (invalidated session)
        if (res.status === 401) {
          await fetch('/api/brand/logout', { method: 'POST', credentials: 'include' })
          router.replace('/brand/login')
        }
      } catch {
        // Network errors or 5xx responses shouldn't auto-logout
      }
    }
    if (pathname !== '/brand/login') {
      check()
      // Check less frequently to avoid accidental logouts due to transient issues
      timer = setInterval(check, 60000)
      const onVis = () => { if (document.visibilityState === 'visible') check() }
      document.addEventListener('visibilitychange', onVis)
      return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis) }
    }
  }, [pathname, router])

  if (pathname === '/brand/login') {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">{children}</div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/brand/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    finally {
      setLoggingOut(false)
    }
    router.replace('/brand/login')
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <Link href="/brand" className="font-semibold text-lg">Marka Yönetimi</Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menü</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/brand')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/brand"><LayoutDashboard className="size-4" /> Gösterge Paneli</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/brand/bonuses')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/brand/bonuses"><Gift className="size-4" /> Bonuslar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/brand/telegram')} className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary data-[active=true]:font-semibold">
                  <Link href="/brand/telegram"><MessageCircle className="size-4" /> Telegram Ekle</Link>
                </SidebarMenuButton>
              </SidebarMenuItem
              >
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
              <span className="font-semibold">GmanVibes Marka Paneli</span>
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
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}