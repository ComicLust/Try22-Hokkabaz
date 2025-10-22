"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { MediaPicker } from "@/components/media/MediaPicker";

export default function AdminCanliMacPage() {
  const { toast } = useToast();
  const [embedCode, setEmbedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Banner state: üst ve alt (desktop/mobile + url + alt)
  const [topDesktopImageUrl, setTopDesktopImageUrl] = useState<string>("");
  const [topMobileImageUrl, setTopMobileImageUrl] = useState<string>("");
  const [topClickUrl, setTopClickUrl] = useState<string>("");
  const [topAltText, setTopAltText] = useState<string>("");
  const [bottomDesktopImageUrl, setBottomDesktopImageUrl] = useState<string>("");
  const [bottomMobileImageUrl, setBottomMobileImageUrl] = useState<string>("");
  const [bottomClickUrl, setBottomClickUrl] = useState<string>("");
  const [bottomAltText, setBottomAltText] = useState<string>("");

  // MediaPicker modalları
  const [openTopDesktop, setOpenTopDesktop] = useState(false);
  const [openTopMobile, setOpenTopMobile] = useState(false);
  const [openBottomDesktop, setOpenBottomDesktop] = useState(false);
  const [openBottomMobile, setOpenBottomMobile] = useState(false);

  // Mevcut embed ve bannerları yükle
  useEffect(() => {
    const loadCurrentEmbed = async () => {
      try {
        const response = await fetch("/api/admin/live-matches");
        if (response.ok) {
          const data = await response.json();
          if (data.live?.embedCode) {
            setEmbedCode(data.live.embedCode);
          }
        }
      } catch (error) {
        console.error("Embed kodu yüklenirken hata:", error);
      }
    };

    const loadSponsors = async () => {
      try {
        const res = await fetch("/api/page-sponsors?pageKey=canli-mac-izle");
        const j = await res.json().catch(() => ({ items: [] }));
        const items = Array.isArray(j.items) ? j.items : [];
        const top = items.find((it: any) => it.placement === "top");
        const bottom = items.find((it: any) => it.placement === "bottom");
        if (top) {
          setTopDesktopImageUrl(top.desktopImageUrl || "");
          setTopMobileImageUrl(top.mobileImageUrl || "");
          setTopClickUrl(top.clickUrl || "");
          setTopAltText(top.altText || "");
        }
        if (bottom) {
          setBottomDesktopImageUrl(bottom.desktopImageUrl || "");
          setBottomMobileImageUrl(bottom.mobileImageUrl || "");
          setBottomClickUrl(bottom.clickUrl || "");
          setBottomAltText(bottom.altText || "");
        }
      } catch (e) {
        console.error("Sponsorlar yüklenemedi", e);
      }
    };

    loadCurrentEmbed();
    loadSponsors();
  }, []);

  const handleSave = async () => {
    if (!embedCode.trim()) {
      toast({
        title: "Hata",
        description: "Embed kodu gereklidir",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1) Embed kaydet
      const response = await fetch("/api/admin/live-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedCode: embedCode.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Embed kaydetme hatası");
      }

      // 2) Bannerları kaydet
      const sponsorRes = await fetch("/api/admin/page-sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: "canli-mac-izle",
          sponsors: [
            {
              placement: "top",
              desktopImageUrl: topDesktopImageUrl || null,
              mobileImageUrl: topMobileImageUrl || null,
              clickUrl: topClickUrl || null,
              altText: topAltText || null,
            },
            {
              placement: "bottom",
              desktopImageUrl: bottomDesktopImageUrl || null,
              mobileImageUrl: bottomMobileImageUrl || null,
              clickUrl: bottomClickUrl || null,
              altText: bottomAltText || null,
            },
          ],
        }),
      });

      if (!sponsorRes.ok) {
        const e = await sponsorRes.json();
        throw new Error(e.error || "Banner kaydetme hatası");
      }

      toast({ title: "Başarılı", description: "Yayın ve bannerlar kaydedildi" });
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Kaydetme sırasında hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Canlı Maç Yönetimi</CardTitle>
          <CardDescription>
            Canlı maç için embed kodunu buraya yapıştırın ve bannerları yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Embed alanı */}
          <div className="space-y-2">
            <Label htmlFor="embedCode">Embed Kodu</Label>
            <Textarea
              id="embedCode"
              placeholder="<iframe src='...' width='560' height='315'></iframe>"
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {embedCode && (
            <div className="space-y-2">
              <Label>Önizleme</Label>
              <div 
                className="border rounded-lg p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: embedCode }}
              />
            </div>
          )}

          {/* Üst Banner */}
          <div className="space-y-3 border rounded-md p-4">
            <div className="font-medium">Üst Banner</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Masaüstü Görsel (728x90)</Label>
                {topDesktopImageUrl && (
                  <img src={topDesktopImageUrl} alt="top desktop" className="w-full h-24 object-contain border rounded" />
                )}
                <div className="flex items-center gap-2">
                  <Input value={topDesktopImageUrl} onChange={(e)=>setTopDesktopImageUrl(e.target.value)} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={()=>setOpenTopDesktop(true)}>Seç / Yükle</Button>
                </div>
                <MediaPicker open={openTopDesktop} onOpenChange={setOpenTopDesktop} onSelect={(url)=>setTopDesktopImageUrl(url)} title="Üst Banner Masaüstü" />
              </div>
              <div className="space-y-2">
                <Label>Mobil Görsel (320x100)</Label>
                {topMobileImageUrl && (
                  <img src={topMobileImageUrl} alt="top mobile" className="w-full h-24 object-contain border rounded" />
                )}
                <div className="flex items-center gap-2">
                  <Input value={topMobileImageUrl} onChange={(e)=>setTopMobileImageUrl(e.target.value)} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={()=>setOpenTopMobile(true)}>Seç / Yükle</Button>
                </div>
                <MediaPicker open={openTopMobile} onOpenChange={setOpenTopMobile} onSelect={(url)=>setTopMobileImageUrl(url)} title="Üst Banner Mobil" />
              </div>
              <div className="space-y-2">
                <Label>Tıklama URL</Label>
                <Input value={topClickUrl} onChange={(e)=>setTopClickUrl(e.target.value)} placeholder="https://reklam-sitesi.com" />
              </div>
              <div className="space-y-2">
                <Label>Alt Metin</Label>
                <Input value={topAltText} onChange={(e)=>setTopAltText(e.target.value)} placeholder="Sponsor banner" />
              </div>
            </div>
          </div>

          {/* Alt Banner */}
          <div className="space-y-3 border rounded-md p-4">
            <div className="font-medium">Alt Banner</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Masaüstü Görsel (728x90)</Label>
                {bottomDesktopImageUrl && (
                  <img src={bottomDesktopImageUrl} alt="bottom desktop" className="w-full h-24 object-contain border rounded" />
                )}
                <div className="flex items-center gap-2">
                  <Input value={bottomDesktopImageUrl} onChange={(e)=>setBottomDesktopImageUrl(e.target.value)} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={()=>setOpenBottomDesktop(true)}>Seç / Yükle</Button>
                </div>
                <MediaPicker open={openBottomDesktop} onOpenChange={setOpenBottomDesktop} onSelect={(url)=>setBottomDesktopImageUrl(url)} title="Alt Banner Masaüstü" />
              </div>
              <div className="space-y-2">
                <Label>Mobil Görsel (320x100)</Label>
                {bottomMobileImageUrl && (
                  <img src={bottomMobileImageUrl} alt="bottom mobile" className="w-full h-24 object-contain border rounded" />
                )}
                <div className="flex items-center gap-2">
                  <Input value={bottomMobileImageUrl} onChange={(e)=>setBottomMobileImageUrl(e.target.value)} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={()=>setOpenBottomMobile(true)}>Seç / Yükle</Button>
                </div>
                <MediaPicker open={openBottomMobile} onOpenChange={setOpenBottomMobile} onSelect={(url)=>setBottomMobileImageUrl(url)} title="Alt Banner Mobil" />
              </div>
              <div className="space-y-2">
                <Label>Tıklama URL</Label>
                <Input value={bottomClickUrl} onChange={(e)=>setBottomClickUrl(e.target.value)} placeholder="https://reklam-sitesi.com" />
              </div>
              <div className="space-y-2">
                <Label>Alt Metin</Label>
                <Input value={bottomAltText} onChange={(e)=>setBottomAltText(e.target.value)} placeholder="Sponsor banner" />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}