// Hova menjünk? – kliens. Nincs build lépés: sima ES modul.
// Nézetek: felfedezés (vízszintes szekciók), lista (szűrt, napokra bontva), keresés, mentett.
// Minden nézetnek van betöltő, üres és hibaállapota; a visszafordítható lépések (mentés) visszavonhatók.

const ROOT = new URL('./', import.meta.url);
const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const sheet = $('#sheet');
const banner = $('#banner');

// A forrásokból jövő 11 kategóriát 6 könnyen átlátható csoportba vonjuk össze.
const GROUPS = [
  { key: 'zene', label: 'Zene', emoji: '🎵', hue: 350, cats: ['Koncert'] },
  { key: 'buli', label: 'Buli', emoji: '🪩', hue: 290, cats: ['Buli'] },
  { key: 'kiallitas', label: 'Kiállítás', emoji: '🖼️', hue: 205, cats: ['Kiállítás'] },
  { key: 'szinpad', label: 'Színház & film', emoji: '🎭', hue: 25, cats: ['Színház', 'Film'] },
  { key: 'csalad', label: 'Családi', emoji: '🧸', hue: 150, cats: ['Családi'] },
  { key: 'egyeb', label: 'Fesztivál & más', emoji: '✨', hue: 55, cats: ['Fesztivál', 'Gasztró', 'Vásár', 'Szabadidő', 'Kultúra'] },
];
const groupOf = (e) => GROUPS.find((g) => g.cats.includes(e.category)) || GROUPS[GROUPS.length - 1];
// Kategóriákon átívelő szűrő: a scraper jelöli (klubok, bulik, egyetemi és diákprogramok).
const YOUTH = { key: 'fiatal', label: 'Fiataloknak', emoji: '🎓', hue: 265 };
const FILTERS = [YOUTH, ...GROUPS];
const matchesFilter = (e, key) => !key || (key === YOUTH.key ? e.youth : groupOf(e).key === key);
const DAYS = [['ma', 'Ma'], ['holnap', 'Holnap'], ['hetvege', 'Hétvégén'], ['het', 'Ezen a héten'], ['mind', 'Bármikor']];
// Rövid címkék a lista kompakt idősávjához, hogy egy sorba férjenek.
const DAY_SHORT = { ma: 'Ma', holnap: 'Holnap', hetvege: 'Hétvége', het: 'Héten', mind: 'Bármikor' };
const WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const WD_SHORT = ['V', 'H', 'K', 'SZE', 'CS', 'P', 'SZO'];
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const STALE_HOURS = 36;

// ---------- dátumok (Budapest időzóna, YYYY-MM-DD stringekkel) ----------
const bpNow = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(new Date());
const today = bpNow().slice(0, 10);
const toDate = (iso) => new Date(`${iso}T12:00:00Z`);
const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekday = (iso) => toDate(iso).getUTCDay();
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
const short = (iso) => `${MONTHS[+iso.slice(5, 7) - 1]} ${+iso.slice(8)}.`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const tomorrow = addDays(today, 1);

function dayName(iso) {
  if (iso === today) return 'Ma';
  if (iso === tomorrow) return 'Holnap';
  return `${cap(WEEKDAYS[weekday(iso)])}, ${short(iso)}`;
}

function dateLabel(e) {
  if (e.end) return `${short(e.start)} – ${short(e.end)}`;
  return `${dayName(e.start)}${e.time ? `, ${e.time}` : ''}`;
}

/** Rövid címke a kártya sarkába: "MA", "HOLNAP", "SZO 24", vagy "DEC 4-IG". */
function chip(e) {
  if (isLong(e) && e.start <= today) return `${short(e.end).replace('.', '')}-ig`;
  if (e.start === today) return 'Ma';
  if (e.start === tomorrow) return 'Holnap';
  return `${WD_SHORT[weekday(e.start)]} ${+e.start.slice(8)}`;
}

