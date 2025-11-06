"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-6 md:pt-4 pb-8 w-full space-y-8 md:pl-72">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gold text-center">Gruplar yükleniyor…</h1>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className="rounded-lg border bg-background/60 p-3">
              <Skeleton className="h-4 w-32" />
              <div className="mt-2">
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="relative border border-border rounded-lg p-4 flex flex-col items-center text-center gap-3 bg-card">
            <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center">
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}