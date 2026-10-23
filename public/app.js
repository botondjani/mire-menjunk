// Hova menjünk? – kliens. Nincs build lépés: sima ES modul.
// Nézetek: felfedezés (vízszintes szekciók), lista (szűrt, napokra bontva), keresés, mentett, profil.
// Minden nézetnek van betöltő, üres és hibaállapota; a visszafordítható lépések (mentés) visszavonhatók.

import * as auth from './auth.js?v=17';

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
const DAYS = [['ma', 'Ma'], ['holnap', 'Holnap'], ['hetvege', 'Hétvégén'], ['het', 'Ezen a héten']];
// Rövid címkék a lista kompakt idősávjához, hogy egy sorba férjenek.
const DAY_SHORT = { ma: 'Ma', holnap: 'Holnap', hetvege: 'Hétvége', het: 'Héten' };
const DEFAULT_DAY = 'het';
const PICK_DAYS = 30; // a dátumválasztóval ennyi napra előre lehet konkrét napot választani
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
  if (isLong(e) && e.start <= today) return e.end === today ? 'Utolsó nap' : `${short(e.end).replace(/\./g, '')}-ig`;
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
    case 'jovohet': return [addDays(sunday, 1), addDays(sunday, 7)];
    default: return /^\d{4}-\d{2}-\d{2}$/.test(key) ? [key, key] : [today, sunday];
  }
}

/** Elfogadott időszak: a gyorsgombok, a "jövő hét", vagy egy konkrét nap a következő 30 napból. */
function validDay(k) {
  if (!k) return null;
  if (DAYS.some(([d]) => d === k) || k === 'jovohet') return k;
  return /^\d{4}-\d{2}-\d{2}$/.test(k) && k >= today && k <= addDays(today, PICK_DAYS) ? k : null;
}

const isLong = (e) => e.end && daysBetween(e.start, e.end) > 3;
const overlaps = (e, [from, to]) => e.start <= to && (e.end || e.start) >= from;
const byTime = (a, b) => a.start.localeCompare(b.start) || (a.time || '99').localeCompare(b.time || '99');

// ---------- állapot ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privát mód: a mentés csak erre a látogatásra él */ } },
};
const VIEWS = { lista: 'list', kereses: 'search', mentett: 'saved', profil: 'profile' };
const params = new URLSearchParams(location.search);
const state = {
  view: VIEWS[params.get('v')] || 'home',
  day: validDay(params.get('nap')) || DEFAULT_DAY,
  tab: { search: 'search', saved: 'saved', profile: 'profile' }[VIEWS[params.get('v')]] || 'home', // melyik alsó fül aktív
  group: FILTERS.some((g) => g.key === params.get('kat')) ? params.get('kat') : '',
  free: params.get('ingyen') === '1',      // csak ingyenes programok
  map: params.get('terkep') === '1',       // térképnézet a listában
  q: params.get('q') || '',
  saved: new Set(store.get('saved', [])),
  interests: store.get('interests', []),   // érdeklődési körök (FILTERS kulcsai); belépve a profilból szinkronizálva
  user: null,                              // belépett felhasználó (Supabase), vagy null
  profile: null,
  authBusy: false,
  confirmDelete: false,
  follows: new Set(),                      // követett helyszínek (belépve)
  myPlans: new Map(),                      // saját „Ki jön?” meghívóim programonként
  myName: store.get('myName', ''),         // a meghívókon megjelenő név
  plan: null,                              // a megnyitott meghívó (ha ?p= linkről jöttünk)
  admin: false,
  push: 'off',                             // értesítések ezen az eszközön: on | off | denied | unsupported
  pushBusy: false,
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
  // Google-ről visszatérve előbb a belépést fejezzük be, különben a címsor takarítása elvinné a ?code=-ot.
  if (auth.hasPendingSession()) await initAuth();
  else loadMyPlans();
  render();
  route();
  updateBanner();
  authError();
}

// ---------- fiók ----------
async function initAuth() {
  try {
    state.user = await auth.currentUser();
    if (state.user) await afterSignIn();
  } catch {
    // Kilépett felhasználónak nem szólunk: neki a belépés gombnál derül ki, ha nem elérhető.
    if (auth.hasPendingSession()) toast('A fiókodhoz most nem tudtunk kapcsolódni – a mentéseid a telefonodon megvannak.');
    initAuth.started = false;
    return;
  }
  if (!initAuth.subscribed) {
    initAuth.subscribed = true;
    auth.onAuthChange(async (user) => {
      const changed = (user?.id ?? null) !== (state.user?.id ?? null);
      state.user = user;
      if (!changed) return;
      if (user) await afterSignIn();
      else state.profile = null;
      if (!sheet.open) render();
    });
  }
}

/** Belépés után: a telefonon és a fiókban lévő mentések összefésülése, érdeklődési körök átvétele. */
async function afterSignIn() {
  const user = state.user;
  try {
    const [profile, remote, follows] = await Promise.all([auth.loadProfile(user.id), auth.loadSaved(), auth.loadFollows()]);
    state.profile = profile;
    state.follows = new Set(follows);
    loadMyPlans();
    auth.amAdmin().then((a) => { state.admin = a; if (a && state.view === 'profile' && !sheet.open) render(); }).catch(() => {});
    state.push = !auth.pushSupported() ? 'unsupported' : Notification.permission === 'denied' ? 'denied' : (await auth.pushEnabled()) ? 'on' : 'off';
    const localOnly = [...state.saved].filter((id) => !remote.includes(id));
    await auth.addSaved(user.id, localOnly.map((id) => state.byId.get(id)).filter(Boolean));
    state.saved = new Set([...state.saved, ...remote]);
    store.set('saved', [...state.saved]);
    if (profile?.interests?.length) {
      state.interests = profile.interests;
      store.set('interests', state.interests);
    } else if (state.interests.length) {
      await auth.saveInterests(user.id, state.interests);
    }
  } catch {
    toast('A mentések szinkronja most nem sikerült – később újrapróbáljuk.');
  }
}

