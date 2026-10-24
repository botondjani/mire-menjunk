import { addDays, todayBudapest } from '../lib/util.js';

// Budapest Film művészmozik (Művész, Puskin, Toldi, Tabán, Kino Café) – az artmozi.hu nyilvános heti műsor-JSON-ja.
// Filmenként egy program: az első vetítés napjától az utolsóig, a legtöbbet játszó mozival mint helyszínnel.
const API = 'https://artmozi.hu/api/schedule/week';

export default {
  id: 'artmozi',
  name: 'Artmozi',
  fixtures: [{ file: 'artmozi.json', url: API }],

  async crawl(get) {
    const index = JSON.parse(await get(API) || '{}');
    const weeks = [];
    for (const w of (index.weeks || []).slice(0, 2)) {
      const body = await get(`${API}/${w}`);
      if (body) weeks.push(JSON.parse(body));
    }
    return [{ url: API, html: JSON.stringify({ cinemas: index.cinemas || {}, weeks }) }];
  },

  parse(json, { today = todayBudapest() } = {}) {
    let data;
    try { data = JSON.parse(json); } catch { return []; }
    const horizon = addDays(today, 13);
    const films = new Map(); // filmId → { movie, shows: [{ date, time, cinema, sub }] }
    for (const week of data.weeks || []) {
      for (const [day, byFilm] of Object.entries(week.schedule || {})) {
        const date = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
        if (date < today || date > horizon) continue;
        for (const [filmId, byTime] of Object.entries(byFilm)) {
          const movie = week.movies?.[filmId];
          if (!movie?.title) continue;
          if (!films.has(filmId)) films.set(filmId, { movie, shows: [] });
          for (const [time, slots] of Object.entries(byTime)) {
            for (const s of Object.values(slots)) films.get(filmId).shows.push({ date, time, cinema: data.cinemas?.[s.cinema]?.name, sub: s.dubSub });
          }
        }
      }
    }
    return [...films.values()].flatMap(({ movie, shows }) => {
      if (!shows.length || !/^https?:\/\//.test(movie.cannonicalUrl || '')) return [];
      shows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      const count = new Map();
      for (const s of shows) if (s.cinema) count.set(s.cinema, (count.get(s.cinema) || 0) + 1);
      const cinemas = [...count.keys()].sort((a, b) => count.get(b) - count.get(a));
      const first = shows[0];
      const last = shows[shows.length - 1].date;
      return [{
        title: movie.title,
        url: movie.cannonicalUrl,
        image: movie.imgUrl || null,
        start: first.date,
        end: last !== first.date ? last : null,
        time: last === first.date ? first.time : null,
        category: 'Film',
        venue: cinemas[0] || null,
        description: [`Vetítik: ${cinemas.join(', ')}`, movie.ageLimit, first.sub].filter(Boolean).join(' · '),
      }];
    });
  },
};
