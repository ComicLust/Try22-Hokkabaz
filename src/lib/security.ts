export function sanitizeText(input: any, maxLen = 2000): string {
  let s = typeof input === 'string' ? input : String(input ?? '');
  // Strip HTML tags
  s = s.replace(/<[^>]*>/g, '');
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Limit length
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export function isSafeHttpUrl(u: any, { allowHttp = false } = {}): boolean {
  try {
    const url = typeof u === 'string' ? new URL(u) : new URL(String(u));
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (!allowHttp && url.protocol !== 'https:') return false;
    // Block javascript: or data:
    if (/^(javascript|data):/i.test(u)) return false;
    return true;
  } catch {
    return false;
  }
}

const ALLOWED_EMBED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'player.vimeo.com',
]);

export function sanitizeEmbedIframe(html: string | null | undefined): { html: string | null, src: string | null } {
  if (!html) return { html: null, src: null };
  const raw = String(html);
  // Extract src from first iframe
  const m = raw.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/i);
  const src = m?.[1] ?? null;
  if (!src) return { html: null, src: null };
  try {
    const u = new URL(src);
    if (!ALLOWED_EMBED_HOSTS.has(u.hostname)) return { html: null, src: null };
    const safeSrc = u.toString();
    const sanitized = `<iframe src="${safeSrc}" width="100%" height="480" frameborder="0" allowfullscreen referrerpolicy="strict-origin" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
    return { html: sanitized, src: safeSrc };
  } catch {
    return { html: null, src: null };
  }
}

export function isSafeLocalUploadPath(p: any): boolean {
  if (typeof p !== 'string') return false;
  if (!p.startsWith('/uploads/')) return false;
  // Prevent traversal
  if (p.includes('..') || p.includes('//')) return false;
  return true;
}

// Simple in-memory per-IP rate limiter
export function createIpRateLimiter(max: number, windowMs: number) {
  const attempts = new Map<string, { count: number; start: number }>();
  return (ip: string) => {
    const now = Date.now();
    const entry = attempts.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
      entry.count = 0;
      entry.start = now;
    }
    if (entry.count >= max) return false;
    entry.count++;
    attempts.set(ip, entry);
    return true;
  };
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '';
  return ip || 'unknown';
}