import * as cheerio from 'cheerio';
import { clean } from '../lib/util.js';

// Vígszínház (Vígszínház, Pesti Színház, Házi Színpad): Next.js oldal, a kártyákon ISO időpont, cím, műfaj, kép.
const URL = 'https://vigszinhaz.hu/hu/musor';
const local = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

export default {
  id: 'vigszinhaz',
  name: 'Vígszínház',
  fixtures: [{ file: 'vigszinhaz.html', url: URL }],
  urls: [URL],

  parse(html) {
    const $ = cheerio.load(html);
    const events = [];
    $('article[class*="EventCardRich_card"]').each((_, el) => {
      const card = $(el);
      const link = card.find('h3 a').first();
      const title = clean(link.text());
      const href = link.attr('href');
      const iso = card.find('time[datetime]').attr('datetime');
      if (!title || !href || !iso || Number.isNaN(Date.parse(iso))) return;
      const [date, time] = local.format(new Date(iso)).split(' ');
      // A kép a Next.js képszolgáltatón át jön: az eredeti címet a url= paraméterből vesszük ki.
      const src = card.find('img').attr('src') || card.find('img').attr('srcset') || '';
      const original = src.match(/url=([^&\s]+)/)?.[1];
      const genre = clean(card.find('[class*="Genre_genre"]').first().text());
      const authors = clean(card.find('[class*="EventCardRich_authors"]').text());
      events.push({
        title,
        url: new globalThis.URL(href, URL).href,
        image: original ? decodeURIComponent(original) : null,
        start: date,
        end: null,
        time,
        category: 'Színház',
        venue: clean(card.find('[class*="Venue_venueName"]').first().text()) || 'Vígszínház',
        description: [authors, genre].filter(Boolean).join(' · ') || null,
      });
    });
    return events;
  },
};
