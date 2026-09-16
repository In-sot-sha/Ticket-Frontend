// Runs inside the generated service worker.
// When a new build activates, reload open windows onto that build.
// Otherwise the old page keeps old file names, those files 404, and the app stays blank.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      await Promise.all(
        windows.map(async (client) => {
          if (!client.url || typeof client.navigate !== 'function') return
          try {
            await client.navigate(client.url)
          } catch {
            // Page script will reload on controllerchange if navigate is blocked.
          }
        }),
      )
    })(),
  )
})
