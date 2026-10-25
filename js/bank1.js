// 👂 "שמע והפוך לתמונה": התמונות והמאגר. כל הוראה (say) מוקלטת לבד ב-deploy.sh בקול של כרמית.
// חשוב: say בגרשיים בודדים ובלי גרש בתוך הטקסט, אחרת ההקלטה לא תמצא אותו.
// e = אימוג'י, w = מה כתוב, c = צבע (נקודה צבעונית), n = כמות (×2), g = קבוצה של אותו חפץ (בשביל הסחות דומות), wd = עולם
export const IT = {
  // 🎸 ציוד והופעות
  cable: { e: '🔌', w: 'כבל', g: 'cable', wd: 'gear' }, cable_red: { e: '🔌', w: 'כבל אדום', c: '#E53935', g: 'cable', wd: 'gear' }, cable_blue: { e: '🔌', w: 'כבל כחול', c: '#1E88E5', g: 'cable', wd: 'gear' },
  mic: { e: '🎤', w: 'מיקרופון', g: 'mic', wd: 'gear' }, mic2: { e: '🎤', w: 'שני מיקרופונים', n: 2, g: 'mic', wd: 'gear' },
  spk: { e: '🔊', w: 'רמקול', g: 'spk', wd: 'gear' }, spk2: { e: '🔊', w: 'שני רמקולים', n: 2, g: 'spk', wd: 'gear' },
  batt: { e: '🔋', w: 'סוללות', g: 'batt', wd: 'gear' }, batt4: { e: '🔋', w: 'ארבע סוללות', n: 4, g: 'batt', wd: 'gear' },
  keys: { e: '🎹', w: 'מקלדת', wd: 'gear' }, pedal: { e: '🦶', w: 'דוושה', wd: 'gear' }, phones: { e: '🎧', w: 'אוזניות', wd: 'gear' },
  notes: { e: '📄', w: 'תווים', wd: 'gear' }, stand: { e: '🎼', w: 'מעמד תווים', wd: 'gear' }, torch: { e: '🔦', w: 'פנס', wd: 'gear' },
  guitar: { e: '🎸', w: 'גיטרה', wd: 'gear' }, drum: { e: '🥁', w: 'תוף', wd: 'gear' }, laptop: { e: '💻', w: 'מחשב נייד', wd: 'gear' }, bag: { e: '🎒', w: 'תיק', wd: 'gear' },
  // 🛒 קניות
  bread: { e: '🍞', w: 'לחם', wd: 'shop' }, milk: { e: '🥛', w: 'חלב', wd: 'shop' }, eggs: { e: '🥚', w: 'ביצים', wd: 'shop' }, cheese: { e: '🧀', w: 'גבינה', wd: 'shop' },
  apple: { e: '🍎', w: 'תפוחים', wd: 'shop' }, tomato: { e: '🍅', w: 'עגבניות', wd: 'shop' }, cucumber: { e: '🥒', w: 'מלפפון', wd: 'shop' }, banana: { e: '🍌', w: 'בננות', wd: 'shop' },
  rice: { e: '🍚', w: 'אורז', wd: 'shop' }, coffee: { e: '☕', w: 'קפה', wd: 'shop' }, water: { e: '💧', w: 'מים', wd: 'shop' },
  // 🏠 בית
  trash: { e: '🗑️', w: 'להוציא זבל', wd: 'home' }, wash: { e: '🧺', w: 'כביסה', wd: 'home' }, dishes: { e: '🍽️', w: 'לשטוף כלים', wd: 'home' }, plants: { e: '🪴', w: 'להשקות עציצים', wd: 'home' },
  light: { e: '💡', w: 'לכבות אור', wd: 'home' }, door: { e: '🚪', w: 'לנעול דלת', wd: 'home' }, keyhome: { e: '🔑', w: 'מפתחות', wd: 'home' }, charge: { e: '📱', w: 'להטעין טלפון', wd: 'home' },
  shirt_w: { e: '👔', w: 'חולצה לבנה', c: '#FFFFFF', g: 'shirt', wd: 'home' }, shirt_b: { e: '👔', w: 'חולצה כחולה', c: '#1E88E5', g: 'shirt', wd: 'home' },
  // 📋 סידורים
  yossi: { e: '📞', w: 'להתקשר ליוסי', wd: 'run' }, wa: { e: '💬', w: 'וואטסאפ לדני', wd: 'run' }, mail: { e: '✉️', w: 'לשלוח מייל', wd: 'run' }, fuel: { e: '⛽', w: 'לתדלק', wd: 'run' },
  bank: { e: '🏦', w: 'בנק', wd: 'run' }, post: { e: '📮', w: 'דואר', wd: 'run' }, pharm: { e: '💊', w: 'בית מרקחת', wd: 'run' }, cal: { e: '📅', w: 'לקבוע תור', wd: 'run' }, hair: { e: '💈', w: 'מספרה', wd: 'run' },
};

