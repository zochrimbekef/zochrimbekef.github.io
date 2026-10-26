// מאפשר לאפליקציה להיפתח גם בלי אינטרנט. deploy.sh מחליף את CACHE בכל העלאה, וכך מגיעה גרסה חדשה.
const CACHE = 'zochrim-20261026132121';
const FILES = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/db.js', 'js/sync.js', 'js/news.js', 'js/track.js', 'js/bank1.js', 'js/bank2.js', 'vendor/supabase.js', 'guide/',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('zochrim-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// מהעותק השמור מיד, ובמקביל מביאים מהרשת עותק חדש לפעם הבאה
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const url = new URL(e.request.url);
  // קוד האפליקציה (index, js, css) מתחלף רק כיחידה אחת, כשמותקנת גרסה חדשה של הקובץ הזה (CACHE חדש).
  // רענון ברקע של קובץ בודד יוצר טעינה "חצי-מעודכנת" (index ישן + app.js חדש) שקורסת
  const code = /(^|\/)(index\.html)?$|\.(js|css|webmanifest)$/.test(url.pathname) && !url.pathname.includes('/vendor/');
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' });
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok && !(code && hit)) c.put(e.request, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match('index.html'));
  }));
});
