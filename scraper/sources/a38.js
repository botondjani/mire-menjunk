import { detectCategory } from '../lib/util.js';

// A38 publishes its whole programme as an iCalendar feed.
const FEED = 'https://www.a38.hu/hu/ical/programok';

const local = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

/** "20261009T173001Z" → { date: "2026-10-09", time: "19:30" } in Budapest time. */
function toLocal(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (!z) return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` };
  const [date, time] = local.format(new Date(Date.UTC(+y, mo - 1, +d, +h, +mi))).split(' ');
  return { date, time: time.slice(0, 5) };
}

const unescape = (s) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').replace(/&nbsp;?/g, ' ');

export default {
  id: 'a38',
  name: 'A38 Hajó',
  fixtures: [{ file: 'a38.ics', url: FEED }],
  urls: [FEED],

  parse(ics) {
    const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/); // unfold continuation lines
    const events = [];
    let ev = null;
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') ev = {};
      else if (line === 'END:VEVENT' && ev) {
        const start = ev.DTSTART && toLocal(ev.DTSTART);
        const desc = unescape(ev.DESCRIPTION || '');
        const url = desc.match(/https:\/\/www\.a38\.hu\/hu\/program\/[^\s]+/)?.[0];
        const title = unescape(ev.SUMMARY || '').trim();
        if (start && title && url) {
          events.push({
            title,
            url,
            image: null,
            start: start.date,
            end: null,
            time: start.time,
            category: detectCategory(title, start.time >= '22:00' ? 'Buli' : 'Koncert'),
            venue: 'A38 Hajó',
            description: desc.split('\n').map((l) => l.trim()).filter((l) => l && l !== title && !/^https?:/.test(l)).slice(0, 3).join(' · ').slice(0, 300) || null,
          });
        }
        ev = null;
      } else if (ev) {
        const i = line.indexOf(':');
        if (i > 0) ev[line.slice(0, i).split(';')[0]] = line.slice(i + 1);
      }
    }
    return events;
  },
};
