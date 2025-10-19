"use client"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3 p-4">
      <div className="text-sm font-semibold text-destructive">Bir hata oluştu</div>
      <div className="text-sm text-muted-foreground">{error?.message ?? "Bilinmeyen hata"}</div>
      <div>
        <Button variant="outline" onClick={() => reset()}>Tekrar dene</Button>
      </div>
    </div>
  )
}