// Mire menjünk? – kliens. Nincs build lépés: sima ES modul.

const ROOT = new URL('./', import.meta.url);
const $ = (s, el = document) => el.querySelector(s);
const list = $('#list');
const sheet = $('#sheet');

const CAT_EMOJI = {
  Koncert: '🎸', Buli: '🪩', Kiállítás: '🖼️', Színház: '🎭', Film: '🎬', Fesztivál: '🎪',
  Gasztró: '🍷', Családi: '🧸', Szabadidő: '🌿', Vásár: '🛍️', Kultúra: '📚',
};
const DAYS = [
  ['ma', 'Ma'], ['holnap', 'Holnap'], ['hetvege', 'Hétvégén'], ['het', 'Ezen a héten'],
  ['mind', 'Mind'], ['mentett', '♥ Mentett'],
];
const WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];

// ---------- dátumok (Budapest időzóna, YYYY-MM-DD stringekkel) ----------
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
const toDate = (iso) => new Date(`${iso}T12:00:00Z`);
const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekday = (iso) => toDate(iso).getUTCDay();
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
const short = (iso) => `${MONTHS[+iso.slice(5, 7) - 1]} ${+iso.slice(8)}.`;

function dayName(iso) {
  if (iso === today) return 'Ma';
  if (iso === addDays(today, 1)) return 'Holnap';
  const w = WEEKDAYS[weekday(iso)];
  return `${w[0].toUpperCase()}${w.slice(1)}, ${short(iso)}`;
}

function dateLabel(e) {
  if (e.end) return e.end === e.start ? short(e.start) : `${short(e.start)} – ${short(e.end)}`;
  return `${dayName(e.start)}${e.time ? `, ${e.time}` : ''}`;
}

function range(key) {
  const sunday = addDays(today, (7 - weekday(today)) % 7);
  switch (key) {
    case 'ma': return [today, today];
    case 'holnap': { const t = addDays(today, 1); return [t, t]; }
    case 'hetvege': { const fri = addDays(sunday, -2); return [fri > today ? fri : today, sunday]; }
    case 'het': return [today, sunday];
    default: return [today, '9999-12-31'];
  }
}

const isLong = (e) => e.end && daysBetween(e.start, e.end) > 3;
const overlaps = (e, [from, to]) => e.start <= to && (e.end || e.start) >= from;

// ---------- állapot ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privát mód */ } },
};
const params = new URLSearchParams(location.search);
const state = {
  day: DAYS.some(([k]) => k === params.get('nap')) ? params.get('nap') : 'mind',
  cat: params.get('kat') || '',
  q: params.get('q') || '',
  saved: new Set(store.get('saved', [])),
  events: [],
  byId: new Map(),
};

// ---------- adat ----------
async function load() {
  try {
    const res = await fetch(new URL('data/events.json', ROOT), { cache: 'no-cache' });
    const data = await res.json();
    state.events = data.events.filter((e) => (e.end || e.start) >= today);
    state.byId = new Map(data.events.map((e) => [e.id, e]));
    state.updated = data.updated;
  } catch {
    list.innerHTML = '<p class="empty">Nem sikerült betölteni a programokat. Ellenőrizd a netet, és próbáld újra.</p>';
    return;
  }
  renderFilters();
  render();
  route();
}

// ---------- megjelenítés ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function filtered() {
  const r = range(state.day);
  const q = norm(state.q.trim());
  return state.events.filter((e) =>
    (state.day === 'mentett' ? state.saved.has(e.id) : overlaps(e, r))
    && (!state.cat || e.category === state.cat)
    && (!q || norm(`${e.title} ${e.venue || ''} ${e.category} ${e.description || ''}`).includes(q)));
}

function renderFilters() {
  $('#days').innerHTML = DAYS.map(([k, label]) =>
    `<button data-day="${k}" aria-pressed="${state.day === k}">${label}</button>`).join('');
  const counts = {};
  for (const e of state.events) counts[e.category] = (counts[e.category] || 0) + 1;
  const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  $('#cats').innerHTML = [`<button data-cat="" aria-pressed="${!state.cat}">Minden</button>`,
    ...cats.map((c) => `<button data-cat="${esc(c)}" aria-pressed="${state.cat === c}">${CAT_EMOJI[c] || ''} ${esc(c)}</button>`)].join('');
  $('#q').value = state.q;
}

