import * as cheerio from 'cheerio';
import { clean, parseShortDate, todayBudapest } from '../lib/util.js';

// Trafó's list alternates day headers ("nov/20") with rows of that day's shows.
const GENRES = {
  'TÁNC': 'Színház', 'SZÍNHÁZ': 'Színház', 'KÖZÖSSÉGI SZÍNHÁZ': 'Színház', 'PERFORMANSZ': 'Színház',
  'LECTURE PERFORMANSZ': 'Színház', 'SLAM POETRY': 'Színház', 'ZENE': 'Koncert', 'FILMVETÍTÉS': 'Film', 'WORKSHOP': 'Szabadidő',
};

export default {
  id: 'trafo',
  name: 'Trafó',
  fixtures: [{ file: 'trafo.html', url: 'https://trafo.hu/programok' }],
  urls: ['https://trafo.hu/programok'],

  parse(html, { today = todayBudapest() } = {}) {
    const $ = cheerio.load(html);
    const events = [];
    let day = null;
    $('h2.module-title, .row.menu').each((_, el) => {
      const node = $(el);
      if (node.is('h2')) {
        const [mon, d] = clean(node.text()).split('/');
        day = mon && d ? parseShortDate(mon, d, today) : null;
        return;
      }
      const link = node.find('h3.features-title').closest('a');
      const title = clean(node.find('h3.features-title').text());
      if (!day || !title || !link.attr('href')) return;
      const meta = node.find('.event-date .widget-title').map((_, w) => clean($(w).text())).get();
      const genre = meta.find((m) => GENRES[m.toUpperCase()]);
      const time = clean(node.find('.event-date .menu-title').text()).match(/^(\d{1,2}):(\d{2})/);
      const credits = clean(node.find('.event-details h4').text());
      events.push({
        title: credits && !credits.startsWith(title) ? `${title} – ${credits.split('/').pop().trim()}` : title,
        url: link.attr('href'),
        image: node.find('.event-thumbnail img').attr('src') || null,
        start: day,
        end: null,
        time: time ? `${time[1].padStart(2, '0')}:${time[2]}` : null,
        category: genre ? GENRES[genre.toUpperCase()] : 'Kultúra',
        venue: 'Trafó',
        description: [credits, clean(node.find('.menu-detail').text())].filter(Boolean).join(' · ').slice(0, 300) || null,
      });
    });
    return events;
  },
};
