// Fetches every source, merges + dedupes events, and writes:
//   public/data/events.json   – data for the app
//   public/e/<id>/index.html  – per-event share pages with Open Graph tags
//   public/sitemap.xml
// FIXTURES=1 parses the saved HTML in scraper/test/fixtures instead of fetching.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import welovebudapest from './sources/welovebudapest.js';
import akvarium from './sources/akvarium.js';
import tixa from './sources/tixa.js';
import funzine from './sources/funzine.js';
import timeout from './sources/timeout.js';
import a38 from './sources/a38.js';
import trafo from './sources/trafo.js';
import zenehaza from './sources/zenehaza.js';
import { detectVenue, slugify, todayBudapest } from './lib/util.js';

// Curated sources first: on duplicates their description and image win.
const SOURCES = [welovebudapest, funzine, timeout, akvarium, a38, trafo, zenehaza, tixa];
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/?$/, '/');
const today = todayBudapest();

const UA = 'MireMenjunkBot/0.2 (+https://github.com/botondjani/mire-menjunk; programajánló aggregátor)';
const lastHit = new Map(); // host -> timestamp, so every source respects its own crawl delay

async function fetchHtml(url, delayMs = 1000, retried = false) {
  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + delayMs - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'hu-HU,hu;q=0.9' },
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 429 && !retried) {
    // Rate limited: back off once, then give up on this page.
    const after = Math.min(60, +res.headers.get('retry-after') || 20);
    await new Promise((r) => setTimeout(r, after * 1000));
    return fetchHtml(url, delayMs, true);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** Returns [{ url, html }] for a source: saved fixtures, its own crawl(), or its static url list. */
async function pagesOf(source) {
  if (process.env.FIXTURES) {
    return Promise.all((source.fixtures || []).map(async ({ file, url }) => ({
      url, html: await readFile(join(ROOT, 'scraper/test/fixtures', file), 'utf8'),
    })));
  }
  const get = async (url) => {
    try {
      return await fetchHtml(url, source.delayMs);
    } catch (err) {
      console.warn(`  ! ${source.id}: ${err.message}`);
      return null;
    }
  };
  if (source.crawl) return source.crawl(get);
  const pages = [];
  for (const url of source.urls) {
    const html = await get(url);
    if (html) pages.push({ url, html });
  }
  return pages;
}

async function collect(source) {
  const started = Date.now();
  const pages = await pagesOf(source);
  const events = pages.flatMap(({ url, html }) => source.parse(html, { today, url }));
  console.log(`  ${source.name}: ${events.length} találat, ${pages.length} oldal, ${Math.round((Date.now() - started) / 1000)} mp`);
  return events.map((e) => ({ ...e, source: source.id, sourceName: source.name }));
}

const CANCELLED = /\belmarad|\bcancel+ed\b|\bt[oö]r[oö]lve\b/i;
const MUSIC_VENUES = new Set(['Akvárium Klub', 'Dürer Kert', 'A38 Hajó', 'Turbina', 'Barba Negra', 'Müpa', 'Magyar Zene Háza', 'Gödör', 'Szimpla Kert', 'Muzikum', 'Toldi Klub', 'Robot', 'KAZI', 'Három Holló', 'Instant & Fogas', 'Lärm']);

// "Fiataloknak": klubok, ahová az egyetemisták járnak, plusz műfajok és kulcsszavak.
const YOUTH_VENUES = new Set([
  'Dürer Kert', 'Turbina', 'Gödör', 'Toldi Klub', 'Robot', 'KAZI', 'Három Holló',
  'Instant & Fogas', 'Lärm', 'MANYI', 'Eötvös10', 'Szimpla Kert', 'Budapest Park',
]);
const YOUTH_WORDS = /egyetem|\belte\b|\bbme\b|corvinus|semmelweis|g[oó]ly|di[aá]k|student|erasmus|\besn\b|hallgat[oó]|open ?mic|slam|stand-?up|kv[ií]z|quiz|karaoke|\bjam\b|techno|\bhouse\b|drum ?(?:and|&|n) ?bass|\bdnb\b|rave|hip-?hop|\brap\b|indie|punk|pub ?night|beer ?pong|s[oö]rfeszt|ingyenes|free entry|warm-?up|afterparty|lemezbemutat/i;
const NOT_YOUTH = /gyerek|csal[aá]d|nyugd[ií]j|szenior|baba|ovis|nosztalg|eml[eé]k(?:koncert|est)|jubileumi|operett|nagykoncert|tribute|tárlatvezet|kiáll[ií]t/i;

function isYouth(e) {
  if (e.category === 'Családi' || NOT_YOUTH.test(e.title)) return false;
  return e.category === 'Buli'
    || (YOUTH_VENUES.has(e.venue) && ['Koncert', 'Buli', 'Szabadidő'].includes(e.category))
    || YOUTH_WORDS.test(`${e.title} ${e.description || ''}`);
}

/** Shared clean-up so sources agree: canonical venue names, no cancelled shows, better category fallback. */
function normalize(e) {
  const venue = e.venue ? detectVenue(e.venue) || e.venue : null;
  const category = e.category === 'Szabadidő' && MUSIC_VENUES.has(venue) ? 'Koncert' : e.category;
  const out = { ...e, venue, category };
  if (isYouth(out)) out.youth = true;
  return out;
}

const norm = (s) => slugify(s).replace(/-/g, ' ');
const STOP = new Set([
  'live', 'koncert', 'buli', 'party', 'pres', 'presents', 'budapest', 'budapesti', 'magyar', 'klubban', 'kertben',
  'night', 'with', 'and', 'the', 'kiallitas', 'eloadas', 'workshop', 'fesztival', 'halloween', 'karacsony',
  'karacsonyi', 'szilveszter', 'szilveszteri', 'special', 'tour', 'turne', 'show', 'open', 'secret', 'market',
]);
const words = (s, venue) => {
  const venueWords = new Set(norm(venue || '').split(' '));
  return norm(s).split(' ').filter((w) => w.length >= 4 && !STOP.has(w) && ![...venueWords].some((v) => v.length >= 3 && w.startsWith(v)));
};
const sameShow = (a, b) => a.venue && a.venue === b.venue
  && words(a.title, a.venue).some((w) => words(b.title, b.venue).includes(w));

/**
 * Same day and either one title contains the other ("Arlo Parks" vs "Arlo Parks az Akvárium Klubban"),
 * or same venue with a shared distinctive word ("TEST pres. DJ Krush" vs "DJ Krush az Akvárium Klubban").
 */
function dedupe(events) {
  const out = [];
  const byUrl = new Map();
  const byDay = new Map(); // start date -> events, keeps this linear-ish with thousands of events
  for (const e of events) {
    const nt = norm(e.title);
    const twin = byUrl.get(e.url) || (byDay.get(e.start) || []).find(
      (o) => norm(o.title).includes(nt) || nt.includes(norm(o.title)) || sameShow(o, e),
    );
    if (!twin) {
      const ev = { ...e, links: [{ name: e.sourceName, url: e.url }] };
      out.push(ev);
      byUrl.set(e.url, ev);
      if (!byDay.has(e.start)) byDay.set(e.start, []);
      byDay.get(e.start).push(ev);
      continue;
    }
    if (twin.url !== e.url && !twin.links.some((l) => l.url === e.url)) twin.links.push({ name: e.sourceName, url: e.url });
    for (const k of ['image', 'description', 'venue', 'time', 'end', 'youth']) twin[k] ??= e[k];
    // Same source listing a show twice (e.g. seated + accessible tickets): keep the plainer title.
    if (e.source === twin.source && e.title.length < twin.title.length) twin.title = e.title;
  }
  return out;
}

/**
 * Fills missing images: first from the last deployed events.json (so each page is fetched once),
 * then from the event page's og:image. Hosts run in parallel, each at its own polite pace.
 */
async function enrichImages(events) {
  const known = new Map();
  if (SITE_URL !== '/' && !process.env.FIXTURES) {
    try {
      const prev = await (await fetch(`${SITE_URL}data/events.json`, { signal: AbortSignal.timeout(15_000) })).json();
      for (const e of prev.events) if (e.image) for (const l of e.links || []) known.set(l.url, e.image);
    } catch { /* first deploy or offline */ }
  }
  const missing = [];
  for (const e of events) {
    if (e.image) continue;
    const hit = e.links.map((l) => known.get(l.url)).find(Boolean);
    if (hit) e.image = hit;
    else missing.push(e);
  }
  if (process.env.FIXTURES) return;
  const byHost = new Map();
  for (const e of missing) {
    const link = e.links.find((l) => !/facebook\.com|instagram\.com|#/.test(l.url));
    if (!link) continue;
    const host = new URL(link.url).host;
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push([e, link.url]);
  }
  let found = 0;
  await Promise.all([...byHost.values()].map(async (jobs) => {
    for (const [e, url] of jobs.slice(0, 120)) {
      try {
        const html = await fetchHtml(url, 1200);
        const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
        const img = m && new URL(m[1].replace(/&amp;/g, '&'), url).href;
        if (img && !/logo|placeholder|default|favicon/i.test(img)) { e.image = img; found++; }
      } catch { /* the poster fallback covers it */ }
    }
  }));
  console.log(`  Képek: ${missing.length} hiányzott, ${found} pótolva az eseményoldalakról.`);
}

function assignIds(events) {
  const seen = new Set();
  for (const e of events) {
    let id = `${slugify(e.title)}-${e.start.slice(5)}`;
    while (seen.has(id)) id += 'x';
    seen.add(id);
    e.id = id;
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const shortDate = (iso) => `${MONTHS[+iso.slice(5, 7) - 1]} ${+iso.slice(8)}.`;
const dateLabel = (e) => (e.end ? `${shortDate(e.start)} – ${shortDate(e.end)}` : shortDate(e.start) + (e.time ? ` ${e.time}` : ''));

function sharePage(template, e) {
  const title = `${e.title} – ${dateLabel(e)}`;
  const desc = [e.venue, e.category, e.description].filter(Boolean).join(' · ').slice(0, 200);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.time ? `${e.start}T${e.time}` : e.start,
    ...(e.end && { endDate: e.end }),
    ...(e.image && { image: [e.image] }),
    ...(e.description && { description: e.description }),
    location: { '@type': 'Place', name: e.venue || 'Budapest', address: 'Budapest' },
    url: e.url,
  };
  const head = `<base href="../../">
    <title>${esc(title)} | Mire menjünk?</title>
    <meta name="description" content="${esc(desc)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc || 'Budapest legjobb programjai egy helyen')}">
    ${e.image ? `<meta property="og:image" content="${esc(e.image)}">` : ''}
    ${SITE_URL !== '/' ? `<meta property="og:url" content="${esc(`${SITE_URL}e/${e.id}/`)}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  return template.replace(/<!--OG-->[\s\S]*?<!--\/OG-->/, head);
}

async function main() {
  console.log(`Gyűjtés (${today})…`);
  const all = (await Promise.all(SOURCES.map(collect))).flat();
  const upcoming = all.filter((e) => (e.end || e.start) >= today && !CANCELLED.test(e.title)).map(normalize);
  const events = dedupe(upcoming).sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'hu'));
  assignIds(events);
  await enrichImages(events);

  if (!events.length) throw new Error('Egyetlen esemény sem jött le – valószínűleg megváltozott egy forrás HTML-je.');

  await mkdir(join(PUBLIC, 'data'), { recursive: true });
  await writeFile(
    join(PUBLIC, 'data/events.json'),
    JSON.stringify({ updated: new Date().toISOString(), events }, null, 1),
  );

  const template = await readFile(join(PUBLIC, 'index.html'), 'utf8');
  await rm(join(PUBLIC, 'e'), { recursive: true, force: true });
  for (const e of events) {
    await mkdir(join(PUBLIC, 'e', e.id), { recursive: true });
    await writeFile(join(PUBLIC, 'e', e.id, 'index.html'), sharePage(template, e));
  }

  if (SITE_URL !== '/') {
    const urls = ['', ...events.map((e) => `e/${e.id}/`)].map((p) => `<url><loc>${esc(SITE_URL + p)}</loc></url>`);
    await writeFile(join(PUBLIC, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`);
  }
  console.log(`Kész: ${events.length} program (${all.length} nyers találatból).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
