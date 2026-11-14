/* Service worker for 杜中文. Generated at build time by vite.config.ts, which
   fills in the build version and the list of app-shell files to precache. */
const VERSION = '0b2081fa59e7';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = 'runtime-v1';
const MEDIA_CACHE = 'media-v1';
const PRECACHE = [
  "./",
  "index.html",
  "assets/index-BTS_g7Md.js",
  "assets/index-B_uU1sVg.css",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-64.png"
];

const scopeUrl = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE.map(scopeUrl))),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, MEDIA_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CACHE_MEDIA') {
    event.waitUntil(cacheMedia(event.data.urls || []));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req));
  } else if (/\.(mp3|vtt)$/i.test(url.pathname)) {
    event.respondWith(mediaResponse(event));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirstPage(req) {
  try {
    // Ask the server every time rather than reusing the browser's HTTP cache
    // (GitHub Pages lets it keep pages for 10 minutes), so a new deploy shows
    // up on the next reload.
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) (await caches.open(SHELL_CACHE)).put(scopeUrl('./index.html'), res.clone());
    return res;
  } catch {
    return (await caches.match(scopeUrl('./index.html'))) || Response.error();
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') (await caches.open(RUNTIME_CACHE)).put(req, res.clone());
  return res;
}

/* Audio: serve from the cache when we have the whole file (answering Range
   requests by slicing it), otherwise stream from the network and fetch the
   full file into the cache in the background so it works offline next time. */
async function mediaResponse(event) {
  const req = event.request;
  const key = stripQuery(req.url);
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(key);
  if (cached) return rangeFrom(cached, req.headers.get('range'));

  event.waitUntil(cacheMedia([key]));
  try {
    return await fetch(req);
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

const inflight = new Map();
function cacheMedia(urls) {
  return Promise.all(urls.map((u) => {
    const key = stripQuery(scopeUrl(u));
    if (!inflight.has(key)) {
      inflight.set(key, (async () => {
        const cache = await caches.open(MEDIA_CACHE);
        if (await cache.match(key)) return;
        const res = await fetch(key);
        if (res.status === 200) await cache.put(key, res);
      })().catch(() => {}).finally(() => inflight.delete(key)));
    }
    return inflight.get(key);
  }));
}

async function rangeFrom(response, range) {
  if (!range) return response;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return response;
  const blob = await response.blob();
  const size = blob.size;
  let start = m[1] === '' ? size - Number(m[2]) : Number(m[1]);
  let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(end, size - 1);
  if (start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

function stripQuery(u) {
  const url = new URL(u);
  url.search = '';
  url.hash = '';
  return url.href;
}
