import * as cheerio from 'cheerio';
import { clean, parseHuDateRange } from '../lib/util.js';

// Dumaszínház: stand-up shows. Each card has date, venue, title and performers; we keep the Budapest ones.
const URL = 'https://dumaszinhaz.hu/eloadasok';

export default {
  id: 'dumaszinhaz',
  name: 'Dumaszínház',
  fixtures: [{ file: 'duma.html', url: URL }],
  urls: [URL],
  debug: ['eloadasok/', '__NUXT_DATA__', '_payload.json', 'október', 'MIXÁT'],

  parse(html) {
    const $ = cheerio.load(html);
    const events = [];
    $('a.absolute[href*="/eloadasok/"]').each((_, el) => {
      const card = $(el).parent();
      const ps = card.find('p').map((_, p) => clean($(p).text())).get();
      const [dateText, place, title, performers] = ps;
      const dates = dateText && parseHuDateRange(dateText);
      // "Szeged - Belvárosi Mozi" is out of town; "Budapest - …" and bare venue names are Budapest.
      if (!dates || !title || !place || (/ - /.test(place) && !/^Budapest\b/.test(place))) return;
      events.push({
        title,
        url: new globalThis.URL($(el).attr('href'), 'https://dumaszinhaz.hu').href,
        image: card.find('img').attr('src') || null,
        ...dates,
        category: 'Színház',
        venue: place.replace(/^Budapest - /, ''),
        description: performers ? `Stand-up: ${performers}` : 'Stand-up comedy',
      });
    });
    return events;
  },
};
