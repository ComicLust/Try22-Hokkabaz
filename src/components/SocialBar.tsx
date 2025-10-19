"use client"
import { Send, Twitter, Instagram, Youtube } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type LinkItem = { name: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; url: string }

const socialLinks: LinkItem[] = [
  { name: "Telegram", Icon: Send, url: "https://t.me/hokkabaz" },
  { name: "Twitter / X", Icon: Twitter, url: "#" },
  { name: "Instagram", Icon: Instagram, url: "#" },
  { name: "YouTube", Icon: Youtube, url: "#" },
]

interface SocialBarProps {
  compact?: boolean
  title?: string
}

export default function SocialBar({ compact = false, title = "Hokkabaz Sosyal Ağlar" }: SocialBarProps) {
  return (
    <section className={compact ? "space-y-0" : "space-y-4"}>
      {!compact && (
        <h2 className="text-lg md:text-2xl font-bold text-gold">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {socialLinks.map((s) => (
          <Card
            key={s.name}
            className="bg-secondary-bg border-border hover:border-gold/60 transition-colors"
          >
            <CardContent
              className={compact ? "py-3 sm:py-4 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" : "py-4 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"}
            >
              <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                <s.Icon className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                <span className="font-medium text-sm md:text-base">{s.name}</span>
              </div>
              <Button
                variant={compact ? "outline" : "default"}
                className={compact ? "h-8 md:h-9 px-2 md:px-3 border-gold/40 hover:border-gold hover:bg-gold/10 w-full sm:w-auto" : "telegram-gradient neon-button w-full sm:w-auto"}
                size={compact ? "sm" : "sm"}
                asChild
              >
                <a
                  href={s.url}
                  aria-label={`${s.name} hesabımızı takip edin`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Takip Et
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}