// Shared helpers: Hungarian date parsing, slugs, category and venue detection.

export const MONTHS = {
  január: 1, február: 2, március: 3, április: 4, május: 5, június: 6,
  július: 7, augusztus: 8, szeptember: 9, október: 10, november: 11, december: 12,
};

// Short forms used on venue sites ("Okt.", "Nov.", "Szept.")
const SHORT_MONTHS = {
  jan: 1, feb: 2, febr: 2, már: 3, márc: 3, mar: 3, ápr: 4, apr: 4, máj: 5, maj: 5, may: 5,
  jún: 6, jun: 6, júl: 7, jul: 7, aug: 8, szep: 9, szept: 9, sep: 9, okt: 10, oct: 10, nov: 11, dec: 12,
};

const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Today's date in Budapest as YYYY-MM-DD. */
export function todayBudapest(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(now);
}

/**
 * Parses "2026. október 16., péntek - 2026. október 22., csütörtök" or
 * "2026. október 24., szombat 20:00" into { start, end, time }.
 */
export function parseHuDateRange(text) {
  const re = /(\d{4})\.\s*([a-záéíóöőúüű]+)\s+(\d{1,2})\./gi;
  const dates = [...text.matchAll(re)]
    .map(([, y, mon, d]) => {
      const m = MONTHS[mon.toLowerCase()];
      return m ? isoDate(+y, m, +d) : null;
    })
    .filter(Boolean);
  // Egy hónapon belüli tartomány: "2026. október 20–25."
  const same = text.match(/(\d{4})\.\s*([a-záéíóöőúüű]+)\s+(\d{1,2})\.?\s*[–-]\s*(\d{1,2})\./i);
  if (dates.length <= 1 && same && MONTHS[same[2].toLowerCase()]) {
    const m = MONTHS[same[2].toLowerCase()];
    dates.splice(0, dates.length, isoDate(+same[1], m, +same[3]), isoDate(+same[1], m, +same[4]));
  }
  if (!dates.length) return null;
  const time = text.match(/\b(\d{1,2}):(\d{2})\b/);
  return {
    start: dates[0],
    end: dates[1] && dates[1] !== dates[0] ? dates[1] : null,
    time: time ? `${pad(time[1])}:${time[2]}` : null,
  };
}

/** Month abbreviation + day without year → ISO date, rolling into next year when needed. */
export function parseShortDate(monthText, dayText, today) {
  const key = monthText.toLowerCase().replace(/[^a-záéíóöőúüű]/g, '');
  const m = SHORT_MONTHS[key] ?? MONTHS[key];
  const d = parseInt(dayText, 10);
  if (!m || !d) return null;
  const [ty, tm] = today.split('-').map(Number);
  // Listings only show upcoming events: a month far behind today means next year.
  const y = m < tm - 2 ? ty + 1 : ty;
  return isoDate(y, m, d);
}

const toAscii = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function slugify(s) {
  return toAscii(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/, '');
}

export const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export const CATEGORIES = [
  'Koncert', 'Buli', 'Kiállítás', 'Színház', 'Film', 'Fesztivál',
  'Gasztró', 'Családi', 'Szabadidő', 'Vásár', 'Kultúra',
];

