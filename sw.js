/* STOCK — Service Worker générique
   La version du cache est injectée via l'URL : ./sw.js?v=X.X.X
   Changer SCHEMA_VERSION dans index.html suffit pour forcer le rechargement. */
var CACHE = 'stock-' + (self.location.search.replace('?v=', '') || 'dev');
var URLS  = ['./'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(URLS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
  /* Notifier les clients qu'une nouvelle version est active */
  self.clients.matchAll({ type: 'window' }).then(function(clients) {
    clients.forEach(function(c) { c.postMessage({ type: 'SW_UPDATED' }); });
  });
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(res) {
        caches.open(CACHE).then(function(c) { c.put(e.request, res.clone()); });
        return res;
      }).catch(function() { return r; });
    })
  );
});
