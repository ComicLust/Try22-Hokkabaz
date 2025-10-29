'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Megaphone, PlayCircle, BarChart3, Send, MessageSquare, Mail, Users, Shield, Calendar, TrendingUp, Target, Award, Zap } from 'lucide-react'

export default function HizmetlerimizClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-neutral-900 text-white">
      <Header currentPath="/hizmetlerimiz" />

      <section className="relative overflow-hidden md:pl-72">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <Badge className="rounded-full bg-black/40 border border-yellow-500/30 text-yellow-300 px-4 py-1 text-xs sm:text-sm">Kurumsal Hizmetler</Badge>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Hizmetlerimiz</h1>
            <p className="mt-4 text-neutral-300 max-w-3xl mx-auto">
              Temel faaliyet alanlarımız; performans ve sürdürülebilir büyüme odağında planlanır,
              ölçümlenir ve kurumsal standartlarda yönetilir. <span className="text-yellow-300 font-semibold">3 milyon kişilik veri tabanımız</span> ve 
              <span className="text-yellow-300 font-semibold"> 300 bin aktif Telegram kullanıcısı</span> ile hedeflenebilir kitle büyüklüğümüz sektörde öncü konumdadır.
            </p>
          </motion.div>

          {/* İstatistikler ve Büyüme Göstergeleri */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30 text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-8 h-8 text-yellow-300" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-300">3M+</div>
                  <div className="text-sm text-neutral-400">Veri Tabanı</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <Send className="w-8 h-8 text-blue-300" />
                  </div>
                  <div className="text-2xl font-bold text-blue-300">300K+</div>
                  <div className="text-sm text-neutral-400">Aktif Telegram</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-8 h-8 text-green-300" />
                  </div>
                  <div className="text-2xl font-bold text-green-300">%85+</div>
                  <div className="text-sm text-neutral-400">Başarı Oranı</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30 text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-8 h-8 text-purple-300" />
                  </div>
                  <div className="text-2xl font-bold text-purple-300">100%</div>
                  <div className="text-sm text-neutral-400">Yatırımcı Garantisi</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Hedeflenebilir Meta Kitlesi */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-16">
            <Card className="bg-gradient-to-r from-neutral-950/80 to-neutral-900/60 border-yellow-500/30">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-yellow-300 flex items-center justify-center gap-2">
                  <Target className="w-6 h-6" />
                  Hedeflenebilir Meta Kitlesi
                </CardTitle>
                <p className="text-neutral-300">Veri odaklı segmentasyon ile doğru kitleye ulaşım</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-3">
                      <Users className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                      <h3 className="font-semibold text-blue-300">Demografik Segmentasyon</h3>
                    </div>
                    <ul className="text-sm text-neutral-300 space-y-1">
                      <li>• 18-45 yaş arası aktif kullanıcılar</li>
                      <li>• Coğrafi konum bazlı hedefleme</li>
                      <li>• Gelir seviyesi segmentasyonu</li>
                      <li>• Eğitim durumu filtreleme</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-3">
                      <BarChart3 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-300">Davranışsal Analiz</h3>
                    </div>
                    <ul className="text-sm text-neutral-300 space-y-1">
                      <li>• Online alışveriş geçmişi</li>
                      <li>• Platform kullanım sıklığı</li>
                      <li>• İçerik etkileşim oranları</li>
                      <li>• Satın alma döngüsü analizi</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-3">
                      <Zap className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                      <h3 className="font-semibold text-purple-300">İlgi Alanı Hedefleme</h3>
                    </div>
                    <ul className="text-sm text-neutral-300 space-y-1">
                      <li>• Spor bahisleri ve casino</li>
                      <li>• E-ticaret ve alışveriş</li>
                      <li>• Teknoloji ve oyun</li>
                      <li>• Finans ve yatırım</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Temel Faaliyet Alanları */}
            <Card className="bg-neutral-950/60 border-yellow-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-yellow-300 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Temel Faaliyet Alanları
                </CardTitle>
                <p className="text-neutral-400 text-sm">Performans odaklı dijital pazarlama hizmetleri</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">Google SEO</p>
                      <p className="text-sm text-neutral-400">Organik görünürlük ve teknik/ içerik odaklı SEO süreçleri.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">Meta Ads</p>
                      <p className="text-sm text-neutral-400">Facebook/Instagram kampanya yönetimi ve dönüşüm optimizasyonu.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <PlayCircle className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">TikTok Ads</p>
                      <p className="text-sm text-neutral-400">Kısa video ekosisteminde performans odaklı reklam yönetimi.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">Google Ads</p>
                      <p className="text-sm text-neutral-400">Arama, Görüntülü ve Video kampanyalarında incremental büyüme.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Send className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">Telegram Organik Grup Büyütme</p>
                      <p className="text-sm text-neutral-400">Etkinlik temelli etkileşim stratejileri ile sürdürülebilir büyüme.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">SMS Marketing</p>
                      <p className="text-sm text-neutral-400">Segmentasyon odaklı kitlelere uygun mesaj akışları.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <p className="font-semibold">E-mail Marketing</p>
                      <p className="text-sm text-neutral-400">Uygun içerik ve zamanlama ile yatırımcı garantili geri dönüş.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Güvence ve Veri */}
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Güvence ve Veri Altyapısı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-neutral-300 text-sm">
                  <p className="flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-300" /> Yatırımcı garantili geri dönüş prensibiyle, sabit ücret modeli üzerinden hizmet sunuyoruz.</p>
                  <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-yellow-300" /> Eylül ayına ait 3 milyon kişilik güncel veri tabanımız mevcuttur.</p>
                  <p className="text-neutral-400">Operasyonlarımız GDPR ve yerel regülasyonlara uygun şekilde yürütülmektedir.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Büyüme Chartı ve Performans Göstergeleri */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="mt-16">
            <Card className="bg-gradient-to-br from-neutral-950/80 to-neutral-900/60 border-green-500/30">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-300 flex items-center justify-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Büyüme Performansı & ROI Göstergeleri
                </CardTitle>
                <p className="text-neutral-300">Son 12 ayda elde edilen başarı metrikleri</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Büyüme Chartı Simülasyonu */}
                  <div>
                    <h3 className="text-lg font-semibold text-green-300 mb-4">Aylık Büyüme Trendi</h3>
                    <div className="bg-neutral-900/50 rounded-lg p-4 border border-green-500/20">
                      <div className="flex items-end justify-between h-32 gap-2">
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500/30 w-6 h-8 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Oca</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500/40 w-6 h-12 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Şub</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500/50 w-6 h-16 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Mar</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500/60 w-6 h-20 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Nis</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500/70 w-6 h-24 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">May</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500/80 w-6 h-28 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Haz</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500 w-6 h-32 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Tem</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-400 w-6 h-30 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Ağu</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-300 w-6 h-32 rounded-t"></div>
                          <span className="text-xs text-neutral-400 mt-1">Eyl</span>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-sm text-green-300">%340 büyüme (9 aylık dönem)</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performans Metrikleri */}
                  <div>
                    <h3 className="text-lg font-semibold text-green-300 mb-4">Anahtar Performans Göstergeleri</h3>
                    <div className="space-y-4">
                      <div className="bg-neutral-900/50 rounded-lg p-4 border border-green-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-300">Ortalama ROI</span>
                          <span className="text-green-300 font-bold">%285</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                      </div>
                      <div className="bg-neutral-900/50 rounded-lg p-4 border border-blue-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-300">Müşteri Memnuniyeti</span>
                          <span className="text-blue-300 font-bold">%92</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                        </div>
                      </div>
                      <div className="bg-neutral-900/50 rounded-lg p-4 border border-yellow-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-300">Proje Tamamlama</span>
                          <span className="text-yellow-300 font-bold">%98</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-2 mt-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: '98%'}}></div>
                        </div>
                      </div>
                      <div className="bg-neutral-900/50 rounded-lg p-4 border border-purple-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-300">Tekrar Çalışma Oranı</span>
                          <span className="text-purple-300 font-bold">%76</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-2 mt-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: '76%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Telegram Topluluk Büyütme */}
            <Card className="bg-neutral-950/60 border-yellow-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-yellow-300 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Telegram Topluluk Büyütme
                </CardTitle>
                <p className="text-neutral-400 text-sm">Organik büyüme stratejileri ve topluluk yönetimi</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-neutral-300">
                  <p>
                    Yeni kurulan Telegram topluluğumuz <span className="text-yellow-300">@HokkabazSohbet</span> platformunu organik büyüme
                    stratejileri ile geliştiriyoruz. Etkinlik temelli etkileşim kurguları ile kullanıcıları
                    markalarla buluşturan, sürdürülebilir topluluk dinamikleri oluşturuyoruz.
                  </p>
                  <p className="text-sm text-neutral-400">
                    Örnek kampanya: “Bombahis Telegram grubuna katıl, 5 mesaj yaz ve Bombahis’te geçerli 200 TL Free Spin kazan!”. Bu yaklaşım, katılımcıların aktif kalmasını sağlar ve organik büyümeyi destekler.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-300 text-sm">
                    <li>Farklı sitelerden aylık düzenli data akışı sağlanır.</li>
                    <li>300 bin kişilik aktif Telegram kullanıcı adı listesi ile hedeflenebilir kitle.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* İletişim CTA */}
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Kurumsal İletişim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300 text-sm">İşbirliği ve sponsorluk talepleri için kurumsal kanaldan ilerlenir.</p>
                <div className="mt-4">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg" asChild>
                    <a href="/iletisim">İşbirliği için iletişime geç</a>
                  </Button>
                  <p className="mt-2 text-xs text-neutral-400">Form yok. Görüşmeler Telegram üzerinden yürütülür.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Özet ve Çağrı Bölümü */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="mt-16">
            <Card className="bg-gradient-to-r from-yellow-500/10 via-neutral-950/80 to-yellow-500/10 border-yellow-500/30">
              <CardContent className="pt-8">
                <div className="text-center max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold text-yellow-300 mb-4">Neden Bizimle Çalışmalısınız?</h2>
                  <p className="text-neutral-300 text-lg mb-8">
                    Sektörde öncü konumumuz, kanıtlanmış başarı oranlarımız ve yatırımcı garantili geri dönüş modelimiz ile 
                    markanızın dijital büyümesinde güvenilir partneriniziz.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center">
                      <div className="bg-yellow-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-8 h-8 text-yellow-300" />
                      </div>
                      <h3 className="font-semibold text-yellow-300 mb-2">Garantili Sonuç</h3>
                      <p className="text-sm text-neutral-400">Yatırımcı garantili geri dönüş prensibi ile çalışıyoruz</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-green-300" />
                      </div>
                      <h3 className="font-semibold text-green-300 mb-2">Kanıtlanmış Büyüme</h3>
                      <p className="text-sm text-neutral-400">%340 büyüme oranı ve %285 ortalama ROI</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-blue-300" />
                      </div>
                      <h3 className="font-semibold text-blue-300 mb-2">Geniş Erişim</h3>
                      <p className="text-sm text-neutral-400">3M+ veri tabanı ve 300K+ aktif Telegram kullanıcısı</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button className="gold-gradient neon-button text-black font-semibold px-8 py-3" asChild>
                      <a href="/iletisim">Hemen Başlayalım</a>
                    </Button>
                    <Button variant="outline" className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 px-8 py-3" asChild>
                      <a href="/hakkimizda">Daha Fazla Bilgi</a>
                    </Button>
                  </div>
                  
                  <p className="text-xs text-neutral-500 mt-6">
                    Bu sayfa paylaşılabilir. Potansiyel iş ortaklarınızla direkt olarak paylaşabilirsiniz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  )
}