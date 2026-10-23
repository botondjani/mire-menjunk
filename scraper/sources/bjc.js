import * as cheerio from 'cheerio';
import { clean } from '../lib/util.js';

// Budapest Jazz Club: program cards carry schema.org/Event microdata.
const URL = 'https://www.bjc.hu/programok/osszes-program/';

export default {
  id: 'bjc',
  name: 'Budapest Jazz Club',
  fixtures: [{ file: 'bjc.html', url: URL }],
  urls: [URL],

  parse(html) {
    const $ = cheerio.load(html);
    const events = [];
    $('.programlead').each((_, el) => {
      const card = $(el);
      const when = card.find('[itemprop="startDate"]').attr('content')?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})[.:](\d{2})/);
      const title = clean(card.find('h2[itemprop="name"]').text());
      const url = card.find('a[href*="/programok/eloado/"]').attr('href');
      if (!when || !title || !url) return;
      const price = card.find('[itemprop="price"]').first().text();
      events.push({
        title,
        url,
        image: card.find('img.programkep').attr('src') || null,
        start: when[1],
        end: null,
        time: `${when[2]}:${when[3]}`,
        category: 'Koncert',
        venue: 'Budapest Jazz Club',
        description: clean(card.find('[itemprop="description"]').text()).slice(0, 260) || null,
        price: Number(price) || null,
      });
    });
    return events;
  },
};
