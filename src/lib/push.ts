import webPush from 'web-push'

let VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || ''
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

// In development, auto-generate VAPID keys if not configured
if ((!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) && process.env.NODE_ENV !== 'production') {
  const { publicKey, privateKey } = webPush.generateVAPIDKeys()
  VAPID_PUBLIC_KEY = publicKey
  VAPID_PRIVATE_KEY = privateKey
  // Do not mutate process.env here; Next.js may inline env values
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  } catch {
    // invalid keys will surface at send time; ignore here
  }
}

export { webPush, VAPID_PUBLIC_KEY }