/** Mai, időponttal rendelkező programnál: "40 perc múlva", "2 óra múlva" vagy "Most megy". */
function startsIn(e) {
  if (e.start !== today || !e.time || e.end) return null;
  const [h, m] = bpNow().slice(11, 16).split(':').map(Number);
  const [eh, em] = e.time.split(':').map(Number);
  const diff = eh * 60 + em - (h * 60 + m);
  if (diff > 0 && diff < 60) return `${diff} perc múlva`;
  if (diff >= 60 && diff <= 240) return `${Math.round(diff / 60)} óra múlva`;
  if (diff <= 0 && diff > -150) return 'Most megy';
  return null;
}

function range(key) {
  const sunday = addDays(today, (7 - weekday(today)) % 7);
  switch (key) {
    case 'ma': return [today, today];
    case 'holnap': return [tomorrow, tomorrow];
    case 'hetvege': { const fri = addDays(sunday, -2); return [fri > today ? fri : today, sunday]; }
    case 'het': return [today, sunday];
    default: return [today, '9999-12-31'];
  }
}

const isLong = (e) => e.end && daysBetween(e.start, e.end) > 3;
const overlaps = (e, [from, to]) => e.start <= to && (e.end || e.start) >= from;
const byTime = (a, b) => a.start.localeCompare(b.start) || (a.time || '99').localeCompare(b.time || '99');

// ---------- állapot ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privát mód: a mentés csak erre a látogatásra él */ } },
};
const VIEWS = { lista: 'list', kereses: 'search', mentett: 'saved' };
const params = new URLSearchParams(location.search);
const state = {
  view: VIEWS[params.get('v')] || 'home',
  day: DAYS.some(([k]) => k === params.get('nap')) ? params.get('nap') : 'mind',
  group: FILTERS.some((g) => g.key === params.get('kat')) ? params.get('kat') : '',
  q: params.get('q') || '',
  saved: new Set(store.get('saved', [])),
  events: [],
  byId: new Map(),
  limit: 40,
  from: null,      // ahonnan a listába jöttünk – ide visz vissza a vissza gomb
  expired: null,   // lejárt megosztott link azonosítója
};
const PAGE = 40;

// ---------- adat ----------
async function load() {
  view.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch(new URL('data/events.json', ROOT), { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    state.events = data.events.filter((e) => (e.end || e.start) >= today).sort(byTime);
    state.byId = new Map(data.events.map((e) => [e.id, e]));
    state.updated = data.updated;
  } catch {
    view.removeAttribute('aria-busy');
    const offline = !navigator.onLine;
    view.innerHTML = stateBox({
      icon: offline ? '📡' : '🛠️',
      title: offline ? 'Nincs internetkapcsolat' : 'Most nem sikerült betölteni a programokat',
      text: offline
        ? 'Kapcsold be a mobilnetet vagy a wifit, és próbáld újra. Ha korábban már megnyitottad az appot, a mentett programjaid is visszajönnek.'
        : 'Valószínűleg átmeneti hiba a szerveren. Pár másodperc múlva próbáld újra.',
      actions: '<button class="btn primary" data-retry>Újrapróbálom</button>',
    });
    return;
  }
  view.removeAttribute('aria-busy');
  render();
  route();
  updateBanner();
}

/** Felső sáv: offline vagy elavult adat esetén megmondja, mit lát a felhasználó, és mit tehet. */
function updateBanner() {
  const upd = state.updated ? new Date(state.updated) : null;
  const when = upd ? upd.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  let html = '';
  if (!navigator.onLine) html = `<b>Offline vagy.</b> A legutóbb letöltött programokat látod${when ? ` (${when})` : ''}.`;
  else if (upd && Date.now() - upd > STALE_HOURS * 3600e3) html = `<b>A lista ${when} óta nem frissült.</b> Indulás előtt nézd meg a részleteket a forrásoldalon.`;
  banner.innerHTML = html;
  banner.hidden = !html;
}
window.addEventListener('offline', updateBanner);
window.addEventListener('online', () => { updateBanner(); load(); });

// ---------- építőelemek ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function stateBox({ icon, title, text, actions = '' }) {
  return `<div class="state"><span class="state-icon" aria-hidden="true">${icon}</span><h2>${title}</h2><p>${text}</p>${actions ? `<div class="state-actions">${actions}</div>` : ''}</div>`;
}

