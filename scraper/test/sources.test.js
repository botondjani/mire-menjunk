import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import welovebudapest from '../sources/welovebudapest.js';
import akvarium from '../sources/akvarium.js';
import { parseHuDateRange, parseShortDate, slugify } from '../lib/util.js';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), 'utf8');

test('parseHuDateRange: tartomány, egy nap, időpont', () => {
  assert.deepEqual(parseHuDateRange('2026. október 16., péntek - 2026. október 22., csütörtök'),
    { start: '2026-10-16', end: '2026-10-22', time: null });
  assert.deepEqual(parseHuDateRange('2026. november 6., péntek 20:00'),
    { start: '2026-11-06', end: null, time: '20:00' });
  assert.equal(parseHuDateRange('Keresés'), null);
});

test('parseShortDate: évváltás', () => {
  assert.equal(parseShortDate('Okt.', '21.', '2026-10-22'), '2026-10-21');
  assert.equal(parseShortDate('Jan.', '9.', '2026-10-22'), '2027-01-09');
});

test('slugify: ékezetek', () => {
  assert.equal(slugify('Dürer Kert – Őszi Buli!'), 'durer-kert-oszi-buli');
});

test('We Love Budapest lista', () => {
  const events = welovebudapest.parse(fixture('wlb'));
  assert.ok(events.length >= 30, `csak ${events.length}`);
  const e = events.find((x) => x.title === 'DJ Krush az Akvárium Klubban');
  assert.equal(e.start, '2026-10-24');
  assert.equal(e.venue, 'Akvárium Klub');
  assert.equal(e.category, 'Buli');
  assert.match(e.image, /^https:\/\/kep\.index\.hu\//);
});

test('Akvárium Klub lista', () => {
  const events = akvarium.parse(fixture('akvarium'), { today: '2026-10-22' });
  assert.ok(events.length >= 100, `csak ${events.length}`);
  const e = events.find((x) => x.title === 'ELTE Halloween');
  assert.equal(e.start, '2026-10-21');
  assert.equal(e.category, 'Buli');
  assert.ok(events.every((x) => x.url.startsWith('https://akvariumklub.hu/programok/')));
});

test('detectCategory: hosszú szöveg, szóhatárok', async () => {
  const { detectCategory } = await import('../lib/util.js');
  assert.equal(detectCategory('https://welovebudapest.com/program/gerhart-hauptmann-patkanyok-emberek-eloadas-radnoti-szinhaz-2026-oktober/ Gerhart Hauptmann: Patkányok emberek – előadás a Radnóti Színházban', 'Kultúra'), 'Színház');
  assert.equal(detectCategory('Forradalmunk fényénél – szobordöntés és fényfestés'), 'Szabadidő');
  assert.equal(detectCategory('Borkóstoló a Várban'), 'Gasztró');
});

test('Tixa helyszínoldal (JSON-LD)', async () => {
  const { default: tixa } = await import('../sources/tixa.js');
  const events = tixa.parse(fixture('tixa-durer'), { today: '2026-10-22' });
  assert.ok(events.length >= 25, `csak ${events.length}`);
  const e = events.find((x) => x.title.startsWith('Jazzbois'));
  assert.deepEqual([e.start, e.time, e.venue], ['2026-11-06', '20:00', 'Dürer Kert']);
  assert.ok(events.every((x) => !/pass|b[eé]rlet/i.test(x.title)));
});

test('Tixa főoldal: csak budapesti események', async () => {
  const { default: tixa } = await import('../sources/tixa.js');
  const events = tixa.parse(fixture('tixa-home'), { today: '2026-10-22' });
  assert.ok(events.length > 0);
  assert.ok(!events.some((x) => /Debrecen|Pécs|Kecskemét/.test(x.title)));
});

test('parseHuProse: cikkek dátumai', async () => {
  const { parseHuProse, weekdayDate } = await import('../lib/util.js');
  const T = '2026-10-22';
  assert.deepEqual(parseHuProse('2026. október 21. – november 22.', T), { start: '2026-10-21', end: '2026-11-22', time: null });
  assert.deepEqual(parseHuProse('szeptember 18. és október 18. között', T), { start: '2026-09-18', end: '2026-10-18', time: null });
  assert.deepEqual(parseHuProse('2026. október 25-ig', T), { start: T, end: '2026-10-25', time: null });
  assert.equal(parseHuProse('2026. október 20-tól', T).start, '2026-10-20');
  assert.equal(parseHuProse('január 9.', T).start, '2027-01-09');
  assert.equal(weekdayDate('Okótber 23-i programok (péntek)', '2026-10-21'), '2026-10-23');
});

test('Funzine heti cikk', async () => {
  const { default: funzine } = await import('../sources/funzine.js');
  const events = funzine.parse(fixture('funzine-cikk'), { today: '2026-10-22' });
  assert.ok(events.length >= 30, `csak ${events.length}`);
  const liszt = events.find((e) => e.title === 'Liszt: Krisztus');
  assert.deepEqual([liszt.start, liszt.venue], ['2026-10-22', 'Müpa']);
  assert.match(liszt.url, /^https:\/\/mupa\.hu\//);
  const bardo = events.find((e) => e.title.startsWith('BARDO 20'));
  assert.equal(bardo.start, '2026-10-23'); // a fejléc elírt ("Okótber"), a napnév alapján
  const bff = events.find((e) => e.title.includes('Budapest International Film Festival'));
  assert.deepEqual([bff.start, bff.end], ['2026-10-24', '2026-11-01']);
});

test('Time Out havi válogatás', async () => {
  const { default: timeout } = await import('../sources/timeout.js');
  const events = timeout.parse(readFileSync(new URL('./fixtures/timeout.html', import.meta.url), 'utf8'), { today: '2026-10-01' });
  assert.ok(events.length >= 3, `csak ${events.length}`);
  assert.ok(events.some((e) => e.title === 'Pitbull – I’m Back!' && e.venue === 'MVM Dome'));
});

test('A38 iCal feed', async () => {
  const { default: a38 } = await import('../sources/a38.js');
  const events = a38.parse(readFileSync(new URL('./fixtures/a38.ics', import.meta.url), 'utf8'));
  assert.ok(events.length >= 70, `csak ${events.length}`);
  const e = events.find((x) => x.title.startsWith('Hétköznapi Csalódások'));
  assert.deepEqual([e.start, e.time], ['2026-10-09', '19:30']); // UTC 17:30 → budapesti idő
  assert.match(e.url, /^https:\/\/www\.a38\.hu\/hu\/program\//);
});

test('Trafó programlista', async () => {
  const { default: trafo } = await import('../sources/trafo.js');
  const events = trafo.parse(fixture('trafo'), { today: '2026-10-22' });
  assert.ok(events.length >= 30, `csak ${events.length}`);
  const e = events.find((x) => x.url.endsWith('/dunapart_uttu'));
  assert.deepEqual([e.start, e.time, e.category], ['2026-11-20', '15:00', 'Színház']);
  assert.ok(events.some((x) => x.start.startsWith('2027-01')), 'januári dátum a következő évre essen');
});

test('Zene Háza: occasions-init JSON', async () => {
  const { default: zenehaza } = await import('../sources/zenehaza.js');
  const json = JSON.stringify([
    { name: 'Autechre (UK) – Liszt Ünnep', date: '2026-10-09T00:00:00', time: '20:00', url: '/esemeny/autechre-uk', genres: [{ name: 'Koncert' }] },
    { name: 'Freddie kurátori vezetés', date: '2026-10-10', time: '9:30', url: 'https://zenehaza.hu/esemeny/freddie', isSoldOut: true, image: { url: 'https://zenehaza.hu/x.jpg' } },
  ]).replace(/"/g, '&quot;');
  const events = zenehaza.parse(`<div><zh-calendar :occasions-init="${json}"></zh-calendar></div>`);
  assert.equal(events.length, 2);
  assert.deepEqual([events[0].url, events[0].time, events[0].category], ['https://zenehaza.hu/esemeny/autechre-uk', '20:00', 'Koncert']);
  assert.deepEqual([events[1].time, events[1].image], ['09:30', 'https://zenehaza.hu/x.jpg']);
});
