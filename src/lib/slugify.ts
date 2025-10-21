// Türkçe uyumlu slugify
// Varsayılan: boşlukları ve özel karakterleri kaldırır, yalnızca [a-z0-9]
// İsteğe bağlı: withHyphens=true ile boşlukları tireye çevirir
export function slugifyTr(input: string, opts?: { withHyphens?: boolean; maxLen?: number }): string {
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
    // Yaygın aksanlar
    'â': 'a', 'Â': 'a',
    'ê': 'e', 'Ê': 'e',
    'î': 'i', 'Î': 'i',
    'ô': 'o', 'Ô': 'o',
    'û': 'u', 'Û': 'u',
  }

  let s = (input || '').normalize('NFKD')
  s = s
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()

  if (opts?.withHyphens) {
    s = s.replace(/[^a-z0-9]+/g, '-')
    s = s.replace(/(^-|-$)+/g, '')
  } else {
    s = s.replace(/[^a-z0-9]+/g, '')
  }

  if (opts?.maxLen && opts.maxLen > 0) s = s.slice(0, opts.maxLen)

  return s || 'marka'
}