import { clean, detectCategory } from '../lib/util.js';

// Dürer Kert's site is Next.js: the full event list sits in __NEXT_DATA__ as JSON (Strapi records).
const URL = 'https://www.durerkert.com/events';

export default {
  id: 'durer',
  name: 'Dürer Kert',
  fixtures: [{ file: 'durer.html', url: URL }],
  urls: [URL],

  parse(html) {
    const raw = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    let data;
    try { data = JSON.parse(raw); } catch { return []; }
    const records = (data?.props?.pageProps?.blocks || []).flatMap((b) => b?.apiResponse?.data || []);
    return records.flatMap(({ attributes: a = {} }) => {
      if (!a.name || !a.slug || !/^\d{4}-\d{2}-\d{2}$/.test(a.startDate || '')) return [];
      const img = a.image?.data?.attributes;
      const genres = (a.genre?.data || []).map((g) => g?.attributes?.name).filter(Boolean).join(' ');
      const time = a.startTime?.[0]?.time?.slice(0, 5);
      return [{
        title: clean(a.name),
        url: `https://www.durerkert.com/event/${a.slug}`,
        image: img?.formats?.lg?.url || img?.formats?.md?.url || img?.url || null,
        start: a.startDate,
        end: a.endDate && a.endDate > a.startDate ? a.endDate : null,
        time: time && time !== '00:00' ? time : null,
        category: detectCategory(`${a.name} ${genres}`, /életmód|kultúra/i.test(genres) ? 'Szabadidő' : 'Koncert'),
        venue: 'Dürer Kert',
        description: clean(a.description).slice(0, 300) || null,
      }];
    });
  },
};
