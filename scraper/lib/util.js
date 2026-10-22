// Shared helpers: Hungarian date parsing, slugs, category and venue detection.

export const MONTHS = {
  január: 1, február: 2, március: 3, április: 4, május: 5, június: 6,
  július: 7, augusztus: 8, szeptember: 9, október: 10, november: 11, december: 12,
};

// Short forms used on venue sites ("Okt.", "Nov.", "Szept.")
const SHORT_MONTHS = {
  jan: 1, feb: 2, febr: 2, már: 3, márc: 3, ápr: 4, máj: 5, jún: 6, júl: 7,
  aug: 8, szep: 9, szept: 9, okt: 10, nov: 11, dec: 12,
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
export function detectCategory(text, fallback = 'Szabadidő') {
  const t = `-${toAscii(text).replace(/[^a-z0-9]+/g, '-')}-`;
  const rules = [
    [/kiallitas|tarlat|muzeum|galeria/, 'Kiállítás'],
    [/koncert|zenekar|jazz|orgona|filharmon|unnep-\d|liszt/, 'Koncert'],
    [/buli|party|-dj-|klubest|-rave-/, 'Buli'],
    [/szinhaz|eloadas|musical|opera|balett|tanc|slam/, 'Színház'],
    [/film|-mozi|vetites|klipszemle/, 'Film'],
    [/fesztival|het-budapest|showcase/, 'Fesztivál'],
    [/gyerek|csalad|halloweeni-csaladi|workshop-gyerek/, 'Családi'],
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
