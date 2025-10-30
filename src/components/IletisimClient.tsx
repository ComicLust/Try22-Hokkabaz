'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

const TelegramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 8.5L15 17.5C15 17.5 14.75 18.25 14 17.75L10.5 15L9 14.5L6.75 13.75C6.75 13.75 6.25 13.5 6.25 13C6.25 12.5 6.75 12.25 6.75 12.25L15.5 8.25C15.5 8.25 16.5 7.75 16.5 8.5Z" fill="currentColor"/>
  </svg>
)

export default function IletisimClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-neutral-900 text-white">
      <Header currentPath="/iletisim" />

      <section className="relative overflow-hidden md:pl-72">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <Badge className="rounded-full bg-black/40 border border-yellow-500/30 text-yellow-300 px-4 py-1 text-xs sm:text-sm">
              Yalnızca işbirliği için iletişim
            </Badge>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">İletişim</h1>
            <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
              Bu sayfa yalnızca işbirliği ve sponsorluk talepleri içindir. Devam etmeden önce işbirliği amacıyla yazdığınızı onaylamanız istenir.
            </p>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-neutral-950/60 border-yellow-500/20 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-yellow-300">Telegram’da Yazışma Önizlemesi</span>
                  <span className="text-xs sm:text-sm text-neutral-400">Admin: @darlydxn</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-8">
                       <AvatarImage src="/images/agentgman.jpg" alt="DarlyDixon" />
                       <AvatarFallback className="bg-yellow-500/20 text-yellow-300">AG</AvatarFallback>
                     </Avatar>
                    <div className="max-w-[80%] rounded-2xl bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-sm">
                      Merhaba, işbirliği ve sponsorluk taleplerini buradan alıyorum. Markanız ve hedefiniz nedir?
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm">
                      Selam! X markasıyız, kampanya için içerik partnerliği planlıyoruz. Kapsam ve bütçe konuşabilir miyiz?
                    </div>
                    <Avatar className="size-8">
                      <AvatarImage src="" alt="Kullanıcı" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src="" alt="DarlyDixon" />
                      <AvatarFallback className="bg-yellow-500/20 text-yellow-300">GV</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[80%] rounded-2xl bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-sm">
                      Harika! Kısa bir brief ve takvim paylaşabilir misiniz? Uygun bütçe aralığıyla dönüş yapayım.
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="telegram-gradient neon-button">
                        <TelegramIcon className="w-4 h-4 mr-2" /> Telegram’da Admin’e Yaz (@darlydxn)
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-950 border border-yellow-500/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Yalnızca işbirliği ve sponsorluk</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu iletişim kanalı sadece işbirliği/sponsorluk başvuruları içindir. Devam ederek işbirliği amacıyla yazdığınızı onaylamış olursunuz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => window.open('https://t.me/darlydxn', '_blank', 'noopener,noreferrer')}>Evet, işbirliği için yazıyorum</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <p className="mt-2 text-xs text-neutral-400">Yönlendirme Telegram uygulaması veya web arayüzünde açılır.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-950/60 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-300">Admin Bilgisi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="/images/agentgman.jpg" alt="DarlyDixon" />
                    <AvatarFallback className="text-lg bg-yellow-500/20 text-yellow-300">AG</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">DarlyDixon</p>
                    <p className="text-sm text-neutral-400">Telegram Admin</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-yellow-300 text-sm hover:text-yellow-200">@darlydxn</button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-neutral-950 border border-yellow-500/20">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Yalnızca işbirliği ve sponsorluk</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu kanal sadece işbirliği/sponsorluk amaçlıdır. Onaylarsanız admin’e yönlendireceğim.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => window.open('https://t.me/darlydxn', '_blank', 'noopener,noreferrer')}>Onayla ve devam et</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="mt-4 text-neutral-300 text-sm">Bu kanal yalnızca işbirliği ve sponsorluk talepleri içindir.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg">Hemen İletişime Geç</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-neutral-950 border border-yellow-500/20">
                <AlertDialogHeader>
                  <AlertDialogTitle>Yalnızca işbirliği ve sponsorluk</AlertDialogTitle>
                  <AlertDialogDescription>
                    Devam ederek işbirliği amacıyla admin ile iletişime geçeceğinizi onaylamış olursunuz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => window.open('https://t.me/darlydxn', '_blank', 'noopener,noreferrer')}>Evet, işbirliği için</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="mt-2 text-xs text-neutral-400">Form yok. Sadece Telegram üzerinden görüşme sağlıyoruz.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}