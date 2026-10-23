// Fiók: opcionális Google-bejelentkezés Supabase-en keresztül, profil (érdeklődési körök) és a mentések szinkronja.
// A Supabase-könyvtár csak akkor töltődik be, ha tényleg kell (belépés, vagy korábban belépett felhasználó).

const SUPABASE_URL = 'https://utybdwjrfnclyasbyuos.supabase.co';
// Nyilvános (publishable) kulcs: a böngészőbe való, a jogosultságot az adatbázis RLS-szabályai adják.
const SUPABASE_KEY = 'sb_publishable_CUbO4ARY9X3Xspe34VOJaw_UT2Us-4r';
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
const SESSION_KEY = 'sb-utybdwjrfnclyasbyuos-auth-token';
// Google-kliens (nyilvános azonosító). A Google saját gombjával a belépő ablak a mi címünket mutatja, nem a Supabase-ét.
const GOOGLE_CLIENT_ID = '593098206890-35ugevo2n62mmhhhfuuubls988b2q7qo.apps.googleusercontent.com';
const GSI = 'https://accounts.google.com/gsi/client';
// Web Push nyilvános (VAPID) kulcs; a privát párja a Supabase Vaultban van.
const VAPID_PUBLIC = 'BOqyeWZck35UunRQfwehmEv9s2Ayshnmr4_ZMUseZGPSPl5wHQOu8uSc15JErnSTga2A3lhAcjxuQvAqUW7LcGg';

let clientPromise;
export function client() {
  clientPromise ??= import(LIB).then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }));
  // Ha a könyvtár nem töltődött be (offline, blokkolva), a következő próbálkozás újra nekifut.
  clientPromise.catch(() => { clientPromise = null; });
  return clientPromise;
}

/** Volt-e már belépve ezen az eszközön (vagy most tér vissza a Google-től)? Ilyenkor érdemes rögtön betölteni. */
export function hasPendingSession() {
  const p = new URLSearchParams(location.search);
  if (p.has('code')) return true;
  try { return !!localStorage.getItem(SESSION_KEY); } catch { return false; }
}

export async function currentUser() {
  const c = await client();
  const { data } = await c.auth.getSession();
  return data.session?.user ?? null;
}

export function onAuthChange(cb) {
  client().then((c) => c.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null))).catch(() => {});
}

export async function signIn(redirectTo) {
  const c = await client();
  const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) throw error;
}

let gsiPromise;
function loadGsi() {
  gsiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI;
    s.async = true;
    s.onload = () => resolve(window.google.accounts.id);
    s.onerror = () => { gsiPromise = null; reject(new Error('gsi')); };
    document.head.append(s);
  });
  return gsiPromise;
}

const sha256 = async (text) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
  .map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * A Google „Folytatás Google-fiókkal” gombja a megadott elembe. Siker esetén Supabase-munkamenet lesz belőle
 * (onAuthChange értesít); hibánál onError. Ha a Google-szkript nem tölt be, false – ilyenkor marad az átirányításos gomb.
 */
export async function mountGoogleButton(el, { onError, onStart } = {}) {
  let id;
  try { [id] = await Promise.all([loadGsi(), client()]); } catch { return false; }
  if (!el.isConnected) return true;
  const nonce = crypto.randomUUID();
  id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: await sha256(nonce),
    ux_mode: 'popup',
    use_fedcm_for_button: true,
    callback: async ({ credential }) => {
      onStart?.();
      try {
        const c = await client();
        const { error } = await c.auth.signInWithIdToken({ provider: 'google', token: credential, nonce });
        if (error) throw error;
      } catch (err) { onError?.(err); }
    },
  });
  id.renderButton(el, { theme: 'filled_black', shape: 'pill', size: 'large', text: 'continue_with', locale: 'hu', width: Math.min(el.clientWidth || 320, 400) });
  return true;
}

export async function signOut() {
  const c = await client();
  await c.auth.signOut();
}

export async function loadProfile(userId) {
  const c = await client();
  const { data, error } = await c.from('profiles').select('display_name, avatar_url, interests, notify_reminders, notify_follows, notify_weekly, remind_before, digest_hour, tonight_mode').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveInterests(userId, interests) {
  const c = await client();
  const { error } = await c.from('profiles').update({ interests }).eq('id', userId);
  if (error) throw error;
}

export async function saveSettings(userId, settings) {
  const c = await client();
  const { error } = await c.from('profiles').update(settings).eq('id', userId);
  if (error) throw error;
}

// ---------- követett helyek ----------
export async function loadFollows() {
  const c = await client();
  const { data, error } = await c.from('follows').select('venue');
  if (error) throw error;
  return data.map((r) => r.venue);
}

export async function follow(userId, venue) {
  const c = await client();
  const { error } = await c.from('follows').upsert({ user_id: userId, venue }, { onConflict: 'user_id,venue', ignoreDuplicates: true });
  if (error) throw error;
}

export async function unfollow(userId, venue) {
  const c = await client();
  const { error } = await c.from('follows').delete().eq('user_id', userId).eq('venue', venue);
  if (error) throw error;
}

// ---------- értesítések (Web Push) ----------
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const keyBytes = (b64) => Uint8Array.from(atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));

