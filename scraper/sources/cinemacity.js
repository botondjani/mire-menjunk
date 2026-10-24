import { addDays, todayBudapest } from '../lib/util.js';

// Cinema City: a műsoron lévő és a jövő héten induló filmek a nyilvános quickbook API-ból.
const api = (until) => `https://www.cinemacity.hu/hu/data-api-service/v1/quickbook/10102/films/until/${until}?attr=&lang=hu_HU`;
const GENRES = {
  action: 'akció', adventure: 'kaland', animation: 'animációs', comedy: 'vígjáték', crime: 'krimi', documentary: 'dokumentum',
  drama: 'dráma', family: 'családi', fantasy: 'fantasy', horror: 'horror', musical: 'zenés', romance: 'romantikus',
  'sci-fi': 'sci-fi', thriller: 'thriller', war: 'háborús', biography: 'életrajzi',
};

export default {
  id: 'cinemacity',
  name: 'Cinema City',
  fixtures: [{ file: 'cinemacity.json', url: api('fixture') }],

  async crawl(get) {
    const url = api(addDays(todayBudapest(), 7));
    const body = await get(url);
    return body ? [{ url, html: body }] : [];
  },

  parse(json, { today = todayBudapest() } = {}) {
    let films;
    try { films = JSON.parse(json)?.body?.films || []; } catch { return []; }
    const until = addDays(today, 6);
    return films.flatMap((f) => {
      const release = String(f.releaseDate || '').slice(0, 10);
      if (!f.name || !/^https?:\/\//.test(f.link || '') || (release && release > until)) return [];
      const genres = (f.attributeIds || []).map((a) => GENRES[a]).filter(Boolean).slice(0, 2);
      const age = (f.attributeIds || []).find((a) => /^\d+-plus$/.test(a));
      return [{
        title: f.name,
        url: f.link,
        image: f.posterLink || null,
        start: release && release > today ? release : today,
        end: until,
        time: null,
        category: 'Film',
        venue: 'Cinema City',
        description: [genres.join(', '), f.length ? `${f.length} perc` : '', age ? `${age.split('-')[0]}+` : '', release > today ? `Bemutató: ${release}` : ''].filter(Boolean).join(' · ') || null,
      }];
    });
  },
};
