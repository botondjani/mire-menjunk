import * as cheerio from 'cheerio';
import { clean, detectCategory, detectVenue, parseHuProse, slugify, todayBudapest, weekdayDate } from '../lib/util.js';

// Funzine's weekly round-ups ("40+ fergeteges hétvégi program…") list each pick as an
// <h3>"Cím // Helyszín (2026. október 21-25.)"</h3> followed by a paragraph and a link.
// Picks without their own date take it from the day heading above them.
const HOME = 'https://funzine.hu/';
const ARTICLE = /https:\/\/funzine\.hu\/(\d{4})\/(\d{2})\/(\d{2})\/(?:goodapest|programok)\/[^"'\s#?]*program[^"'\s#?]*\//g;
const MAX_AGE_DAYS = 10;

export default {
  id: 'funzine',
  name: 'Funzine',
  delayMs: 2000,
  fixtures: [{ file: 'funzine-cikk.html', url: 'https://funzine.hu/2026/10/21/goodapest/40-fergeteges-program-budapesten-es-kornyeken-az-oktober-23-i-hosszu-hetvegere/' }],

  async crawl(get) {
    const home = await get(HOME);
    if (!home) return [];
    const today = todayBudapest();
    const minDate = new Date(Date.parse(`${today}T00:00:00Z`) - MAX_AGE_DAYS * 864e5).toISOString().slice(0, 10);
    const urls = [...new Set([...home.matchAll(ARTICLE)].filter((m) => `${m[1]}-${m[2]}-${m[3]}` >= minDate).map((m) => m[0]))];
    const pages = [];
    for (const url of urls.slice(0, 8)) {
      const html = await get(url);
      if (html) pages.push({ url, html });
    }
    return pages;
  },

  parse(html, { url = HOME, today = todayBudapest() } = {}) {
    const $ = cheerio.load(html);
    const published = $('meta[property="article:published_time"]').attr('content')?.slice(0, 10) || today;
    const events = [];
    let dayContext = null;
    let lastDay = published;

    $('.entry-content').first().find('h2, h3').each((_, el) => {
      const heading = clean($(el).text());
      if (el.tagName === 'h2') {
        // "Szombati programok … (2026. október 24.)"; typos happen, so the weekday is the fallback.
        const parsed = parseHuProse(heading, published);
        dayContext = parsed && !parsed.end ? parsed.start : weekdayDate(heading, lastDay);
        if (dayContext) lastDay = dayContext;
        return;
      }

      const dateText = heading.match(/\(([^)]*\d[^)]*)\)\s*$/)?.[1];
      const name = clean(heading.replace(/\(([^)]*\d[^)]*)\)\s*$/, ''));
      const [title, venueText] = name.split(/\s+(?:\/\/|@)\s+/);
      const block = $(el).nextUntil('h2, h3');
      const description = clean(block.filter('p').first().text()).slice(0, 400) || null;
      const dates = (dateText && parseHuProse(dateText, published)) || (dayContext && { start: dayContext, end: null, time: null });
      if (!title || !dates || title.length > 140 || /^aj[aá]nl[oó]$/i.test(title)) return;

      const link = block.find('a[href^="http"]').filter((_, a) => !/funzine\.hu/.test($(a).attr('href'))).first().attr('href');
      const img = block.find('img').filter((_, i) => /wp-content\/uploads/.test($(i).attr('data-src') || $(i).attr('src') || '')).first();
      const time = description?.match(/\b(\d{1,2}):(\d{2})\b/);
      events.push({
        title: clean(title),
        url: link || `${url}#${slugify(title)}`,
        image: img.attr('data-src') || img.attr('src') || null,
        start: dates.start,
        end: dates.end,
        time: dates.time || (time && !dates.end ? `${time[1].padStart(2, '0')}:${time[2]}` : null),
        category: detectCategory(`${title} ${description || ''}`.slice(0, 200)),
        venue: venueText ? clean(venueText) : detectVenue(title),
        description,
      });
    });
    return events;
  },
};
