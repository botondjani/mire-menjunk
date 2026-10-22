import { clean, detectCategory, todayBudapest } from '../lib/util.js';

// Tixa embeds schema.org ItemLists of Events as JSON-LD on its home and venue pages.
// The home page also lists its featured venues, which we follow automatically.
const HOME = 'https://www.tixa.hu/';
const VENUES = [
  'durerkert', 'turbina-kulturalis-kozpont', 'budapest_park', 'fogashaz_budapest', 'Godor_Budapest', 'muzikum_klub',
  // fiatalok kedvenc klubjai
  'toldiklub', 'robot', 'kazi', 'haromholloszinpad',
];
const JUNK = /b[eé]rlet|\bpass\b|csomag|aj[aá]nd[eé]k|gift|voucher|utalv[aá]ny|early bird pass/i;

function jsonLd(html) {
  return [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, raw]) => { try { return JSON.parse(raw); } catch { return null; } })
    .filter(Boolean);
}

/** Every Event found anywhere in the JSON-LD (lists, and events nested under featured venues). */
function findEvents(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => findEvents(n, out));
  else if (node && typeof node === 'object') {
    if (node['@type'] === 'Event') out.push(node);
    else Object.values(node).forEach((v) => findEvents(v, out));
  }
  return out;
}

function findPlaces(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => findPlaces(n, out));
  else if (node && typeof node === 'object') {
    if (node['@type'] === 'Place' && node.url) out.push(node);
    Object.values(node).forEach((v) => findPlaces(v, out));
  }
  return out;
}

export default {
  id: 'tixa',
  name: 'Tixa',
  delayMs: 3000,
  fixtures: [{ file: 'tixa-home.html', url: HOME }, { file: 'tixa-durer.html', url: `${HOME}durerkert` }],

  async crawl(get) {
    const home = await get(HOME);
    const featured = home ? findPlaces(jsonLd(home))
      .filter((p) => /budapest/i.test(p.address || '') && p.url?.startsWith(HOME))
      .map((p) => p.url.slice(HOME.length)) : [];
    const slugs = [...new Set([...VENUES, ...featured])];
    const pages = home ? [{ url: HOME, html: home }] : [];
    for (const slug of slugs) {
      const html = await get(HOME + slug);
      if (html) pages.push({ url: HOME + slug, html });
    }
    return pages;
  },

  parse(html, { today = todayBudapest() } = {}) {
    return findEvents(jsonLd(html)).flatMap((e) => {
      const title = clean(e.name);
      const address = typeof e.location?.address === 'string' ? e.location.address : e.location?.address?.addressLocality || '';
      const start = e.startDate?.slice(0, 10);
      if (!title || !e.url || !/^\d{4}-\d{2}-\d{2}$/.test(start || '') || !/budapest/i.test(address) || JUNK.test(title)) return [];
      const endDay = e.endDate?.slice(0, 10);
      const time = (e.customDate || '').match(/\b(\d{1,2}:\d{2})\b/)?.[1] || null;
      const end = endDay && endDay > start && endDay >= today ? endDay : null;
      return [{
        title,
        url: e.url,
        image: (Array.isArray(e.image) ? e.image[0] : e.image) || null,
        start,
        end,
        time: time?.padStart(5, '0') ?? null,
        category: detectCategory(title, 'Koncert'),
        venue: clean(e.location?.name) && e.location.name !== 'Budapest' ? clean(e.location.name) : null,
        description: null,
      }];
    });
  },
};
