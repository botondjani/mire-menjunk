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
import { slugify, todayBudapest } from './lib/util.js';

const SOURCES = [welovebudapest, akvarium];
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/?$/, '/');
const today = todayBudapest();

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'MireMenjunkBot/0.1 (+https://github.com/; programajánló aggregátor)',
      'Accept-Language': 'hu-HU,hu;q=0.9',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function collect(source) {
  const pages = process.env.FIXTURES
    ? [await readFile(join(ROOT, 'scraper/test/fixtures', `${source.id === 'welovebudapest' ? 'wlb' : source.id}.html`), 'utf8')]
    : [];
  if (!process.env.FIXTURES) {
    for (const url of source.urls) {
      try {
        pages.push(await fetchHtml(url));
      } catch (err) {
        console.warn(`  ! ${source.id}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 1000)); // be polite
    }
  }
  const events = pages.flatMap((html) => source.parse(html, { today }));
  console.log(`  ${source.name}: ${events.length} találat`);
  return events.map((e) => ({ ...e, source: source.id, sourceName: source.name }));
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
  for (const e of events) {
    const twin = out.find(
      (o) => o.url === e.url
        || (o.start === e.start && (norm(o.title).includes(norm(e.title)) || norm(e.title).includes(norm(o.title)) || sameShow(o, e))),
    );
    if (!twin) { out.push({ ...e, links: [{ name: e.sourceName, url: e.url }] }); continue; }
    if (twin.url !== e.url && !twin.links.some((l) => l.url === e.url)) twin.links.push({ name: e.sourceName, url: e.url });
    for (const k of ['image', 'description', 'venue', 'time', 'end']) twin[k] ??= e[k];
    // Same source listing a show twice (e.g. seated + accessible tickets): keep the plainer title.
    if (e.source === twin.source && e.title.length < twin.title.length) twin.title = e.title;
  }
  return out;
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
  const upcoming = all.filter((e) => (e.end || e.start) >= today);
  const events = dedupe(upcoming).sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'hu'));
  assignIds(events);

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
