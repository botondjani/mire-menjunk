// Mire menjünk? – kliens. Nincs build lépés: sima ES modul.
// Nézetek: felfedezés (vízszintes szekciók), lista (szűrt, napokra bontva), keresés, mentett.

const ROOT = new URL('./', import.meta.url);
const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const sheet = $('#sheet');

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
const DAYS = [['ma', 'Ma'], ['holnap', 'Holnap'], ['hetvege', 'Hétvégén'], ['het', 'Ezen a héten'], ['mind', 'Bármikor']];
const WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const WD_SHORT = ['V', 'H', 'K', 'SZE', 'CS', 'P', 'SZO'];
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const SUGGESTIONS = ['Dürer', 'Akvárium', 'A38', 'Trafó', 'jazz', 'fesztivál', 'kiállítás', 'stand-up'];

// ---------- dátumok (Budapest időzóna, YYYY-MM-DD stringekkel) ----------
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
const toDate = (iso) => new Date(`${iso}T12:00:00Z`);
const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekday = (iso) => toDate(iso).getUTCDay();
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
const short = (iso) => `${MONTHS[+iso.slice(5, 7) - 1]} ${+iso.slice(8)}.`;
const tomorrow = addDays(today, 1);

function dayName(iso) {
  if (iso === today) return 'Ma';
  if (iso === tomorrow) return 'Holnap';
  const w = WEEKDAYS[weekday(iso)];
  return `${w[0].toUpperCase()}${w.slice(1)}, ${short(iso)}`;
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
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privát mód */ } },
};
const VIEWS = { lista: 'list', kereses: 'search', mentett: 'saved' };
const params = new URLSearchParams(location.search);
const state = {
  view: VIEWS[params.get('v')] || 'home',
  day: DAYS.some(([k]) => k === params.get('nap')) ? params.get('nap') : 'mind',
  group: GROUPS.some((g) => g.key === params.get('kat')) ? params.get('kat') : '',
  q: params.get('q') || '',
  saved: new Set(store.get('saved', [])),
  events: [],
  byId: new Map(),
  limit: 40,
};
const PAGE = 40;

// ---------- adat ----------
async function load() {
  try {
    const res = await fetch(new URL('data/events.json', ROOT), { cache: 'no-cache' });
    const data = await res.json();
    state.events = data.events.filter((e) => (e.end || e.start) >= today).sort(byTime);
    state.byId = new Map(data.events.map((e) => [e.id, e]));
    state.updated = data.updated;
  } catch {
    view.innerHTML = '<p class="empty">Nem sikerült betölteni a programokat. Ellenőrizd a netet, és próbáld újra.</p>';
    return;
  }
  render();
  route();
}

// ---------- építőelemek ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

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
  const meta = [isLong(e) ? null : e.time, e.venue].filter(Boolean).join(' · ') || groupOf(e).label;
  return `<article class="card">
    <a class="card-link" href="${eventUrl(e)}" data-open="${e.id}" aria-label="${esc(e.title)}"></a>
    ${media(e)}
    <span class="chip">${esc(chip(e))}</span>
    <button class="fab save" data-save="${e.id}" aria-pressed="${saved}" aria-label="${saved ? 'Mentve' : 'Mentés'}">${icons.heart}</button>
    <h3>${esc(e.title)}</h3>
    <div class="card-foot">
      <p>${esc(meta)}</p>
      <button class="icon-btn" data-share="${e.id}" aria-label="Megosztás">${icons.share}</button>
    </div>
  </article>`;
}

function rail(title, events, link, sub = '') {
  if (!events.length) return '';
  return `<section class="rail">
    <header class="rail-head">
      <h2>${title}${sub ? ` <small>${sub}</small>` : ''}</h2>
      ${link ? `<a href="${link}" data-nav="${link}">Összes</a>` : ''}
    </header>
    <div class="rail-track">${events.slice(0, 12).map(card).join('')}</div>
  </section>`;
}

const listHref = (p) => `?${new URLSearchParams({ v: 'lista', ...p })}`;