/** Ha a Google-belépés hibával tért vissza (pl. megszakítva), azt elmondjuk, nem némán nyeljük el. */
function authError() {
  const p = new URLSearchParams(location.search + location.hash.replace(/^#/, '&'));
  if (!p.get('error')) return;
  toast(p.get('error') === 'access_denied' ? 'A bejelentkezést megszakítottad – semmi sem változott.' : 'A bejelentkezés most nem sikerült. Próbáld újra pár perc múlva.');
}

async function signIn() {
  state.authBusy = true;
  render();
  try {
    await auth.signIn(new URL('?v=profil', ROOT).href);
  } catch {
    state.authBusy = false;
    render();
    toast(navigator.onLine ? 'A Google-bejelentkezés most nem érhető el. Próbáld újra később.' : 'Nincs internetkapcsolat – a belépéshez net kell.');
  }
}

async function signOut() {
  await auth.disablePush().catch(() => {});
  await auth.signOut().catch(() => {});
  state.user = null;
  state.profile = null;
  state.follows = new Set();
  state.push = 'off';
  state.admin = false;
  state.myPlans = new Map();
  loadMyPlans();
  render();
  toast('Kijelentkeztél. A mentéseid ezen a telefonon megmaradnak.');
}

async function deleteAccount() {
  state.authBusy = true;
  render();
  try {
    await auth.disablePush().catch(() => {});
    await auth.deleteAccount();
    state.user = null;
    state.profile = null;
    state.follows = new Set();
    state.push = 'off';
    state.admin = false;
    state.myPlans = new Map();
    state.confirmDelete = false;
    toast('A fiókodat és a hozzá tartozó adatokat töröltük.');
  } catch {
    toast('A fiók törlése most nem sikerült. Próbáld újra, vagy írj nekünk.');
  }
  state.authBusy = false;
  render();
}

async function toggleInterest(key) {
  const set = new Set(state.interests);
  set.has(key) ? set.delete(key) : set.add(key);
  state.interests = FILTERS.map((g) => g.key).filter((k) => set.has(k));
  store.set('interests', state.interests);
  render();
  if (state.user) auth.saveInterests(state.user.id, state.interests).catch(() => toast('Nem sikerült elmenteni a fiókodba – ezen a telefonon megvan.'));
}

function goProfile() {
  closeEvent(false);
  state.view = 'profile';
  state.tab = 'profile';
  render();
  window.scrollTo({ top: 0 });
}

async function toggleFollow(venue) {
  if (!state.user) return toast('A helyek követéséhez lépj be – szólunk, ha új programjuk lesz.', { label: 'Belépés', fn: goProfile });
  const on = !state.follows.has(venue);
  on ? state.follows.add(venue) : state.follows.delete(venue);
  document.querySelectorAll(`[data-follow="${CSS.escape(venue)}"]`).forEach((b) => { b.setAttribute('aria-pressed', on); b.textContent = on ? '✓ Követed' : '+ Követés'; });
  if (state.view === 'profile' && !sheet.open) render();
  try {
    await (on ? auth.follow(state.user.id, venue) : auth.unfollow(state.user.id, venue));
  } catch {
    on ? state.follows.delete(venue) : state.follows.add(venue);
    return toast('Most nem sikerült – próbáld újra.');
  }
  if (!on) return toast(`Már nem követed: ${venue}`);
  auth.track('follow');
  if (state.push === 'on') toast(`Követed: ${venue}. Szólunk, ha új programja lesz.`);
  else toast(`Követed: ${venue}. Kapcsold be az értesítéseket, hogy szóljunk.`, { label: 'Bekapcsolom', fn: enablePush });
}

async function enablePush() {
  if (!state.user) return goProfile();
  state.pushBusy = true;
  if (state.view === 'profile') render();
  try {
    const r = await auth.enablePush(state.user.id);
    state.push = r === 'ok' ? 'on' : r;
    if (r === 'ok') { auth.testPush().catch(() => {}); auth.track('push_on'); }
    else if (r === 'denied') toast('Az értesítések le vannak tiltva – a böngésző beállításaiban engedélyezheted.');
  } catch {
    toast('Az értesítések bekapcsolása most nem sikerült. Próbáld újra.');
  }
  state.pushBusy = false;
  if (state.view === 'profile' && !sheet.open) render();
}

async function disablePush() {
  await auth.disablePush().catch(() => {});
  state.push = 'off';
  render();
  toast('Értesítések kikapcsolva ezen az eszközön.');
}

async function toggleSetting(key) {
  const cur = ({ ...NOTIFY_DEFAULTS, ...state.profile })[key];
  setPref(key, key === 'tonight_mode' ? (cur ? 0 : 1) : !cur);
}

function setPref(key, value) {
  state.profile = { ...state.profile, [key]: value };
  render();
  auth.saveSettings(state.user.id, { [key]: value }).catch(() => toast('Nem sikerült menteni – próbáld újra.'));
}

/** A Google saját gombja a profil oldalon; ha nem tölt be, az átirányításos tartalék gomb látszik. */
function mountSignIn() {
  const el = $('#gsi');
  if (!el || el.childElementCount) return;
  if (!initAuth.subscribed && !initAuth.started) { initAuth.started = true; initAuth(); }
  auth.mountGoogleButton(el, {
    onStart: () => { el.classList.add('busy'); auth.track('signin'); },
    onError: () => { el.classList.remove('busy'); toast('A bejelentkezés most nem sikerült. Próbáld újra pár perc múlva.'); },
  }).then((ok) => { if (!ok) $('#gsiFallback')?.removeAttribute('hidden'); });
}

/** "Neked ajánljuk": a választott érdeklődési körök és a mentett programok helyszínei, kategóriái alapján. */
function recommendations() {
  const savedEvents = state.events.filter((e) => state.saved.has(e.id));
  const venues = new Set(savedEvents.map((e) => e.venue).filter(Boolean));
  const groups = new Set(savedEvents.map((e) => groupOf(e).key));
  if (!state.interests.length && !savedEvents.length) return [];
  const horizon = addDays(today, 14);
  return state.events
    .filter((e) => !isLong(e) && e.start <= horizon && !state.saved.has(e.id))
    .map((e) => {
      let score = 0;
      if (state.interests.some((k) => matchesFilter(e, k))) score += 3;
      if (venues.has(e.venue)) score += 2;
      if (groups.has(groupOf(e).key)) score += 1;
      if (score && e.image) score += 0.5;
      return { e, score };
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score || byTime(a.e, b.e))
    .map((x) => x.e);
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
/** Csak http(s) link mehet ki a forrásadatokból (javascript: és társai nem). */
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
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
    ${safeUrl(e.image) ? `<img src="${esc(e.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
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
    ${e.free ? `<span class="chips"><span class="chip">${esc(chip(e))}</span><span class="chip free">Ingyenes</span></span>` : `<span class="chip">${esc(chip(e))}</span>`}
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
  const when = isLong(e) ? `${short(e.end).replace(/\./g, '')}-ig` : withDate ? [chip(e), e.time].filter(Boolean).join(', ') : e.time;
  const parts = [when, e.venue].filter(Boolean).map(esc);
  if (e.free) parts.push('<span class="free-tag">Ingyenes</span>');
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

/** Kis, álló poszterkártya a másodlagos szekciókhoz – egy sorban 2-3 látszik. */
function mini(e) {
  const saved = state.saved.has(e.id);
  return `<article class="mini">
    <a class="card-link" href="${eventUrl(e)}" data-open="${e.id}" aria-label="${esc(e.title)}"></a>
    ${media(e)}
    ${e.free ? `<span class="chips"><span class="chip">${esc(chip(e))}</span><span class="chip free">Ingyenes</span></span>` : `<span class="chip">${esc(chip(e))}</span>`}
    <button class="fab save" data-save="${e.id}" aria-pressed="${saved}" aria-label="${saved ? 'Mentve – koppints az eltávolításhoz' : 'Mentés'}">${icons.heart}</button>
    <h3>${esc(e.title)}</h3>
    <p>${esc([isLong(e) ? null : e.time, e.venue].filter(Boolean).join(' · ') || groupOf(e).label)}</p>
  </article>`;
}

function rail(title, events, link, { size = 'big', total = events.length, map = null } = {}) {
  if (!events.length) return '';
  return `<section class="rail rail-${size}">
    <header class="rail-head">
      <h2>${title}</h2>
      ${map ? `<a class="rail-map" href="${map}" data-nav="${map}" aria-label="Térképen">${icons.map}</a>` : ''}
      ${link ? `<a href="${link}" data-nav="${link}">Összes <span aria-hidden="true">${total}</span></a>` : ''}
    </header>
    <div class="rail-track">${events.map(size === 'big' ? card : mini).join('')}</div>
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
  if (!state.events.length) {
    return stateBox({ icon: '🗓️', title: 'Most épp nincs program a listában', text: 'A lista naponta háromszor frissül. Nézz vissza később.' }) + footer();
  }
  const dated = state.events.filter((e) => !isLong(e));
  const on = (key) => dated.filter((e) => overlaps(e, range(key)));
  const soon = dated.filter((e) => e.start <= addDays(today, 21));
  const evening = on('ma').filter((e) => !e.time || e.time >= '17:00');
  const tonight = evening.length >= 3 ? evening : on('ma');

  // Egy program csak egyszer szerepeljen a kezdőlapon; a kis kártyáknál a képesek előre.
  const shown = new Set();
  const pick = (list, n, preferImages = true) => {
    const fresh = list.filter((e) => !shown.has(e.id));
    const ordered = preferImages ? [...fresh.filter((e) => e.image), ...fresh.filter((e) => !e.image)] : fresh;
    const out = ordered.slice(0, n);
    out.forEach((e) => shown.add(e.id));
    return out;
  };

  const quick = [
    ['ma', 'Ma este', tonight.length],
    ['holnap', 'Holnap', on('holnap').length],
    ['hetvege', 'Hétvégén', on('hetvege').length],
    ['het', 'Héten', on('het').length],
  ].filter(([, , n]) => n);

  let html = `${expiredNotice()}<header class="hello">
    <p>${esc(cap(WEEKDAYS[weekday(today)]))}, ${esc(short(today))}</p>
    <h1>Mi legyen ma?</h1>
  </header>
  <nav class="quick" aria-label="Időszak">${quick.map(([k, label, n]) => `<a href="${listHref({ nap: k })}" data-nav="${listHref({ nap: k })}"><b>${label}</b><span>${n} program</span></a>`).join('')}</nav>`;

  html += rail('Ma este', pick(tonight, 10, false), listHref({ nap: 'ma' }), { total: tonight.length, map: listHref({ nap: 'ma', terkep: '1' }) })
    || '<p class="hint">Mára már nincs több programunk – nézd meg a holnapiakat.</p>';

  const recs = recommendations();
  if (recs.length) html += rail('✨ Neked ajánljuk', pick(recs, 12), null, { size: 'mini' });
  else if (!state.interests.length) html += `<button class="nudge" data-tab="profile"><span>✨</span><b>Mi érdekel?</b> Jelöld be a kedvenc műfajaidat, és ajánlunk neked programokat.</button>`;

  html += `<nav class="shortcuts" aria-label="Kategóriák">${[...FILTERS, { key: '', label: 'Minden', emoji: '🗂️', hue: 230 }].map((g) => `<a href="${listHref(g.key ? { kat: g.key } : {})}" data-nav="${listHref(g.key ? { kat: g.key } : {})}" style="--hue:${g.hue}"><span>${g.emoji}</span>${esc(g.label.replace(' & ', ' &\u00a0'))}</a>`).join('')}</nav>`;

  const youth = soon.filter((e) => e.youth);
  html += rail(`${YOUTH.emoji} Fiataloknak`, pick(youth, 12), listHref({ kat: YOUTH.key }), { size: 'mini', total: youth.length });
  const weekend = on('hetvege');
  html += rail('Hétvégén', pick(weekend, 12), listHref({ nap: 'hetvege' }), { size: 'mini', total: weekend.length });
  const free = soon.filter((e) => e.free);
  if (free.length >= 3) html += rail('🆓 Ingyen is jó', pick(free, 12), listHref({ nap: 'het', ingyen: '1' }), { size: 'mini', total: free.length });
  const ongoing = state.events.filter((e) => isLong(e) && e.start <= addDays(today, 7)).sort((a, b) => a.end.localeCompare(b.end));
  html += rail('Most is látogatható', pick(ongoing, 12), listHref({ nap: 'ma', kat: 'kiallitas' }), { size: 'mini', total: ongoing.length });
  const nextWeek = on('jovohet');
  html += rail('Jövő héten', pick(nextWeek, 12), listHref({ nap: 'jovohet' }), { size: 'mini', total: nextWeek.length });
  return html + footer();
}

function filteredList() {
  const r = range(state.day);
  return state.events.filter((e) => overlaps(e, r) && matchesFilter(e, state.group) && (!state.free || e.free));
}

function listBody(items) {
  if (!items.length) {
    const actions = [
      state.day !== 'het' ? '<button class="btn primary" data-day="het">Nézd meg az egész hetet</button>' : '<button class="btn primary" data-day="jovohet">Jövő heti programok</button>',
      state.group ? '<button class="btn" data-group="">Minden kategória</button>' : '',
      state.free ? '<button class="btn" data-free>Fizetősök is</button>' : '',
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
        <span>${g ? `${g.emoji} ${esc(g.label)}` : 'Minden program'}</span><small class="head-count">${items.length}</small>${icons.down}
      </button>
      <span class="head-tools">
        <button class="free-chip" data-free aria-pressed="${state.free}">Ingyenes</button>
        <button class="icon-btn map-toggle" data-map aria-pressed="${state.map}" aria-label="${state.map ? 'Lista nézet' : 'Térkép nézet'}">${state.map ? icons.list : icons.map}</button>
      </span>
    </header>
    <nav class="seg compact" aria-label="Időszak">
      ${DAYS.map(([k]) => `<button data-day="${k}" aria-pressed="${state.day === k}">${DAY_SHORT[k]}</button>`).join('')}
      ${datePicker()}
    </nav>
    ${state.map ? mapBody(items) : `${listBody(items)}${footer()}`}`;
}

// ---------- térkép ----------
const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min';
let leafletPromise;
function loadLeaflet() {
  leafletPromise ??= new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${LEAFLET}.css`;
    document.head.append(css);
    const js = document.createElement('script');
    js.src = `${LEAFLET}.js`;
    js.onload = () => resolve(window.L);
    js.onerror = () => { leafletPromise = null; reject(new Error('leaflet')); };
    document.head.append(js);
  });
  return leafletPromise;
}

function mapBody(items) {
  const missing = items.filter((e) => !e.geo).length;
  return `<div class="map-wrap"><div id="map" class="map" role="region" aria-label="Programok térképen"></div>
      <button class="locate" data-locate>${icons.locate}<span>Közelemben</span></button></div>
    ${missing ? `<p class="hint">${missing} programnak nincs pontos helye a térképen – <button class="link" data-map>lista nézet</button></p>` : ''}
    <div id="venuePanel" class="venue-panel"><p class="muted">Koppints egy helyszínre a térképen, és megmutatjuk, mi van ott.</p></div>`;
}

let mapState = null; // { map, L, user, venues }
const km = (a, b) => {
  const r = Math.PI / 180;
  const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r);
  const y = (b[0] - a[0]) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};
const kmLabel = (d) => (d < 1 ? `${Math.round(d * 1000 / 50) * 50} m` : `${d.toFixed(1).replace('.', ',')} km`);

let mapRun = 0;
async function initMap(items) {
  const el = $('#map');
  if (!el) return;
  const run = ++mapRun; // gyors szűrőváltásnál csak a legutolsó rajzol
  let L;
  try { L = await loadLeaflet(); } catch {
    el.innerHTML = '<p class="state">A térkép most nem tölthető be. <button class="link" data-map>Lista nézet</button></p>';
    return;
  }
  if (!el.isConnected || run !== mapRun) return;
  mapState?.map?.remove();
  const map = L.map(el, { zoomControl: false, attributionControl: true }).setView([47.4979, 19.0602], 12);
  // OpenStreetMap-csempék; sötét módban CSS-szűrő sötétíti őket (styles.css: .map.dark).
  el.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const venues = new Map();
  for (const e of items) {
    if (!e.geo) continue;
    const key = e.venue;
    if (!venues.has(key)) venues.set(key, { name: key, geo: e.geo, events: [] });
    venues.get(key).events.push(e);
  }
  const markers = [];
  for (const v of venues.values()) {
    const icon = L.divIcon({ className: 'pin-wrap', html: `<span class="pin"><b>${v.events.length}</b></span>`, iconSize: [36, 36], iconAnchor: [18, 18] });
    const m = L.marker(v.geo, { icon, title: v.name, keyboard: true }).addTo(map);
    m.on('click', () => showVenue(v.name));
    markers.push(m);
  }
  if (markers.length > 1) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15), { maxZoom: 14, animate: false });
  else if (markers.length === 1) map.setView(markers[0].getLatLng(), 14, { animate: false });
  mapState = { map, L, venues, user: mapState?.user || null };
  if (mapState.user) placeUser();
  auth.track('map');
}

function showVenue(name) {
  const v = mapState?.venues.get(name);
  const panel = $('#venuePanel');
  if (!v || !panel) return;
  const dist = mapState.user ? ` · ${kmLabel(km(mapState.user, v.geo))}` : '';
  const route = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${v.name}, Budapest`)}&travelmode=transit`;
  panel.innerHTML = `<header class="venue-head"><div><h2>${esc(v.name)}</h2><small>${v.events.length} program${dist}</small></div>
      <a class="pill" href="${route}" target="_blank" rel="noopener">Útvonal</a>
      <button class="pill" data-follow="${esc(v.name)}" aria-pressed="${state.follows.has(v.name)}">${state.follows.has(v.name) ? '✓ Követed' : '+ Követés'}</button></header>
    <div class="rows">${v.events.slice(0, 30).map((e) => row(e, { withDate: true })).join('')}</div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function placeUser() {
  const { map, L, user } = mapState;
  mapState.userMarker?.remove();
  mapState.userMarker = L.marker(user, { icon: L.divIcon({ className: 'me-wrap', html: '<span class="me-dot"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false }).addTo(map);
}

function locate() {
  if (!navigator.geolocation) return toast('A böngésződ nem tudja megmondani, hol vagy.');
  const btn = $('[data-locate]');
  btn?.classList.add('busy');
  navigator.geolocation.getCurrentPosition((pos) => {
    btn?.classList.remove('busy');
    if (!mapState) return;
    mapState.user = [pos.coords.latitude, pos.coords.longitude];
    placeUser();
    // A legközelebbi helyszín kártyája rögtön látszik.
    const nearest = [...mapState.venues.values()].sort((a, b) => km(mapState.user, a.geo) - km(mapState.user, b.geo))[0];
    const far = !nearest || km(mapState.user, nearest.geo) > 30;
    if (far) mapState.map.setView([47.4979, 19.0602], 12);
    else mapState.map.setView(mapState.user, 14);
    if (nearest && !far) showVenue(nearest.name);
    if (far) toast('Úgy tűnik, most nem Budapesten vagy – a belvárost mutatjuk.');
    auth.track('near');
  }, () => {
    btn?.classList.remove('busy');
    toast('Nem kaptunk helyadatot – engedélyezd a helymeghatározást a böngészőben.');
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

/** Naptár gomb: a natív dátumválasztó nyílik, a következő 30 napból lehet választani. */
function datePicker() {
  const custom = !DAYS.some(([k]) => k === state.day);
  const label = state.day === 'jovohet' ? 'Jövő hét' : custom ? short(state.day).replace(/\.$/, '') : '';
  return `<label class="date-btn" aria-pressed="${custom}" title="Válassz napot">
    ${icons.calendar}${label ? `<span>${esc(label)}</span>` : ''}
    <input type="date" id="pickDate" min="${today}" max="${addDays(today, PICK_DAYS)}" value="${/^\d/.test(state.day) ? state.day : ''}" aria-label="Válassz napot a következő ${PICK_DAYS} napból">
  </label>`;
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
  return `<p class="count">${hits.length} találat</p><div class="rows">${hits.slice(0, state.limit).map((e) => row(e, { withDate: true })).join('')}</div>${moreButton(hits.length)}`;
}

function moreButton(total) {
  return total > state.limit ? `<button class="btn more" data-more>Még ${Math.min(PAGE, total - state.limit)} program <small>(${state.limit} / ${total})</small></button>` : '';
}

/** Keresés alapnézet: kategóriák, alattuk a közelgő programok időrendben, lapozható listában. */
function searchIdle() {
  const counts = Object.fromEntries(FILTERS.map((g) => [g.key, state.events.filter((e) => matchesFilter(e, g.key)).length]));
  const upcoming = state.events.filter((e) => !isLong(e));
  return `<h2 class="day">Kategóriák</h2>
    <div class="tiles">${FILTERS.map((g) => `<a class="tile" href="${listHref({ kat: g.key })}" data-nav="${listHref({ kat: g.key })}" style="--hue:${g.hue}">
      <span class="tile-emoji">${g.emoji}</span><b>${g.label}</b><small>${counts[g.key]} program</small></a>`).join('')}</div>
    <h2 class="day">Közelgő programok <small>${upcoming.length}</small></h2>
    <div class="rows">${upcoming.slice(0, state.limit).map((e) => row(e, { withDate: true })).join('')}</div>
    ${moreButton(upcoming.length)}`;
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

function profileView() {
  const u = state.user;
  const meta = u?.user_metadata || {};
  const name = state.profile?.display_name || meta.full_name || meta.name || u?.email;
  const avatar = state.profile?.avatar_url || meta.avatar_url;
  const chips = FILTERS.map((g) => `<button data-interest="${g.key}" aria-pressed="${state.interests.includes(g.key)}">${g.emoji} ${esc(g.label)}</button>`).join('');
  const interests = `<section class="panel">
      <h2>Mi érdekel?</h2>
      <p class="muted">Ezek alapján állítjuk össze a „Neked ajánljuk” sort a kezdőlapon.</p>
      <div class="interest-chips">${chips}</div>
    </section>`;
  if (!u) {
    return `<header class="page-head"><div><h1>Profil</h1></div></header>
      <section class="login-card">
        <h2>Lépj be, és mindenhol veled lesznek a mentéseid</h2>
        <ul class="perks">
          <li><span>♥</span>A mentett programjaid szinkronban a telefonodon és a gépeden</li>
          <li><span>✨</span>Ajánlások a kedvenc műfajaid és helyeid alapján</li>
          <li><span>🔔</span>Emlékeztető a program előtt, és szólunk, ha a kedvenc helyeiden új program van</li>
        </ul>
        <div id="gsi" class="gsi" aria-label="Belépés Google-fiókkal"></div>
        <button id="gsiFallback" class="btn google" data-signin hidden ${state.authBusy ? 'disabled' : ''}>${icons.google}${state.authBusy ? 'Átirányítás a Google-höz…' : 'Belépés Google-fiókkal'}</button>
        <p class="fineprint">Csak a neved, az e-mail-címed és a profilképed látjuk. Bármikor törölheted a fiókodat. <a href="adatvedelem.html">Adatvédelem</a></p>
      </section>
      ${interests}`;
  }
  const savedCount = state.events.filter((e) => state.saved.has(e.id)).length;
  return `<header class="page-head"><div><h1>Profil</h1></div></header>
    <section class="me">
      ${safeUrl(avatar) ? `<img src="${esc(avatar)}" alt="" referrerpolicy="no-referrer">` : `<span class="me-initial">${esc((name || '?')[0].toUpperCase())}</span>`}
      <div><b>${esc(name)}</b><small>${esc(u.email || '')}</small></div>
    </section>
    <p class="muted sync-note">♥ ${savedCount} közelgő mentett program, szinkronban minden eszközödön.</p>
    ${notifyPanel()}
    ${followsPanel()}
    ${interests}
    <section class="panel account">
      <button class="btn" data-signout>Kijelentkezés</button>
      ${state.confirmDelete
        ? `<div class="danger-confirm"><p>Biztosan törlöd a fiókodat? A mentéseid a fiókodból végleg törlődnek (ezen a telefonon megmaradnak).</p>
            <div class="state-actions"><button class="btn" data-delete-cancel>Mégse</button><button class="btn danger" data-delete-confirm ${state.authBusy ? 'disabled' : ''}>${state.authBusy ? 'Törlés…' : 'Igen, törlöm'}</button></div></div>`
        : '<button class="link danger-link" data-delete>Fiókom törlése</button>'}
      <p class="fineprint">${state.admin ? '<a href="statisztika.html">📊 Statisztika</a> · ' : ''}<a href="adatvedelem.html">Adatvédelmi tájékoztató</a></p>
    </section>`;
}

const NOTIFY_DEFAULTS = { notify_reminders: true, notify_follows: true, notify_weekly: true, remind_before: 120, digest_hour: 10, tonight_mode: 1 };

/** Mintaprogram az értesítés-előnézethez: lehetőleg a saját mentettjeiből, különben a ma esti kínálatból. */
function sampleEvent() {
  const timed = (e) => e.time && e.venue;
  return state.events.find((e) => state.saved.has(e.id) && timed(e) && (e.end || e.start) >= today)
    || state.events.find((e) => timed(e) && e.start === today)
    || state.events.find(timed) || state.events[0];
}

function notifyPanel() {
  const p = { ...NOTIFY_DEFAULTS, ...state.profile };
  const choices = (key, opts) => `<div class="choices" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${p[key] === v}" data-choice="${key}:${v}">${l}</button>`).join('')}</div>`;
  const pref = (key, icon, label, sub, extra = '') => `<div class="pref${p[key] ? '' : ' off'}">
      <label class="switch"><span class="pref-icon" aria-hidden="true">${icon}</span><span>${label}<small>${sub}</small></span>
        <input type="checkbox" data-setting="${key}" ${p[key] ? 'checked' : ''}><i aria-hidden="true"></i></label>
      ${p[key] && extra ? extra : ''}
    </div>`;
  const prefs = `<div class="prefs">
      ${pref('notify_reminders', '⏰', 'Emlékeztető', 'Mielőtt kezdődik, amit elmentettél', choices('remind_before', [[60, '1 órával'], [120, '2 órával'], [180, '3 órával'], [0, 'Aznap reggel']]))}
      ${pref('notify_weekly', '🎉', 'Hétvégi tippek', 'Csütörtökönként 3 program, ami neked szól')}
      ${pref('tonight_mode', '🌙', 'Esti tippek', 'Délután 4-kor 3 program az estére', choices('tonight_mode', [[1, 'Pénteken és szombaton'], [2, 'Minden nap']]))}
      ${pref('notify_follows', '📍', 'Új program a kedvenc helyeiden', 'Naponta legfeljebb egyszer')}
      ${p.notify_weekly || p.notify_follows ? `<div class="pref-time"><span>Mikor jöjjenek a tippek?</span>${choices('digest_hour', [[10, '☀️ Délelőtt'], [17, '🌆 Délután']])}</div>` : ''}
    </div>`;
  if (state.push === 'on') {
    return `<section class="panel">
      <div class="panel-head"><h2>Értesítések</h2><span class="on-badge">Bekapcsolva</span></div>
      ${prefs}
      <p class="muted small"><button class="link" data-push-test>Próbaértesítés</button> · <button class="link" data-push-off>Kikapcsolás ezen az eszközön</button></p>
    </section>`;
  }
  const e = sampleEvent();
  const tips = recommendations().slice(0, 3).map((x) => x.title).join(' · ') || 'Koncert, kiállítás és egy jó buli a hétvégére';
  const icon = '<img src="icons/icon-192.png" alt="">';
  let cta;
  if (state.push === 'denied') cta = '<p class="notice-line">Az értesítések le vannak tiltva ennél az oldalnál – a böngésző (vagy a telefon) beállításaiban engedélyezheted.</p>';
  else if (state.push === 'unsupported') cta = /iP(hone|ad)/.test(navigator.userAgent)
    ? '<p class="notice-line">iPhone-on: Megosztás → <b>Főképernyőhöz adás</b>, majd onnan nyisd meg az appot, és itt bekapcsolhatod.</p>'
    : '<p class="notice-line">Ez a böngésző nem támogatja az értesítéseket.</p>';
  else cta = `<button class="btn primary wide bell" data-push-on ${state.pushBusy ? 'disabled' : ''}>${state.pushBusy ? 'Egy pillanat…' : '🔔 Kérem az értesítéseket'}</button>`;
  return `<section class="panel notify-hero">
      <div class="np-stack" aria-hidden="true">
        <div class="np back">${icon}<div><small>Hova menjünk? · csüt.</small><b>🎉 Hétvégi tippek neked</b><span>${esc(tips)}</span></div></div>
        <div class="np">${icon}<div><small>Hova menjünk? · most</small><b>⏰ ${esc(e?.title || 'A mentett programod')}</b><span>${p.remind_before ? `${p.remind_before / 60} óra múlva kezdődik` : 'Ma'}${e?.time ? ` · ${e.time}` : ''}${e?.venue ? ` · ${esc(e.venue)}` : ''}</span></div></div>
      </div>
      <h2>Ne maradj le semmiről</h2>
      <p class="muted">Szólunk, mielőtt kezdődik, amit elmentettél, és csütörtökön hozzuk a hétvégi tippeket. Te döntöd el, mit és mikor – spam nélkül.</p>
      ${cta}
      <h3 class="prefs-title">Szabd személyre</h3>
      ${prefs}
    </section>`;
}

function followsPanel() {
  const venues = [...state.follows].sort((a, b) => a.localeCompare(b, 'hu'));
  return `<section class="panel">
      <h2>Követett helyek</h2>
      ${venues.length
    ? `<div class="interest-chips">${venues.map((v) => `<button class="followed" data-follow="${esc(v)}" aria-label="${esc(v)} – követés leállítása">${esc(v)} <span aria-hidden="true">×</span></button>`).join('')}</div>`
    : '<p class="muted">Egy program részleteinél a helyszín mellett nyomd meg a „+ Követés” gombot, és szólunk, ha új programja lesz.</p>'}
    </section>`;
}

function footer() {
  const upd = state.updated ? new Date(state.updated).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const sources = [...new Set(state.events.flatMap((e) => e.links.map((l) => l.name)))].join(', ');
  return `<footer class="foot">${state.events.length} program · frissítve: ${upd}<br>Források: ${esc(sources)}.<br>A részletekért és jegyekért mindig a forrásoldal az irányadó.</footer>`;
}

function render() {
  // A régi térképet a DOM cseréje előtt bontjuk le, különben a futó animációi a már eltűnt elemekre hivatkoznak.
  if (mapState?.map) { mapState.map.remove(); mapState = { user: mapState.user }; }
  view.innerHTML = { home: homeView, list: listView, search: searchView, saved: savedView, profile: profileView }[state.view]();
  if (state.view === 'profile' && !state.user) mountSignIn();
  trackView();
  if (state.view === 'list' && state.map) initMap(filteredList());
  document.querySelectorAll('.tabbar [data-tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === state.tab ? 'page' : 'false'));
  updateBadge();
  syncQuery();
}

/** Nézetváltásonként egy névtelen „view” esemény; az elsőnél azt is, honnan jött (más oldal / megosztott link). */
let trackedView = null;
function trackView() {
  if (trackedView === state.view) return;
  let r;
  if (trackedView === null) {
    try { r = document.referrer && new URL(document.referrer).host !== location.host ? new URL(document.referrer).host.replace(/^www\./, '') : undefined; } catch { /* nincs */ }
    if (!r && location.pathname.includes('/e/')) r = 'megosztott link';
  }
  trackedView = state.view;
  auth.track('view', { v: state.view, r });
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
    if (state.day !== DEFAULT_DAY) p.set('nap', state.day);
    if (state.group) p.set('kat', state.group);
    if (state.free) p.set('ingyen', '1');
    if (state.map) p.set('terkep', '1');
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
  state.day = validDay(p.get('nap')) || DEFAULT_DAY;
  state.group = p.get('kat') || '';
  state.free = p.get('ingyen') === '1';
  state.map = p.get('terkep') === '1';
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

function openEvent(e, push = true, { shared = false, plan = null } = {}) {
  if (!e) return;
  if (push) history.pushState({ id: e.id }, '', eventUrl(e));
  auth.track('open', { e: e.id, r: shared ? 'megosztott link' : undefined });
  const pid = newPlanId();
  state.plan = null;
  const saved = state.saved.has(e.id);
  const g = groupOf(e);
  const soon = startsIn(e);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${e.venue || e.title}, Budapest`)}&travelmode=transit`;
  sheet.innerHTML = `<article class="detail">
    <div class="grabber" aria-hidden="true"></div>
    <button class="fab close" data-close aria-label="Bezárás">${icons.close}</button>
    ${media(e, 'hero')}
    <div class="detail-body">
      ${shared && !plan ? '<p class="shared-note">🔗 Valaki megosztotta veled ezt a programot</p>' : ''}
      <span class="kicker">${g.emoji} ${esc(e.category)}${e.youth ? ' · 🎓 Fiataloknak' : ''}</span>
      <h2 id="sheetTitle" tabindex="-1" autofocus>${esc(e.title)}</h2>
      <ul class="facts">
        <li>${icons.clock}<span>${esc(dateLabel(e))}${soon ? ` <em class="soon">· ${soon}</em>` : ''}</span></li>
        ${e.free || e.price ? `<li>${icons.ticket}<span>${e.free ? '<b class="free-tag">Ingyenes</b>' : `Jegy ${e.price.toLocaleString('hu-HU')} Ft-tól`}</span></li>` : ''}
        ${e.venue ? `<li>${icons.pin}<span>${esc(e.venue)}</span><button class="pill" data-follow="${esc(e.venue)}" aria-pressed="${state.follows.has(e.venue)}">${state.follows.has(e.venue) ? '✓ Követed' : '+ Követés'}</button></li>` : ''}
      </ul>
      ${plan ? '<section class="rsvp loading" id="rsvp" aria-busy="true"><div class="rsvp-head"><span class="rsvp-emoji">🙋</span><div><b>Meghívó betöltése…</b></div></div></section>' : ''}
      <div class="actions">
        <button class="btn primary" data-share="${e.id}" data-pid="${pid}">${icons.share} Ki jön?</button>
        <button class="btn" data-save="${e.id}" aria-pressed="${saved}">${icons.heart} ${saved ? 'Mentve' : 'Mentés'}</button>
      </div>
      ${plan ? '' : ownerCard(e)}
      ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ''}
      <div class="links">
        ${e.links.filter((l) => safeUrl(l.url)).map((l) => `<a class="row" href="${esc(l.url)}" target="_blank" rel="noopener">${icons.ticket}<span>Részletek, jegyek<small>${esc(l.name)} oldalán</small></span>${icons.out}</a>`).join('')}
        <a class="row" href="${directions}" target="_blank" rel="noopener">${icons.pin}<span>Útvonal tömegközlekedéssel<small>Google Térkép</small></span>${icons.out}</a>
      </div>
      <div class="share-row" aria-label="Meghívó küldése" data-invite="${e.id}" data-pid="${pid}">
        <a href="https://wa.me/?text=${encodeURIComponent(shareText(e, pid))}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl(e, pid))}" target="_blank" rel="noopener">Facebook</a>
        <a href="viber://forward?text=${encodeURIComponent(shareText(e, pid))}">Viber</a>
        <button data-copy="${e.id}">Link másolása</button>
      </div>
      ${shared ? '<button class="btn wide" data-close>Több program ma estére →</button>' : ''}
      <p class="fineprint">Az időpont és az ár változhat – indulás előtt nézd meg a forrásoldalon.</p>
    </div>
  </article>`;
  if (!sheet.open) sheet.showModal();
  else $('#sheetTitle').focus({ preventScroll: true });
  sheet.scrollTop = 0;
  if (plan) loadGuestPlan(plan);
  else if (state.myPlans.has(e.id)) loadMyPlans();
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
  const plan = new URLSearchParams(location.search).get('p');
  if (e && (e.end || e.start) >= today) return openEvent(e, false, { shared: !history.state, plan: PLAN_ID.test(plan || '') ? plan : null });
  // Lejárt vagy eltűnt program: a kezdőlapon elmagyarázzuk, és hasonlókat ajánlunk.
  state.expired = id;
  state.view = 'home';
  state.tab = 'home';
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
const shareText = (e, pid) => `${shareLine(e)} Jelezz itt 👉 ${inviteUrl(e, pid)}`;

// ---------- „Ki jön?” meghívók ----------
// Minden megosztás egy kis meghívó: a link végén ?p=<azonosító>, a barát egy koppintással jelezhet.
const PLAN_ID = /^[A-Za-z0-9]{8,16}$/;
function newPlanId() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return [...crypto.getRandomValues(new Uint8Array(10))].map((b) => abc[b % abc.length]).join('');
}
const inviteUrl = (e, pid) => `${eventUrl(e)}?p=${pid}`;
const displayName = () => (state.profile?.display_name || state.user?.user_metadata?.full_name || state.myName || '').slice(0, 40);
const createdPlans = new Set();

/** A meghívót a háttérben hozzuk létre, hogy a megosztás azonnal (a koppintás közben) induljon. */
function ensurePlan(e, pid) {
  if (createdPlans.has(pid)) return;
  createdPlans.add(pid);
  store.set('hasPlans', true);
  auth.createPlan(pid, e, displayName()).then(() => loadMyPlans()).catch(() => createdPlans.delete(pid));
  auth.track('share', { e: e.id });
}

async function loadMyPlans() {
  if (!store.get('hasPlans', false) && !state.user) return;
  try {
    const plans = await auth.myPlans();
    state.myPlans = new Map();
    for (const p of plans || []) state.myPlans.set(p.event_id, [...(state.myPlans.get(p.event_id) || []), p]);
    const card = $('#rsvp[data-owner]');
    if (card && sheet.open) card.outerHTML = ownerCard(state.byId.get(card.dataset.owner));
  } catch { /* offline: a következő megnyitáskor újra */ }
}

const STATUS = { going: ['👍', 'jön'], maybe: ['🤔', 'talán'], no: ['🙅', 'nem tud'] };
function peopleLine(responses) {
  const going = responses.filter((r) => r.status === 'going');
  const maybe = responses.filter((r) => r.status === 'maybe');
  if (!going.length && !maybe.length) return '';
  const faces = [...going, ...maybe].slice(0, 5).map((r) => `<span class="face${r.status === 'maybe' ? ' maybe' : ''}" title="${esc(r.name)}">${esc(r.name.trim()[0]?.toUpperCase() || '?')}</span>`).join('');
  const others = going.filter((r) => !r.me).map((r) => r.name);
  const list = `${others.slice(0, 3).join(', ')}${others.length > 3 ? ` és még ${others.length - 3}` : ''}`;
  const meGoing = going.some((r) => r.me);
  const goingText = meGoing ? (others.length ? `Te és ${list} jöttök` : 'Te jössz') : others.length ? `${list} jön` : '';
  const text = [goingText, maybe.length ? `${maybe.length} talán` : ''].filter(Boolean).join(' · ');
  return `<div class="people"><div class="faces">${faces}</div><span>${esc(text)}</span></div>`;
}

/** A meghívott barát kártyája: ki hív, ki jön már, és a válaszgombok. */
function guestCard(plan) {
  const me = plan.responses.find((r) => r.me);
  const btn = (st, label) => `<button data-rsvp="${st}" aria-pressed="${me?.status === st}">${label}</button>`;
  return `<section class="rsvp" id="rsvp" data-plan="${esc(plan.id)}">
      <div class="rsvp-head"><span class="rsvp-emoji" aria-hidden="true">🙋</span>
        <div><b>${plan.owner_name ? `${esc(plan.owner_name)} hív` : 'Meghívtak'}</b><small>${me ? (me.status === 'going' ? 'Szuper, szóltunk neki! 🎉' : 'Megkapta a válaszod. Bármikor módosíthatod.') : 'Jössz? Egy koppintás, és tudni fogja.'}</small></div></div>
      ${peopleLine(plan.responses)}
      <div class="rsvp-btns">${btn('going', '👍 Jövök')}${btn('maybe', '🤔 Talán')}${btn('no', 'Most nem')}</div>
      <form class="rsvp-name" hidden><input name="n" maxlength="40" autocomplete="given-name" placeholder="A neved, hogy tudja, ki vagy" required><button class="btn primary">Küldés</button></form>
    </section>`;
}

/** A szervező kártyája: összesítve, ki jelzett vissza a meghívóira. */
function ownerCard(e) {
  const plans = state.myPlans.get(e?.id);
  if (!e || !plans?.length) return `<div id="rsvp" data-owner="${esc(e?.id || '')}" hidden></div>`;
  const responses = plans.flatMap((p) => p.responses.filter((r) => !r.me));
  return `<section class="rsvp mine" id="rsvp" data-owner="${esc(e.id)}">
      <div class="rsvp-head"><span class="rsvp-emoji" aria-hidden="true">🎟️</span>
        <div><b>Ki jön?</b><small>${responses.length ? 'A meghívóidra érkezett válaszok' : 'Még senki nem jelzett vissza – küldd el másnak is!'}</small></div></div>
      ${peopleLine(responses)}
      ${responses.filter((r) => r.status === 'no').length ? `<p class="muted small">${responses.filter((r) => r.status === 'no').map((r) => esc(r.name)).join(', ')} most nem tud jönni.</p>` : ''}
    </section>`;
}

async function loadGuestPlan(pid) {
  try {
    const plan = await auth.getPlan(pid);
    const slot = $('#rsvp');
    if (!slot || !sheet.open) return;
    if (!plan) { slot.outerHTML = '<p class="shared-note">🔗 Valaki megosztotta veled ezt a programot</p>'; return; }
    state.plan = plan;
    slot.outerHTML = plan.is_owner ? ownerCard(state.byId.get(plan.event_id)) : guestCard(plan);
  } catch {
    $('#rsvp')?.remove();
  }
}

async function rsvp(status, name) {
  const plan = state.plan;
  if (!plan) return;
  name = (name || state.myName || state.profile?.display_name || '').trim();
  if (!name) {
    const form = $('.rsvp-name');
    form.hidden = false;
    form.dataset.status = status;
    form.querySelector('input').focus();
    return;
  }
  if (name !== state.myName) { state.myName = name; store.set('myName', name); }
  try {
    state.plan = await auth.respondPlan(plan.id, name, status);
    $('#rsvp').outerHTML = guestCard(state.plan);
    auth.track('rsvp', { e: plan.event_id });
    if (status === 'going' && !state.saved.has(plan.event_id) && state.byId.has(plan.event_id)) toggleSave(plan.event_id, { quiet: true });
    toast(status === 'going' ? 'Szóltunk neki – elmentettük neked is' : 'Elküldtük a válaszod', null, { icon: STATUS[status][0], ms: 1800 });
  } catch {
    toast('Most nem sikerült elküldeni – próbáld újra.');
  }
}

async function share(e, pid = newPlanId()) {
  ensurePlan(e, pid);
  const url = inviteUrl(e, pid);
  if (navigator.share) {
    try { await navigator.share({ title: e.title, text: shareLine(e), url }); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  copy(url);
}

async function copy(url) {
  try {
    await navigator.clipboard.writeText(url);
    toast('Link kimásolva – küldd el a barátaidnak', null, { ms: 1800 });
  } catch {
    showLink(url);
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

function toggleSave(id, { undo = false, quiet = false } = {}) {
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  store.set('saved', [...state.saved]);
  const on = state.saved.has(id);
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', on);
    if (b.classList.contains('btn')) b.innerHTML = `${icons.heart} ${on ? 'Mentve' : 'Mentés'}`;
    else b.setAttribute('aria-label', on ? 'Mentve – koppints az eltávolításhoz' : 'Mentés');
  });
  updateBadge();
  if (state.user) {
    const e = state.byId.get(id);
    (on ? auth.addSaved(state.user.id, e ? [e] : []) : auth.removeSaved(state.user.id, [id]))
      .catch(() => toast('A fiókodba most nem sikerült szinkronizálni – ezen a telefonon megvan.'));
  }
  if (on) celebrate(id);
  auth.track(on ? 'save' : 'unsave', { e: id });
  if (quiet) { if (state.view === 'saved' && !sheet.open) render(); return; }
  if (undo) toast(on ? 'Visszatéve' : 'Visszavonva', null, { ms: 1200 });
  else if (on && state.user && state.push === 'off' && !store.get('pushNudged', false)) {
    store.set('pushNudged', true);
    toast('Mentve. Szóljunk, mielőtt kezdődik?', { label: 'Igen', fn: enablePush }, { icon: icons.heart, ms: 4000 });
  } else if (on && !state.user && !store.get('loginNudged', false)) {
    // Egyszer, finoman: a belépés opcionális, a mentés enélkül is működik.
    store.set('loginNudged', true);
    toast('Mentve ezen a telefonon', { label: 'Minden eszközön', fn: goProfile }, { icon: icons.heart, ms: 3500 });
  } else if (on) toast('Mentve', null, { icon: icons.heart, ms: 1200 });
  else toast('Eltávolítva', { label: 'Visszavonás', fn: () => toggleSave(id, { undo: true }) }, { ms: 2600 });
  if (state.view === 'saved' && !sheet.open) render();
}

/** Mentés-visszajelzés: a szív kipattan, a Mentett fül számlálója megugrik, Androidon egy apró rezgés. */
function celebrate(id) {
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach((b) => {
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
  });
  const badge = $('.tabbar .count');
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
  navigator.vibrate?.(12);
}

let toastTimer;
let toastAction = null;
function toast(msg, action, { icon = '', ms } = {}) {
  const t = $('#toast');
  t.innerHTML = `${icon ? `<i class="toast-icon" aria-hidden="true">${icon}</i>` : ''}<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  toastAction = action?.fn || null;
  t.classList.toggle('has-action', !!action);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); toastAction = null; }, ms ?? (action ? 3200 : 1800));
}
$('#toast').addEventListener('click', (ev) => {
  if (!ev.target.closest('button') || !toastAction) return;
  const fn = toastAction;
  toastAction = null;
  fn();
});

// ---------- események ----------
document.addEventListener('click', (ev) => {
  const inviteLink = ev.target.closest('[data-invite] a');
  if (inviteLink) { const row = inviteLink.closest('[data-invite]'); ensurePlan(state.byId.get(row.dataset.invite), row.dataset.pid); }
  const el = ev.target.closest('[data-map],[data-locate],[data-free],[data-rsvp],[data-choice],[data-follow],[data-push-on],[data-push-off],[data-push-test],[data-signin],[data-signout],[data-delete],[data-delete-cancel],[data-delete-confirm],[data-interest],[data-pick],[data-tab],[data-nav],[data-back],[data-more],[data-day],[data-group],[data-q],[data-clear],[data-open],[data-save],[data-share],[data-copy],[data-close],[data-retry],[data-dismiss],[data-prune]');
  if (!el) return;
  const d = el.dataset;
  const find = (id) => state.byId.get(id);
  if (d.follow) return toggleFollow(d.follow);
  if (d.choice && state.user) { const [k, v] = d.choice.split(':'); return setPref(k, Number(v)); }
  if ('pushOn' in d) return enablePush();
  if ('pushOff' in d) return disablePush();
  if ('pushTest' in d) return auth.testPush().then(() => toast('Elküldtük – pár másodpercen belül megjön.')).catch(() => toast('Most nem sikerült elküldeni.'));
  if ('signin' in d) return signIn();
  if ('signout' in d) return signOut();
  if ('delete' in d) { state.confirmDelete = true; return render(); }
  if ('deleteCancel' in d) { state.confirmDelete = false; return render(); }
  if ('deleteConfirm' in d) return deleteAccount();
  if (d.interest) return toggleInterest(d.interest);
  if (d.tab) {
    ev.preventDefault();
    closeEvent(false);
    if (d.tab === 'profile' && !state.user && !initAuth.started) { initAuth.started = true; initAuth().then(() => state.view === 'profile' && render()); }
    state.view = d.tab;
    state.tab = d.tab;
    state.from = null;
    state.limit = PAGE;
    render();
    window.scrollTo({ top: 0 });
  } else if (d.nav) { ev.preventDefault(); go(d.nav); }
  else if ('back' in d) back();
  else if ('more' in d) { state.limit += PAGE; state.view === 'search' ? ($('#results').innerHTML = searchResults()) : render(); }
  else if ('map' in d) { state.map = !state.map; render(); window.scrollTo({ top: 0 }); }
  else if ('locate' in d) locate();
  else if ('free' in d) { state.free = !state.free; state.limit = PAGE; render(); }
  else if (d.day !== undefined) { state.day = d.day; state.limit = PAGE; render(); window.scrollTo({ top: 0 }); }
  else if ('pick' in d) openPicker();
  else if (d.group !== undefined) { $('#picker')?.close(); state.group = d.group; state.limit = PAGE; render(); window.scrollTo({ top: 0 }); }
  else if (d.q) { state.q = d.q; state.limit = PAGE; render(); }
  else if ('clear' in d) { state.q = ''; render(); $('#q').focus(); }
  else if (d.open) { ev.preventDefault(); openEvent(find(d.open)); }
  else if (d.save) toggleSave(d.save);
  else if (d.share) share(find(d.share), d.pid);
  else if (d.copy) { const row = el.closest('[data-pid]'); const e = find(d.copy); ensurePlan(e, row.dataset.pid); copy(inviteUrl(e, row.dataset.pid)); }
  else if (d.rsvp) rsvp(d.rsvp);
  else if ('close' in d) closeEvent();
  else if ('retry' in d) { view.innerHTML = $('#skeleton').innerHTML; load(); }
  else if ('dismiss' in d) { state.expired = null; render(); }
  else if ('prune' in d) {
    const before = [...state.saved];
    state.saved = new Set(before.filter((id) => state.events.some((e) => e.id === id)));
    store.set('saved', [...state.saved]);
    if (state.user) auth.removeSaved(state.user.id, before.filter((id) => !state.saved.has(id))).catch(() => {});
    render();
    toast('Lejárt programok törölve', { label: 'Visszavonás', fn: () => { state.saved = new Set(before); store.set('saved', before); render(); } });
  }
});

document.addEventListener('change', (ev) => {
  if (ev.target.id !== 'pickDate' || !validDay(ev.target.value)) return;
  state.day = ev.target.value;
  state.limit = PAGE;
  render();
  window.scrollTo({ top: 0 });
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
  if (outcome === 'accepted') { toast('Telepítve – a kezdőképernyőn találod'); auth.track('install'); }
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register(new URL('sw.js', ROOT)).catch(() => {});

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const icons = {
  google: '<svg viewBox="0 0 48 48" aria-hidden="true" class="g"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
  heart: svg('<path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"/>'),
  // a klasszikus "három összekötött pötty" megosztás ikon
  share: svg('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 13.3 7.4 4.4M15.7 6.3 8.3 10.7"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  map: svg('<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2z"/><path d="M9 4.5v13M15 6.5v13"/>'),
  list: svg('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'),
  locate: svg('<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7.5"/>'),
  calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  ticket: svg('<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'),
  out: svg('<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>'),
};

load();

document.addEventListener('change', (ev) => {
  const key = ev.target.dataset?.setting;
  if (key && state.user) toggleSetting(key);
});

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('.rsvp-name');
  if (!form) return;
  ev.preventDefault();
  rsvp(form.dataset.status, form.elements.n.value);
});
