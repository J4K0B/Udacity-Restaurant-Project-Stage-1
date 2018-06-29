const cacheName = "restaurant-reviews-v12";
const urlsToCache = [
  "./index.html",
  // "/js/main.js",
  // "/js/dbhelper.js",
  // "/js/idb.js",
  // "/js/restaurant_info.js",
  // "./css/styles.css",
  "./css/styles.min.css",
  "./img/1.jpg",
  "./img/2.jpg",
  "./img/3.jpg",
  "./img/4.jpg",
  "./img/5.jpg",
  "./img/6.jpg",
  "./img/7.jpg",
  "./img/8.jpg",
  "./img/9.jpg",
  "./img/10.jpg",
  "./manifest.json",
  "./restaurant.html",
  "./",
  "./js/db.min.js",
  "./js/main.min.js",
  "./js/restaurant_info.min.js"
];

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(urlsToCache))
  );
});