/** Picks a unified category from free text (title, url slug, source category). */
// Finomabb műfaj a kártyákra (csak megjelenítés; a csoportosítás a kategória szerint marad).
// Kategóriánként csak az oda illő műfajok jöhetnek szóba, így egy „tánc” szó nem tesz táncelőadássá egy koncertet.
const MUSIC = [
  [/jazz|swing|-blues-|bebop|big-band/, 'Jazz'],
  [/klasszikus|filharmon|orgona|kamarazene|vonosnegyes|zongoraest|szimfon|barokk|kortars-zene|classical/, 'Klasszikus'],
  [/techno|-house-|drum-and-bass|-dnb-|-trance-|psytrance|-psy-|elektronikus|electronic|-rave-|-dj-|dj-set|-edm-/, 'Elektronikus'],
  [/metal|-punk|hardcore|-rock|grunge|-pogo|stoner|-emo-/, 'Rock'],
  [/hip-?hop|-rap-|rapper|-trap-|grime/, 'Hip-hop'],
  [/nepzene|-folk|tanchaz|vilagzene|world-music|balkan|klezmer|cigany/, 'Népzene & folk'],
  [/-soul|funk|r-n-b|-rnb-|reggae|-ska-|dub-|afrobeat|latin|cumbia|disco/, 'Soul & funk'],
  [/indie|-pop-|alter|singer-songwriter|dream-pop|synth|shoegaze|-pop/, 'Indie & pop'],
];
const STAGE = [
  [/stand-?up|dumaszinhaz|dumaklub|onallo-est|comedy|-humor/, 'Stand-up'],
  [/-opera|operett/, 'Opera'],
  [/balett|-tanc|tancszinhaz|tanceloadas|dance|koreograf/, 'Tánc'],
  [/musical/, 'Musical'],
  [/-slam/, 'Slam poetry'],
];
const LEISURE = [
  [/stand-?up|dumaszinhaz|dumaklub|comedy/, 'Stand-up'],
  [/kviz|quiz|tarsas|boardgame|bingo/, 'Kvíz & játék'],
  [/-seta|setak-|-tura-|walking|vezetett/, 'Séta'],
  [/fenyfesztival|lumina|lights|fenyparad|fenyfest/, 'Fényparádé'],
  [/workshop|kurzus|alkotomuhely/, 'Workshop'],
  [/-joga|yoga|-futas|-sport/, 'Sport & mozgás'],
  [/csillag|planetarium|tudomany|-talk-|beszelgetes|kerekasztal|eloadas/, 'Előadás'],
];
const GENRES = {
  Koncert: [MUSIC, 'Koncert'], Buli: [MUSIC.filter(([, g]) => g !== 'Klasszikus'), 'Buli'], Színház: [STAGE, 'Színház'],
  Kiállítás: [[[/-photo-|fotografi|foto-?kiallitas|press-photo/, 'Fotó'], [/design/, 'Design']], 'Kiállítás'],
  Szabadidő: [LEISURE, 'Program'], Kultúra: [[...LEISURE, ...STAGE], 'Kultúra'],
};
const GENRE_BY_VENUE = { 'Budapest Jazz Club': 'Jazz', 'Corvin Dumaszínház': 'Stand-up', 'MIXÁT Dumaklub': 'Stand-up' };

export function detectGenre({ category, title = '', description = '', tags = '', venue = '', source = '' }) {
  if (source === 'dumaszinhaz' || (GENRE_BY_VENUE[venue] && category === 'Koncert')) {
    return source === 'dumaszinhaz' ? 'Stand-up' : GENRE_BY_VENUE[venue];
  }
  const [rules, fallback] = GENRES[category] || [[], category];
  const t = `-${toAscii(`${title} ${tags} ${(description || '').slice(0, 600)}`).replace(/[^a-z0-9]+/g, '-')}-`;
  for (const [re, genre] of rules) if (re.test(t)) return genre;
  return fallback;
}

export function detectCategory(text, fallback = 'Szabadidő') {
  const t = `-${toAscii(text).replace(/[^a-z0-9]+/g, '-')}-`;
  const rules = [
    [/kiallitas|tarlat|muzeum|galeria|press-photo|fotokiallitas/, 'Kiállítás'],
    [/gyerekprogram|gyerekeknek|csaladi|csaladok|babszinhaz|mesejatek/, 'Családi'],
    [/gyerek|csalad/, 'Családi'],
    [/koncert|zenekar|jazz|orgona|filharmon|unnep-\d|liszt/, 'Koncert'],
    [/buli|party|-dj-|klubest|-rave-/, 'Buli'],
    [/szinhaz|eloadas|musical|opera|balett|tanc|slam/, 'Színház'],
    [/film|-mozi|vetites|klipszemle/, 'Film'],
    [/fesztival|het-budapest|showcase/, 'Fesztivál'],
    [/gasztro|vacsora|-bor-|borfesztival|-sor-|sorfesztival|fozes|kostolo|street-food|whisky|spirit|-wine-/, 'Gasztró'],
    [/vasar|placc|toy-show|market|bolhapiac/, 'Vásár'],
  ];
  for (const [re, cat] of rules) if (re.test(t)) return cat;
  return fallback;
}

