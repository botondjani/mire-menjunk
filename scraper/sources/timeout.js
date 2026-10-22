import * as cheerio from 'cheerio';
import { clean, detectCategory, detectVenue, parseHuProse, slugify, todayBudapest } from '../lib/util.js';

// Time Out Budapest's monthly picks: numbered tiles "4. ARC kiállítás 2026" (often "Cím @ Helyszín"),
// with the dates written into the summary text.
const URL = 'https://www.timeout.com/hu/budapest/programok/legjobb-programok-mit-csinalj-budapesten';

export default {
  id: 'timeout',
  name: 'Time Out Budapest',
  fixtures: [{ file: 'timeout.html', url: URL }],
  urls: [URL],

  parse(html, { url = URL, today = todayBudapest() } = {}) {
    const $ = cheerio.load(html);
    const events = [];
    $('h3').each((_, el) => {
      const heading = clean($(el).text().replace(/ /g, ' '));
      const m = heading.match(/^\d+\.\s*(.+)$/);
      if (!m) return;
      const [title, venueText] = m[1].split(/\s+@\s+/);
      const tile = $(el).closest('article, [class*="articleContent"]');
      const summary = clean(tile.find('[data-testid="summary_testID"]').text());
      const dates = parseHuProse(summary, today);
      if (!dates) return;
      const link = tile.find('[data-testid="summary_testID"] a[href^="http"]').first().attr('href');
      events.push({
        title: clean(title),
        url: link || `${url}#${slugify(title)}`,
        image: tile.find('img').first().attr('src') || null,
        ...dates,
        category: detectCategory(`${title} ${summary}`.slice(0, 200)),
        venue: venueText ? clean(venueText) : detectVenue(`${title} ${summary}`),
        description: summary.slice(0, 400) || null,
      });
    });
    return events;
  },
};
