// Fiók: opcionális Google-bejelentkezés Supabase-en keresztül, profil (érdeklődési körök) és a mentések szinkronja.
// A Supabase-könyvtár csak akkor töltődik be, ha tényleg kell (belépés, vagy korábban belépett felhasználó).

const SUPABASE_URL = 'https://utybdwjrfnclyasbyuos.supabase.co';
// Nyilvános (publishable) kulcs: a böngészőbe való, a jogosultságot az adatbázis RLS-szabályai adják.
const SUPABASE_KEY = 'sb_publishable_CUbO4ARY9X3Xspe34VOJaw_UT2Us-4r';
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
const SESSION_KEY = 'sb-utybdwjrfnclyasbyuos-auth-token';

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

export async function signOut() {
  const c = await client();
  await c.auth.signOut();
}

export async function loadProfile(userId) {
  const c = await client();
  const { data, error } = await c.from('profiles').select('display_name, avatar_url, interests').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveInterests(userId, interests) {
  const c = await client();
  const { error } = await c.from('profiles').update({ interests }).eq('id', userId);
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
