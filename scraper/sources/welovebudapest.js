import * as cheerio from 'cheerio';
import { clean, detectCategory, detectVenue, parseHuDateRange } from '../lib/util.js';

const BASE = 'https://welovebudapest.com/programok/';

export default {
  id: 'welovebudapest',
  name: 'We Love Budapest',
  // The main list is a curated mix; category pages surface more events.
  urls: [
    BASE,
    `${BASE}?kategoria=kultura`,
    `${BASE}?kategoria=ejszakai-elet`,
    `${BASE}?kategoria=szabadido`,
    `${BASE}?kategoria=gasztro`,
    `${BASE}?kategoria=shopping`,
  ],

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
