// 🌱 זוכרים בכיף — האפליקציה. חלק 1: השלד (כניסה, גן, רצף, שמירה, התקנה, מה חדש, הערות).
// התרגילים כאן עובדים כמו בדמו. ההתקדמות שלהם מיום ליום תיבנה בחלקים 2–5.
import * as db from './db.js';
import * as sync from './sync.js';
import { NEWS, LATEST } from './news.js';
import { IT, BANK, MIN_LEVEL, MAX_LEVEL, ROUNDS } from './bank1.js';
import { build, MAX2, ROUNDS2 } from './bank2.js';

// אלמנט שלא קיים (למשל בטעינה חצי-מעודכנת: index.html ישן עם app.js חדש) — מחזירים "אלמנט ריק" שבולע הכל, במקום קריסה
const NOEL = new Proxy({}, { get: (_, k) => k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false } : k === 'style' || k === 'dataset' ? {} : () => NOEL, set: () => true });
const $ = s => document.querySelector(s) || (console.warn('missing element', s), NOEL);
const has = s => !!document.querySelector(s);   // לבדיקה אם אלמנט קיים (בלי האלמנט הריק)
const V = () => $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FEEDBACK_FORM = 'afe845b5ff6d0c2cd899d08390663e7c'; // גיבוי במייל (FormSubmit), כמו בשאר האפליקציות
const FEEDBACK_TO = 'mvindish@gmail.com';

// ---------- מצב ----------
const blank = () => ({ v: 1, days: {}, seeds: [], prefs: { notice: true }, updated: 0 });
let D = blank();          // המצב שנשמר
let timers = [];
const T = { ex3tab: 'words', ex3i: 0, songLines: null, songStuck: {} }; // זמני, לא נשמר
const clearT = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; try { speechSynthesis.cancel(); curAudio?.pause(); } catch { /* */ } };

const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
const today = () => D.days[dayKey()] || {};
const didAny = k => { const x = D.days[k]; return !!(x && (x.ex1 || x.ex2 || x.ex3)); };
function streak() {
  let k = dayKey(), n = 0;
  if (!didAny(k)) k = addDays(k, -1);       // היום עוד לא תרגלת? הרצף של אתמול עדיין חי
  while (didAny(k)) { n++; k = addDays(k, -1); }
  return n;
}
const countEx = ex => Object.values(D.days).filter(x => x?.[ex]).length;
const totalDays = () => Object.keys(D.days).filter(didAny).length;

/** איחוד של מה שבטלפון ומה שבענן: ימים ושתילים מתאחדים, ושאר ההגדרות לפי מה שעודכן אחרון */
function merge(a, b) {
  if (!b) return a; if (!a) return b;
  const newer = (b.updated || 0) > (a.updated || 0) ? b : a;
  const days = { ...a.days };
  for (const [k, v] of Object.entries(b.days || {})) days[k] = { ...(days[k] || {}), ...v };
  const seeds = [...(a.seeds || [])];
  for (const s of b.seeds || []) if (!seeds.some(x => x.id === s.id)) seeds.push(s);
  return { ...blank(), ...newer, days, seeds, updated: Math.max(a.updated || 0, b.updated || 0) };
}
async function save() {
  D.updated = Date.now();
  await db.set('state', D);
  sync.push(D);
}

// ---------- כלים ----------
function toast(t, ms = 2600) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), ms); }
function go(r) { if (location.hash !== '#' + r) location.hash = r; else render(); }
window.addEventListener('hashchange', () => render());
const topbar = (t, tm) => `<div class="top"><button class="back" data-back aria-label="חזרה">→</button><h1>${t}</h1>${tm ? `<span class="tm">${tm}</span>` : ''}</div>`;
document.addEventListener('click', e => { if (e.target.closest('[data-back]')) { if (history.length > 1) history.back(); else go('home'); } });

// ---------- חלון תחתון (נסגר ב"חזור", במשיכה למטה או בלחיצה בחוץ) ----------
let sheetOpen = false;
function sheet(html, cls = '') {
  const box = $('#sheet'), card = $('#sheetCard');
  card.className = 'sheet-card ' + cls;
  card.innerHTML = `<div class="grab"></div>${html}`;
  box.classList.add('on'); card.scrollTop = 0;
  if (!sheetOpen) { sheetOpen = true; history.pushState({ sheet: 1 }, ''); }
  return card;
}
function closeSheet(fromPop) {
  if (!sheetOpen) return;
  sheetOpen = false; $('#sheet').classList.remove('on');
  if (!fromPop) history.back();
}
window.addEventListener('popstate', () => { if (sheetOpen) closeSheet(true); });
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
(() => { // משיכה למטה
  const card = $('#sheetCard'); let y0 = null, dy = 0;
  card.addEventListener('touchstart', e => { y0 = card.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
  card.addEventListener('touchmove', e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) card.style.transform = `translateY(${dy}px)`; }, { passive: true });
  card.addEventListener('touchend', () => { card.style.transform = ''; if (dy > 90) closeSheet(); y0 = null; });
})();

// ================= מסך הבית: הגן =================
const PLANTS = {
  ex1: { name: 'שמיעה', st: ['🌱', '🌿', '🌷', '🌷'] },
  ex2: { name: 'קשב', st: ['🌱', '🌿', '🌻', '🌻'] },
  ex3: { name: 'מילים', st: ['🌱', '🌿', '🪴', '🌳'] },
};
const stage = n => n >= 14 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0;
const EX = [['ex1', '👂', 'שמע והפוך לתמונה', '4 דקות · לזכור מה אמרו לך'], ['ex2', '🎯', 'ציד מילה', '4 דקות · להתרכז'], ['ex3', '📚', 'ללמוד דבר חדש', '4 דקות · אנגלית, שירים']];
let pendingWater = null;
function greet() { const h = new Date().getHours(); return h < 5 ? 'לילה טוב 🌙' : h < 12 ? 'בוקר טוב ☀️' : h < 17 ? 'צהריים טובים 🌤️' : h < 21 ? 'ערב טוב 🌇' : 'לילה טוב 🌙'; }
function home() {
  const watered = pendingWater; pendingWater = null;
  const d = today(), n = EX.filter(e => d[e[0]]).length, st = streak();
  const next = EX.find(e => !d[e[0]]);
  V().innerHTML = `<div class="scr home"><div class="sun"></div>
   <div class="hrow1"><div><div class="hi">${greet()}</div>
     <div class="streak"><span class="f">🔥</span>${st ? `${st} ${st === 1 ? 'יום' : 'ימים'} ברצף` : 'מתחילים רצף היום'}</div></div>
     <button class="gear" id="gearBtn" aria-label="הגדרות">⚙️</button></div>
   <div class="garden">${Object.entries(PLANTS).map(([k, p]) => { const c = countEx(k); return `<div class="pl" data-k="${k}"><div class="drops"></div><span class="p" style="font-size:${34 + Math.min(c, 20) * 2}px">${p.st[stage(c)]}</span>${p.name}${d[k] ? ' 💧' : ''}</div>`; }).join('')}</div>
   <div class="tasks">
     <div class="muted">${n === 3 ? '🌻 הגן הושקה היום. נתראה מחר!' : `היום: ${n} מתוך 3 · ${12 - n * 4} דקות נשארו`}</div>
     ${EX.map(e => `<button class="tk ${d[e[0]] ? 'tk-done' : ''}" onclick="location.hash='${e[0]}'"><span class="e">${e[1]}</span><span class="w"><b>${e[2]}</b><small>${e[0] === 'ex1' ? `4 דקות · רמה: ${E1().level} דברים` : e[0] === 'ex2' ? `4 דקות · רמה ${E2().level} מתוך ${MAX2}` : e[3]}</small></span><span class="st">${d[e[0]] ? '💧✔' : '💧'}</span></button>`).join('')}
     ${next ? `<button class="btn" style="margin-top:12px" onclick="location.hash='${next[0]}'">▶ ממשיכים: ${next[2]}</button>` : ''}
     <div class="seedsum"><div><b>${D.seeds.length}</b>זרעים בגן</div><div><b>${st}</b>ימים ברצף</div><div><b>${totalDays()}</b>ימי תרגול</div></div>
     ${sync.cloud === 'off' && sync.user() ? '<div class="cloudnote">📱 נשמר בטלפון. יעלה לחשבון כשיהיה חיבור.</div>' : ''}
     <div style="height:76px"></div>
   </div></div>
   <button class="helpbtn" onclick="location.hash='helper'"><span class="mi">🎙️</span>עוזר מיידי</button>`;
  $('#gearBtn').onclick = () => settings();
  if (watered) {
    const el = document.querySelector(`.pl[data-k="${watered}"] .drops`);
    if (el) el.innerHTML = [10, 40, 70, 25, 55].map((x, i) => `<i style="right:${x}%;animation-delay:${i * 0.12}s">💧</i>`).join('');
  }
}
async function finish(k, msg) {
  clearT();
  const key = dayKey(), first = !didAny(key);
  D.days[key] = { ...(D.days[key] || {}), [k]: 1 };
  await save();
  const all = EX.every(e => D.days[key][e[0]]);
  const o = document.createElement('div'); o.className = 'ov';
  o.innerHTML = `<div class="box"><div class="e">${all ? '🌻' : '💧'}</div><div class="big" style="margin:6px 0">${all ? 'כל הגן הושקה היום!' : 'הצמח הושקה'}</div>
    <p class="muted" style="margin-bottom:14px">${msg}${first ? `<br>🔥 ${streak()} ${streak() === 1 ? 'יום' : 'ימים'} ברצף` : ''}</p><button class="btn">לגן ←</button></div>`;
  document.body.appendChild(o);
  o.querySelector('button').onclick = () => { o.remove(); pendingWater = k; go('home'); };
}