export const BANK = [
  // רמה 3
  { id: 'a1', say: 'תביא כבל, תתקשר ליוסי, ואל תשכח דוושה.', seq: ['cable', 'yossi', 'pedal'] },
  { id: 'a2', say: 'תקנה לחם, חלב וביצים.', seq: ['bread', 'milk', 'eggs'] },
  { id: 'a3', say: 'תוציא את הזבל, תשקה את העציצים ותנעל את הדלת.', seq: ['trash', 'plants', 'door'] },
  { id: 'a4', say: 'תתדלק, תעבור בבנק ותשלח וואטסאפ לדני.', seq: ['fuel', 'bank', 'wa'] },
  { id: 'a5', say: 'תביא מיקרופון, אוזניות ותווים.', seq: ['mic', 'phones', 'notes'] },
  { id: 'a6', say: 'תכבה את האור, תטעין את הטלפון ותיקח מפתחות.', seq: ['light', 'charge', 'keyhome'] },
  // רמה 4
  { id: 'b1', say: 'קודם תקנה לחם, אחר כך תתדלק, תביא את התווים, ובסוף תתקשר ליוסי.', seq: ['bread', 'fuel', 'notes', 'yossi'] },
  { id: 'b2', say: 'תכניס לתיק גיטרה, פנס, סוללות ומעמד תווים.', seq: ['guitar', 'torch', 'batt', 'stand'] },
  { id: 'b3', say: 'תקנה עגבניות, מלפפון, גבינה וקפה.', seq: ['tomato', 'cucumber', 'cheese', 'coffee'] },
  { id: 'b4', say: 'תעשה כביסה, תשטוף כלים, תוציא זבל ותשקה עציצים.', seq: ['wash', 'dishes', 'trash', 'plants'] },
  { id: 'b5', say: 'תקבע תור, ותעבור בבית מרקחת, בדואר ובמספרה.', seq: ['cal', 'pharm', 'post', 'hair'] },
  { id: 'b6', say: 'תביא מקלדת, רמקול, תוף ומחשב נייד.', seq: ['keys', 'spk', 'drum', 'laptop'] },
  // רמה 5 (מתחילים צבעים ומספרים)
  { id: 'c1', say: 'תכניס לתיק אוזניות, סוללות, מיקרופון, מים ואת הדוושה.', seq: ['phones', 'batt', 'mic', 'water', 'pedal'] },
  { id: 'c2', say: 'תביא כבל אדום, שני רמקולים, מקלדת, פנס ותווים.', seq: ['cable_red', 'spk2', 'keys', 'torch', 'notes'] },
  { id: 'c3', say: 'תקנה חלב, בננות, אורז, ביצים ולחם.', seq: ['milk', 'banana', 'rice', 'eggs', 'bread'] },
  { id: 'c4', say: 'תתקשר ליוסי, תשלח מייל, תתדלק, תעבור בבנק ותקנה קפה.', seq: ['yossi', 'mail', 'fuel', 'bank', 'coffee'] },
  { id: 'c5', say: 'תלבש חולצה לבנה, תיקח מפתחות, תכבה את האור, תנעל את הדלת ותטעין את הטלפון.', seq: ['shirt_w', 'keyhome', 'light', 'door', 'charge'] },
  { id: 'c6', say: 'תביא כבל כחול, מיקרופון, אוזניות, מחשב נייד ותיק.', seq: ['cable_blue', 'mic', 'phones', 'laptop', 'bag'] },
  // רמה 6
  { id: 'd1', say: 'תביא שני מיקרופונים, כבל אדום, מעמד תווים, גיטרה, סוללות ופנס.', seq: ['mic2', 'cable_red', 'stand', 'guitar', 'batt', 'torch'] },
  { id: 'd2', say: 'תקנה לחם, גבינה, עגבניות, מלפפון, חלב ותפוחים.', seq: ['bread', 'cheese', 'tomato', 'cucumber', 'milk', 'apple'] },
  { id: 'd3', say: 'תשטוף כלים, תעשה כביסה, תשקה עציצים, תוציא זבל, תטעין את הטלפון ותכבה את האור.', seq: ['dishes', 'wash', 'plants', 'trash', 'charge', 'light'] },
  { id: 'd4', say: 'תתדלק, תעבור בדואר, בבנק ובבית מרקחת, תקבע תור ותתקשר ליוסי.', seq: ['fuel', 'post', 'bank', 'pharm', 'cal', 'yossi'] },
  { id: 'd5', say: 'תלבש חולצה כחולה, ותביא שני רמקולים, כבל כחול, מקלדת, תוף ומים.', seq: ['shirt_b', 'spk2', 'cable_blue', 'keys', 'drum', 'water'] },
  { id: 'd6', say: 'תקנה קפה, אורז, בננות, ביצים, מים ולחם.', seq: ['coffee', 'rice', 'banana', 'eggs', 'water', 'bread'] },
  // רמה 7
  { id: 'e1', say: 'תביא מקלדת, שני רמקולים, כבל אדום, מיקרופון, אוזניות, דוושה ותווים.', seq: ['keys', 'spk2', 'cable_red', 'mic', 'phones', 'pedal', 'notes'] },
  { id: 'e2', say: 'תקנה חלב, לחם, גבינה, ביצים, עגבניות, בננות וקפה.', seq: ['milk', 'bread', 'cheese', 'eggs', 'tomato', 'banana', 'coffee'] },
  { id: 'e3', say: 'תתקשר ליוסי, תשלח וואטסאפ לדני, תתדלק, תעבור בבנק, בדואר ובמספרה, ותקבע תור.', seq: ['yossi', 'wa', 'fuel', 'bank', 'post', 'hair', 'cal'] },
  { id: 'e4', say: 'תלבש חולצה לבנה, תיקח מפתחות ותיק, תכבה את האור, תנעל את הדלת, תוציא זבל ותשקה עציצים.', seq: ['shirt_w', 'keyhome', 'bag', 'light', 'door', 'trash', 'plants'] },
  { id: 'e5', say: 'תכניס לתיק ארבע סוללות, פנס, שני מיקרופונים, כבל כחול, מחשב נייד, מים ומעמד תווים.', seq: ['batt4', 'torch', 'mic2', 'cable_blue', 'laptop', 'water', 'stand'] },
  { id: 'e6', say: 'תקנה אורז, מלפפון, תפוחים, קפה, חלב, לחם וגבינה.', seq: ['rice', 'cucumber', 'apple', 'coffee', 'milk', 'bread', 'cheese'] },
];
export const MIN_LEVEL = 3, MAX_LEVEL = 7, ROUNDS = 3;
