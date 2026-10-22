import * as cheerio from 'cheerio';
import { clean, detectCategory, parseShortDate, todayBudapest } from '../lib/util.js';

export default {
  id: 'akvarium',
  name: 'Akvárium Klub',
  urls: ['https://akvariumklub.hu/programok/', 'https://akvariumklub.hu/programok/page/2/'],

  parse(html, { today = todayBudapest() } = {}) {
    const $ = cheerio.load(html);
    const events = [];
    $('a.m-card').each((_, el) => {
      const card = $(el);
      const url = card.attr('href');
      const title = clean(card.find('.m-card__description .h5').text());
      const start = parseShortDate(
        clean(card.find('.date__month').text()),
        clean(card.find('.date__day').text()),
        today,
      );
      if (!url || !title || !start) return;

      const classes = (card.attr('class') || '').split(/\s+/);
      const img = card.find('.m-card__image img').first();
      const image = img.attr('data-lazy-src') || img.attr('src');
      const fallback = classes.includes('koncertek')
        ? 'Koncert'
        : classes.some((c) => /^(party|buli)/.test(c)) ? 'Buli' : 'Kultúra';
      events.push({
        title,
        url,
        image: image?.startsWith('http') ? image : null,
        start,
        end: null,
        time: null,
        category: classes.includes('koncertek') ? 'Koncert' : detectCategory(title, fallback),
        venue: 'Akvárium Klub',
        description: clean(card.find('.m-card__description p:not(.h5)').text()) || null,
        free: classes.includes('free'),
      });
    });
    return events;
  },
};
