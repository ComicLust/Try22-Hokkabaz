'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send, Trash2, RefreshCcw } from 'lucide-react'
import { MediaPicker } from '@/components/media/MediaPicker'

// Hazır izin ekranı temaları
const PERM_TEMPLATES = [
  {
    key: 'klasik',
    name: 'Klasik Koyu',
    config: { bgColor: '#0F172A', textColor: '#FFFFFF', position: 'bottom', radiusClass: 'rounded-xl', shadowClass: 'shadow-lg' }
  },
  {
    key: 'minimal',
    name: 'Minimal Açık',
    config: { bgColor: '#FFFFFF', textColor: '#0F172A', position: 'middle', radiusClass: 'rounded-lg', shadowClass: 'shadow' }
  },
  {
    key: 'glass',
    name: 'Glass',
    config: { bgColor: 'rgba(2, 6, 23, 0.6)', textColor: '#FFFFFF', position: 'middle', radiusClass: 'rounded-xl', shadowClass: 'shadow-2xl' }
  },
  {
    key: 'bold',
    name: 'Vurgu (Teal)',
    config: { bgColor: '#0F766E', textColor: '#FFFFFF', position: 'bottom', radiusClass: 'rounded-xl', shadowClass: 'shadow-lg' }
  },
]

export default function AdminPushNotificationsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState('new')

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [clickAction, setClickAction] = useState('')
  const [icon, setIcon] = useState('')
  const [image, setImage] = useState('')
  const [target, setTarget] = useState<'all' | 'segment' | 'manual'>('all')
  const [segment, setSegment] = useState<'active_7d' | 'active_30d'>('active_7d')
  const [manualIds, setManualIds] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    try {
      setSending(true)
      const payload: any = { title, body, click_action: clickAction || undefined, icon: icon || undefined, image: image || undefined, target }
      if (target === 'segment') payload.segment = segment
      if (target === 'manual') payload.manualIds = manualIds.split(/[\,\s]+/).filter(Boolean)
      const res = await fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Gönderim hatası')
      toast({ title: 'Bildirim gönderildi', description: `${data.sentCount}/${data.targetCount} aboneye iletildi.` })
      setTitle(''); setBody(''); setClickAction(''); setIcon(''); setImage(''); setTarget('all'); setSegment('active_7d'); setManualIds('')
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Gönderim hatası', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  // Sent notifications list
  const [listLoading, setListLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const loadList = async () => {
    setListLoading(true)
    try {
      const res = await fetch('/api/push/list')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      toast({ title: 'Liste yüklenemedi', variant: 'destructive' })
    } finally {
      setListLoading(false)
    }
  }
  useEffect(() => { if (tab === 'sent') loadList() }, [tab])

  // Subscribers
  const [subsLoading, setSubsLoading] = useState(false)
  const [subs, setSubs] = useState<any[]>([])
  const [subsTotal, setSubsTotal] = useState(0)
  const [subsActive, setSubsActive] = useState(0)
  const [filterBrowser, setFilterBrowser] = useState<string>('all')
  const [filterDevice, setFilterDevice] = useState<string>('all')
  const loadSubs = async () => {
    setSubsLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filterBrowser && filterBrowser !== 'all') qs.set('browser', filterBrowser)
      if (filterDevice && filterDevice !== 'all') qs.set('device', filterDevice)
      const res = await fetch(`/api/push/subscribers?${qs.toString()}`)
      const data = await res.json()
      setSubs(Array.isArray(data?.items) ? data.items : [])
      setSubsTotal(data?.total ?? 0)
      setSubsActive(data?.active ?? 0)
    } catch (e) {
      toast({ title: 'Aboneler yüklenemedi', variant: 'destructive' })
    } finally {
      setSubsLoading(false)
    }
  }
  useEffect(() => { if (tab === 'subs') loadSubs() }, [tab])

  const deleteSub = async (id: string) => {
    try {
      const res = await fetch(`/api/push/subscribers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Silme hatası')
      toast({ title: 'Abonelik silindi' })
      loadSubs()
    } catch (e) {
      toast({ title: 'Silme hatası', variant: 'destructive' })
    }
  }

  const clearSubs = async () => {
    if (!confirm('Tüm abonelikler silinecek. Emin misiniz?')) return
    try {
      const res = await fetch('/api/push/subscribers?all=true', { method: 'DELETE' })
      if (!res.ok) throw new Error('Temizleme hatası')
      toast({ title: 'Tüm abonelikler temizlendi' })
      loadSubs()
    } catch (e) {
      toast({ title: 'Temizleme hatası', variant: 'destructive' })
    }
  }

  // Stats
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState<any | null>(null)
  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/push/stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      toast({ title: 'İstatistikler yüklenemedi', variant: 'destructive' })
    } finally {
      setStatsLoading(false)
    }
  }
  useEffect(() => { if (tab === 'stats') loadStats() }, [tab])

  // Permission Screen settings
  const [permLoading, setPermLoading] = useState(false)
  const [permSaving, setPermSaving] = useState(false)
  const [permOpenMedia, setPermOpenMedia] = useState(false)
  const [perm, setPerm] = useState({
    title: 'Bildirimlere izin ver',
    description: 'Yeni kampanyaları, bonusları ve özel fırsatları anında öğren!',
    allowText: 'İzin Ver',
    laterText: 'Daha Sonra',
    bgColor: '#111827',
    textColor: '#FFFFFF',
    imageUrl: '',
    position: 'bottom',
    radiusClass: 'rounded-xl',
    shadowClass: 'shadow-lg',
  })

  const sanitizePerm = (x: any) => ({
    title: x?.title ?? '',
    description: x?.description ?? '',
    allowText: x?.allowText ?? 'İzin Ver',
    laterText: x?.laterText ?? 'Daha Sonra',
    bgColor: x?.bgColor ?? '#111827',
    textColor: x?.textColor ?? '#FFFFFF',
    imageUrl: x?.imageUrl ?? '',
    position: ['top','middle','bottom'].includes(x?.position) ? x.position : 'bottom',
    radiusClass: x?.radiusClass ?? 'rounded-xl',
    shadowClass: x?.shadowClass ?? 'shadow-lg',
  })

  const loadPerm = async () => {
    setPermLoading(true)
    try {
      const res = await fetch('/api/push/permission-screen')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Yükleme hatası')
      setPerm((p) => ({ ...p, ...sanitizePerm(data) }))
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'İzin ekranı ayarları yüklenemedi', variant: 'destructive' })
    } finally {
      setPermLoading(false)
    }
  }
  useEffect(() => { if (tab === 'perm') loadPerm() }, [tab])

  const applyPermTemplate = (key: string) => {
    const t = PERM_TEMPLATES.find((x) => x.key === key)
    if (!t) return
    setPerm((p) => ({
      ...p,
      bgColor: t.config.bgColor,
      textColor: t.config.textColor,
      position: t.config.position as any,
      radiusClass: t.config.radiusClass,
      shadowClass: t.config.shadowClass,
    }))
  }

  const savePerm = async () => {
    setPermSaving(true)
    try {
      const res = await fetch('/api/push/permission-screen', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(perm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Kaydetme hatası')
      toast({ title: 'Kaydedildi', description: 'İzin ekranı ayarları güncellendi' })
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Kaydetme hatası', variant: 'destructive' })
    } finally {
      setPermSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="new">Yeni Bildirim Gönder</TabsTrigger>
              <TabsTrigger value="sent">Gönderilen Bildirimler</TabsTrigger>
              <TabsTrigger value="subs">Aboneler</TabsTrigger>
              <TabsTrigger value="stats">İstatistikler</TabsTrigger>
              <TabsTrigger value="perm">İzin Ekranı</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Başlık</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Yeni kampanya!" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Mesaj</label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Örn: Detaylar için tıklayın" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Link (click_action)</label>
                  <Input value={clickAction} onChange={(e) => setClickAction(e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm">İkon</label>
                  <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="/uploads/..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Görsel (image)</label>
                  <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/uploads/..." />
                </div>
                <div className="flex items-end gap-3">
                  <Select value={target} onValueChange={(v) => setTarget(v as any)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Hedef" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="segment">Segment</SelectItem>
                      <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                  {target === 'segment' && (
                    <Select value={segment} onValueChange={(v) => setSegment(v as any)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Segment" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active_7d">Son 7 gün aktif</SelectItem>
                        <SelectItem value="active_30d">Son 30 gün aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {target === 'manual' && (
                    <Input value={manualIds} onChange={(e) => setManualIds(e.target.value)} placeholder="ID listesi, virgülle" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSend} disabled={sending}>
                    {sending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</>) : (<>Gönder</>)}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sent" className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Gönderilen Bildirimler</div>
                <Button type="button" variant="outline" onClick={loadList}><RefreshCcw className="mr-2 h-4 w-4" /> Yenile</Button>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Gönderim</TableHead>
                      <TableHead>Alındı</TableHead>
                      <TableHead>Tıklama</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-mono text-xs">{it.id}</TableCell>
                        <TableCell>{it.title}</TableCell>
                        <TableCell>{it.sentCount}</TableCell>
                        <TableCell>{it.receivedCount}</TableCell>
                        <TableCell>{it.clickCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="subs" className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Aboneler</div>
                <div className="flex items-center gap-2">
                  <Select value={filterBrowser} onValueChange={setFilterBrowser}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tarayıcı" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Chrome">Chrome</SelectItem>
                      <SelectItem value="Safari">Safari</SelectItem>
                      <SelectItem value="Firefox">Firefox</SelectItem>
                      <SelectItem value="Edge">Edge</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDevice} onValueChange={setFilterDevice}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cihaz" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Android">Android</SelectItem>
                      <SelectItem value="iOS">iOS</SelectItem>
                      <SelectItem value="macOS">macOS</SelectItem>
                      <SelectItem value="Windows">Windows</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={loadSubs}><RefreshCcw className="mr-2 h-4 w-4" /> Yenile</Button>
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tarayıcı</TableHead>
                      <TableHead>Cihaz</TableHead>
                      <TableHead>Aktif</TableHead>
                      <TableHead>Son Aktivite</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell>{s.browser || '-'}</TableCell>
                        <TableCell>{s.device || '-'}</TableCell>
                        <TableCell>{s.isActive ? 'Evet' : 'Hayır'}</TableCell>
                        <TableCell>{s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="destructive" size="sm" onClick={() => deleteSub(s.id)}><Trash2 className="mr-1 h-4 w-4" /> Sil</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm">Toplam: <Badge variant="secondary">{subsTotal}</Badge> Aktif: <Badge variant="secondary">{subsActive}</Badge></div>
                <Button type="button" variant="outline" onClick={clearSubs}>Tümünü Temizle</Button>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="pt-4">
              {statsLoading ? (
                <div className="py-6">Yükleniyor...</div>
              ) : !stats ? (
                <div className="py-6 text-sm text-muted-foreground">Veri yok</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Toplam Bildirim</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold">{stats.totals?.notifications ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Toplam Tıklama</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold">{stats.totals?.clicks ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Aktif Abone</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold">{stats.totals?.activeSubscribers ?? 0}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Tarayıcı Dağılımı</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(stats.distribution?.browser ?? []).map((b: any) => (
                            <Badge key={b.name} variant="secondary">{b.name}: {b.count}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Cihaz Dağılımı</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(stats.distribution?.device ?? []).map((d: any) => (
                            <Badge key={d.name} variant="secondary">{d.name}: {d.count}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Gönderildi</TableHead>
                          <TableHead>Tıklama</TableHead>
                          <TableHead>Yeni Abone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stats.daily ?? []).map((d: any) => (
                          <TableRow key={d.date}>
                            <TableCell className="font-mono text-xs">{d.date}</TableCell>
                            <TableCell>{d.sent}</TableCell>
                            <TableCell>{d.clicked}</TableCell>
                            <TableCell>{d.newSubscribers}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button type="button" variant="outline" onClick={loadStats}>
                      <RefreshCcw className="mr-2 h-4 w-4" /> Yenile
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="perm" className="pt-4">
              {permLoading ? (
                <div className="py-6">Yükleniyor...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Form */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm">Başlık</label>
                      <Input value={perm.title} onChange={(e) => setPerm({ ...perm, title: e.target.value })} placeholder="Örn: Bildirimlere izin ver" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm">Açıklama</label>
                      <Textarea value={perm.description} onChange={(e) => setPerm({ ...perm, description: e.target.value })} placeholder="Örn: Yeni kampanyaları anında öğren!" />
                    </div>

                    {/* Şablon Seç */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm">Şablon Seç</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {PERM_TEMPLATES.map((t) => (
                          <button
                            type="button"
                            key={t.key}
                            onClick={() => applyPermTemplate(t.key)}
                            className="border rounded-md p-2 text-left hover:bg-muted"
                            title={`Uygula: ${t.name}`}
                          >
                            <div className="text-xs font-medium mb-2">{t.name}</div>
                            <div className="relative h-16 bg-muted rounded">
                              <div
                                className="absolute left-1/2 -translate-x-1/2 w-[85%] p-2 flex items-center gap-2 rounded-md"
                                style={{
                                  backgroundColor: (t.config as any).bgColor,
                                  color: (t.config as any).textColor,
                                  top: (t.config as any).position === 'top' ? '8%' : (t.config as any).position === 'middle' ? '50%' : 'auto',
                                  bottom: (t.config as any).position === 'bottom' ? '8%' : 'auto',
                                  transform: (t.config as any).position === 'middle' ? 'translate(-50%, -50%)' : 'translateX(-50%)',
                                }}
                              >
                                <div className="text-[11px] flex-1">Başlık</div>
                                <div className="text-[10px] opacity-80">Açıklama</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Onay Butonu</label>
                        <Input value={perm.allowText} onChange={(e) => setPerm({ ...perm, allowText: e.target.value })} placeholder="İzin Ver" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Reddet Butonu</label>
                        <Input value={perm.laterText} onChange={(e) => setPerm({ ...perm, laterText: e.target.value })} placeholder="Daha Sonra" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Arka Plan Rengi</label>
                        <input type="color" value={perm.bgColor} onChange={(e) => setPerm({ ...perm, bgColor: e.target.value })} className="h-10 w-16 p-0 border rounded-md" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Metin Rengi</label>
                        <input type="color" value={perm.textColor} onChange={(e) => setPerm({ ...perm, textColor: e.target.value })} className="h-10 w-16 p-0 border rounded-md" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm">Görsel (logo/ikon)</label>
                      <div className="flex items-center gap-3">
                        <Input value={perm.imageUrl} onChange={(e) => setPerm({ ...perm, imageUrl: e.target.value })} placeholder="/uploads/... veya https://..." />
                        <Button type="button" variant="outline" onClick={() => setPermOpenMedia(true)}>Medya</Button>
                        <MediaPicker open={permOpenMedia} onOpenChange={setPermOpenMedia} onSelect={(url) => setPerm({ ...perm, imageUrl: url })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Pozisyon</label>
                        <Select value={perm.position} onValueChange={(v) => setPerm({ ...perm, position: v })}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Seçin" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Üst</SelectItem>
                            <SelectItem value="middle">Orta</SelectItem>
                            <SelectItem value="bottom">Alt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Radius Class</label>
                        <Input value={perm.radiusClass} onChange={(e) => setPerm({ ...perm, radiusClass: e.target.value })} placeholder="rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm">Shadow Class</label>
                        <Input value={perm.shadowClass} onChange={(e) => setPerm({ ...perm, shadowClass: e.target.value })} placeholder="shadow-lg" />
                      </div>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <Button onClick={savePerm} disabled={permSaving}>
                        {permSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</>) : (<>Kaydet</>)}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => window.open('/?forcePushPrompt=1', '_blank')}>Sitede Göster</Button>
                    </div>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground mb-2">Önizleme</div>
                    <div className="relative h-[420px] bg-muted rounded-md overflow-visible">
                      <div
                        className={"absolute left-0 right-0 mx-auto w-[90%] md:w-[70%] max-w-[720px] p-4 flex items-center gap-3 " + perm.radiusClass + " " + perm.shadowClass}
                        style={{
                          backgroundColor: perm.bgColor,
                          color: perm.textColor,
                          top: perm.position === 'top' ? '1rem' : perm.position === 'middle' ? '50%' : 'auto',
                          bottom: perm.position === 'bottom' ? '1rem' : 'auto',
                          transform: perm.position === 'middle' ? 'translateY(-50%)' : 'none',
                        }}
                      >
                        {perm.imageUrl && (
                          <img src={perm.imageUrl} alt="logo" className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{perm.title}</div>
                          <div className="text-xs opacity-80">{perm.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" style={{ backgroundColor: perm.textColor, color: perm.bgColor }}>{perm.allowText}</Button>
                          <Button size="sm" variant="outline" className="bg-transparent border border-white/40" style={{ color: perm.textColor }}>{perm.laterText}</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
}