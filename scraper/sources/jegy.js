import * as cheerio from 'cheerio';
import { clean } from '../lib/util.js';

// jegy.hu list pages carry schema.org/Event microdata per card. Each card is a
// production with its next performance date; later dates are on the detail page.
const BASE = 'https://www.jegy.hu/event/category';
const CATEGORIES = [
  // [path segment, our category, max pages] – pages hold 36 cards each
  ['szinhaz-1', 'Színház', 45],
  ['koncert-zene-3', 'Koncert', 25],
  ['muzeum-kiallitas-6', 'Kiállítás', 10],
  ['fesztival-4', 'Fesztivál', 3],
  ['cirkusz-7', 'Családi', 3],
  ['show-8', 'Színház', 3],
];
const JUNK = /aj[aá]nd[eé]k|gift|utalv[aá]ny|voucher|b[eé]rlet|season ticket|csomag/i;

const listUrl = (slug, page = 1) => `${BASE}/${slug}/city/budapest${page > 1 ? `/${page}` : ''}`;

export default {
  id: 'jegy',
  name: 'Jegy.hu',
  delayMs: 20_000, // robots.txt: Crawl-delay: 20
  fixtures: [{ file: 'jegy-koncert.html', url: listUrl('koncert-zene-3') }],

  async crawl(get) {
    const pages = [];
    for (const [slug, , max] of CATEGORIES) {
      const first = await get(listUrl(slug));
      if (!first) continue;
      pages.push({ url: listUrl(slug), html: first });
      const last = Math.max(1, ...[...first.matchAll(/data-ci-pagination-page="(\d+)"/g)].map((m) => +m[1]));
      for (let p = 2; p <= Math.min(last, max); p++) {
        const html = await get(listUrl(slug, p));
        if (html) pages.push({ url: listUrl(slug, p), html });
      }
    }
    return pages;
  },

  parse(html, { url = '' } = {}) {
    const category = CATEGORIES.find(([slug]) => url.includes(`/${slug}/`))?.[1] || 'Kultúra';
    const $ = cheerio.load(html);
    const events = [];
    $('.programBox[itemtype*="schema.org/Event"]').each((_, el) => {
      const card = $(el);
      const prop = (name) => card.find(`[itemprop="${name}"]`).first().attr('content');
      const title = clean(card.find('h2').first().contents().filter((_, n) => n.type === 'text').text()) || clean(prop('name'));
      const link = card.find('.infoContent a[href*="/program/"]').first().attr('href');
      const when = prop('startDate')?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      const address = card.find('[itemprop="location"] [itemprop="address"]').attr('content') || '';
      if (!title || !link || !when || JUNK.test(title) || (address && !/budapest/i.test(address))) return;

      events.push({
        title,
        url: link.split('?')[0],
        image: prop('image') || null,
        start: when[1],
        end: null,
        time: when[2] === '00:00' ? null : when[2],
        category,
        venue: clean(card.find('a.place').first().text()) || card.find('[itemprop="location"] [itemprop="name"]').attr('content') || null,
        description: clean(prop('description')) || null,
      });
    });
    return events;
  },
};