// Known venues: a stem regex (Hungarian suffixes vary) → canonical name.
const VENUES = [
  [/akv[aá]rium/i, 'Akvárium Klub'],
  [/d[uü]rer/i, 'Dürer Kert'],
  [/\bA38\b/i, 'A38 Hajó'],
  [/turbin[aá]/i, 'Turbina'],
  [/barba negr/i, 'Barba Negra'],
  [/m[uü]p[aá]/i, 'Müpa'],
  [/mai man[oó]/i, 'Mai Manó Ház'],
  [/sz[eé]pm[uű]v[eé]szeti/i, 'Szépművészeti Múzeum'],
  [/nemzeti gal[eé]ri/i, 'Magyar Nemzeti Galéria'],
  [/nemzeti m[uú]zeum/i, 'Magyar Nemzeti Múzeum'],
  [/ludwig/i, 'Ludwig Múzeum'],
  [/radn[oó]ti/i, 'Radnóti Színház'],
  [/pesti vigad[oó]/i, 'Pesti Vigadó'],
  [/bem mozi/i, 'Bem mozi'],
  [/hengermalom/i, 'Hengermalom'],
  [/neverland/i, 'Neverland'],
  [/[eé]szaki j[aá]rm[uű]jav[ií]t[oó]/i, 'Északi Járműjavító'],
  [/dugatty[uú]s/i, 'Dugattyús'],
  [/v[aá]rosh[aá]za park/i, 'Városháza park'],
  [/arkki/i, 'Arkki Műhely'],
  [/g[oö]d[oö]r/i, 'Gödör'],
  [/muzikum/i, 'Muzikum'],
  [/toldi (art)?mozi/i, 'Toldi Mozi'],
  [/\btoldi\b/i, 'Toldi Klub'],
  [/m[uű]v[eé]sz (art)?mozi/i, 'Művész Mozi'],
  [/puskin (art)?mozi/i, 'Puskin Mozi'],
  [/kino caf[eé]/i, 'Kino Cafe Mozi'],
  [/tab[aá]n (art)?mozi/i, 'Tabán artmozi'],
  [/katona j[oó]zsef/i, 'Katona József Színház'],
  [/v[ií]gsz[ií]nh[aá]z/i, 'Vígszínház'],
  [/pesti sz[ií]nh[aá]z/i, 'Pesti Színház'],
  [/^robot$|\bROBOT\b/, 'Robot'],
  [/\bkazi\b/i, 'KAZI'],
  [/h[aá]rom holl[oó]/i, 'Három Holló'],
  [/instant|fogas/i, 'Instant & Fogas'],
  [/l[aä]rm/i, 'Lärm'],
  [/\bmanyi\b/i, 'MANYI'],
  [/e[oö]tv[oö]s ?10/i, 'Eötvös10'],
  [/budapest park/i, 'Budapest Park'],
  [/borganik/i, 'Borganika'],
  [/klauz[aá]l t[eé]ri/i, 'Klauzál téri Vásárcsarnok'],
  [/ferencv[aá]rosi m[uű]vel[oő]d[eé]si/i, 'Ferencvárosi Művelődési Központ'],
  [/zene h[aá]z/i, 'Magyar Zene Háza'],
  [/m[uű]csarnok/i, 'Műcsarnok'],
  [/trafó/i, 'Trafó'],
  [/b[aá]lna/i, 'Bálna'],
  [/gy[aá]rudvar/i, 'Gyárudvar'],
  [/szimpla/i, 'Szimpla Kert'],
  [/mom park|mom kult/i, 'MOM Kult'],
  [/erkel/i, 'Erkel Színház'],
  [/operah[aá]z/i, 'Magyar Állami Operaház'],
];

export function detectVenue(text) {
  for (const [re, name] of VENUES) if (re.test(text)) return name;
  return null;
}

const MONTH_RE = '(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)';
const WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const yearFor = (m, today) => {
  const [ty, tm] = today.split('-').map(Number);
  return m < tm - 2 ? ty + 1 : ty;
};

/**
 * Pulls a date range out of Hungarian prose or headings:
 *   "2026. október 21-25."  "október 21. – november 22."  "szeptember 18. és október 18. között"
 *   "október 20-tól" (open ended: assumed to run `openDays`)  "október 25-ig" (runs until then)
 */
export function parseHuProse(text, today = todayBudapest(), { openDays = 45 } = {}) {
  const re = new RegExp(`(?:(\\d{4})\\.\\s*)?${MONTH_RE}\\s+(\\d{1,2})(?:\\s*[-–]\\s*(\\d{1,2})(?![\\d:]))?\\.?(-?(?:t[oóöő]l|ig|i|[aáeé]n))?`, 'gi');
  const dates = [];
  let until = null;
  let from = null;
  for (const [, y, mon, d1, d2, suffix] of text.matchAll(re)) {
    const m = MONTHS[mon.toLowerCase()];
    const year = y ? +y : yearFor(m, today);
    const a = isoDate(year, m, +d1);
    dates.push(a);
    if (d2 && +d2 > +d1) dates.push(isoDate(year, m, +d2));
    const s = (suffix || '').toLowerCase().replace('-', '');
    if (s === 'ig') until = d2 ? isoDate(year, m, +d2) : a;
    if (/^t[oóöő]l$/.test(s)) from = a;
  }
  const time = text.match(/\b(\d{1,2}):(\d{2})\b/);
  const t = time ? `${time[1].padStart(2, '0')}:${time[2]}` : null;
  if (until && dates.length === 1) return { start: today, end: until, time: t };
  if (from && dates.length === 1) return { start: from, end: addDays(from, openDays), time: t };
  if (!dates.length) return null;
  dates.sort();
  const end = dates[dates.length - 1];
  return { start: dates[0], end: end !== dates[0] ? end : null, time: t };
}

