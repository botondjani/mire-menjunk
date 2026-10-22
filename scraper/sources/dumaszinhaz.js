import * as cheerio from 'cheerio';
import { clean, parseHuDateRange } from '../lib/util.js';

// Dumaszínház: stand-up shows. Each card has date, venue, title and performers; we keep the Budapest ones.
const URL = 'https://dumaszinhaz.hu/eloadasok';

export default {
  id: 'dumaszinhaz',
  name: 'Dumaszínház',
  fixtures: [{ file: 'duma.html', url: URL }],
  urls: [URL],

  parse(html) {
    const $ = cheerio.load(html);
    const events = [];
    $('a[href*="dumaszinhaz.hu/eloadasok/"].absolute').each((_, el) => {
      const card = $(el).parent();
      const ps = card.find('p').map((_, p) => clean($(p).text())).get();
      const [dateText, place, title, performers] = ps;
      const dates = dateText && parseHuDateRange(dateText);
      // "Szeged - Belvárosi Mozi" is out of town; "Budapest - …" and bare venue names are Budapest.
      if (!dates || !title || !place || (/ - /.test(place) && !/^Budapest\b/.test(place))) return;
      events.push({
        title,
        url: $(el).attr('href'),
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
