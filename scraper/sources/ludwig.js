import * as cheerio from 'cheerio';
import { clean, detectCategory, parseHuDateRange, parseShortDate, todayBudapest } from '../lib/util.js';

// Ludwig Múzeum: aktuális kiállítások (dátumtartománnyal) és programok (tárlatvezetések stb.).
const BASE = 'https://www.ludwigmuseum.hu';

export default {
  id: 'ludwig',
  name: 'Ludwig Múzeum',
  fixtures: [{ file: 'ludwig.html', url: `${BASE}/kiallitasok` }],
  urls: [`${BASE}/kiallitasok`, `${BASE}/programok`],

  parse(html, { today = todayBudapest() } = {}) {
    const $ = cheerio.load(html);
    const events = [];
    $('article.node-exhibition').each((_, el) => {
      const node = $(el);
      const link = node.find('h3.node-title a').first();
      const title = clean(link.find('.title').text() || link.text());
      const dates = parseHuDateRange(clean(link.find('.subtitle--date').text()));
      const href = link.attr('href');
      if (!title || !dates || !href) return;
      const img = node.find('img').attr('src');
      events.push({
        title,
        url: new URL(href, BASE).href,
        image: img ? new URL(img, BASE).href : null,
        start: dates.start,
        end: dates.end,
        time: null,
        category: 'Kiállítás',
        venue: 'Ludwig Múzeum',
        description: clean(node.find('.field--name-body').text()).slice(0, 300) || null,
      });
    });
    $('.node-programme').each((_, el) => {
      const node = $(el);
      const link = node.find('h3.node-title a').first();
      const time = clean(link.find('.time').text()).replace('.', ':');
      const title = clean(link.find('span').not('.time').text());
      const start = parseShortDate(clean(node.find('.month').text()), clean(node.find('.date').text()), today);
      const href = link.attr('href');
      if (!title || !start || !href) return;
      events.push({
        title,
        url: new URL(href, BASE).href,
        image: null,
        start,
        end: null,
        time: /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, '0') : null,
        category: detectCategory(title, 'Kultúra'),
        venue: 'Ludwig Múzeum',
        description: clean(node.find('.field--name-field-location').text()) || null,
      });
    });
    return events;
  },
};
