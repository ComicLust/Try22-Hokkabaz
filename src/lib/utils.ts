import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// DiceBear tabanlı yorum avatarı URL üreteci (yorumlarda kullanılan stile uyumlu)
export interface AvatarOptions { size?: number; radius?: number; backgroundType?: 'gradientLinear' | 'solid' }

export function getCommentAvatarUrl(seed: string, opts?: AvatarOptions): string {
  const size = opts?.size ?? 64
  const radius = opts?.radius ?? 50
  const backgroundType = opts?.backgroundType ?? 'gradientLinear'
  const s = encodeURIComponent((seed || 'user').trim())
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${s}&size=${size}&radius=${radius}&backgroundType=${backgroundType}`
}
