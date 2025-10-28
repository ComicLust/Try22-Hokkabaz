"use client";
import React, { useEffect, useState } from "react";
import { useInAppBrowserDetect } from "@/hooks/use-inapp-browser";
import { ExternalLink } from "lucide-react";

export default function InAppOpenBar() {
  // Hydration güvenliği: SSR sırasında hiçbir şey render etme,
  // mount sonrası client tarafında durumu değerlendir.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { inApp, isIOS, isAndroid, links } = useInAppBrowserDetect();
  if (!mounted || !inApp) return null;

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-amber-100 text-amber-900 border-b border-amber-300 px-3 py-2 flex items-center justify-between">
        <div className="text-sm">
          Bu sayfa sosyal medya içi tarayıcıda açıldı. Dış tarayıcıda daha iyi çalışır.
        </div>
        <div className="flex items-center gap-2">
          {isIOS && (
            <>
              <a href={links.chromeIOS} className="inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-xs">
                Chrome’da Aç <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a href={links.firefoxIOS} className="inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-xs">
                Firefox’ta Aç <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a href={links.edgeIOS} className="inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-xs">
                Edge’de Aç <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </>
          )}
          {isAndroid && (
            <a href={links.chromeAndroidIntent} className="inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-xs">
              Chrome’da Aç <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
          <button
            className="inline-flex items-center px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-xs"
            onClick={() => {
              try {
                navigator.clipboard.writeText(links.currentUrl);
                alert("Bağlantı kopyalandı. Tarayıcınıza yapıştırabilirsiniz.");
              } catch {}
            }}
          >
            Bağlantıyı Kopyala
          </button>
        </div>
      </div>
    </div>
  );
}