// ================= תרגיל 1: שמע והפוך לתמונה =================
let heVoice = null;
function loadVoice() { try { heVoice = speechSynthesis.getVoices().find(x => /^he|^iw/i.test(x.lang)) || null; } catch { /* */ } }
try { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; } catch { /* */ }
// הקראה בקול. ok=false כשהטלפון לא באמת השמיע (אין קול בעברית, נגמר מהר מדי, או לא התחיל בכלל)
let noVoice = false; db.get('noVoice', false).then(v => { noVoice = !!v; });
function speak(t, onend) {
  try {
    if (noVoice || !('speechSynthesis' in window)) throw 0;
    const voices = speechSynthesis.getVoices();
    if (voices.length && !heVoice) throw 0;                 // יש רשימת קולות ואין בה עברית
    const u = new SpeechSynthesisUtterance(t); u.lang = 'he-IL'; u.rate = 0.92; if (heVoice) u.voice = heVoice;
    let ended = false, started = 0;
    const fin = ok => { if (!ended) { ended = true; onend(ok); } };
    const minMs = Math.max(1000, t.length * 35);              // הקראה אמיתית לוקחת לפחות כך
    u.onstart = () => { started = Date.now(); };
    u.onend = () => fin(!!started && Date.now() - started >= minMs);
    u.onerror = () => fin(false);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    timers.push(setTimeout(() => { if (!started) { try { speechSynthesis.cancel(); } catch { /* */ } fin(false); } }, 1800));
    timers.push(setTimeout(() => fin(!!started), Math.max(5000, t.length * 130)));
  } catch { onend(false); }
}
// 🎙️ הקלטות מוכנות מראש (tools/make-audio.py): עובדות בכל טלפון, גם בלי קול עברי מובנה
const audioName = t => { let h = 5381; for (const ch of t) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0; return 'audio/' + h.toString(16) + '.mp3'; };
let curAudio = null;
function playRec(t) {
  return new Promise(res => {
    try {
      curAudio?.pause(); const a = new Audio(audioName(t)); curAudio = a;
      let done = false; const fin = ok => { if (!done) { done = true; res(ok); } };
      a.onended = () => fin(true); a.onerror = () => fin(false);
      a.play().catch(() => fin(false));
      timers.push(setTimeout(() => { if (a.paused && !a.ended && a.currentTime === 0) fin(false); }, 2500));
    } catch { res(false); }
  });
}
/** קודם ההקלטה, אם אין — הקול של הטלפון, ואם גם הוא שותק — ok=false */
async function say(t, onend) {
  if (await playRec(t)) return onend(true);
  speak(t, onend);
}
function showWritten(L, why) {
  $('#wave')?.classList.remove('on'); $('#pick').innerHTML = ''; $('#nohear')?.remove();
  $('#lst').innerHTML = `${why}<div class="big said">${L.say}</div><div class="cnt" id="cnt"></div>`;
  let n = Math.max(4, Math.round(L.say.length / 12));
  const tick = () => { if (!has('#cnt')) return; if (n <= 0) { $('#lst').textContent = 'ההוראה נעלמה. עכשיו לפי הסדר:'; return pick1(L); } $('#cnt').textContent = `נעלמת בעוד ${n}…`; n--; timers.push(setTimeout(tick, 1000)); };
  tick();
}
// --- התקדמות: רמה = כמה דברים בהוראה. הצלחה מלאה פעמיים ברצף ← רמה אחת למעלה. טעות ← נשארים (בלי ירידה) ---
const E1 = () => (D.ex1 ??= { level: MIN_LEVEL, run: 0, seen: [], hist: [] });
function nextInstr() {
  const e = E1(), pool = BANK.filter(b => b.seq.length === e.level);
  const fresh = pool.filter(b => !e.seen.includes(b.id) && b.id !== T.ex1Last);
  const L = (fresh.length ? fresh : pool.filter(b => b.id !== T.ex1Last))[Math.floor(Math.random() * (fresh.length || pool.length - 1))] || pool[0];
  T.ex1Last = L.id; return L;
}
function weekLine() {
  const since = addDays(dayKey(), -6), h = E1().hist.filter(x => x.d >= since);
  if (!h.length) return '';
  const first = h[0].len, best = Math.max(...h.filter(x => x.ok).map(x => x.len), 0);
  return best > first ? `🌷 השבוע: מ־${first} ל־${best} דברים` : best ? `🌷 השבוע זכרת עד ${best} דברים לפי הסדר` : '';
}
const tile = (k, cls = '') => { const it = IT[k]; return `<span class="em ${cls}">${it.e}${it.c ? `<i class="dot" style="background:${it.c}"></i>` : ''}${it.n ? `<i class="cnt2">×${it.n}</i>` : ''}</span>`; };
function ex1() {
  T.ex1Round ??= 0; T.ex1Res ??= []; T.ex1StartLevel ??= E1().level;
  const L = T.ex1Cur || (T.ex1Cur = nextInstr()), e = E1();
  V().innerHTML = `<div class="scr">${topbar('👂 שמע והפוך לתמונה', `סיבוב ${T.ex1Round + 1} מתוך ${ROUNDS}`)}
   <div class="lvl">${Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => `<i class="${i + MIN_LEVEL <= e.level ? 'on' : ''}">${i + MIN_LEVEL}</i>`).join('')}<span>רמה: ${e.level} דברים${e.run ? ' · עוד הצלחה אחת ועולים 🌱' : ''}</span></div>
   <div class="card"><p>הטלפון יגיד הוראה קצרה, פעם אחת. אחר כך היא נעלמת, ואתה בוחר את התמונות <b>לפי הסדר</b>.</p>
   <div class="listen"><div class="wave" id="wave"><i></i><i></i><i></i><i></i><i></i></div><div id="lst" class="muted">מוכן? כדאי להגביר את הקול 🔊</div></div>
   <button class="btn b" id="play">🔊 השמע את ההוראה</button></div><div id="pick"></div></div>`;
  $('#play').onclick = () => {
    $('#play').style.display = 'none'; $('#wave').classList.add('on'); $('#lst').textContent = 'מקשיבים…';
    $('#play').insertAdjacentHTML('afterend', '<button class="link nohear" id="nohear">🔇 לא שמעתי כלום</button>');
    $('#nohear').onclick = () => { clearT(); curAudio?.pause(); showWritten(L, 'לא נשמע? הנה ההוראה כתובה לרגע:'); };
    say(L.say, async ok => {
      if (!has('#lst')) return;
      if (!ok) { noVoice = true; await db.set('noVoice', true); return showWritten(L, 'לא הצלחתי להשמיע קול, אז ההוראה כתובה לרגע:'); }
      $('#wave')?.classList.remove('on');
      $('#lst').textContent = 'ההוראה נעלמה. עכשיו לפי הסדר:'; pick1(L);
    });
  };
}
/** התמונות לבחירה: כל מה שנאמר + הסחות. קודם "אחים" (אותו חפץ בצבע או בכמות אחרת), אחר כך מאותו עולם */
function options(L) {
  const total = L.seq.length <= 4 ? 8 : 12, inSeq = new Set(L.seq), mix = a => a.sort(() => Math.random() - 0.5);
  const sib = mix(Object.keys(IT).filter(k => !inSeq.has(k) && IT[k].g && L.seq.some(s => IT[s].g === IT[k].g)));
  const wds = new Set(L.seq.map(k => IT[k].wd));
  const same = mix(Object.keys(IT).filter(k => !inSeq.has(k) && !sib.includes(k) && wds.has(IT[k].wd)));
  const rest = mix(Object.keys(IT).filter(k => !inSeq.has(k) && !sib.includes(k) && !same.includes(k)));
  return mix([...L.seq, ...[...sib, ...same, ...rest].slice(0, total - L.seq.length)]);
}
function pick1(L) {
  const opts = options(L), chosen = [];
  const draw = () => {
    $('#pick').innerHTML = `<div class="card"><div class="slots">${L.seq.map((_, i) => `<div class="slot" id="s${i}"><span class="n">${i + 1}</span>${chosen[i] ? tile(chosen[i]) : ''}</div>`).join('')}</div>
     <div class="icons">${opts.map(k => `<button class="ic ${chosen.includes(k) ? 'used' : ''}" data-k="${k}">${tile(k)}<small>${IT[k].w}</small></button>`).join('')}</div>
     <div class="row2" style="margin-top:12px"><button class="btn g" id="undo">↶ בטל</button><button class="btn" id="chk" ${chosen.length < L.seq.length ? 'disabled' : ''}>✔ בדוק</button></div></div>`;
    document.querySelectorAll('.ic').forEach(b => b.onclick = () => { const k = b.dataset.k; if (chosen.includes(k) || chosen.length >= L.seq.length) return; chosen.push(k); draw(); });
    $('#undo').onclick = () => { chosen.pop(); draw(); };
    $('#chk').onclick = async () => {
      let ok = 0;
      L.seq.forEach((k, i) => { const g = chosen[i] === k; if (g) ok++; $('#s' + i).classList.add(g ? 'ok' : 'bad'); });
      $('#chk').disabled = true; $('#undo').disabled = true;
      const e = E1(), all = ok === L.seq.length, before = e.level;
      e.hist.push({ d: dayKey(), len: L.seq.length, ok: all }); if (e.hist.length > 200) e.hist = e.hist.slice(-200);
      e.seen = [...e.seen.filter(x => x !== L.id), L.id].slice(-12);
      if (all) { e.run++; if (e.run >= 2 && e.level < MAX_LEVEL) { e.level++; e.run = 0; } } else e.run = 0;
      T.ex1Res.push({ ok, len: L.seq.length });
      await save();
      const up = e.level > before, last = T.ex1Round >= ROUNDS - 1;
      $('#pick').insertAdjacentHTML('beforeend', `<div class="card"><div class="big">${all ? `✅ מושלם! ${ok} מתוך ${ok}` : `👍 ${ok} מתוך ${L.seq.length} במקום`}</div>
        ${up ? `<div class="levelup">⬆️ עלית לרמה של ${e.level} דברים!</div>` : ''}
        <div class="answer">מה נאמר: ${L.seq.map(k => `<span class="aw">${tile(k)} ${IT[k].w}</span>`).join(' ← ')}</div>
        <button class="btn" style="margin-top:12px" id="nx">${last ? 'סיימתי 💧' : 'לסיבוב הבא ←'}</button></div>`);
      $('#nx').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#nx').onclick = () => {
        T.ex1Cur = null;
        if (!last) { T.ex1Round++; ex1(); return scrollTo(0, 0); }
        const res = T.ex1Res, good = res.filter(r => r.ok === r.len).length, start = T.ex1StartLevel;
        T.ex1Round = 0; T.ex1Res = []; T.ex1StartLevel = null;
        const wl = weekLine();
        finish('ex1', `${good} מתוך ${ROUNDS} הוראות זכרת בדיוק לפי הסדר.${E1().level > start ? `<br>⬆️ היום עלית לרמה של ${E1().level} דברים.` : `<br>מחר ממשיכים מרמה של ${E1().level} דברים.`}${wl ? '<br>' + wl : ''}`);
      };
    };
  };
  draw();
}
// ================= תרגיל 2: ציד מילה =================
const E2 = () => (D.ex2 ??= { level: 1, run: 0, hist: [] });
const TCOL = [{ c: '#2E7D32', bg: '#E3F6E1', n: 'ירוק' }, { c: '#C2410C', bg: '#FFEDD5', n: 'כתום' }];
function weekLine2() {
  const since = addDays(dayKey(), -6), h = E2().hist.filter(x => x.d >= since);
  if (!h.length) return '';
  const first = h[0].words, best = Math.max(...h.filter(x => x.ok).map(x => x.words), 0);
  return best > first ? `🌻 השבוע: מ־${first} ל־${best} מילים` : best ? `🌻 השבוע תפסת הכל בהסבר של ${best} מילים` : '';
}
function ex2() {
  T.ex2Round ??= 0; T.ex2Res ??= []; T.ex2Start ??= E2().level;
  const e = E2(), R = T.ex2Cur || (T.ex2Cur = build(e.level, T.ex2LastWorld)), two = R.targets.length > 1;
  T.ex2LastWorld = R.world;
  const total = R.hits.filter(h => h >= 0).length;
  V().innerHTML = `<div class="scr">${topbar('🎯 ציד מילה', `סיבוב ${T.ex2Round + 1} מתוך ${ROUNDS2}`)}
   <div class="lvl">${Array.from({ length: MAX2 }, (_, i) => `<i class="${i + 1 <= e.level ? 'on' : ''}">${i + 1}</i>`).join('')}<span>רמה ${e.level} · ${R.words.length} מילים${e.run ? ' · עוד הצלחה אחת ועולים 🌱' : ''}</span></div>
   <div class="card target"><div class="muted">${R.name} · ${two ? 'שתי מילות מטרה' : 'מילת המטרה'}</div>
     <div class="tws">${R.targets.map((t, k) => `<span class="tw" style="color:${TCOL[k].c};background:${TCOL[k].bg}">${t}</span>`).join('')}</div>
     <p class="muted" style="margin-top:8px">מילים יעברו אחת אחת. ${two ? 'כשמופיעה מילת מטרה, לוחצים על <b>הכפתור בצבע שלה</b>.' : 'לוחצים על הכפתור הגדול <b>רק</b> כשמופיעה המילה הזו.'}${R.decoys.length ? `<br>🪤 זהירות: יש מילים שנראות דומות (כמו "${R.decoys[0]}").` : ''}</p></div>
   <div class="stage" id="stg"><div class="word" id="wd">⏳</div></div>
   <div class="prog"><i id="pg"></i></div>
   <div class="hits ${two ? 'two' : ''}">${R.targets.map((t, k) => `<button class="btn hunt" data-h="${k}" style="background:${two ? TCOL[k].c : 'var(--sun)'};color:${two ? '#fff' : '#3b2a00'};box-shadow:0 5px 0 #0003">🎯 ${two ? t : 'תפסתי!'}</button>`).join('')}</div>
   <button class="btn g" id="start" style="margin-top:12px">▶ מתחילים</button></div>`;
  let i = -1, hits = 0, wrong = 0, shownAt = 0, running = false; const caught = {};
  document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
    if (!running) return; const k = +b.dataset.h, stg = $('#stg');
    const cand = [i, i - 1].find(x => x >= 0 && R.hits[x] === k && !caught[x] && (x === i || Date.now() - shownAt < 350));
    if (cand !== undefined) { caught[cand] = 1; hits++; stg.className = 'stage flash'; try { navigator.vibrate?.(40); } catch { /* */ } }
    else { wrong++; stg.className = 'stage miss'; }
    timers.push(setTimeout(() => { stg.className = 'stage'; }, 300));
  });
  $('#start').onclick = () => {
    $('#start').remove(); running = true; let k = 3;
    const cd = setInterval(() => { $('#wd').textContent = k || '!'; if (k-- < 0) { clearInterval(cd); step(); } }, 500); timers.push(cd);
    function step() {
      i++; if (i >= R.words.length) { running = false; return end(); }
      $('#wd').textContent = R.words[i].replace(/[.,?!]/g, ''); shownAt = Date.now();
      $('#pg').style.width = ((i + 1) / R.words.length * 100) + '%';
      timers.push(setTimeout(step, R.ms));
    }
  };
  async function end() {
    $('#wd').textContent = '🏁';
    const ok = hits === total && wrong <= 1, before = e.level;
    e.hist.push({ d: dayKey(), words: R.words.length, ok }); if (e.hist.length > 200) e.hist = e.hist.slice(-200);
    if (ok) { e.run++; if (e.run >= 2 && e.level < MAX2) { e.level++; e.run = 0; } } else e.run = 0;
    T.ex2Res.push(ok); await save();
    const last = T.ex2Round >= ROUNDS2 - 1;
    document.querySelector('.hits').outerHTML = `<div class="card"><div class="big">${hits === total ? '✅' : '👍'} תפסת ${hits} מתוך ${total}</div>
      <p class="muted">${wrong ? `לחצת ${wrong} ${wrong === 1 ? 'פעם' : 'פעמים'} לא במקום.` : 'בלי אף לחיצה מיותרת 👏'}</p>
      ${e.level > before ? `<div class="levelup">⬆️ עלית לרמה ${e.level}: הסבר ארוך יותר${e.level === 3 ? ' ושתי מילות מטרה' : e.level === 4 ? ' ומילים מטעות' : ''}!</div>` : ''}
      <button class="btn" id="fin" style="margin-top:10px">${last ? 'סיימתי 💧' : 'לסיבוב הבא ←'}</button></div>`;
    $('#fin').onclick = () => {
      T.ex2Cur = null;
      if (!last) { T.ex2Round++; ex2(); return scrollTo(0, 0); }
      const good = T.ex2Res.filter(Boolean).length, start = T.ex2Start; T.ex2Round = 0; T.ex2Res = []; T.ex2Start = null;
      const wl = weekLine2();
      finish('ex2', `${good} מתוך ${ROUNDS2} סיבובים תפסת הכל.${E2().level > start ? `<br>⬆️ היום עלית לרמה ${E2().level}.` : `<br>מחר ממשיכים מרמה ${E2().level}.`}${wl ? '<br>' + wl : ''}`);
    };
  }
}

