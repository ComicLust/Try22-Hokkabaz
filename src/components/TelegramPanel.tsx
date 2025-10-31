"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommentAvatarUrl } from "@/lib/utils";

// Local Telegram icon (simple round paper-plane)
const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 8.5L15 17.5C15 17.5 14.75 18.25 14 17.75L10.5 15L9 14.5L6.75 13.75C6.75 13.75 6.25 13.5 6.25 13C6.25 12.5 6.75 12.25 6.75 12.25L15.5 8.25C15.5 8.25 16.5 7.75 16.5 8.5Z" fill="currentColor"/>
  </svg>
);

type Admin = {
  name: string;
  role: string;
  href: string;
};

type ChatMessage = {
  id: string;
  sender: string;
  avatarUrl: string;
  text: string;
  side: "left" | "right"; // align as incoming/outgoing
};

export default function TelegramPanel({
  groupName = "Hokkabaz Telegram",
  groupLink = "https://t.me/+-H20aHx5MyZlZjQ0",
  members = 15423,
  onlineBase = 562,
}: {
  groupName?: string;
  groupLink?: string;
  members?: number;
  onlineBase?: number;
}) {
  const admins: Admin[] = useMemo(
    () => [
      {
        name: "Yönetici 1",
        role: "Admin",
        href: groupLink,
      },
      {
        name: "Yönetici 2",
        role: "Admin",
        href: groupLink,
      },
      {
        name: "Yönetici 3",
        role: "Admin",
        href: groupLink,
      },
    ],
    [groupLink]
  );

  // Simulated chat messages (3-4 people)
  const chatScript: ChatMessage[] = useMemo(
    () => [
      {
        id: "m1",
        sender: "Ali",
        avatarUrl: getCommentAvatarUrl("Ali", { size: 64 }),
        text: "Hoş geldiniz! Bugünkü özel bonus duyurusunu kaçırmayın.",
        side: "left",
      },
      {
        id: "m2",
        sender: "Zeynep",
        avatarUrl: getCommentAvatarUrl("Zeynep", { size: 64 }),
        text: "Katıldım, ayrıntıları nereden görebilirim?",
        side: "right",
      },
      {
        id: "m3",
        sender: "Mehmet",
        avatarUrl: getCommentAvatarUrl("Mehmet", { size: 64 }),
        text: "Üstte sabitli mesajda link var, oradan başla.",
        side: "left",
      },
      {
        id: "m4",
        sender: "Elif",
        avatarUrl: getCommentAvatarUrl("Elif", { size: 64 }),
        text: "Yeni katılanlara hoş geldiniz! Sorunuz olursa yazın.",
        side: "right",
      },
      {
        id: "m5",
        sender: "Ali",
        avatarUrl: getCommentAvatarUrl("Ali", { size: 64 }),
        text: "Akşam canlı yayın öncesi duyuru yapacağız, takipte kalın.",
        side: "left",
      },
    ],
    []
  );

  // Reveal messages one by one to simulate chat activity
  const [visibleCount, setVisibleCount] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => (c < chatScript.length ? c + 1 : c));
    }, 1500);
    return () => clearInterval(interval);
  }, [chatScript.length]);

  // Simulate online count drifting slightly
  const [online, setOnline] = useState(onlineBase);
  useEffect(() => {
    const interval = setInterval(() => {
      setOnline((o) => {
        const delta = Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1);
        const next = o + delta;
        return Math.max(0, next);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [onlineBase]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0e0e0e] via-[#141414] to-[#1a1a1a] p-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left gap-3">
        {/* Sol blok: ikon + grup adı + üye rozeti */}
        <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/20 flex items-center justify-center">
            <TelegramIcon className="w-5 h-5 text-gold" />
          </div>
          <div className="font-semibold tracking-tight">{groupName}</div>
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-black/40 border border-gold/40 text-gold text-sm md:text-base font-semibold tracking-tight">
            Üye {members.toLocaleString("tr-TR")}
          </div>
        </div>
        {/* Sağ blok: aktif + CTA (mobilde ortalı, desktop sağda) */}
        <div className="flex items-center justify-center md:justify-end gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-emerald-400 text-sm">Aktif {online.toLocaleString("tr-TR")}</span>
          </div>
          <Button className="telegram-gradient neon-button" asChild>
            <a href={groupLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <TelegramIcon className="w-4 h-4 mr-2" />
              Telegram'a Katıl
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="mt-6 rounded-xl bg-black/30 border border-border p-4 h-[320px] overflow-hidden">
        <div className="flex flex-col gap-3">
          {chatScript.slice(0, visibleCount).map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className={`flex items-end ${m.side === "right" ? "justify-end" : "justify-start"}`}
            >
              {m.side === "left" && (
                <img
                  src={m.avatarUrl}
                  alt={m.sender}
                  className="w-7 h-7 rounded-full mr-2"
                  loading="lazy"
                />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm border ${
                  m.side === "right"
                    ? "bg-gold/15 border-gold/30"
                    : "bg-secondary-bg border-border"
                }`}
              >
                <div className="font-medium text-xs mb-1 text-muted-foreground">{m.sender}</div>
                <div className="text-foreground/90">{m.text}</div>
              </div>
              {m.side === "right" && (
                <img
                  src={m.avatarUrl}
                  alt={m.sender}
                  className="w-7 h-7 rounded-full ml-2"
                  loading="lazy"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Admins */}
      <div className="mt-6 flex items-center justify-between">
        {admins.map((a) => (
          <a
            key={a.name}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-gold transition-colors"
          >
            <img src={getCommentAvatarUrl(a.name, { size: 48 })} alt={a.name} className="w-6 h-6 rounded-full" loading="lazy" />
            <span className="text-sm font-medium">{a.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}