import * as cheerio from 'cheerio';
import { clean, isoDate, todayBudapest } from '../lib/util.js';

// Katona József Színház: a műsoroldal soronként egy előadás (dátum számjegyenként, cím, helyszín, időpont, jegylink).
const URL = 'https://katonajozsefszinhaz.hu/musor/';

export default {
  id: 'katona',
  name: 'Katona József Színház',
  fixtures: [{ file: 'katona.html', url: URL }],
  urls: [URL],

  parse(html, { today = todayBudapest() } = {}) {
    const $ = cheerio.load(html);
    const [ty, tm] = today.split('-').map(Number);
    const events = [];
    $('.performances-next-list > .col-12 > .row').each((_, el) => {
      const row = $(el);
      const link = row.find('.performances-title a').first();
      const title = clean(link.text());
      const url = link.attr('href');
      const month = +row.find('.performances-date-month').map((__, s) => $(s).text().trim()).get().join('');
      const day = +row.find('.performances-date-day').map((__, s) => $(s).text().trim()).get().join('');
      if (!title || !url || !month || !day) return;
      const year = month < tm - 2 ? ty + 1 : ty; // a műsor csak előre mutat: a korábbi hónap már jövő év
      const time = clean(row.find('.performances-datetime').text()).match(/(\d{1,2}):(\d{2})/);
      const stage = clean(row.find('.performances-location').text()).replace(/^Katona József Színház\s*-?\s*/, '');
      events.push({
        title,
        url,
        image: null,
        start: isoDate(year, month, day),
        end: null,
        time: time ? `${time[1].padStart(2, '0')}:${time[2]}` : null,
        category: 'Színház',
        venue: 'Katona József Színház',
        description: [stage ? `Helyszín: ${stage}` : '', url.includes('/en/') ? 'Angol felirattal' : ''].filter(Boolean).join(' · ') || null,
      });
    });
    return events;
  },
};