// ---------- nézetek ----------
function homeView() {
  const dated = state.events.filter((e) => !isLong(e));
  const on = (key) => dated.filter((e) => overlaps(e, range(key)));
  const soon = dated.filter((e) => e.start <= addDays(today, 21));
  const evening = on('ma').filter((e) => !e.time || e.time >= '17:00');
  let html = `<header class="hello">
    <p>${esc(WEEKDAYS[weekday(today)][0].toUpperCase() + WEEKDAYS[weekday(today)].slice(1))}, ${esc(short(today))}</p>
    <h1>Mi legyen ma?</h1>
  </header>`;
  html += rail('Ma este', evening.length >= 4 ? evening : on('ma'), listHref({ nap: 'ma' }));
  html += rail('Holnap', on('holnap'), listHref({ nap: 'holnap' }));
  html += rail('Hétvégén', on('hetvege'), listHref({ nap: 'hetvege' }));
  for (const g of GROUPS) {
    html += rail(`${g.emoji} ${g.label}`, soon.filter((e) => groupOf(e) === g), listHref({ kat: g.key }));
  }
  const ongoing = state.events.filter((e) => isLong(e) && e.start <= addDays(today, 7)).sort((a, b) => a.end.localeCompare(b.end));
  html += rail('Most is látogatható', ongoing, listHref({ nap: 'ma', kat: 'kiallitas' }), 'kiállítások, sorozatok');
  return html + footer();
}

function filteredList() {
  const r = range(state.day);
  const g = GROUPS.find((x) => x.key === state.group);
  return state.events.filter((e) => overlaps(e, r) && (!g || groupOf(e) === g));
}

function listBody(items) {
  if (!items.length) return '<p class="empty">Erre nincs találat. Próbálj másik napot vagy kategóriát.</p>';
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
  for (const [day, evs] of groups) html += `<section><h2 class="day">${dayName(day)}</h2><div class="grid">${evs.map(card).join('')}</div></section>`;
  if (dated.length > state.limit) html += `<button class="btn more" data-more>Még ${Math.min(PAGE, dated.length - state.limit)} program</button>`;
  if (ongoing.length && dated.length <= state.limit) {
    html += `<section><h2 class="day">Most is látogatható</h2><div class="grid">${ongoing.sort((a, b) => a.end.localeCompare(b.end)).slice(0, 24).map(card).join('')}</div></section>`;
  }
  return html;
}

function listView() {
  const items = filteredList();
  const g = GROUPS.find((x) => x.key === state.group);
  const title = [g?.label, DAYS.find(([k]) => k === state.day)?.[1]].filter((x) => x && x !== 'Bármikor').join(' · ') || 'Minden program';
  return `<header class="page-head">
      <button class="icon-btn back" data-nav="./" aria-label="Vissza">${icons.back}</button>
      <div><h1>${esc(title)}</h1><p>${items.length} program</p></div>
    </header>
    <nav class="seg" aria-label="Időszak">${DAYS.map(([k, l]) => `<button data-day="${k}" aria-pressed="${state.day === k}">${l}</button>`).join('')}</nav>
    <nav class="cats" aria-label="Kategória">
      <button data-group="" aria-pressed="${!state.group}">Mind</button>
      ${GROUPS.map((x) => `<button data-group="${x.key}" aria-pressed="${state.group === x.key}">${x.emoji} ${x.label}</button>`).join('')}
    </nav>
    ${listBody(items)}${footer()}`;
}

function searchResults() {
  const q = norm(state.q.trim());
  if (!q) return '';
  const hits = state.events.filter((e) => norm(`${e.title} ${e.venue || ''} ${e.category} ${e.description || ''}`).includes(q));
  return hits.length
    ? `<p class="count">${hits.length} találat</p><div class="grid">${hits.slice(0, state.limit).map(card).join('')}</div>${hits.length > state.limit ? '<button class="btn more" data-more>Továbbiak</button>' : ''}`
    : `<p class="empty">Nincs találat erre: „${esc(state.q)}”.</p>`;
}

