// חשבון ושמירה בענן — אותו חשבון כמו "כסף בכיף" ו"זמן בכיף" (אותו מייל וסיסמה).
// כל המצב של המשתמש (הגן, הרצף, הזרעים) נשמר בשורה אחת בטבלה zochrim_state. כל משתמש רואה רק את השורה שלו.
import { BDIKA } from './db.js';
import * as track from './track.js';

const CONFIG = {
  url: 'https://dmhxovlepdoobkoiyjhj.supabase.co',
  // מפתח ציבורי (anon). האבטחה נשמרת בהרשאות שבשרת (RLS).
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtaHhvdmxlcGRvb2Jrb2l5amhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDUxNDIsImV4cCI6MjEwNzkyMTE0Mn0.qao1CRL1QWJhMnWsAaPXKt-WxbgySqIlH68iIdCYH1o',
};
export const APP = 'zochrim';
// 📊 לוח הבקרה: מתי נפתחה, האם מותקנת, סוג הטלפון ותקלות. בלי תוכן. (במחשב של המפתח, localhost, לא נשלח)
if (!BDIKA) track.init({ app: APP, url: CONFIG.url, key: CONFIG.key });
let sb = null, me = null, loading = null;
export const user = () => me;

function loadLib() {
  if (window.supabase) return Promise.resolve();
  loading ??= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'vendor/supabase.js'; s.onload = res; s.onerror = () => { loading = null; rej(new Error('lib')); };
    document.head.appendChild(s);
  });
  return loading;
}
async function client() {
  if (BDIKA) throw new Error('במצב הדגמה לא מתחברים לענן');
  if (sb) return sb;
  await loadLib();
  sb = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { persistSession: true, autoRefreshToken: true } });
  return sb;
}

const HEB = {
  'Invalid login credentials': 'המייל או הסיסמה לא נכונים',
  'User already registered': 'המייל הזה כבר רשום. נסה "כניסה"',
  'Password should be at least 6 characters': 'הסיסמה צריכה להיות לפחות 6 תווים',
  'Email not confirmed': 'צריך לאשר את המייל שנשלח אליך, ואז להיכנס',
  'Unable to validate email address': 'כתובת המייל לא תקינה',
};
const nice = e => {
  const m = e?.message || String(e);
  const k = Object.keys(HEB).find(x => m.includes(x));
  return k ? HEB[k] : (/fetch|network|load failed/i.test(m) ? 'אין חיבור לאינטרנט' : m);
};

export async function currentUser() {
  const c = await client();
  me = (await c.auth.getSession()).data.session?.user || null;
  if (me) track.ping(c);
  return me;
}
/** כשהמשתמש חוזר מקישור "שכחתי סיסמה" במייל */
export async function onRecovery(fn) {
  const c = await client();
  c.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') fn(); });
}
export async function signIn(email, password) {
  const { error } = await (await client()).auth.signInWithPassword({ email, password });
  if (error) { track.fail('auth', error.status || error.message); throw new Error(nice(error)); }
  await currentUser(); track.ping(sb); return me;
}
export async function signUp(email, password) {
  const { data, error } = await (await client()).auth.signUp({ email, password });
  if (error) throw new Error(nice(error));
  if (!data.session) throw new Error(HEB['Email not confirmed']);
  return currentUser();
}
export async function resetPassword(email) {
  const { error } = await (await client()).auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) throw new Error(nice(error));
}
export async function setPassword(password) {
  const { error } = await (await client()).auth.updateUser({ password });
  if (error) throw new Error(nice(error));
}
export async function signOut() {
  await (await client()).auth.signOut();
  me = null;
}

// ---------- המצב בענן ----------
// cloud = 'ok' | 'off' (הטבלה עוד לא קיימת / אין אינטרנט) — האפליקציה ממשיכה לעבוד מהטלפון
export let cloud = 'off';
export async function pull() {
  if (!me) return null;
  try {
    const { data, error } = await (await client()).from('zochrim_state').select('data, updated_at').eq('user_id', me.id).maybeSingle();
    if (error) throw error;
    cloud = 'ok';
    return data?.data || null;
  } catch { cloud = 'off'; return null; }
}
let pushT = null, pushing = null;
/** שולח לענן את המצב (מאוחד), חצי שנייה אחרי השינוי האחרון */
export function push(state) {
  if (!me || BDIKA) return;
  clearTimeout(pushT);
  pushT = setTimeout(async () => {
    try {
      pushing = (await client()).from('zochrim_state').upsert({ user_id: me.id, data: state, updated_at: new Date().toISOString() });
      const { error } = await pushing;
      cloud = error ? 'off' : 'ok';
    } catch { cloud = 'off'; }
  }, 600);
}

// ---------- הערות (טבלת feedback המשותפת, עם app='zochrim') ----------
export async function saveFeedback(f) {
  if (!me) return false;
  try {
    const { error } = await (await client()).from('feedback').insert({ user_id: me.id, app: APP, ...f });
    return !error;
  } catch { return false; }
}