// ================= תרגיל 3: ללמוד דבר חדש =================
const WORDS = [
  { pic: '🔑', en: 'Key', he: 'מפתח', story: '"קי" נשמע כמו "קיר": מפתח ענק תלוי על הקיר.', check: 1 },
  { pic: '🚪', en: 'Door', he: 'דלת', story: '"דור" כמו דור: סבא מדור אחר עומד בדלת ומחייך.' },
  { pic: '📖', en: 'Book', he: 'ספר', story: '"בוק" כמו "בוקר": כל בוקר פותחים ספר עם קפה.' },
];
const PICS = ['🔑', '🚪', '📖', '🍎', '🐟', '🌙', '🏠', '⭐', '🎹', '🚗', '☂️', '🕯️', '🍞', '👟', '🎈', '🧲', '🌉', '🪜'];
const SONG = ['אני מאמין באמונה שלמה', 'בביאת המשיח', 'ואף על פי שיתמהמה', 'עם כל זה אחכה לו'];
function ex3() {
  V().innerHTML = `<div class="scr">${topbar('📚 ללמוד דבר חדש', '4 דקות')}
   <div class="seg">${[['words', '🔤 מילים'], ['song', '🎵 שיר'], ['add', '➕ להוסיף']].map(([k, n]) => `<button data-t="${k}" class="${T.ex3tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
   <div id="ex3b"></div></div>`;
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { T.ex3tab = b.dataset.t; ex3(); });
  ({ words: ex3words, song: ex3song, add: ex3add })[T.ex3tab]();
}
function ex3words() {
  const w = WORDS[T.ex3i], el = $('#ex3b');
  if (w.check) {
    const opts = ['🔑', '🍎', '🚪'].sort(() => Math.random() - 0.5);
    el.innerHTML = `<div class="wcard"><div class="muted">💧 השקיה: בדיקה קצרה של מילה מאתמול</div><div class="en" style="margin-top:8px">${w.en}</div><p class="muted">איזו תמונה?</p>
      <div class="choices">${opts.map(o => `<button data-o="${o}">${o}</button>`).join('')}</div><div id="fb" style="min-height:28px;margin-top:10px"></div></div>`;
    el.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
      const ok = b.dataset.o === w.pic; b.classList.add(ok ? 'ok' : 'bad');
      if (!ok) el.querySelector(`[data-o="${w.pic}"]`).classList.add('ok');
      el.querySelectorAll('.choices button').forEach(x => { x.disabled = true; });
      $('#fb').innerHTML = `${ok ? '✅ נכון! ' : '🌱 זה בסדר. '}<b>${w.he}</b>. ${w.story}<button class="btn" style="margin-top:12px" id="nx">הבא ←</button>`;
      $('#nx').onclick = () => { T.ex3i++; ex3words(); };
    });
    return;
  }
  el.innerHTML = `<div class="wcard"><div class="muted">🌱 זרע חדש · ${T.ex3i} מתוך ${WORDS.length - 1}</div><div class="pic">${w.pic}</div><div class="en">${w.en}</div><div class="he">${w.he}</div>
    <div class="story">${w.story}</div>
    <div class="sched"><span>היום 🌱</span><span class="now">מחר 💧</span><span>עוד 3 ימים 💧</span><span>עוד שבוע 💧</span></div></div>
    <button class="btn b" style="margin-top:14px" id="say">🔊 איך זה נשמע</button>
    <button class="btn" id="nx">${T.ex3i < WORDS.length - 1 ? 'הבא ←' : 'שתלתי 💧'}</button>`;
  $('#say').onclick = async () => { if (await playRec(w.en)) return; try { const u = new SpeechSynthesisUtterance(w.en); u.lang = 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { toast('אין קול בטלפון הזה'); } };
  $('#nx').onclick = () => { if (T.ex3i < WORDS.length - 1) { T.ex3i++; ex3words(); } else { T.ex3i = 0; finish('ex3', 'בדקת מילה אחת ושתלת 2 זרעים חדשים.'); } };
}
function ex3song() {
  const cols = [['#2E9BE6', '#164A6B'], ['#E0527A', '#8E1F43'], ['#5DBB63', '#1B5E20'], ['#FFC93C', '#7A5300']];
  const lines = T.songLines || SONG, n = Object.keys(T.songStuck).length;
  $('#ex3b').innerHTML = `<div class="card"><b>🎵 ${T.songLines ? 'השיר שלך' : 'אני מאמין'}</b><p class="muted">רואים רק את האות הראשונה, וצבע לכל שורה. מנסים לשיר, ולוחצים רק על מילה שנתקעים בה.</p></div>
   <div class="lyr">${lines.map((l, li) => `<div class="line" style="--c:${cols[li % 4][0]};--c2:${cols[li % 4][1]}">${l.split(/\s+/).map((wd, wi) => { const k = li + '_' + wi, sh = T.songStuck[k]; return `<button data-k="${k}" data-w="${esc(wd)}" class="${sh ? 'show' : ''}">${sh ? esc(wd) : esc(wd[0]) + '…'}</button>`; }).join('')}</div>`).join('')}</div>
   <div class="card" id="sr">${n ? `נתקעת ב־${n} מילים. מחר מתחילים דווקא מהן.` : 'עוד לא נתקעת באף מילה 👏'}</div>
   <label class="field"><span>📋 שיר משלך: הדבק את המילים, שורה בכל שורה</span><textarea id="paste" placeholder="מדביקים כאן…"></textarea></label>
   <button class="btn g" style="margin-top:10px" id="use">הפוך לאותיות וצבעים</button>`;
  document.querySelectorAll('.lyr button').forEach(b => b.onclick = () => {
    if (T.songStuck[b.dataset.k]) return; T.songStuck[b.dataset.k] = 1; b.textContent = b.dataset.w; b.classList.add('show');
    $('#sr').textContent = `נתקעת ב־${Object.keys(T.songStuck).length} מילים. מחר מתחילים דווקא מהן.`;
  });
  $('#use').onclick = () => {
    const t = $('#paste').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (!t.length) return toast('קודם מדביקים מילים');
    T.songLines = t.slice(0, 16); T.songStuck = {}; ex3song(); toast('🎵 השיר מוכן');
  };
}
function ex3add() {
  let pic = '';
  const mine = [...D.seeds].reverse().slice(0, 12);
  $('#ex3b').innerHTML = `<div class="card"><b>🌱 לשתול מילה חדשה</b><p class="muted">סיפור שכתבת בעצמך נזכר הכי טוב.</p>
   <label class="field"><span>המילה</span><input id="aw" placeholder="למשל: Bridge" autocomplete="off"></label>
   <label class="field"><span>מה זה אומר</span><input id="am" placeholder="למשל: גשר" autocomplete="off"></label>
   <div class="field"><span>תמונה</span><div class="emo">${PICS.map(p => `<button data-p="${p}">${p}</button>`).join('')}</div></div>
   <label class="field"><span>סיפור שמחבר את הצליל למשהו מוכר</span><textarea id="as" placeholder='למשל: "בְּרִידג׳" כמו "ברד": ברד נופל על גשר'></textarea></label>
   <button class="btn" style="margin-top:14px" id="plant">🌱 לשתול</button></div>
   ${mine.length ? `<div class="card"><b>הזרעים שלך (${D.seeds.length})</b>${mine.map(m => `<div class="tk" style="pointer-events:none"><span class="e">${esc(m.pic)}</span><span class="w"><b>${esc(m.en)}</b><small>${esc(m.he)}${m.story ? ' · ' + esc(m.story) : ''}</small></span></div>`).join('')}</div>` : ''}`;
  document.querySelectorAll('.emo button').forEach(b => b.onclick = () => { document.querySelectorAll('.emo button').forEach(x => x.classList.remove('on')); b.classList.add('on'); pic = b.dataset.p; });
  $('#plant').onclick = async () => {
    const en = $('#aw').value.trim(), he = $('#am').value.trim();
    if (!en || !he) return toast('צריך מילה ומה היא אומרת');
    if (!pic) return toast('בחר תמונה');
    D.seeds.push({ id: db.newId(), en: en.slice(0, 60), he: he.slice(0, 60), pic, story: $('#as').value.trim().slice(0, 300), planted: dayKey() });
    await save(); toast('🌱 נשתל! הבדיקות הקצרות ייבנו בחלק 4'); ex3add();
  };
}

// ================= עוזר מיידי (שקט ונקי) =================
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false, finalTxt = '', interim = '';
const DEMO_TXT = 'אז ביום חמישי בשמונה בערב באולם הגדול, תביא את המקלדת ושני רמקולים, ותתקשר ליוסי לגבי התאורה. הזמר רוצה להתחיל עם השיר של סולטן.';
function helper() {
  document.body.classList.add('calm-bg');
  V().innerHTML = `<div class="calm"><div class="scr">${topbar('🎙️ עוזר מיידי')}
   ${D.prefs.notice !== false ? `<div class="notice" id="ntc"><span style="font-size:22px">💬</span><div>כדאי לומר: "אני רושם לעצמי בטלפון".<br><button id="ntcOff">לא להציג שוב</button></div></div>` : ''}
   <div class="micwrap"><button class="mic" id="mic" aria-label="הקשבה">🎙️</button><div id="mst" class="mst">${SR ? 'לוחצים, והטלפון מקשיב' : 'בטלפון הזה ההקשבה לא זמינה כאן'}</div></div>
   <div id="hbody"></div></div></div>`;
  $('#ntcOff')?.addEventListener('click', async () => { D.prefs.notice = false; await save(); $('#ntc').remove(); toast('אפשר להחזיר ב־⚙️'); });
  if (SR) {
    $('#mic').onclick = () => listening ? stopListen() : startListen();
    $('#hbody').innerHTML = `<div class="live" id="live"><span class="int">מה שנאמר יופיע כאן…</span></div>
      <button class="cbtn" id="mk" style="margin-top:12px;display:none">✔ סיימתי, תכין כרטיס</button>
      <button class="cbtn l" id="demo" style="margin-top:10px">🧪 נסה עם משפט לדוגמה</button>`;
    $('#mk').onclick = () => { stopListen(); makeCard(finalTxt + ' ' + interim); };
    $('#demo').onclick = () => { stopListen(); makeCard(DEMO_TXT); };
  } else fallbackInput();
}
function fallbackInput() {
  $('#mic').onclick = () => $('#ftxt').focus();
  $('#hbody').innerHTML = `<div class="notice" style="margin-bottom:10px"><span style="font-size:22px">⌨️</span><div>הגיבוי: לוחצים בתיבה, ואז על <b>המיקרופון שבמקלדת</b>, ומדברים.</div></div>
    <textarea id="ftxt" class="live" placeholder="מה שנאמר יופיע כאן…"></textarea>
    <button class="cbtn" id="mk" style="margin-top:12px">✔ תכין כרטיס</button>
    <button class="cbtn l" id="demo">🧪 נסה עם משפט לדוגמה</button>`;
  $('#mk').onclick = () => { const t = $('#ftxt').value.trim(); if (!t) return toast('קודם מדברים או כותבים משהו'); makeCard(t); };
  $('#demo').onclick = () => makeCard(DEMO_TXT);
}
function startListen() {
  finalTxt = ''; interim = '';
  try {
    rec = new SR(); rec.lang = 'he-IL'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => {
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalTxt += r[0].transcript + ' '; else interim += r[0].transcript; }
      $('#live').innerHTML = (finalTxt || interim) ? `${esc(finalTxt)}<span class="int">${esc(interim)}</span>` : '<span class="int">מקשיב…</span>';
      $('#mk').style.display = 'block';
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { listening = false; uiListen(); toast('הטלפון לא אישר מיקרופון. עוברים לגיבוי.', 3200); fallbackInput(); }
      else if (e.error !== 'no-speech' && e.error !== 'aborted') toast('תקלה בהקשבה: ' + e.error);
    };
    rec.onend = () => { if (listening) { try { rec.start(); } catch { /* */ } } };
    rec.start(); listening = true; uiListen();
  } catch { toast('ההקשבה לא נפתחה. עוברים לגיבוי.'); fallbackInput(); }
}
function stopListen() { listening = false; try { rec?.stop(); } catch { /* */ } uiListen(); }
function uiListen() {
  if (!has('#mic')) return; const m = $('#mic');
  m.classList.toggle('on', listening); m.textContent = listening ? '⏹' : '🎙️';
  $('#mst').textContent = listening ? 'מקשיב… לוחצים שוב כדי לעצור' : 'לוחצים, והטלפון מקשיב';
  if (listening && has('#live')) $('#live').innerHTML = '<span class="int">מקשיב…</span>';
}
// --- כללים פשוטים (בחינם): טקסט → שורות בכרטיס ---
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const NUM = { 'אחת': 1, 'אחד': 1, 'שתיים': 2, 'שתים': 2, 'שלוש': 3, 'ארבע': 4, 'חמש': 5, 'שש': 6, 'שבע': 7, 'שמונה': 8, 'תשע': 9, 'עשר': 10, 'אחת עשרה': 11, 'שתים עשרה': 12, 'שתיים עשרה': 12 };
const ICON = [[/מקלדת|פסנתר|קלידים/, '🎹'], [/רמקול/, '🔊'], [/מיקרופון/, '🎤'], [/כבל/, '🔌'], [/תווים|דף/, '📄'], [/דוושה/, '🦶'], [/גיטרה/, '🎸'], [/תאורה|אור/, '💡'], [/מים|שתייה/, '💧'], [/ספר|מחברת/, '📒'], [/כסף|תשלום|צ'ק/, '💰']];
const iconFor = t => { for (const [r, e] of ICON) if (r.test(t)) return e; return '📦'; };
function parse(txt) {
  const t = ' ' + txt.replace(/\s+/g, ' ') + ' ', rows = [];
  let day = null; for (const d of DAYS) { if (new RegExp('(יום |ב)' + d + '[ ,.]').test(t)) { day = d; break; } }
  if (!day) { if (/ מחר/.test(t)) day = 'מחר'; else if (/ היום/.test(t)) day = 'היום'; else if (/מוצאי שבת|מוצ"ש/.test(t)) day = 'מוצאי שבת'; }
  let time = null; const m1 = t.match(/(\d{1,2})[:.](\d{2})/);
  if (m1) time = m1[1].padStart(2, '0') + ':' + m1[2];
  else {
    const m2 = t.match(/(?:בשעה |ב)(אחת עשרה|שתים עשרה|שתיים עשרה|אחת|שתיים|שתים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר)(?:[ ,.])/), m3 = t.match(/בשעה (\d{1,2})/);
    let h = m2 ? NUM[m2[1]] : (m3 ? +m3[1] : null);
    if (h != null) { if (/ערב|לילה|אחר הצהריים|אחה"צ/.test(t) && h < 12) h += 12; time = String(h).padStart(2, '0') + (/וחצי/.test(t) ? ':30' : ':00'); }
  }
  if (day || time) rows.push({ i: '🕗', w: (day ? (DAYS.includes(day) ? 'יום ' + day : day) : '') + (day && time ? ', ' : '') + (time || ''), to: '📅 ליומן', dest: 'cal' });
  const pl = t.match(/ ב(אולם[^,.]*?|בית[^,.]*?|אצל[^,.]*?|רחוב[^,.]*?|גן[^,.]*?|מלון[^,.]*?|ישיבה[^,.]*?|מרכז[^,.]*?)(?=[,.]| תביא| ת| עם| בשעה| ב)/);
  if (pl) { let w = pl[1].trim(); const ws = w.split(' '); if (ws[1] && /^ה/.test(ws[1]) && !/^ה/.test(ws[0])) w = 'ה' + w; rows.push({ i: '📍', w }); }
  const br = t.match(/(?:תביא|להביא|תיקח|לקחת|אל תשכח)(?: את)? ([^.]*?)(?=[.]|,? ות(?!ביא)|$)/);
  if (br) br[1].split(/,| ו(?=[א-ת])/).map(s => s.replace(/^(את|ה)\s*/, '').trim()).filter(s => s && s.length > 1).forEach(s => {
    rows.push({ i: iconFor(s), w: s.replace(/^שני /, '2 ').replace(/^שתי /, '2 ').replace(/^שלושה /, '3 '), to: '🧰 לציוד', dest: 'gear' });
  });
  const cl = t.match(/(?:תתקשר|להתקשר|תדבר|לדבר) (?:ל|עם )([^ ,.]+)(?: ([^,.]*))?/);
  if (cl) { const more = (cl[2] || '').replace(/(ביום|יום) (ראשון|שני|שלישי|רביעי|חמישי|שישי)|בשבת|מחר|היום/g, '').replace(/\s+/g, ' ').trim().replace(/^לגבי /, '· '); rows.push({ i: '📞', w: 'להתקשר ל' + cl[1] + (more ? ' ' + more : ''), to: '📅 ליומן', dest: 'cal' }); }
  const sg = t.match(/(?:להתחיל|לפתוח|פותחים|מתחילים)(?: עם| ב)? (השיר[^,.]*)/) || t.match(/(השיר של [^,.]+)/);
  if (sg) rows.push({ i: '🎤', w: 'פותחים ב' + sg[1].trim().replace(/^השיר/, 'שיר'), to: '📋 לליין־אפ', dest: 'line' });
  if (!rows.length) rows.push({ i: '📝', w: txt.trim().slice(0, 80) });
  const title = sg || /הופעה|אירוע|חתונה|בר מצווה/.test(t) ? 'הופעה' + (day && DAYS.includes(day) ? ', יום ' + day : '') : (day ? (DAYS.includes(day) ? 'יום ' + day : day) : 'מה אמרו לי');
  return { title, rows };
}
function makeCard(txt) {
  if (!txt?.trim()) return toast('לא נשמע כלום. נסה שוב.');
  const c = parse(txt);
  finalTxt = ''; interim = ''; txt = ''; // הטקסט המלא לא נשמר — נשאר רק הכרטיס
  const draw = () => {
    $('#hbody').innerHTML = `<div class="hcard"><div class="t">🎙️ ${esc(c.title)}</div>
     ${c.rows.map((r, i) => `<div class="hrow"><span class="i">${r.i}</span><span class="w" data-i="${i}">${esc(r.w)}</span>${r.to ? `<button class="to" data-d="${i}">${r.to}</button>` : ''}<button class="x" data-x="${i}" aria-label="מחק שורה">✕</button></div>`).join('')}
     <button class="cbtn l" id="add" style="margin-top:10px">＋ להוסיף שורה</button></div>
     <div class="gone">🗑️ הטקסט המלא נמחק. נשאר רק הכרטיס. לוחצים על שורה כדי לתקן אותה.</div>
     <button class="cbtn" id="again" style="margin-top:12px">🎙️ להקשיב שוב</button>`;
    document.querySelectorAll('.hrow .w').forEach(w => w.onclick = () => {
      if (w.querySelector('input')) return; const i = +w.dataset.i;
      w.innerHTML = `<input value="${esc(c.rows[i].w)}">`; const inp = w.querySelector('input'); inp.focus();
      inp.onblur = () => { c.rows[i].w = inp.value.trim() || c.rows[i].w; draw(); };
      inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); };
    });
    document.querySelectorAll('.hrow .x').forEach(b => b.onclick = () => { c.rows.splice(+b.dataset.x, 1); draw(); });
    document.querySelectorAll('.hrow .to').forEach(b => b.onclick = () => {
      const r = c.rows[+b.dataset.d];
      if (r.dest === 'cal') return toast('📅 החיבור ליומן של הטלפון ייבנה בחלק 5');
      const s = (r.dest === 'gear' ? '🧰 לציוד: ' : '📋 לליין־אפ: ') + r.w;
      if (navigator.share) navigator.share({ text: s }).catch(() => {}); else toast(s);
    });
    $('#add').onclick = () => { c.rows.push({ i: '📝', w: 'שורה חדשה' }); draw(); const ws = document.querySelectorAll('.hrow .w'); ws[ws.length - 1].click(); };
    $('#again').onclick = () => helper();
  };
  draw(); $('#hbody').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================= ⚙️ הגדרות =================
function settings() {
  const u = sync.user();
  const c = sheet(`<h3>⚙️ הגדרות</h3>
    <div class="acct">${db.BDIKA ? '🎭 מצב הדגמה. שום דבר לא נשמר.' : `👤 ${esc(u?.email || '')}<br><small>${sync.cloud === 'ok' ? '☁️ הגן נשמר בחשבון' : '📱 נשמר בטלפון. יעלה לחשבון כשיהיה חיבור.'}</small>`}</div>
    <button class="srow" data-a="news">✨ מה חדש</button>
    <a class="srow" href="guide/" target="_blank" rel="noopener">📖 מדריך ועזרה</a>
    <button class="srow" data-a="feedback">💌 הערה או רעיון</button>
    <button class="srow" data-a="install">📲 התקנה למסך הבית</button>
    <label class="srow"><span>💬 תזכורת "כדאי לומר שאני רושם"</span><input type="checkbox" id="ntcPref" ${D.prefs.notice !== false ? 'checked' : ''}></label>
    ${db.BDIKA ? '' : '<button class="srow out" data-a="out">🚪 יציאה מהחשבון</button>'}
    <p class="ver">זוכרים בכיף · גרסה ${NEWS[0].v.split("-").reverse().join(".")}${NEWS[0].rev ? " (" + NEWS[0].rev + ")" : ""}</p>`);
  c.querySelector('#ntcPref').onchange = async e => { D.prefs.notice = e.target.checked; await save(); };
  c.querySelectorAll('[data-a]').forEach(b => b.onclick = () => ({ news: () => openNews(), feedback: () => openFeedback(), install: () => openInstall(), out: () => doSignOut() })[b.dataset.a]());
}
async function doSignOut() {
  if (!confirm('לצאת מהחשבון? הגן שמור בחשבון, ויחזור כשתיכנס שוב.')) return;
  try { await sync.signOut(); } catch { /* */ }
  D = blank(); await db.set('state', null); await db.set('uid', null);
  closeSheet(); showGate();
}

// ================= ✨ מה חדש =================
function openNews(auto) {
  const n = NEWS[0];
  const c = sheet(`<h3>✨ מה חדש</h3><p class="muted" style="margin-bottom:8px">${n.v.split('-').reverse().join('.')}</p>
    ${n.items.map((it, i) => `<div class="news" style="animation-delay:${i * 0.07}s"><span class="ne">${it.e}</span><div><b>${it.t}</b><p>${it.d}</p>${it.go ? `<button class="link" data-go="${it.go}">👀 תראו לי</button>` : ''}</div></div>`).join('')}
    <button class="btn" id="newsOk" style="margin-top:10px">${auto ? 'יופי, ממשיכים 🌱' : 'סגירה'}</button>`);
  db.set('seenNews', LATEST);
  c.querySelector('#newsOk').onclick = () => closeSheet();
  c.querySelectorAll('[data-go]').forEach(b => b.onclick = () => jumpTo(b.dataset.go));
}
function jumpTo(goTo) {
  if (sheetOpen) closeSheet();
  setTimeout(() => {
    if (goTo === 'settings') go('settings');
    else if (goTo === 'install') openInstall();
    else if (goTo === 'feedback') openFeedback();
    else go(goTo);
  }, 80);
}

// ================= 💌 הערות =================
const FK = { idea: '💡 רעיון', bug: '🐞 משהו לא עובד', love: '❤️ מחמאה', other: '💬 אחר' };
function openFeedback() {
  let kind = 'idea';
  const c = sheet(`<h3>💌 הערה או רעיון</h3>
    <p class="muted" style="margin-bottom:10px">כל הערה מגיעה ישר למוישי ועוזרת לשפר את האפליקציה 🙏</p>
    <div class="chips">${Object.entries(FK).map(([k, n]) => `<button class="chip ${k === kind ? 'on' : ''}" data-k="${k}">${n}</button>`).join('')}</div>
    <label class="field"><span>מה תרצה לספר?</span><textarea id="fMsg" rows="5" placeholder="למשל: היה נחמד אם…"></textarea></label>
    <div id="fErr" class="err"></div>
    <button class="btn" id="fSend">📨 שליחה</button>`);
  c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kind = b.dataset.k; c.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); });
  c.querySelector('#fSend').onclick = async e => {
    const message = c.querySelector('#fMsg').value.trim();
    if (message.length < 2) { c.querySelector('#fErr').textContent = 'צריך לכתוב משהו 🙂'; return; }
    if (db.BDIKA) { closeSheet(); toast('🎭 בהדגמה ההערה לא נשלחת'); return; }
    e.target.disabled = true; e.target.textContent = 'שולח…';
    const device = `${navigator.userAgent.match(/iPhone|iPad|Android[^;)]*|Mac|Windows/)?.[0] || 'מכשיר'} · ${screen.width}×${screen.height} · ${standalone() ? 'מותקנת' : 'דפדפן'}`;
    const cloud = sync.saveFeedback({ kind, message, contact: sync.user()?.email || '', device });
    let mailed = false;
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${FEEDBACK_FORM}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: `💌 הערה חדשה — זוכרים בכיף (${FK[kind]})`, _template: 'table', _captcha: 'false', 'אפליקציה': 'זוכרים בכיף 🌱', 'סוג': FK[kind], 'הערה': message, 'מכשיר': device }) });
      if (r.ok) { try { const j = await r.json(); mailed = j.success === true || j.success === 'true'; } catch { /* */ } }
    } catch { /* */ }
    if ((await cloud) || mailed) { closeSheet(); toast('💌 תודה! ההערה נשלחה'); return; }
    e.target.disabled = false; e.target.textContent = '📨 שליחה';
    c.querySelector('#fErr').innerHTML = `לא הצלחתי לשלוח (אין אינטרנט?). אפשר <a href="mailto:${FEEDBACK_TO}?subject=${encodeURIComponent('הערה — זוכרים בכיף')}&body=${encodeURIComponent(message)}">לשלוח במייל רגיל</a>`;
  };
}

// ================= 📲 התקנה =================
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// 📦 נפתחו מתוך אפליקציה אחרת (וואטסאפ, אפליקציית סינון…): משם אי אפשר להתקין. מעבירים פעם אחת ל-Chrome / Safari
const APP_URL = 'https://zochrimbekef.github.io/';
const inWebView = () => { const ua = navigator.userAgent; return !isIOS() && /android/i.test(ua) && (/; wv\)/.test(ua) || (/Version\/\d/.test(ua) && /Chrome/.test(ua)) || /FBAN|FBAV|Instagram|Line\/|Moi\b|WhatsApp|Telegram/i.test(ua)); };
const iosNotSafari = () => isIOS() && (/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line\//i.test(navigator.userAgent) || !/Safari/i.test(navigator.userAgent));
const CHROME_INTENT = 'intent://zochrimbekef.github.io/#Intent;scheme=https;package=com.android.chrome;end';
function openInstall() {
  let body;
  if (inWebView()) body = `<div class="tipbox">📦 <b>נפתחתם מתוך אפליקציה אחרת</b> (וואטסאפ, אפליקציית סינון וכדומה), ומשם אי אפשר להתקין. פותחים פעם אחת ב־<b>Chrome</b>, ושם ההתקנה עובדת:</div>
    <a class="btn" href="${CHROME_INTENT}" style="display:block;text-align:center;text-decoration:none">🌐 לפתוח ב־Chrome</a>
    <button class="btn g" id="instCopy">📋 להעתיק את הקישור</button>
    <p class="muted" style="margin-top:8px">לא נפתח? מעתיקים את הקישור, פותחים את Chrome, מדביקים למעלה ונכנסים. ושם: ⚙️ ← "📲 התקנה".</p>`;
  else if (iosNotSafari()) body = `<div class="tipbox">⚠️ <b>באייפון אפשר להתקין רק מ־Safari</b>, ומהדפדפן הזה זה לא יעבוד.</div>
    <ol class="steps"><li>לוחצים: <button class="chip" id="instCopy">📋 להעתיק את הקישור</button></li><li>פותחים את <b>Safari</b>, מדביקים למעלה ונכנסים.</li><li>שם: כפתור השיתוף <b>⬆️</b> ← <b>"הוסף למסך הבית"</b> ← <b>"הוסף"</b>.</li></ol>`;
  else if (standalone()) body = '<p>✅ האפליקציה כבר מותקנת אצלך. פותחים אותה מהאייקון 🌱 במסך הבית.</p>';
  else if (installEvt) body = '<p>לחיצה אחת, והאייקון 🌱 יופיע במסך הבית.</p><button class="btn" id="doInst">📲 התקן</button>';
  else if (isIOS()) body = `<ol class="steps"><li>פותחים את הכתובת ב<b>ספארי</b> (לא בתוך וואטסאפ).</li><li>לוחצים על כפתור השיתוף <b>⬆️</b> בתחתית.</li><li>גוללים ובוחרים <b>"הוסף למסך הבית"</b>.</li><li>לוחצים <b>"הוסף"</b>. האייקון 🌱 יופיע במסך הבית.</li></ol>`;
  else body = `<ol class="steps"><li>פותחים את הכתובת ב<b>כרום</b>: <span class="ltr">zochrimbekef.github.io</span></li><li>לוחצים על <b>⋮</b> למעלה.</li><li>בוחרים <b>"התקנת האפליקציה"</b> או <b>"הוספה למסך הבית"</b>.</li></ol>`;
  const c = sheet(`<h3>📲 התקנה למסך הבית</h3>${body}<p class="muted" style="margin-top:10px">אחרי ההתקנה האפליקציה עובדת גם בלי אינטרנט.</p>`);
  c.querySelector('#instCopy')?.addEventListener('click', async e => { try { await navigator.clipboard.writeText(APP_URL); e.target.textContent = inWebView() ? '✅ הועתק. עכשיו פותחים Chrome ומדביקים' : '✅ הועתק. עכשיו ל־Safari'; } catch { e.target.textContent = APP_URL; } });
  c.querySelector('#doInst')?.addEventListener('click', async () => { installEvt.prompt(); const r = await installEvt.userChoice; installEvt = null; closeSheet(); if (r.outcome === 'accepted') toast('🌱 הותקנה!'); });
}

// ================= כניסה =================
function showGate(mode = 'in') {
  document.body.classList.remove('calm-bg');
  V().innerHTML = `<div class="scr gate"><div class="sun"></div>
    <div class="glogo">🌱</div><h1 class="gt">זוכרים בכיף</h1>
    <p class="muted" style="text-align:center">12 דקות ביום. כל מילה הופכת לתמונה, לסדר ולצבע.</p>
    <div class="card">
      <div class="seg">${[['in', 'כניסה'], ['up', 'חשבון חדש']].map(([k, n]) => `<button data-m="${k}" class="${mode === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <p class="muted" style="font-size:14px">${mode === 'in' ? 'אותו מייל וסיסמה כמו בכסף בכיף ובזמן בכיף.' : 'כבר יש לך חשבון בכסף בכיף או בזמן בכיף? בחר "כניסה".'}</p>
      <label class="field"><span>מייל</span><input id="gE" type="email" autocomplete="email" inputmode="email" dir="ltr"></label>
      <label class="field"><span>סיסמה</span><input id="gP" type="password" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" dir="ltr"></label>
      <div id="gErr" class="err"></div>
      <button class="btn" id="gGo" style="margin-top:6px">${mode === 'in' ? '🌱 כניסה' : '🌱 פתיחת חשבון'}</button>
      ${mode === 'in' ? '<button class="link" id="gForgot" style="margin-top:12px">שכחתי סיסמה</button>' : ''}
    </div></div>`;
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => showGate(b.dataset.m));
  const err = t => { $('#gErr').textContent = t; };
  $('#gGo').onclick = async e => {
    const em = $('#gE').value.trim(), pw = $('#gP').value;
    if (!em || !pw) return err('צריך מייל וסיסמה');
    e.target.disabled = true; err('');
    try { await (mode === 'in' ? sync.signIn(em, pw) : sync.signUp(em, pw)); await afterLogin(); }
    catch (x) { err(x.message); e.target.disabled = false; }
  };
  $('#gForgot')?.addEventListener('click', async () => {
    const em = $('#gE').value.trim(); if (!em) return err('קודם כותבים את המייל למעלה');
    try { await sync.resetPassword(em); err(''); toast('📧 נשלח מייל עם קישור לסיסמה חדשה', 4000); } catch (x) { err(x.message); }
  });
}
function askNewPassword() {
  const c = sheet(`<h3>🔑 סיסמה חדשה</h3><label class="field"><span>הסיסמה החדשה (לפחות 6 תווים)</span><input id="np" type="password" autocomplete="new-password" dir="ltr"></label><div id="npErr" class="err"></div><button class="btn" id="npGo">שמירה</button>`);
  c.querySelector('#npGo').onclick = async () => {
    try { await sync.setPassword(c.querySelector('#np').value); closeSheet(); toast('✅ הסיסמה עודכנה'); } catch (x) { c.querySelector('#npErr').textContent = x.message; }
  };
}
async function afterLogin() {
  const u = sync.user();
  const prevUid = await db.get('uid', null);
  if (prevUid && prevUid !== u.id) D = blank();   // משתמש אחר באותו טלפון — לא מערבבים
  await db.set('uid', u.id);
  const remote = await sync.pull();
  D = merge(D, remote);
  await db.set('state', D);
  if (sync.cloud === 'ok') sync.push(D);
  go('home'); render();
  maybeNews();
}
async function maybeNews() {
  if (db.BDIKA) return;
  const seen = await db.get('seenNews', '');
  if (seen !== LATEST) setTimeout(() => openNews(true), 700);
}