/** Kép, alatta mindig egy színes "poszter" – ha a kép nem tölt be, az marad látható. */
function media(e, cls = 'media') {
  const g = groupOf(e);
  return `<div class="${cls}" style="--hue:${g.hue}">
    <div class="poster" aria-hidden="true"><span>${g.emoji}</span></div>
    ${e.image ? `<img src="${esc(e.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
  </div>`;
}

function card(e) {
  const saved = state.saved.has(e.id);
  const soon = startsIn(e);
  const parts = [isLong(e) ? null : e.time, e.venue].filter(Boolean).map(esc);
  const meta = (soon ? [`<span class="soon">${soon}</span>`, ...parts] : parts).join(' · ') || groupOf(e).label;
  return `<article class="card">
    <a class="card-link" href="${eventUrl(e)}" data-open="${e.id}" aria-label="${esc(e.title)}"></a>
    ${media(e)}
    <span class="chip">${esc(chip(e))}</span>
    <button class="fab save" data-save="${e.id}" aria-pressed="${saved}" aria-label="${saved ? 'Mentve – koppints az eltávolításhoz' : 'Mentés'}">${icons.heart}</button>
    <h3>${esc(e.title)}</h3>
    <div class="card-foot">
      <p>${meta}</p>
      <button class="icon-btn" data-share="${e.id}" aria-label="Megosztás">${icons.share}</button>
    </div>
  </article>`;
}

/** Kompakt sor a listákhoz: kis kép, cím, idő és helyszín – egy képernyőre 6-7 program fér. */
function row(e, { withDate = false } = {}) {
  const saved = state.saved.has(e.id);
  const soon = startsIn(e);
  const when = isLong(e) ? `${short(e.end).replace('.', '')}-ig` : withDate ? [chip(e), e.time].filter(Boolean).join(', ') : e.time;
  const parts = [when, e.venue].filter(Boolean).map(esc);
  const meta = (soon ? [`<span class="soon">${soon}</span>`, ...parts] : parts).join(' · ') || groupOf(e).label;
  return `<article class="row-card">
    <a class="card-link" href="${eventUrl(e)}" data-open="${e.id}" aria-label="${esc(e.title)}"></a>
    ${media(e, 'thumb')}
    <div class="rc-body">
      <h3>${esc(e.title)}</h3>
      <p>${meta}</p>
    </div>
    <button class="icon-btn save" data-save="${e.id}" aria-pressed="${saved}" aria-label="${saved ? 'Mentve – koppints az eltávolításhoz' : 'Mentés'}">${icons.heart}</button>
  </article>`;
}

function rail(title, events, link, sub = '') {
  if (!events.length) return '';
  return `<section class="rail">
    <header class="rail-head">
      <h2>${title}${sub ? ` <small>${sub}</small>` : ''}</h2>
      ${link ? `<a href="${link}" data-nav="${link}">Összes <span aria-hidden="true">${events.length}</span></a>` : ''}
    </header>
    <div class="rail-track">${events.slice(0, 12).map(card).join('')}</div>
  </section>`;
}

const listHref = (p) => `?${new URLSearchParams({ v: 'lista', ...p })}`;

/** Lejárt megosztott link: nem hiba, hanem esély – megmutatjuk, mi hasonló jön most. */
function expiredNotice() {
  if (!state.expired) return '';
  const words = state.expired.replace(/-(?:\d{2}-\d{2}|[a-z]{3,4}\d{1,2})x*$/, '').split('-').filter((w) => w.length >= 4);
  const similar = state.events.filter((e) => words.some((w) => norm(`${e.title} ${e.venue || ''}`).includes(w)));
  const picks = (similar.length ? similar : state.events.filter((e) => e.start <= addDays(today, 3))).slice(0, 12);
  return `<section class="notice" role="status">
    <div class="notice-head">
      <div><b>Ez a program már lejárt</b><p>A link, amit kaptál, egy elmúlt programra mutat. ${similar.length ? 'Ezek hasonlítanak rá, és még előtted vannak:' : 'Nézd meg, mi lesz a következő napokban:'}</p></div>
      <button class="icon-btn" data-dismiss aria-label="Bezárás">${icons.close}</button>
    </div>
    <div class="rail-track">${picks.map(card).join('')}</div>
  </section>`;
}

// ---------- nézetek ----------
function homeView() {
  const dated = state.events.filter((e) => !isLong(e));
  const on = (key) => dated.filter((e) => overlaps(e, range(key)));
  const soon = dated.filter((e) => e.start <= addDays(today, 21));
  const evening = on('ma').filter((e) => !e.time || e.time >= '17:00');
  let html = `${expiredNotice()}<header class="hello">
    <p>${esc(cap(WEEKDAYS[weekday(today)]))}, ${esc(short(today))}</p>
    <h1>Mi legyen ma?</h1>
  </header>`;
  const todayRail = rail('Ma este', evening.length >= 4 ? evening : on('ma'), listHref({ nap: 'ma' }));
  html += todayRail || '<p class="hint">Mára már nincs több programunk – nézd meg a holnapiakat.</p>';
  html += rail(`${YOUTH.emoji} Fiataloknak`, soon.filter((e) => e.youth), listHref({ kat: YOUTH.key }), 'klubok, bulik, diákprogramok');
  html += rail('Holnap', on('holnap'), listHref({ nap: 'holnap' }));
  html += rail('Hétvégén', on('hetvege'), listHref({ nap: 'hetvege' }));
  for (const g of GROUPS) {
    html += rail(`${g.emoji} ${g.label}`, soon.filter((e) => groupOf(e) === g), listHref({ kat: g.key }));
  }
  const ongoing = state.events.filter((e) => isLong(e) && e.start <= addDays(today, 7)).sort((a, b) => a.end.localeCompare(b.end));
  html += rail('Most is látogatható', ongoing, listHref({ nap: 'ma', kat: 'kiallitas' }), 'kiállítások, sorozatok');
  if (!state.events.length) {
    html += stateBox({ icon: '🗓️', title: 'Most épp nincs program a listában', text: 'A lista naponta háromszor frissül. Nézz vissza később.' });
  }
  return html + footer();
}

function filteredList() {
  const r = range(state.day);
  return state.events.filter((e) => overlaps(e, r) && matchesFilter(e, state.group));
}

function listBody(items) {
  if (!items.length) {
    const actions = [
      state.day !== 'mind' ? '<button class="btn primary" data-day="mind">Mutasd bármikor</button>' : '',
      state.group ? '<button class="btn" data-group="">Minden kategória</button>' : '',
    ].join('');
    return stateBox({ icon: '🔍', title: 'Erre most nincs program', text: 'Ebben az időszakban és kategóriában nem találtunk semmit. Bővítsd a szűrést:', actions });
  }
  const [from] = range(state.day);
  const dayOf = (e) => (e.start < from ? from : e.start);
  const dated = items.filter((e) => !isLong(e));
  const ongoing = items.filter(isLong);
  const groups = new Map();
  for (const e of dated.slice(0, state.limit)) {
    if (!groups.has(dayOf(e))) groups.set(dayOf(e), []);
    groups.get(dayOf(e)).push(e);
  }
  let html = '';
  for (const [day, evs] of groups) html += `<section><h2 class="day sticky">${dayName(day)} <small>${evs.length}</small></h2><div class="rows">${evs.map((e) => row(e)).join('')}</div></section>`;
  if (dated.length > state.limit) html += `<button class="btn more" data-more>Még ${Math.min(PAGE, dated.length - state.limit)} program <small>(${state.limit} / ${dated.length})</small></button>`;
  if (ongoing.length && dated.length <= state.limit) {
    html += `<section><h2 class="day sticky">Most is látogatható <small>${ongoing.length}</small></h2><div class="rows">${ongoing.sort((a, b) => a.end.localeCompare(b.end)).slice(0, 24).map((e) => row(e)).join('')}</div></section>`;
  }
  return html;
}

function listView() {
  const items = filteredList();
  const g = FILTERS.find((x) => x.key === state.group);
  return `<header class="page-head compact">
      <button class="icon-btn back" data-back aria-label="Vissza">${icons.back}</button>
      <button class="title-btn" data-pick aria-haspopup="dialog" aria-label="Kategória: ${esc(g?.label || 'Minden program')}. Koppints a váltáshoz.">
        <span>${g ? `${g.emoji} ${esc(g.label)}` : 'Minden program'}</span>${icons.down}
      </button>
      <span class="head-count">${items.length}</span>
    </header>
    <nav class="seg compact" aria-label="Időszak">${DAYS.map(([k]) => `<button data-day="${k}" aria-pressed="${state.day === k}">${DAY_SHORT[k]}</button>`).join('')}</nav>
    ${listBody(items)}${footer()}`;
}

/** Kategóriaválasztó alsó lap – a lista fejlécéből nyílik, darabszámokkal az aktuális időszakra. */
function openPicker() {
  let box = $('#picker');
  if (!box) {
    box = document.createElement('dialog');
    box.id = 'picker';
    box.className = 'picker';
    box.setAttribute('aria-label', 'Kategória választása');
    document.body.append(box);
    box.addEventListener('click', (ev) => { if (ev.target === box) box.close(); });
  }
  const r = range(state.day);
  const count = (key) => state.events.filter((e) => overlaps(e, r) && matchesFilter(e, key)).length;
  const opt = (key, label) => `<button data-group="${key}" aria-pressed="${state.group === key}"><span>${label}</span><small>${count(key)}</small></button>`;
  box.innerHTML = `<div class="grabber" aria-hidden="true"></div><h2>Kategória</h2>
    <div class="picker-list">${opt('', '🗂️ Minden program')}${FILTERS.map((x) => opt(x.key, `${x.emoji} ${esc(x.label)}`)).join('')}</div>`;
  box.showModal();
}

function searchResults() {
  const q = norm(state.q.trim());
  if (!q) return searchIdle();
  const hits = state.events.filter((e) => norm(`${e.title} ${e.venue || ''} ${e.category} ${e.description || ''}`).includes(q));
  if (!hits.length) {
    return stateBox({
      icon: '🤔',
      title: `Nincs találat erre: „${esc(state.q)}”`,
      text: 'Nézd meg a helyesírást, vagy írj rövidebb szót – például csak az előadó vagy a helyszín nevét.',
      actions: '<button class="btn" data-clear>Keresés törlése</button>',
    });
  }
  return `<p class="count">${hits.length} találat</p><div class="rows">${hits.slice(0, state.limit).map((e) => row(e, { withDate: true })).join('')}</div>${hits.length > state.limit ? '<button class="btn more" data-more>Továbbiak</button>' : ''}`;
}

function searchIdle() {
  const counts = Object.fromEntries(FILTERS.map((g) => [g.key, state.events.filter((e) => matchesFilter(e, g.key)).length]));
  return `<h2 class="day">Kategóriák</h2>
    <div class="tiles">${FILTERS.map((g) => `<a class="tile" href="${listHref({ kat: g.key })}" data-nav="${listHref({ kat: g.key })}" style="--hue:${g.hue}">
      <span class="tile-emoji">${g.emoji}</span><b>${g.label}</b><small>${counts[g.key]} program</small></a>`).join('')}</div>`;
}

function searchView() {
  return `<header class="page-head"><div><h1>Keresés</h1></div></header>
    <label class="search">
      ${icons.search}
      <input id="q" type="search" value="${esc(state.q)}" placeholder="Előadó, helyszín, műfaj…" autocomplete="off" enterkeyhint="search" aria-label="Keresés">
      <button class="clear" type="button" data-clear aria-label="Keresés törlése">${icons.close}</button>
    </label>
    <div id="results" aria-live="polite">${searchResults()}</div>`;
}

function savedView() {
  const items = state.events.filter((e) => state.saved.has(e.id));
  const gone = [...state.saved].filter((id) => !state.events.some((e) => e.id === id)).length;
  const note = gone ? `<p class="hint">${gone} mentett programod már lejárt. <button class="link" data-prune>Lejártak törlése</button></p>` : '';
  return `<header class="page-head"><div><h1>Mentett</h1><p>${items.length} közelgő program</p></div></header>
    ${note}
    ${items.length ? `<div class="rows">${items.map((e) => row(e, { withDate: true })).join('')}</div>`
    : stateBox({ icon: '♡', title: 'Még nincs mentett programod', text: 'Nyomd meg a szív gombot egy kártyán, és itt megtalálod – akkor is, ha legközelebb nincs net.', actions: '<button class="btn primary" data-tab="home">Programok felfedezése</button>' })}`;
}

function footer() {
  const upd = state.updated ? new Date(state.updated).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const sources = [...new Set(state.events.flatMap((e) => e.links.map((l) => l.name)))].join(', ');
  return `<footer class="foot">${state.events.length} program · frissítve: ${upd}<br>Források: ${esc(sources)}.<br>A részletekért és jegyekért mindig a forrásoldal az irányadó.</footer>`;
}

function render() {
  view.innerHTML = { home: homeView, list: listView, search: searchView, saved: savedView }[state.view]();
  document.querySelectorAll('.tabbar [data-tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === state.view || (b.dataset.tab === 'home' && state.view === 'list') ? 'page' : 'false'));
  updateBadge();
  syncQuery();
}

function updateBadge() {
  const n = state.events.filter((e) => state.saved.has(e.id)).length;
  const badge = $('.tabbar .count');
  badge.textContent = n || '';
  badge.hidden = !n;
}

function syncQuery() {
  if (location.pathname.includes('/e/')) return;
  const p = new URLSearchParams();
  const v = Object.entries(VIEWS).find(([, val]) => val === state.view)?.[0];
  if (v) p.set('v', v);
  if (state.view === 'list') {
    if (state.day !== 'mind') p.set('nap', state.day);
    if (state.group) p.set('kat', state.group);
  }
  if (state.view === 'search' && state.q) p.set('q', state.q);
  const url = new URL(ROOT);
  url.search = p.toString();
  history.replaceState(null, '', url);
}

function go(href) {
  const p = new URLSearchParams(href.split('?')[1] || '');
  state.from = { view: state.view, q: state.q, scroll: window.scrollY };
  state.view = VIEWS[p.get('v')] || 'home';
  state.day = p.get('nap') || 'mind';
  state.group = p.get('kat') || '';
  state.limit = PAGE;
  render();
  window.scrollTo({ top: 0 });
}

/** Vissza oda, ahonnan jöttünk (a keresés csempéjéről a keresésbe, a kezdőlapról a kezdőlap ugyanazon pontjára). */
function back() {
  const from = state.from || { view: 'home', scroll: 0 };
  state.from = null;
  state.view = from.view === 'list' ? 'home' : from.view;
  state.q = from.q || '';
  render();
  window.scrollTo({ top: from.scroll || 0 });
}

// ---------- részletek ----------
const eventUrl = (e) => new URL(`e/${e.id}/`, ROOT).href;

function openEvent(e, push = true, { shared = false } = {}) {
  if (!e) return;
  if (push) history.pushState({ id: e.id }, '', eventUrl(e));
  const saved = state.saved.has(e.id);
  const g = groupOf(e);
  const soon = startsIn(e);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${e.venue || e.title}, Budapest`)}&travelmode=transit`;
  sheet.innerHTML = `<article class="detail">
    <div class="grabber" aria-hidden="true"></div>
    <button class="fab close" data-close aria-label="Bezárás">${icons.close}</button>
    ${media(e, 'hero')}
    <div class="detail-body">
      ${shared ? '<p class="shared-note">🔗 Valaki megosztotta veled ezt a programot</p>' : ''}
      <span class="kicker">${g.emoji} ${esc(e.category)}${e.youth ? ' · 🎓 Fiataloknak' : ''}</span>
      <h2 id="sheetTitle">${esc(e.title)}</h2>
      <ul class="facts">
        <li>${icons.clock}<span>${esc(dateLabel(e))}${soon ? ` <em class="soon">· ${soon}</em>` : ''}</span></li>
        ${e.venue ? `<li>${icons.pin}<span>${esc(e.venue)}</span></li>` : ''}
      </ul>
      <div class="actions">
        <button class="btn primary" data-share="${e.id}">${icons.share} Megosztás</button>
        <button class="btn" data-save="${e.id}" aria-pressed="${saved}">${icons.heart} ${saved ? 'Mentve' : 'Mentés'}</button>
      </div>
      ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ''}
      <div class="links">
        ${e.links.map((l) => `<a class="row" href="${esc(l.url)}" target="_blank" rel="noopener">${icons.ticket}<span>Részletek, jegyek<small>${esc(l.name)} oldalán</small></span>${icons.out}</a>`).join('')}
        <a class="row" href="${directions}" target="_blank" rel="noopener">${icons.pin}<span>Útvonal tömegközlekedéssel<small>Google Térkép</small></span>${icons.out}</a>
      </div>
      <div class="share-row" aria-label="Küldés">
        <a href="https://wa.me/?text=${encodeURIComponent(shareText(e))}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl(e))}" target="_blank" rel="noopener">Facebook</a>
        <a href="viber://forward?text=${encodeURIComponent(shareText(e))}">Viber</a>
        <button data-copy="${e.id}">Link másolása</button>
      </div>
      ${shared ? '<button class="btn wide" data-close>Több program ma estére →</button>' : ''}
      <p class="fineprint">Az időpont és az ár változhat – indulás előtt nézd meg a forrásoldalon.</p>
    </div>
  </article>`;
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
  document.title = `${e.title} | Hova menjünk?`;
}

function closeEvent(push = true) {
  if (sheet.open) sheet.close();
  document.title = 'Hova menjünk? – Budapest legjobb programjai';
  if (push && location.pathname.includes('/e/')) {
    history.pushState(null, '', ROOT);
    syncQuery();
  }
}

function route() {
  const m = location.pathname.match(/\/e\/([^/]+)\/?$/);
  if (!m) return closeEvent(false);
  const id = decodeURIComponent(m[1]);
  const e = state.byId.get(id);
  if (e && (e.end || e.start) >= today) return openEvent(e, false, { shared: !history.state });
  // Lejárt vagy eltűnt program: a kezdőlapon elmagyarázzuk, és hasonlókat ajánlunk.
  state.expired = id;
  state.view = 'home';
  closeEvent(false);
  history.replaceState(null, '', ROOT);
  render();
}

// ---------- megosztás, mentés ----------
/** Úgy szól, mintha egy barát írná: "Ezt nézd: … 🪩 Csütörtök 19:00 · Dürer Kert. Jössz?" */
function shareLine(e) {
  const when = e.end ? `${short(e.start)} – ${short(e.end)}` : `${cap(dayName(e.start) === 'Ma' ? 'ma' : dayName(e.start) === 'Holnap' ? 'holnap' : WEEKDAYS[weekday(e.start)])}${e.time ? ` ${e.time}` : ''}`;
  return `Ezt nézd: ${e.title} ${groupOf(e).emoji} ${[when, e.venue].filter(Boolean).join(' · ')}. Jössz?`;
}
const shareText = (e) => `${shareLine(e)} 👉 ${eventUrl(e)}`;

async function share(e) {
  const data = { title: e.title, text: shareLine(e), url: eventUrl(e) };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  copy(e);
}

async function copy(e) {
  try {
    await navigator.clipboard.writeText(eventUrl(e));
    toast('Link kimásolva – illeszd be egy üzenetbe');
  } catch {
    showLink(eventUrl(e));
  }
}

/** Ha a vágólap nem elérhető: kijelölt link, amit kézzel lehet másolni (prompt() helyett, ami sok helyen tiltott). */
function showLink(url) {
  let box = $('#linkbox');
  if (!box) {
    box = document.createElement('dialog');
    box.id = 'linkbox';
    box.className = 'linkbox';
    document.body.append(box);
    box.addEventListener('click', (ev) => { if (ev.target === box || ev.target.closest('[data-done]')) box.close(); });
  }
  box.innerHTML = `<h2>Másold ki a linket</h2><p>A böngésződ nem engedte az automatikus másolást. Tartsd nyomva a linket, és válaszd a Másolás lehetőséget.</p>
    <input readonly value="${esc(url)}" aria-label="Program linkje"><button class="btn primary" data-done>Kész</button>`;
  box.showModal();
  box.querySelector('input').select();
}

function toggleSave(id, { undo = false } = {}) {
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  store.set('saved', [...state.saved]);
  const on = state.saved.has(id);
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', on);
    if (b.classList.contains('btn')) b.innerHTML = `${icons.heart} ${on ? 'Mentve' : 'Mentés'}`;
    else b.setAttribute('aria-label', on ? 'Mentve – koppints az eltávolításhoz' : 'Mentés');
  });
  updateBadge();
  if (undo) toast(on ? 'Visszatéve a mentettek közé' : 'Mentés visszavonva');
  else toast(on ? 'Elmentve – a Mentett fülön találod' : 'Eltávolítva a mentettek közül', { label: 'Visszavonás', fn: () => toggleSave(id, { undo: true }) });
  if (state.view === 'saved' && !sheet.open) render();
}

let toastTimer;
let toastAction = null;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  toastAction = action?.fn || null;
  t.classList.toggle('has-action', !!action);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); toastAction = null; }, action ? 5000 : 2400);
}
$('#toast').addEventListener('click', (ev) => {
  if (!ev.target.closest('button') || !toastAction) return;
  const fn = toastAction;
  toastAction = null;
  fn();
});

// ---------- események ----------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-pick],[data-tab],[data-nav],[data-back],[data-more],[data-day],[data-group],[data-q],[data-clear],[data-open],[data-save],[data-share],[data-copy],[data-close],[data-retry],[data-dismiss],[data-prune]');
  if (!el) return;
  const d = el.dataset;
  const find = (id) => state.byId.get(id);
  if (d.tab) {
    ev.preventDefault();
    closeEvent(false);
    state.view = d.tab;
    state.from = null;
    state.limit = PAGE;
    render();
    window.scrollTo({ top: 0 });
  } else if (d.nav) { ev.preventDefault(); go(d.nav); }
  else if ('back' in d) back();
  else if ('more' in d) { state.limit += PAGE; state.view === 'search' ? ($('#results').innerHTML = searchResults()) : render(); }
  else if (d.day !== undefined) { state.day = d.day; state.limit = PAGE; render(); window.scrollTo({ top: 0 }); }
  else if ('pick' in d) openPicker();
  else if (d.group !== undefined) { $('#picker')?.close(); state.group = d.group; state.limit = PAGE; render(); window.scrollTo({ top: 0 }); }
  else if (d.q) { state.q = d.q; state.limit = PAGE; render(); }
  else if ('clear' in d) { state.q = ''; render(); $('#q').focus(); }
  else if (d.open) { ev.preventDefault(); openEvent(find(d.open)); }
  else if (d.save) toggleSave(d.save);
  else if (d.share) share(find(d.share));
  else if (d.copy) copy(find(d.copy));
  else if ('close' in d) closeEvent();
  else if ('retry' in d) { view.innerHTML = $('#skeleton').innerHTML; load(); }
  else if ('dismiss' in d) { state.expired = null; render(); }
  else if ('prune' in d) {
    const before = [...state.saved];
    state.saved = new Set(before.filter((id) => state.events.some((e) => e.id === id)));
    store.set('saved', [...state.saved]);
    render();
    toast('Lejárt programok törölve', { label: 'Visszavonás', fn: () => { state.saved = new Set(before); store.set('saved', before); render(); } });
  }
});

let qTimer;
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'q') return;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    state.q = ev.target.value;
    state.limit = PAGE;
    $('#results').innerHTML = searchResults();
    syncQuery();
  }, 200);
});

sheet.addEventListener('click', (ev) => { if (ev.target === sheet) closeEvent(); });
sheet.addEventListener('cancel', (ev) => { ev.preventDefault(); closeEvent(); });
window.addEventListener('popstate', route);

// ---------- PWA ----------
let installEvent;
window.addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  installEvent = ev;
  $('#installBtn').hidden = false;
});
$('#installBtn').addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  $('#installBtn').hidden = true;
  if (outcome === 'accepted') toast('Telepítve – a kezdőképernyőn találod');
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register(new URL('sw.js', ROOT)).catch(() => {});

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const icons = {
  heart: svg('<path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"/>'),
  // a klasszikus "három összekötött pötty" megosztás ikon
  share: svg('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 13.3 7.4 4.4M15.7 6.3 8.3 10.7"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  ticket: svg('<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'),
  out: svg('<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>'),
};

load();