function searchView() {
  const counts = Object.fromEntries(GROUPS.map((g) => [g.key, state.events.filter((e) => groupOf(e) === g).length]));
  return `<header class="page-head"><div><h1>Keresés</h1></div></header>
    <label class="search">
      ${icons.search}
      <input id="q" type="search" value="${esc(state.q)}" placeholder="Előadó, helyszín, műfaj…" autocomplete="off" enterkeyhint="search" aria-label="Keresés">
    </label>
    <div id="results">${state.q ? searchResults() : `
      <div class="suggest">${SUGGESTIONS.map((s) => `<button data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <h2 class="day">Kategóriák</h2>
      <div class="tiles">${GROUPS.map((g) => `<a class="tile" href="${listHref({ kat: g.key })}" data-nav="${listHref({ kat: g.key })}" style="--hue:${g.hue}">
        <span class="tile-emoji">${g.emoji}</span><b>${g.label}</b><small>${counts[g.key]} program</small></a>`).join('')}</div>`}
    </div>`;
}

function savedView() {
  const items = state.events.filter((e) => state.saved.has(e.id));
  return `<header class="page-head"><div><h1>Mentett</h1><p>${items.length} program</p></div></header>
    ${items.length ? `<div class="grid">${items.map(card).join('')}</div>`
    : '<p class="empty">Még nincs mentett programod.<br>Nyomd meg a ♡ gombot egy kártyán, és itt megtalálod.</p>'}`;
}

function footer() {
  const upd = state.updated ? new Date(state.updated).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const sources = [...new Set(state.events.flatMap((e) => e.links.map((l) => l.name)))].join(', ');
  return `<footer class="foot">${state.events.length} program · frissítve: ${upd}<br>Források: ${esc(sources)}.<br>A részletekért és jegyekért mindig a forrásoldal az irányadó.</footer>`;
}

function render() {
  view.innerHTML = { home: homeView, list: listView, search: searchView, saved: savedView }[state.view]();
  document.querySelectorAll('.tabbar [data-tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === state.view || (b.dataset.tab === 'home' && state.view === 'list') ? 'page' : 'false'));
  const badge = $('.tabbar .count');
  badge.textContent = state.saved.size || '';
  badge.hidden = !state.saved.size;
  syncQuery();
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
  state.view = VIEWS[p.get('v')] || 'home';
  state.day = p.get('nap') || 'mind';
  state.group = p.get('kat') || '';
  state.limit = PAGE;
  render();
  window.scrollTo({ top: 0 });
}

// ---------- részletek ----------
const eventUrl = (e) => new URL(`e/${e.id}/`, ROOT).href;

function openEvent(e, push = true) {
  if (push) history.pushState({ id: e.id }, '', eventUrl(e));
  const saved = state.saved.has(e.id);
  const g = groupOf(e);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue || e.title}, Budapest`)}`;
  sheet.innerHTML = `<article class="detail">
    <div class="grabber" aria-hidden="true"></div>
    <button class="fab close" data-close aria-label="Bezárás">${icons.close}</button>
    ${media(e, 'hero')}
    <div class="detail-body">
      <span class="kicker">${g.emoji} ${esc(e.category)}</span>
      <h2 id="sheetTitle">${esc(e.title)}</h2>
      <ul class="facts">
        <li>${icons.clock}<span>${esc(dateLabel(e))}</span></li>
        ${e.venue ? `<li>${icons.pin}<span>${esc(e.venue)}</span></li>` : ''}
      </ul>
      <div class="actions">
        <button class="btn primary" data-share="${e.id}">${icons.share} Megosztás</button>
        <button class="btn" data-save="${e.id}" aria-pressed="${saved}">${icons.heart} ${saved ? 'Mentve' : 'Mentés'}</button>
      </div>
      ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ''}
      <div class="links">
        ${e.links.map((l) => `<a class="row" href="${esc(l.url)}" target="_blank" rel="noopener">${icons.ticket}<span>Részletek, jegyek<small>${esc(l.name)}</small></span>${icons.out}</a>`).join('')}
        <a class="row" href="${maps}" target="_blank" rel="noopener">${icons.pin}<span>Útvonaltervezés<small>Google Térkép</small></span>${icons.out}</a>
      </div>
      <div class="share-row" aria-label="Küldés">
        <a href="https://wa.me/?text=${encodeURIComponent(shareText(e))}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl(e))}" target="_blank" rel="noopener">Facebook</a>
        <a href="viber://forward?text=${encodeURIComponent(shareText(e))}">Viber</a>
        <button data-copy="${e.id}">Link másolása</button>
      </div>
    </div>
  </article>`;
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
  document.title = `${e.title} | Mire menjünk?`;
}

function closeEvent(push = true) {
  if (sheet.open) sheet.close();
  document.title = 'Mire menjünk? – Budapest legjobb programjai';
  if (push && location.pathname.includes('/e/')) {
    history.pushState(null, '', ROOT);
    syncQuery();
  }
}

function route() {
  const m = location.pathname.match(/\/e\/([^/]+)\/?$/);
  if (!m) return closeEvent(false);
  const e = state.byId.get(decodeURIComponent(m[1]));
  if (e) openEvent(e, false);
  else {
    toast('Ez a program már lejárt – nézd meg a többit!');
    history.replaceState(null, '', ROOT);
  }
}

// ---------- megosztás, mentés ----------
const shareText = (e) => `${e.title} – ${dateLabel(e)}${e.venue ? `, ${e.venue}` : ''} 👉 ${eventUrl(e)}`;

async function share(e) {
  const data = { title: e.title, text: `${e.title} – ${dateLabel(e)}${e.venue ? `, ${e.venue}` : ''}`, url: eventUrl(e) };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  copy(e);
}

async function copy(e) {
  try {
    await navigator.clipboard.writeText(eventUrl(e));
    toast('Link kimásolva – küldd el a haveroknak!');
  } catch {
    prompt('Másold ki a linket:', eventUrl(e));
  }
}

function toggleSave(id) {
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  store.set('saved', [...state.saved]);
  const on = state.saved.has(id);
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', on);
    if (b.classList.contains('btn')) b.innerHTML = `${icons.heart} ${on ? 'Mentve' : 'Mentés'}`;
  });
  const badge = $('.tabbar .count');
  badge.textContent = state.saved.size || '';
  badge.hidden = !state.saved.size;
  toast(on ? 'Elmentve' : 'Eltávolítva a mentettek közül');
  if (state.view === 'saved' && !sheet.open) render();
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ---------- események ----------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-tab],[data-nav],[data-more],[data-day],[data-group],[data-q],[data-open],[data-save],[data-share],[data-copy],[data-close]');
  if (!el) return;
  const d = el.dataset;
  const find = (id) => state.byId.get(id);
  if (d.tab) {
    ev.preventDefault();
    closeEvent(false);
    state.view = d.tab;
    state.limit = PAGE;
    render();
    window.scrollTo({ top: 0 });
    if (d.tab === 'search') $('#q')?.focus();
  } else if (d.nav) { ev.preventDefault(); go(d.nav); }
  else if ('more' in d) { state.limit += PAGE; state.view === 'search' ? ($('#results').innerHTML = searchResults()) : render(); }
  else if (d.day !== undefined) { state.day = d.day; state.limit = PAGE; render(); }
  else if (d.group !== undefined) { state.group = d.group; state.limit = PAGE; render(); }
  else if (d.q) { state.q = d.q; render(); }
  else if (d.open) { ev.preventDefault(); openEvent(find(d.open)); }
  else if (d.save) toggleSave(d.save);
  else if (d.share) share(find(d.share));
  else if (d.copy) copy(find(d.copy));
  else if ('close' in d) closeEvent();
});

let qTimer;
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'q') return;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    state.q = ev.target.value;
    state.limit = PAGE;
    $('#results').innerHTML = state.q.trim() ? searchResults() : '';
    if (!state.q.trim()) render();
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
  await installEvent.userChoice;
  installEvent = null;
  $('#installBtn').hidden = true;
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register(new URL('sw.js', ROOT)).catch(() => {});

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const icons = {
  heart: svg('<path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"/>'),
  // a klasszikus "három összekötött pötty" megosztás ikon
  share: svg('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 13.3 7.4 4.4M15.7 6.3 8.3 10.7"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  ticket: svg('<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'),
  out: svg('<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>'),
};

load();
