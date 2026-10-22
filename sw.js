/* =========================================================================
 * Service Worker：装到桌面后断网也能学
 *  - 应用外壳与课程数据：cache-first + 后台更新（stale-while-revalidate）
 *  - 页面导航：network-first，失败回退缓存（保证离线可打开）
 *  - 跨域请求（你接的大模型 API）：不拦截，直接放行
 * 更新内容时把 CACHE 版本号 +1 即可让老用户刷新到新版
 * ========================================================================= */
var CACHE = 'aam-v1';

var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/js/01-core.js',
  './assets/js/02-curriculum-a.js',
  './assets/js/03-curriculum-b.js',
  './assets/js/04-catalog.js',
  './assets/js/05-zh-titles.js',
  './assets/js/06-zh-p19.js',
  './assets/js/07-content-a.js',
  './assets/js/08-content-b.js',
  './assets/js/09-topics.js',
  './assets/js/10-retriever.js',
  './assets/js/11-tutor.js',
  './assets/js/12-recommend.js',
  './assets/js/13-ui.js',
  './assets/js/14-app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 大模型 API 等跨域请求不拦截

  /* 页面：优先网络，断网时用缓存里的 index.html */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (r) {
        caches.open(CACHE).then(function (c) { c.put('./index.html', r.clone()); });
        return r;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  /* 资源：先给缓存，再后台更新 */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (r) {
        if (r && r.status === 200) {
          caches.open(CACHE).then(function (c) { c.put(req, r.clone()); });
        }
        return r;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