function card(e) {
  const saved = state.saved.has(e.id);
  return `<article class="card" data-id="${e.id}">
    <a class="card-link" href="${eventUrl(e)}" data-open="${e.id}" aria-label="${esc(e.title)}"></a>
    <div class="thumb">${e.image
      ? `<img src="${esc(e.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`
      : ''}<span class="thumb-emoji" aria-hidden="true">${CAT_EMOJI[e.category] || '✨'}</span></div>
    <div class="card-body">
      <span class="badge">${esc(e.category)}${e.free ? ' · ingyenes' : ''}</span>
      <h3>${esc(e.title)}</h3>
      <p class="meta">${esc(dateLabel(e))}${e.venue ? ` · ${esc(e.venue)}` : ''}</p>
    </div>
    <div class="card-actions">
      <button class="icon-btn save" data-save="${e.id}" aria-pressed="${saved}" aria-label="${saved ? 'Mentve' : 'Mentés'}">${heart}</button>
      <button class="icon-btn" data-share="${e.id}" aria-label="Megosztás">${shareIcon}</button>
    </div>
  </article>`;
}

function render() {
  const items = filtered();
  syncQuery();
  if (!items.length) {
    list.innerHTML = state.day === 'mentett'
      ? '<p class="empty">Még nincs mentett programod. Nyomj a ♥-re egy kártyán, és itt megtalálod.</p>'
      : '<p class="empty">Erre nincs találat. Próbálj másik napot vagy kategóriát! 🙂</p>';
    return;
  }
  // Napi csoportok; a hosszan futó (kiállítás-szerű) programok külön a végén.
  const [from] = range(state.day);
  const groups = new Map();
  const ongoing = [];
  for (const e of items) {
    if (isLong(e) && state.day !== 'mentett') { ongoing.push(e); continue; }
    const key = e.start < from ? from : e.start;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  let html = '';
  for (const [day, evs] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    html += `<section><h2 class="day">${dayName(day)}</h2><div class="grid">${evs.map(card).join('')}</div></section>`;
  }
  if (ongoing.length) {
    ongoing.sort((a, b) => a.end.localeCompare(b.end));
    html += `<section><h2 class="day">Most is látogatható <small>kiállítások, sorozatok</small></h2><div class="grid">${ongoing.map(card).join('')}</div></section>`;
  }
  const upd = state.updated ? new Date(state.updated).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  html += `<footer class="foot">${items.length} program · frissítve: ${upd}<br>Források: We Love Budapest, Akvárium Klub. A részletekért és jegyekért mindig a forrásoldal az irányadó.</footer>`;
  list.innerHTML = html;
}

function syncQuery() {
  if (location.pathname.includes('/e/')) return;
  const p = new URLSearchParams();
  if (state.day !== 'mind') p.set('nap', state.day);
  if (state.cat) p.set('kat', state.cat);
  if (state.q) p.set('q', state.q);
  const url = new URL(ROOT);
  url.search = p.toString();
  history.replaceState(null, '', url);
}

// ---------- részletek ----------
const eventUrl = (e) => new URL(`e/${e.id}/`, ROOT).href;

function openEvent(e, push = true) {
  if (push) history.pushState({ id: e.id }, '', eventUrl(e));
  const saved = state.saved.has(e.id);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue || e.title}, Budapest`)}`;
  sheet.innerHTML = `<article class="detail">
    <button class="icon-btn close" data-close aria-label="Bezárás">✕</button>
    ${e.image ? `<img class="hero" src="${esc(e.image)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : `<div class="hero hero-empty">${CAT_EMOJI[e.category] || '✨'}</div>`}
    <div class="detail-body">
      <span class="badge">${CAT_EMOJI[e.category] || ''} ${esc(e.category)}</span>
      <h2 id="sheetTitle">${esc(e.title)}</h2>
      <p class="meta big">📅 ${esc(dateLabel(e))}${e.venue ? `<br>📍 ${esc(e.venue)}` : ''}</p>
      ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ''}
      <div class="actions">
        <button class="btn primary" data-share="${e.id}">${shareIcon} Megosztom</button>
        <button class="btn" data-save="${e.id}" aria-pressed="${saved}">${heart} ${saved ? 'Mentve' : 'Mentés'}</button>
      </div>
      <div class="share-row" aria-label="Küldés">
        <a href="https://wa.me/?text=${encodeURIComponent(shareText(e))}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl(e))}" target="_blank" rel="noopener">Facebook</a>
        <a href="viber://forward?text=${encodeURIComponent(shareText(e))}">Viber</a>
        <button data-copy="${e.id}">Link másolása</button>
      </div>
      <div class="links">
        <a class="btn" href="${maps}" target="_blank" rel="noopener">🗺️ Útvonal</a>
        <button class="btn" data-ics="${e.id}">🗓️ Naptárba</button>
        ${e.links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">Részletek, jegyek: ${esc(l.name)} ↗</a>`).join('')}
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
    toast('Ez a program már lejárt vagy eltűnt – nézd meg a többit! 👇');
    history.replaceState(null, '', ROOT);
  }
}

