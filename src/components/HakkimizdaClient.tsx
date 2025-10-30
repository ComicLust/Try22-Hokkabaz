'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Shield, Award, CalendarCheck2, UserCircle } from 'lucide-react'
import Image from 'next/image'

export default function HakkimizdaClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-neutral-900 text-white">
      <Header currentPath="/hakkimizda" />

      <section className="relative overflow-hidden md:pl-72">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <Badge className="rounded-full bg-black/40 border border-yellow-500/30 text-yellow-300 px-4 py-1 text-xs sm:text-sm">2024’ten beri</Badge>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Hakkımızda</h1>
            <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
              2024 yılından bu yana; alanında uzman 6 kişilik ekibimizle, güvenilir ve
              şeffaf yaklaşımımızla topluluğumuza değer katıyoruz. Operasyonlarımız
              kurumsal standartlarda yönetiliyor ve kullanıcı deneyimini merkeze alıyoruz.
            </p>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-300 text-base">
                  <CalendarCheck2 className="w-4 h-4" /> Kuruluş
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-semibold">2024</p>
                <p className="text-sm text-neutral-400">Faaliyete başlama</p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-300 text-base">
                  <Users className="w-4 h-4" /> Ekip
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-semibold">6 kişi</p>
                <p className="text-sm text-neutral-400">Deneyimli çekirdek kadro</p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-300 text-base">
                  <UserCircle className="w-4 h-4" /> Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-semibold">DarlyDixon</p>
                <p className="text-sm text-neutral-400">Topluluk yöneticisi</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-neutral-950/60 border-yellow-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-yellow-300">Kurumsal Yaklaşım</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-neutral-300">
                  <p>
                    Operasyonlarımızı kurumsal ilkeler doğrultusunda yönetiyoruz. Planlama, ölçümleme ve
                    sürekli iyileştirme süreçlerimiz; şeffaflık ve güven üzerine inşa edilmiştir.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-yellow-300 shrink-0" />
                      <div>
                        <p className="font-semibold">Güven ve Şeffaflık</p>
                        <p className="text-sm text-neutral-400">Açık iletişim, net kriterler ve doğrulanabilir içerik.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Award className="w-5 h-5 text-yellow-300 shrink-0" />
                      <div>
                        <p className="font-semibold">Kalite Standartları</p>
                        <p className="text-sm text-neutral-400">Süreç ve içerik kalitesinde tutarlılık.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="w-5 h-5 text-yellow-300 shrink-0" />
                      <div>
                        <p className="font-semibold">Topluluk Odağı</p>
                        <p className="text-sm text-neutral-400">Kullanıcı deneyimi ve geri bildirim odaklı gelişim.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Yönetim</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-yellow-500/30">
                    <Image src="/images/agentgman.jpg" alt="DarlyDixon" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold">DarlyDixon</p>
                    <p className="text-sm text-neutral-400">Admin / Topluluk Yöneticisi</p>
                  </div>
                </div>
                <p className="mt-4 text-neutral-300 text-sm">
                  DarlyDixon, stratejik karar süreçlerini koordine eder ve toplulukla düzenli iletişim
                  kurarak operasyonların kurumsal standartlarda ilerlemesini sağlar.
                </p>
                <div className="mt-2">
                  <a href="https://t.me/darlydxn" target="_blank" rel="noopener noreferrer" className="text-yellow-300 text-sm hover:text-yellow-200">@darlydxn</a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Misyon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  Kullanıcılarımıza doğru, güncel ve güvenilir bilgiyi kurumsal bir dille sunmak; deneyimi
                  sade ve erişilebilir kılmak.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Vizyon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  Topluluğumuzla birlikte sürdürülebilir büyüme sağlamak ve bulunduğumuz alanda
                  güvenilir referans noktası olmak.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg" asChild>
              <a href="/iletisim">Bize Ulaşın</a>
            </Button>
            <p className="mt-2 text-xs text-neutral-400">Kurumsal iş birlikleri için iletişime geçebilirsiniz.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}