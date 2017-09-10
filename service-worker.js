var cacheName = 'essentialsPWA-v1';
var dataCacheName = 'essentialsPWA-v1';
var filesToCache = [
    './',
    './index.html',
    './scripts/appLogic.js',
    './styles/main.css',
    './styles/pure.css',    
    './resources/back.svg',
    './resources/loading.svg',
    './resources/refresh.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
		e.respondWith(
			caches.match(e.request).then(function(response) {
				return response || fetch(e.request);
			})
		);
});