"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

const labelMap: Record<string, string> = {
  "": "Ana Sayfa",
  "kampanyalar": "Kampanyalar",
  "bonuslar": "Bonuslar",
  "guvenilir-bahis-siteleri-listesi": "Güvenilir Bahis Siteleri Listesi",
  "yorumlar": "Yorumlar",
  "guvenilir-telegram": "Güvenilir Telegram",
  "hakkimizda": "Hakkımızda",
  "iletisim": "İletişim",
  "vpn-onerileri": "VPN Önerileri",
}

function labelFor(seg: string) {
  return labelMap[seg] ?? decodeURIComponent(seg)
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  if (!pathname || pathname === "/" || pathname.startsWith("/admin")) {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)
  const items = segments.map((seg, idx) => ({
    href: "/" + segments.slice(0, idx + 1).join("/"),
    label: labelFor(seg),
  }))

  // JSON-LD
  const origin = (typeof window !== "undefined" ? window.location.origin : "") || process.env.NEXT_PUBLIC_SITE_URL || ""
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: { "@id": origin + "/", name: "Ana Sayfa" },
      },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        item: { "@id": origin + it.href, name: it.label },
      })),
    ],
  }

  return (
    <div className="px-4 py-2">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Ana Sayfa</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {items.length > 0 && <BreadcrumbSeparator />}
          {items.slice(0, -1).map((item) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ))}
          {items.length > 0 && (
            <BreadcrumbItem>
              <BreadcrumbPage>{items[items.length - 1].label}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}