// ================= ניתוב =================
function render() {
  clearT(); if (listening) stopListen(); document.body.classList.remove('calm-bg');
  if (!sync.user() && !db.BDIKA && !(window.__offlineUid)) return showGate();
  const r = (location.hash || '#home').slice(1);
  if (r === 'settings') { history.replaceState(null, '', '#home'); home(); settings(); return; }
  ({ home, ex1, ex2, ex3, helper }[r] || home)();
  scrollTo(0, 0);
}

// ================= הפעלה =================
function bdikaFixture() {
  const d = blank(); let k = dayKey();
  for (let i = 1; i <= 6; i++) { k = addDays(dayKey(), -i); d.days[k] = { ex1: 1, ex2: 1, ex3: 1 }; }
  d.seeds = [['🔑', 'Key', 'מפתח'], ['🚪', 'Door', 'דלת'], ['📖', 'Book', 'ספר'], ['🍎', 'Apple', 'תפוח'], ['🌙', 'Moon', 'ירח']].map(([pic, en, he], i) => ({ id: 's' + i, pic, en, he, story: '', planted: addDays(dayKey(), -i) }));
  d.ex2 = { level: 3, run: 0, hist: [{ d: addDays(dayKey(), -4), words: 45, ok: true }] };
  d.ex1 = { level: 4, run: 1, seen: [], hist: [{ d: addDays(dayKey(), -5), len: 3, ok: true }, { d: addDays(dayKey(), -1), len: 4, ok: true }] };
  return d;
}
async function boot() {
  if ('serviceWorker' in navigator && !db.BDIKA) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    let had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had) { had = true; return; }
      const t = $('#toast'); t.innerHTML = '✨ יש גרסה חדשה <button class="tbtn" onclick="location.reload()">לרענן</button>'; t.classList.add('on'); t.style.pointerEvents = 'auto';
    });
  }
  if (db.BDIKA) {
    D = bdikaFixture();
    const [v, i] = db.NEWS_JUMP.split('|'); const n = NEWS.find(x => x.v === v);
    const it = n?.items[+i];
    if (it?.go) { location.hash = ''; render(); return setTimeout(() => jumpTo(it.go), 200); }
    return render();
  }
  D = (await db.get('state', null)) || blank();
  try {
    sync.onRecovery(askNewPassword);
    const u = await sync.currentUser();
    if (u) {
      render(); maybeNews();
      sync.pull().then(async remote => { const before = JSON.stringify(D); D = merge(D, remote); await db.set('state', D); if (sync.cloud === 'ok') sync.push(D); if (JSON.stringify(D) !== before && (location.hash || '#home') === '#home') render(); });
    } else showGate();
  } catch {
    // בלי אינטרנט ובלי ספריית הענן: מי שכבר נכנס בעבר בטלפון הזה ממשיך מהטלפון
    window.__offlineUid = await db.get('uid', null);
    render();
  }
}
boot();