/** The first date on/after `after` that falls on the weekday named in the text ("Szombati programok"). */
export function weekdayDate(text, after) {
  const t = text.toLowerCase();
  const wd = WEEKDAYS.findIndex((w) => t.includes(w));
  if (wd < 0) return null;
  for (let i = 0; i < 7; i++) {
    const d = addDays(after, i);
    if (new Date(`${d}T12:00:00Z`).getUTCDay() === wd) return d;
  }
  return null;
}

const SMALL_WORDS = new Set(['és', 'a', 'az', 'de', 'vagy', 'with', 'the', 'and', 'of', 'in', 'at', 'feat.', 'vs.', 'x']);

/** "10. MAGYAR KLIPSZEMLE DÍJÁTADÓ" → "10. Magyar Klipszemle Díjátadó"; short tokens (DJ, UK, A38) stay as they are. */
export function tidyTitle(t) {
  const letters = t.replace(/[^a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ]/g, '');
  const upper = letters.replace(/[^A-ZÁÉÍÓÖŐÚÜŰ]/g, '').length;
  if (letters.length < 8 || upper / letters.length < 0.8) return t;
  return t.split(' ').map((w, i) => {
    const lw = w.toLocaleLowerCase('hu');
    if (i > 0 && SMALL_WORDS.has(lw)) return lw;
    if (/\d/.test(w) || w.replace(/[^\p{L}]/gu, '').length <= 2) return w;
    return lw.replace(/^(\P{L}*)(\p{L})/u, (_, pre, c) => pre + c.toLocaleUpperCase('hu'));
  }).join(' ');
}

/**
 * Ingyenes-e a program. Csak egyértelmű megfogalmazás számít ("ingyenes kiállítás", "a belépés díjtalan",
 * "ingyenesen látogatható", "szabad belépés", vagy "Ingyenes …" kezdetű cím) – a feltételes kedvezmény
 * ("születésnaposoknak ingyenes belépő") nem.
 */
const FREE_PATTERNS = [
  /^\s*(ingyenes|free)\b/,
  /\bingyenes(en)? \S*(program|rendezvény|koncert|kiállítás|fesztivál|esemény|vásár|séta|túra|előadás|vetítés|jam|buli)/,
  /\b(ingyenesen|díjtalanul) (látogatható|megtekinthető|vehető részt|lehet részt venni)/,
  /\bbelépés ?:? ?(ingyenes|díjtalan|0 ?ft)|\ba belépés (ingyenes|díjtalan)|\bszabad belépés|\bfree (entry|admission)\b/,
];
// Ha közvetlenül előtte feltétel áll ("12 éves kor alatt", "diákoknak", "születésnaposoknak", "ha …"), nem számít.
const FREE_CONDITION = /(alatt|alattiak|felett|éves|évesek|gyerek|diák|nyugdíjas|születésnap|kedvezmény|regisztráció|\bha\b|esetén)[^.!?]{0,40}$/;

export function detectFree(text = '') {
  const t = text.toLowerCase();
  if (/nem ingyenes/.test(t)) return false;
  return FREE_PATTERNS.some((re) => {
    const m = re.exec(t);
    return m && !FREE_CONDITION.test(t.slice(Math.max(0, m.index - 60), m.index));
  });
}

/** A legolcsóbb jegyár forintban a szövegből ("3 900 Ft", "8.000 Ft-tól", "2500 HUF"), vagy null. */
export function detectPrice(text = '') {
  const prices = [...text.matchAll(/(\d{1,3}(?:[ . ]\d{3})|\d{3,5})\s?(?:,-\s?)?(?:Ft|HUF|forint)\b/gi)]
    .map((m) => Number(m[1].replace(/[ . ]/g, '')))
    .filter((n) => n >= 300 && n <= 100000);
  return prices.length ? Math.min(...prices) : null;
}
