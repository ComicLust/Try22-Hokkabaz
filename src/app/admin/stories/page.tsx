"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/media/MediaPicker";
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from "lucide-react";

// CarouselSlide modelini Story olarak kullanıyoruz
// title, mobileImageUrl, ctaUrl, isActive, order

type StorySlide = {
  id: string;
  title?: string | null;
  mobileImageUrl?: string | null;
  ctaUrl?: string | null;
  isActive?: boolean | null;
  order?: number | null;
};

export default function AdminStoriesPage() {
  const [items, setItems] = useState<StorySlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Yeni ekleme formu
  const [form, setForm] = useState<Partial<StorySlide>>({ isActive: true });
  const [mediaOpenNewMobile, setMediaOpenNewMobile] = useState(false);

  // Düzenleme formu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StorySlide>>({});
  const [mediaOpenEditMobile, setMediaOpenEditMobile] = useState(false);

  const maxOrder = useMemo(() => {
    return items.reduce((acc, it) => Math.max(acc, Number(it.order ?? 0)), 0);
  }, [items]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/carousel", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Storyler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = {
      title: form.title ?? null,
      mobileImageUrl: form.mobileImageUrl ?? null,
      ctaUrl: form.ctaUrl ?? null,
      isActive: !!form.isActive,
      order: typeof form.order === "number" ? form.order : (maxOrder + 1) || 1,
    };
    try {
      const res = await fetch("/api/carousel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Oluşturma başarısız");
      setForm({ isActive: true });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Oluşturma hatası");
    }
  };

  const updateItem = async (id: string, patch: Partial<StorySlide>) => {
    try {
      const res = await fetch(`/api/carousel/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Güncelleme hatası");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Bu story'i silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`/api/carousel/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Silme hatası");
    }
  };

  const moveUp = async (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const curr = items[idx];
    const prev = items[idx - 1];
    const currOrder = Number(curr.order ?? 0);
    const prevOrder = Number(prev.order ?? 0);
    await updateItem(curr.id, { order: prevOrder });
    await updateItem(prev.id, { order: currOrder });
  };

  const moveDown = async (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0 || idx >= items.length - 1) return;
    const curr = items[idx];
    const next = items[idx + 1];
    const currOrder = Number(curr.order ?? 0);
    const nextOrder = Number(next.order ?? 0);
    await updateItem(curr.id, { order: nextOrder });
    await updateItem(next.id, { order: currOrder });
  };

  const startEdit = (it: StorySlide) => {
    setEditingId(it.id);
    setEditForm({
      title: it.title ?? "",
      mobileImageUrl: it.mobileImageUrl ?? "",
      ctaUrl: it.ctaUrl ?? "",
      isActive: !!it.isActive,
      order: Number(it.order ?? 0),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateItem(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Story – Instagram Story Yönetimi</h1>
      <p className="text-muted-foreground">Mobil üstte görünen story alanındaki kartları yönetin: görsel, link, başlık, aktiflik ve sıralama.</p>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Story Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm">Başlık</label>
              <Input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Örn: Büyük Bonus" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Mobil Görsel URL (9:16)</label>
              <Input value={form.mobileImageUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, mobileImageUrl: e.target.value }))} placeholder="https://..." />
              <Button type="button" variant="outline" onClick={() => setMediaOpenNewMobile(true)}>Görsel Seç / Yükle</Button>
              <MediaPicker open={mediaOpenNewMobile} onOpenChange={setMediaOpenNewMobile} onSelect={(url) => setForm((f) => ({ ...f, mobileImageUrl: url }))} title="Story Mobil Görsel Seç / Yükle" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">CTA URL (Story tıklanınca gidilecek link)</label>
              <Input value={form.ctaUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={!!form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                <span>Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Sıra</span>
                <Input type="number" className="w-24" value={Number(form.order ?? 0)} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Ekle</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Storyler</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
          {!!error && <div className="text-sm text-red-600">{error}</div>}
          <div className="space-y-4">
            {items.map((it, idx) => (
              <div key={it.id} className="border rounded-md p-3">
                <div className="flex items-start gap-3">
                  <img src={it.mobileImageUrl ?? "/logo.svg"} alt={String(it.title ?? "Story Görseli")} className="w-20 h-28 object-cover rounded-md border" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <div className="text-sm font-medium">Başlık</div>
                      <div className="text-sm text-muted-foreground">{it.title || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">CTA URL</div>
                      <div className="text-sm text-muted-foreground break-all">{it.ctaUrl || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Sıra</div>
                      <div className="text-sm text-muted-foreground">{Number(it.order ?? 0)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={!!it.isActive} onCheckedChange={(v) => updateItem(it.id, { isActive: v })} />
                      <span>Aktif</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => moveUp(it.id)} disabled={idx === 0}><ArrowUp className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => moveDown(it.id)} disabled={idx === items.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(it)}><Edit className="w-4 h-4 mr-1" /> Düzenle</Button>
                  <Button variant="outline" size="sm" onClick={() => deleteItem(it.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4 mr-1" /> Sil</Button>
                </div>

                {editingId === it.id && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
                    <div className="space-y-2">
                      <label className="text-sm">Başlık</label>
                      <Input value={editForm.title ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Mobil Görsel URL (9:16)</label>
                      <Input value={editForm.mobileImageUrl ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, mobileImageUrl: e.target.value }))} />
                      <Button type="button" variant="outline" onClick={() => setMediaOpenEditMobile(true)}>Görsel Seç / Yükle</Button>
                      <MediaPicker open={mediaOpenEditMobile} onOpenChange={setMediaOpenEditMobile} onSelect={(url) => setEditForm((f) => ({ ...f, mobileImageUrl: url }))} title="Story Mobil Görsel Seç / Yükle" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm">CTA URL</label>
                      <Input value={editForm.ctaUrl ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, ctaUrl: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Switch checked={!!editForm.isActive} onCheckedChange={(v) => setEditForm((f) => ({ ...f, isActive: v }))} />
                      <span>Aktif</span>
                      <span className="ml-6">Sıra</span>
                      <Input type="number" className="w-24" value={Number(editForm.order ?? 0)} onChange={(e) => setEditForm((f) => ({ ...f, order: Number(e.target.value) }))} />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <Button onClick={saveEdit}>Kaydet</Button>
                      <Button variant="outline" onClick={() => { setEditingId(null); setEditForm({}); }}>İptal</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && !loading && (
              <div className="text-sm text-muted-foreground">Henüz story eklenmemiş.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}