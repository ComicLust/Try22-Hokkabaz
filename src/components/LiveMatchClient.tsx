"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

function isYouTubeEmbed(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return host === "youtube.com" && u.pathname.startsWith("/embed/") || host === "youtube-nocookie.com" && u.pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

export default function LiveMatchClient({ liveMatch }: { liveMatch: any }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [topSponsor, setTopSponsor] = useState<any | null>(null);
  const [bottomSponsor, setBottomSponsor] = useState<any | null>(null);

  useEffect(() => {
    const loadSponsors = async () => {
      try {
        const res = await fetch("/api/page-sponsors?pageKey=canli-mac-izle");
        const j = await res.json().catch(() => ({ items: [] }));
        const items = Array.isArray(j.items) ? j.items : [];
        setTopSponsor(items.find((x:any)=>x.placement === "top") || null);
        setBottomSponsor(items.find((x:any)=>x.placement === "bottom") || null);
      } catch (e) {
        console.error("Sponsorlar alınamadı", e);
      }
    };
    loadSponsors();
  }, []);

  const Banner = ({ sponsor }: { sponsor: any | null }) => {
    if (!sponsor || (!sponsor.desktopImageUrl && !sponsor.mobileImageUrl)) return null;
    const clickUrl = sponsor.clickUrl || "#";
    const alt = sponsor.altText || "sponsor";
    const mobileSrc = sponsor.mobileImageUrl || sponsor.desktopImageUrl;
    const desktopSrc = sponsor.desktopImageUrl || sponsor.mobileImageUrl;
    return (
      <a href={clickUrl} target="_blank" rel="noopener noreferrer" className="block">
        {mobileSrc && (
          <img
            src={mobileSrc}
            alt={alt}
            className="block md:hidden mx-auto h-24 object-contain"
            style={{ maxHeight: 100 }}
          />
        )}
        {desktopSrc && (
          <img
            src={desktopSrc}
            alt={alt}
            className="hidden md:block mx-auto w-[728px] h-[90px] object-contain"
          />
        )}
      </a>
    );
  };

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        const resLive = await fetch("/api/live-match");
        const j = await resLive.json().catch(() => ({}));
        if (resLive.ok && j?.live && !canceled) {
          setEmbedUrl(j.live.embedUrl ?? null);
          setEmbedCode(j.live.embedCode ?? null);
        } else {
          setEmbedUrl(null);
          setEmbedCode(null);
        }
      } catch {
        setEmbedUrl(null);
        setEmbedCode(null);
      }
    };
    load();
    return () => { canceled = true };
  }, []);

  const validUrl = !!(embedUrl && (isYouTubeEmbed(embedUrl) || /^https?:\/\//.test(embedUrl)));
  const hasCode = !!embedCode;

  return (
    // Full-bleed: içteki container pad'lerini yok say ve viewport genişliğine taşır
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen md:left-0 md:right-0 md:ml-0 md:mr-0 md:w-full">
      {/* Üst Banner */}
      <div className="mb-4">
        <Banner sponsor={topSponsor} />
      </div>

      <Card className="relative overflow-hidden bg-transparent border-0 rounded-none shadow-none md:backdrop-blur-lg md:bg-opacity-80 md:bg-card md:border-2 md:rounded-2xl md:mt-6">
        <CardContent className="p-0 md:p-6">
          {hasCode ? (
            <div
              className="relative w-screen md:w-full aspect-video md:aspect-video overflow-hidden border-0 md:border border-border [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: embedCode! }}
            />
          ) : validUrl ? (
            <div className="relative w-screen md:w-full aspect-video md:aspect-video overflow-hidden border-0 md:border border-border">
              <iframe
                src={embedUrl!}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                frameBorder={0}
              />
            </div>
          ) : (
            <div className="relative w-screen md:w-full aspect-video md:aspect-video overflow-hidden border-0 md:border border-border grid place-items-center">
              <div className="text-center space-y-2 px-4">
                <div className="text-lg">Yayın bilgisi bulunamadı</div>
                <div className="text-sm text-muted-foreground">Yayın eklenene kadar bekleyiniz.</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alt Banner */}
      <div className="mt-4">
        <Banner sponsor={bottomSponsor} />
      </div>
    </div>
  );
}