/** Van-e már értesítési feliratkozás ezen az eszközön. */
export async function pushEnabled() {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!(await reg?.pushManager.getSubscription());
}

/** Engedélykérés + feliratkozás + mentés a fiókba. 'denied' | 'unsupported' | 'ok' */
export async function enablePush() {
  if (!pushSupported()) return 'unsupported';
  if (await Notification.requestPermission() !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription()
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
  const { endpoint, keys } = sub.toJSON();
  const c = await client();
  const { error } = await c.rpc('save_push_subscription', { p_endpoint: endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth });
  if (error) throw error;
  return 'ok';
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const c = await client();
  await c.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

/** Próbaértesítés a saját eszközeimre – hogy rögtön lássa, működik. */
export async function testPush() {
  const c = await client();
  const { error } = await c.functions.invoke('notify', { body: { test: true } });
  if (error) throw error;
}

export async function loadSaved() {
  const c = await client();
  const { data, error } = await c.from('saved_events').select('event_id');
  if (error) throw error;
  return data.map((r) => r.event_id);
}

/** A program adatait is eltároljuk, hogy a profilban akkor is olvasható maradjon, ha már nincs a listában. */
export async function addSaved(userId, events) {
  if (!events.length) return;
  const c = await client();
  const rows = events.map((e) => ({
    user_id: userId,
    event_id: e.id,
    event: { title: e.title, start: e.start, end: e.end, time: e.time, venue: e.venue, url: e.links?.[0]?.url ?? e.url },
  }));
  const { error } = await c.from('saved_events').upsert(rows, { onConflict: 'user_id,event_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeSaved(userId, ids) {
  if (!ids.length) return;
  const c = await client();
  const { error } = await c.from('saved_events').delete().eq('user_id', userId).in('event_id', ids);
  if (error) throw error;
}

export async function deleteAccount() {
  const c = await client();
  const { error } = await c.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await c.auth.signOut();
}

// ---------- „Ki jön?” meghívók ----------
// Könnyű hívás a Supabase-könyvtár nélkül: a meghívott barátnak nem kell a teljes kliens. Belépve a saját tokenünkkel megy.
async function rpc(fn, args) {
  let token = null;
  try { token = JSON.parse(localStorage.getItem(SESSION_KEY))?.access_token ?? null; } catch { /* nincs munkamenet */ }
  const call = (t) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify(args),
  });
  let res = await call(token);
  if (res.status === 401 && token) res = await call(null);
  if (!res.ok) throw new Error(`${fn}: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Véletlen eszközazonosító a meghívókhoz (hogy a válaszodat később módosíthasd). Csak ehhez használjuk. */
export function deviceId() {
  try {
    let id = localStorage.getItem('device');
    if (!id) localStorage.setItem('device', (id = crypto.randomUUID().replace(/-/g, '')));
    return id;
  } catch { return (deviceId.tmp ??= crypto.randomUUID().replace(/-/g, '')); }
}

export const createPlan = (id, e, name) => rpc('create_plan', {
  p_id: id, p_event_id: e.id, p_device: deviceId(), p_name: name || null,
  p_event: { title: e.title, start: e.start, end: e.end, time: e.time, venue: e.venue },
});
export const getPlan = (id) => rpc('get_plan', { p_id: id, p_device: deviceId() });
export const respondPlan = (id, name, status) => rpc('respond_plan', { p_id: id, p_device: deviceId(), p_name: name, p_status: status });
export const myPlans = () => rpc('my_plans', { p_device: deviceId() });
export const amAdmin = () => rpc('am_i_admin', {});

// ---------- mérés ----------
/** Sütimentes, névtelen esemény a statisztikához (nem tárol semmit az eszközön). */
export function track(n, data = {}) {
  try {
    const body = JSON.stringify({ n, ...data, s: matchMedia('(display-mode: standalone)').matches });
    if (!navigator.sendBeacon?.(`${SUPABASE_URL}/functions/v1/track`, body)) {
      fetch(`${SUPABASE_URL}/functions/v1/track`, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch { /* a mérés soha nem törheti el az appot */ }
}
