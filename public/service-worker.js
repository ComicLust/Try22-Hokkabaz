self.addEventListener('push', (event) => {
  try {
    const data = event.data ? JSON.parse(event.data.text()) : {}
    const title = data.title || 'Bildirim'
    const body = data.body || ''
    const icon = data.icon
    const image = data.image
    const clickAction = data.clickAction
    const notificationId = data.notificationId
    const subscriberUUID = data.subscriberUUID

    event.waitUntil(
      (async () => {
        await self.registration.showNotification(title, {
          body,
          icon,
          image,
          data: { clickAction, notificationId, subscriberUUID },
        })
        if (notificationId && subscriberUUID) {
          try {
            await fetch('/api/push/event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'received', notificationId, uuid: subscriberUUID }),
            })
          } catch (e) {
            // ignore
          }
        }
      })()
    )
  } catch (e) {
    // ignore
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification?.data || {}
  const url = data.clickAction
  const notificationId = data.notificationId
  const subscriberUUID = data.subscriberUUID
  event.waitUntil(
    (async () => {
      if (notificationId && subscriberUUID) {
        try {
          await fetch('/api/push/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'clicked', notificationId, uuid: subscriberUUID }),
          })
        } catch (e) {}
      }
      if (url) {
        try {
          await clients.openWindow(url)
        } catch (e) {}
      }
    })()
  )
})