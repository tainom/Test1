const CACHE_NAME = "overlay-cache-v1";
const ASSETS = [
  "index.html",
  "style.css",
  "script.js",
  "Output\\cat_2\\default\\front.png",
  "Output\\cat_9\\default\\front.png",
  "Output\\cheer_1\\default\\front.png",
  "Output\\cheer_2\\default\\front.png",
  "Output\\cheer_3\\default\\front.png",
  "Output\\cheer_4\\default\\front.png",
  "Output\\cheer_5\\default\\front.png",
  "Output\\cheer_6\\default\\front.png",
  "Output\\jump_4\\default\\front.png",
  "Output\\jump_5\\default\\front.png",
  "Output\\piece_3\\default\\front.png",
  "manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});