// ---------- megosztás, mentés, naptár ----------
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
    toast('Link kimásolva – küldd el a haveroknak! 🎉');
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
    if (b.classList.contains('btn')) b.innerHTML = `${heart} ${on ? 'Mentve' : 'Mentés'}`;
  });
  toast(on ? 'Elmentve a ♥ Mentett fülre' : 'Eltávolítva a mentettek közül');
  if (state.day === 'mentett') render();
}

function downloadIcs(e) {
  const d = (iso) => iso.replace(/-/g, '');
  const end = addDays(e.end || e.start, 1);
  const start = e.time && !e.end ? `TZID=Europe/Budapest:${d(e.start)}T${e.time.replace(':', '')}00` : `VALUE=DATE:${d(e.start)}`;
  const finish = e.time && !e.end ? `TZID=Europe/Budapest:${d(e.start)}T${String(Math.min(23, +e.time.slice(0, 2) + 2)).padStart(2, '0')}${e.time.slice(3)}00` : `VALUE=DATE:${d(end)}`;
  const icsEsc = (s) => String(s || '').replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mire menjunk//HU', 'BEGIN:VEVENT',
    `UID:${e.id}@mire-menjunk`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART;${start}`, `DTEND;${finish}`, `SUMMARY:${icsEsc(e.title)}`,
    `LOCATION:${icsEsc(e.venue ? `${e.venue}, Budapest` : 'Budapest')}`,
    `DESCRIPTION:${icsEsc(`${e.description || ''}\n${eventUrl(e)}`)}`, `URL:${eventUrl(e)}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: `${e.id}.ics`,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- események ----------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-day],[data-cat],[data-open],[data-save],[data-share],[data-copy],[data-ics],[data-close],[data-home]');
  if (!el) return;
  const { day, cat, open, save, share: sh, copy: cp, ics } = el.dataset;
  const ev_ = (id) => state.byId.get(id);
  if (day !== undefined) { state.day = day; renderFilters(); render(); window.scrollTo({ top: 0 }); }
  else if (cat !== undefined) { state.cat = cat; renderFilters(); render(); }
  else if (open) { ev.preventDefault(); openEvent(ev_(open)); }
  else if (save) toggleSave(save);
  else if (sh) share(ev_(sh));
  else if (cp) copy(ev_(cp));
  else if (ics) downloadIcs(ev_(ics));
  else if ('close' in el.dataset) closeEvent();
  else if ('home' in el.dataset) { ev.preventDefault(); closeEvent(); }
});

sheet.addEventListener('click', (ev) => { if (ev.target === sheet) closeEvent(); });
sheet.addEventListener('cancel', (ev) => { ev.preventDefault(); closeEvent(); });
window.addEventListener('popstate', route);

let qTimer;
$('#q').addEventListener('input', (ev) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { state.q = ev.target.value; render(); }, 150);
});

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
if ('serviceWorker' in navigator) navigator.serviceWorker.register(new URL('sw.js', ROOT));

const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>';

load();
