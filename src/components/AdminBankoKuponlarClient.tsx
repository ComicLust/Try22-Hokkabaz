"use client"

import React, { useEffect, useMemo, useState } from 'react'

type MatchResult = 'PENDING' | 'WON' | 'LOST' | 'DRAW' | 'CANCELLED'

type BankoMatch = {
  id?: string
  homeTeam: string
  awayTeam: string
  league?: string | null
  startTime?: string | null
  prediction?: string | null
  odd?: number | null
  resultScore?: string | null
  result?: MatchResult
}

type BankoCoupon = {
  id: string
  title?: string | null
  date: string
  totalOdd?: number | null
  status: 'WON' | 'LOST' | 'PENDING'
  matchCount: number
  upVotes: number
  downVotes: number
  communityTrust: number
  isActive: boolean
  publishedAt?: string | null
  matches?: BankoMatch[]
}

function fmtDate(d: string | Date) {
  const x = typeof d === 'string' ? new Date(d) : d
  return x.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function calcTotalOdd(matches: BankoMatch[]) {
  if (!matches || matches.length === 0) return 1
  return Math.round(matches.reduce((acc, m) => acc * (m.odd || 1), 1) * 100) / 100
}

export default function AdminBankoKuponlarClient() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<BankoCoupon[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('')
  const [winnersOnly, setWinnersOnly] = useState(false)
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')

  const [stats, setStats] = useState<{ successRate7d: number; avgTotalOdd7d: number | null; todayVotes: number; winSeries: { date: string; won: number; total: number }[] } | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<BankoCoupon | null>(null)

  const [newTitle, setNewTitle] = useState('Banko Kupon #1')
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().substring(0, 10))
  const [newMatches, setNewMatches] = useState<BankoMatch[]>([])
  const newTotalOdd = useMemo(() => calcTotalOdd(newMatches), [newMatches])
  const [newPublish, setNewPublish] = useState(true)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState<string>('')
  const [editMatches, setEditMatches] = useState<BankoMatch[]>([])
  const editTotalOdd = useMemo(() => calcTotalOdd(editMatches), [editMatches])
  const [editPublish, setEditPublish] = useState<boolean>(true)

  // Notification management
  const [notifyStats, setNotifyStats] = useState<{ activeUsers: number | null; dailyReminderOnRate: number | null; message?: string } | null>(null)
  const [testMessage, setTestMessage] = useState('Bugünün kuponları hazır!')

  async function loadList() {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (winnersOnly) params.set('winnersOnly', 'true')
    if (start) params.set('start', start)
    if (end) params.set('end', end)
    const res = await fetch(`/api/admin/banko-coupons?${params.toString()}`, { credentials: 'include' })
    const json = await res.json()
    if (json.ok) setItems(json.data)
    setLoading(false)
  }

  async function loadStats() {
    const res = await fetch(`/api/admin/banko-coupons/stats`, { credentials: 'include' })
    const json = await res.json()
    if (json.ok) setStats(json.data)
  }

  async function loadNotifyStats() {
    const res = await fetch(`/api/admin/onesignal/stats`, { credentials: 'include' })
    const json = await res.json()
    if (json.ok) setNotifyStats(json.data)
  }

  useEffect(() => {
    loadList()
    loadStats()
    loadNotifyStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addNewMatch() {
    setNewMatches((arr) => [...arr, { homeTeam: '', awayTeam: '', prediction: '', odd: 1, result: 'PENDING' }])
  }
  function updateNewMatch(idx: number, patch: Partial<BankoMatch>) {
    setNewMatches((arr) => arr.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }
  function removeNewMatch(idx: number) {
    setNewMatches((arr) => arr.filter((_, i) => i !== idx))
  }

  async function submitCreate() {
    const payload = {
      title: newTitle,
      date: new Date(newDate).toISOString(),
      isActive: newPublish,
      matches: newMatches.map((m) => ({
        ...m,
        startTime: m.startTime ? new Date(m.startTime).toISOString() : undefined,
      })),
    }
    const res = await fetch('/api/admin/banko-coupons', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.ok) {
      setCreateOpen(false)
      setNewMatches([])
      setNewTitle('Banko Kupon #1')
      setNewDate(new Date().toISOString().substring(0, 10))
      setNewPublish(true)
      await loadList()
    } else {
      alert(json.error || 'Hata')
    }
  }

  function openEdit(c: BankoCoupon) {
    setEditing(c)
    setEditTitle(c.title || '')
    setEditDate(c.date.substring(0, 10))
    setEditMatches((c.matches || []).map((m) => ({ ...m, startTime: m.startTime ? new Date(m.startTime).toISOString().substring(0, 16) : '' })))
    setEditPublish(c.isActive)
    setEditOpen(true)
  }
  function addEditMatch() {
    setEditMatches((arr) => [...arr, { homeTeam: '', awayTeam: '', prediction: '', odd: 1, result: 'PENDING' }])
  }
  function updateEditMatch(idx: number, patch: Partial<BankoMatch>) {
    setEditMatches((arr) => arr.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }
  function removeEditMatch(idx: number) {
    setEditMatches((arr) => arr.filter((_, i) => i !== idx))
  }

  async function submitEdit() {
    if (!editing) return
    const payload = {
      title: editTitle,
      date: new Date(editDate).toISOString(),
      isActive: editPublish,
      recalculate: true,
      matches: editMatches.map((m) => ({
        ...m,
        startTime: m.startTime ? new Date(m.startTime).toISOString() : undefined,
      })),
    }
    const isDemo = editing.id?.startsWith('demo-')
    const endpoint = isDemo ? '/api/admin/banko-coupons' : `/api/admin/banko-coupons/${editing.id}`
    const method = isDemo ? 'POST' : 'PATCH'
    const res = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.ok) {
      setEditOpen(false)
      setEditing(null)
      await loadList()
    } else {
      alert(json.error || 'Hata')
    }
  }

  async function archiveCoupon(id: string) {
    const res = await fetch(`/api/admin/banko-coupons/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    const json = await res.json()
    if (json.ok) await loadList()
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Kuponu silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/banko-coupons/${id}`, { method: 'DELETE', credentials: 'include' })
    const json = await res.json()
    if (json.ok) await loadList()
  }

  const trustPct = (c: BankoCoupon) => (c.upVotes + c.downVotes > 0 ? Math.round((c.upVotes / (c.upVotes + c.downVotes)) * 100) : 0)

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin: Banko Kuponlar</h1>
        <button className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => setCreateOpen(true)}>
          + Yeni Kupon
        </button>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-600">Son 7 gün başarı</div>
          <div className="text-2xl font-bold">{stats ? `${stats.successRate7d}%` : '-'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-600">Ortalama toplam oran</div>
          <div className="text-2xl font-bold">{stats?.avgTotalOdd7d ?? '-'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-600">Günlük aktif oy</div>
          <div className="text-2xl font-bold">{stats ? stats.todayVotes : '-'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-600">Kazandırma grafiği</div>
          <div className="h-16">
            {stats && (
              <svg viewBox="0 0 100 40" className="w-full h-full">
                {(() => {
                  const max = Math.max(...stats.winSeries.map((d) => d.total), 1)
                  const points = stats.winSeries.map((d, i) => {
                    const x = (i / Math.max(stats.winSeries.length - 1, 1)) * 100
                    const y = 40 - (d.won / max) * 38
                    return `${x},${y}`
                  })
                  return <polyline fill="none" stroke="#10b981" strokeWidth={2} points={points.join(' ')} />
                })()}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-sm">Arama</label>
          <input className="w-full border rounded px-3 py-2" placeholder="Takım adı veya tahmin" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Durum</label>
          <select className="w-full border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Hepsi</option>
            <option value="PENDING">Beklemede</option>
            <option value="WON">Kazandı</option>
            <option value="LOST">Kaybetti</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Başlangıç</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Bitiş</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="winners-only" type="checkbox" checked={winnersOnly} onChange={(e) => setWinnersOnly(e.target.checked)} />
          <label htmlFor="winners-only" className="text-sm">Sadece Kazananlar</label>
          <button className="ml-auto px-3 py-2 bg-blue-600 text-white rounded" onClick={loadList}>Uygula</button>
        </div>
      </div>

      {/* Listing Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-2 text-left">Tarih</th>
              <th className="p-2 text-left">Kupon</th>
              <th className="p-2 text-left">Toplam Oran</th>
              <th className="p-2 text-left">Durum</th>
              <th className="p-2 text-left">Maç Sayısı</th>
              <th className="p-2 text-left">Topluluk Güveni</th>
              <th className="p-2 text-left">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{fmtDate(c.date)}</td>
                <td className="p-2">{c.title || '-'}</td>
                <td className="p-2">{c.totalOdd ?? '-'}</td>
                <td className="p-2">
                  <span className={
                    c.status === 'WON' ? 'px-2 py-1 rounded bg-emerald-100 text-emerald-700' : c.status === 'LOST' ? 'px-2 py-1 rounded bg-red-100 text-red-700' : 'px-2 py-1 rounded bg-gray-100 text-gray-700'
                  }>{c.status}</span>
                </td>
                <td className="p-2">{c.matchCount}</td>
                <td className="p-2">%{trustPct(c)}</td>
                <td className="p-2 flex gap-2">
                  <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => openEdit(c)}>Düzenle</button>
                  <button className="px-2 py-1 bg-yellow-600 text-white rounded" onClick={() => archiveCoupon(c.id)} disabled={!c.isActive}>Arşive Taşı</button>
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteCoupon(c.id)}>Sil</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">Kayıt bulunamadı</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-background text-foreground w-full max-w-3xl rounded-lg p-6 shadow-lg">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-lg font-semibold">Yeni Kupon Oluştur</div>
              <button className="px-3 py-2 rounded-md border" onClick={() => setCreateOpen(false)}>Kapat</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium">Kupon Adı / Sırası</label>
                  <input className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Yayın Tarihi</label>
                  <input type="date" className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Toplam Oran</label>
                  <div className="px-3 py-2 border border-border rounded-md bg-muted/40 text-foreground">{newTotalOdd}</div>
                </div>
                <div className="md:col-span-3 flex items-center gap-2">
                  <input id="new-publish" type="checkbox" checked={newPublish} onChange={(e) => setNewPublish(e.target.checked)} />
                  <label htmlFor="new-publish" className="text-sm">Yayınla (işaret kaldırılırsa taslak olarak kaydedilir)</label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Maçlar</div>
                  <button className="px-3 py-2 rounded-md border" onClick={addNewMatch}>+ Maç Ekle</button>
                </div>
                <div className="space-y-2">
                  {newMatches.map((m, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                      <input className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" placeholder="Ev Takımı" value={m.homeTeam} onChange={(e) => updateNewMatch(i, { homeTeam: e.target.value })} />
                      <input className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" placeholder="Deplasman" value={m.awayTeam} onChange={(e) => updateNewMatch(i, { awayTeam: e.target.value })} />
                      <input type="datetime-local" className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={m.startTime || ''} onChange={(e) => updateNewMatch(i, { startTime: e.target.value })} />
                      <select className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={m.prediction || ''} onChange={(e) => updateNewMatch(i, { prediction: e.target.value })}>
                        <option value="">Tahmin</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="KG Var">KG Var</option>
                        <option value="2.5 Üst">2.5 Üst</option>
                      </select>
                      <input type="number" step="0.01" className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" placeholder="Oran" value={m.odd ?? ''} onChange={(e) => updateNewMatch(i, { odd: parseFloat(e.target.value) })} />
                      <div className="flex gap-2">
                        <button className="px-3 py-2 rounded-md border" onClick={() => removeNewMatch(i)}>Sil</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 rounded-md border" onClick={() => setCreateOpen(false)}>İptal</button>
                <button className="px-3 py-2 rounded-md border" onClick={submitCreate}>Kaydet ve Yayınla</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editOpen && editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-background text-foreground w-full max-w-3xl rounded-lg p-6 shadow-lg">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-lg font-semibold">Kupon Düzenle</div>
              <button className="px-3 py-2 rounded-md border" onClick={() => setEditOpen(false)}>Kapat</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium">Kupon Adı / Sırası</label>
                  <input className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Yayın Tarihi</label>
                  <input type="date" className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Toplam Oran</label>
                  <div className="px-3 py-2 border border-border rounded-md bg-muted/40 text-foreground">{editTotalOdd}</div>
                </div>
                <div className="md:col-span-3 flex items-center gap-2">
                  <input id="edit-publish" type="checkbox" checked={editPublish} onChange={(e) => setEditPublish(e.target.checked)} />
                  <label htmlFor="edit-publish" className="text-sm">Yayınla (işaret kaldırılırsa taslak olarak kaydedilir)</label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Maçlar</div>
                  <button className="px-3 py-2 rounded-md border" onClick={addEditMatch}>+ Maç Ekle</button>
                </div>
                <div className="space-y-2">
                  {editMatches.map((m, i) => (
                    <div key={m.id || i} className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      <input className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" placeholder="Ev Takımı" value={m.homeTeam} onChange={(e) => updateEditMatch(i, { homeTeam: e.target.value })} />
                      <input className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" placeholder="Deplasman" value={m.awayTeam} onChange={(e) => updateEditMatch(i, { awayTeam: e.target.value })} />
                      <input type="datetime-local" className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={m.startTime || ''} onChange={(e) => updateEditMatch(i, { startTime: e.target.value })} />
                      <select className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={m.prediction || ''} onChange={(e) => updateEditMatch(i, { prediction: e.target.value })}>
                        <option value="">Tahmin</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="KG Var">KG Var</option>
                        <option value="2.5 Üst">2.5 Üst</option>
                      </select>
                      <input type="number" step="0.01" className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" placeholder="Oran" value={m.odd ?? ''} onChange={(e) => updateEditMatch(i, { odd: parseFloat(e.target.value) })} />
                      <select className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground" value={m.result || 'PENDING'} onChange={(e) => updateEditMatch(i, { result: e.target.value as MatchResult })}>
                        <option value="PENDING">Beklemede</option>
                        <option value="WON">Kazandı</option>
                        <option value="LOST">Kaybetti</option>
                        <option value="DRAW">Berabere</option>
                        <option value="CANCELLED">İptal</option>
                      </select>
                      <div className="flex gap-2">
                        <button className="px-3 py-2 rounded-md border" onClick={() => removeEditMatch(i)}>Sil</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 rounded-md border" onClick={() => setEditOpen(false)}>İptal</button>
                <button className="px-3 py-2 rounded-md border" onClick={submitEdit}>Yeniden Hesapla & Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Management */}
      <div className="p-4 border rounded">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">📢 Hatırlatma Bildirimi</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-sm text-gray-600">Aktif kullanıcı</div>
            <div className="text-xl font-bold">{notifyStats?.activeUsers ?? '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Günlük Hatırlatma Açık</div>
            <div className="text-xl font-bold">{notifyStats?.dailyReminderOnRate != null ? `${notifyStats.dailyReminderOnRate}%` : '-'}</div>
          </div>
          <div>
            {notifyStats?.message && <div className="text-xs text-gray-500">{notifyStats.message}</div>}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-sm">Test mesajı</label>
            <input className="w-full border rounded px-3 py-2" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded"
              onClick={async () => {
                const res = await fetch('/api/admin/onesignal/test-notification', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: testMessage }),
                })
                const json = await res.json()
                if (json.ok) alert('Test bildirimi gönderildi')
                else alert(json.error || 'Bildirimi gönderme hatası')
              }}
            >
              Test Bildirimi Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}