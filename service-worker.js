const cacheName = 'restaurant-reviews-v4';
const urlsToCache = [
    '/',
    '/js/main.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/css/styles.css',
    '/data/restaurants.json',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg',
]


self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request)
        })
    );
});

self.addEventListener('install', event => {
    console.log('installed');
    event.waitUntil(
        caches.open(cacheName).then( cache => cache.addAll(urlsToCache))
    )
});

