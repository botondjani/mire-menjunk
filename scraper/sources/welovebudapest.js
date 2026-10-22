import * as cheerio from 'cheerio';
import { clean, detectCategory, detectVenue, parseHuDateRange, todayBudapest } from '../lib/util.js';

const BASE = 'https://welovebudapest.com/programok/';
const DAYS_AHEAD = 60; // the list caps out at ~50 cards, so we also ask day by day

const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default {
  id: 'welovebudapest',
  name: 'We Love Budapest',
  delayMs: 2500,
  fixtures: [{ file: 'wlb.html' }],
  // The main list is a curated mix; category pages surface more events.
  urls: [
    BASE,
    `${BASE}?kategoria=kultura`,
    `${BASE}?kategoria=ejszakai-elet`,
    `${BASE}?kategoria=szabadido`,
    `${BASE}?kategoria=gasztro`,
    `${BASE}?kategoria=shopping`,
  ],

  async crawl(get) {
    const today = todayBudapest();
    const urls = [...this.urls];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const day = addDays(today, i);
      urls.push(`${BASE}?tol=${day}&ig=${day}`);
    }
    const pages = [];
    for (const url of urls) {
      const html = await get(url);
      if (html) pages.push({ url, html });
    }
    return pages;
  },

  parse(html) {
    const $ = cheerio.load(html);
    const events = [];
    $('.news-bullet').each((_, el) => {
      const card = $(el);
      const link = card.find('h2 a').first();
      const url = link.attr('href');
      const title = clean(link.text());
      const dates = parseHuDateRange(card.find('.info-table .text').first().text());
      if (!url?.includes('/program/') || !title || !dates) return;

      const tags = card.find('h4 a').map((_, a) => clean($(a).text())).get();
      const image = card.find('.image-box img').attr('src');
      events.push({
        title,
        url,
        image: image && !image.includes('placeholder') ? image : null,
        ...dates,
        category: detectCategory(`${url} ${title}`, mapCategory(tags[0])),
        venue: detectVenue(title),
        description: clean(card.find('.kopf').text()) || null,
        sponsored: tags.includes('Szponzorált'),
      });
    });
    return events;
  },
};

function mapCategory(tag) {
  return { 'Éjszakai élet': 'Buli', Kultúra: 'Kultúra', Gasztró: 'Gasztró', Shopping: 'Vásár' }[tag] || 'Szabadidő';
}
