import * as cheerio from 'cheerio';
import { clean, detectCategory } from '../lib/util.js';

// The Magyar Zene Háza calendar is a Vue component; the server hands it the current
// month (±6 days) as JSON in its `occasions-init` prop. Field names follow the component
// template: name, date, time, url, location.name, genres[].name, isSoldOut.
const URL = 'https://zenehaza.hu/naptar';

export default {
  id: 'zenehaza',
  name: 'Magyar Zene Háza',
  fixtures: [],
  urls: [URL],
  debug: ['occasions-init', 'zh-calendar', 'occasions', 'esemeny/'],

  parse(html) {
    const $ = cheerio.load(html);
    let raw = null;
    $('*').each((_, el) => {
      const attrs = el.attribs || {};
      const key = Object.keys(attrs).find((k) => /occasions-init$/i.test(k));
      if (key) { raw = attrs[key]; return false; }
    });
    let occasions;
    try { occasions = JSON.parse(raw); } catch { return []; }
    if (!Array.isArray(occasions)) return [];

    return occasions.flatMap((o) => {
      const date = String(o.date || '').slice(0, 10);
      const url = o.url?.startsWith('http') ? o.url : o.url ? `https://zenehaza.hu${o.url}` : null;
      if (!o.name || !url || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
      const genres = (o.genres || []).map((g) => g?.name).filter(Boolean).join(' ');
      const image = [o.image?.url, o.image, o.cover?.url, o.cover].find((v) => typeof v === 'string' && v.startsWith('http'));
      return [{
        title: clean(o.name),
        url,
        image: image || null,
        start: date,
        end: null,
        time: String(o.time || '').match(/\d{1,2}:\d{2}/)?.[0]?.padStart(5, '0') || null,
        category: detectCategory(`${o.name} ${genres}`, 'Koncert'),
        venue: 'Magyar Zene Háza',
        description: o.isSoldOut ? 'Minden jegy elkelt' : null,
      }];
    });
  },
};
