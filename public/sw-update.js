// Runs inside the generated service worker.
// When a new build activates, claim clients and gently update windows if online.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      // If we are offline, do NOT force window navigations to avoid breaking offline state
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return;
      }
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      await Promise.all(
        windows.map(async (client) => {
          if (!client.url || typeof client.navigate !== 'function') return;
          try {
            await client.navigate(client.url);
          } catch {
            // Handled by controllerchange on page
          }
        })
      );
    })()
  );
});
