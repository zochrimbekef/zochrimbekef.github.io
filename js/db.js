// שמירה בתוך הטלפון (IndexedDB). נשמר גם בלי אינטרנט ואחרי סגירת האפליקציה.
// 📱 עמדת בדיקה (?bdika=1): נכנסים ישר להדגמה, בלי חשבון, בלי חלונות קופצים ובלי שרת. הכל רק בזיכרון.
const qs = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(); } })();
export const BDIKA = qs.get('bdika') === '1';
export const NEWS_JUMP = qs.get('news') || '';
const DB_NAME = 'zochrim-bekef';
const MEM = new Map();
let dbp;

function open() {
  dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
const done = req => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export async function get(key, fallback) {
  if (BDIKA) return MEM.has(key) ? structuredClone(MEM.get(key)) : fallback;
  try { const v = await done((await open()).transaction('kv').objectStore('kv').get(key)); return v === undefined ? fallback : v; }
  catch { return fallback; }
}
export async function set(key, val) {
  if (BDIKA) { MEM.set(key, structuredClone(val)); return; }
  try { await done((await open()).transaction('kv', 'readwrite').objectStore('kv').put(val, key)); } catch { /* מצב פרטי */ }
}
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
