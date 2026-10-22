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

test('Jegy.hu koncertlista (microdata)', async () => {
  const { default: jegy } = await import('../sources/jegy.js');
  const events = jegy.parse(fixture('jegy-koncert'), { url: 'https://www.jegy.hu/event/category/koncert-zene-3/city/budapest' });
  assert.ok(events.length >= 30, `csak ${events.length}`);
  const e = events.find((x) => x.title === 'Zorán koncert');
  assert.deepEqual([e.start, e.time, e.venue, e.category], ['2026-11-17', '20:00', 'Müpa', 'Koncert']);
  assert.ok(events.every((x) => !/aj[aá]nd[eé]k|gift/i.test(x.title)));
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
