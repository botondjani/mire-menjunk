// Értesítések: óránként a pg_cron hívja (x-cron-secret), vagy belépett felhasználó próbaértesítést kér ({ test: true }).
// - Emlékeztető: a mentett program előtt a választott idővel (1/2/3 óra, vagy aznap reggel 9-kor), kiállításnál az utolsó napon.
// - Követett helyek: naponta egyszer összesítő az új programokról, a választott órában (10 vagy 17).
// - Hétvégi tippek: csütörtökönként 3 program a hétvégére az érdeklődési körök alapján.
// - Esti tippek: 16 órakor 3 esti program (péntek–szombat vagy minden nap).
// - „Ki jön?”: a meghívóra érkező válaszról szól a szervezőnek (adatbázis-trigger hívja, { rsvp }).
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import webpush from 'npm:web-push@3.6.7';

const SITE = 'https://botondjani.github.io/mire-menjunk/';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Ev = { id: string; title: string; start: string; end: string | null; time: string | null; venue: string | null; category: string; youth?: boolean; image?: string | null };
type Prefs = { id: string; interests: string[]; notify_reminders: boolean; notify_follows: boolean; notify_weekly: boolean; remind_before: number; digest_hour: number; tonight_mode: number };

// Ugyanaz a csoportosítás, mint az appban (public/app.js GROUPS + Fiataloknak).
const GROUPS: Record<string, string[]> = {
  zene: ['Koncert'], buli: ['Buli'], kiallitas: ['Kiállítás'], szinpad: ['Színház', 'Film'], csalad: ['Családi'],
  egyeb: ['Fesztivál', 'Gasztró', 'Vásár', 'Szabadidő', 'Kultúra'],
};
const matches = (e: Ev, key: string) => (key === 'fiatal' ? !!e.youth : (GROUPS[key] ?? []).includes(e.category));
type Sub = { endpoint: string; user_id: string; p256dh: string; auth: string };
type Note = { title: string; body: string; url: string; tag: string };

const secret = async (name: string) => (await admin.rpc('app_secret', { secret_name: name })).data as string | null;

/** Budapesti falióra-idő "naiv" Date-ként (UTC mezőkben), hogy egyszerűen összevethető legyen az esemény idejével. */
function budapestNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const shortDate = (s: string) => `${MONTHS[+s.slice(5, 7) - 1]} ${+s.slice(8, 10)}.`;
const eventUrl = (e: Ev) => `${SITE}e/${encodeURIComponent(e.id)}/`;

/** 3 program: egynaposak és képesek előre, csoportonként egy, hogy változatos legyen. */
function pick3(list: Ev[]) {
  const single = (e: Ev) => !(e.end && e.end !== e.start);
  const sorted = [...list].sort((a, b) => Number(single(b)) - Number(single(a)) || Number(!!b.image) - Number(!!a.image));
  const picks: Ev[] = [];
  for (const e of sorted) if (picks.length < 3 && !picks.some((x) => x.category === e.category)) picks.push(e);
  for (const e of sorted) if (picks.length < 3 && !picks.includes(e)) picks.push(e);
  return picks;
}

async function sendAll(subs: Sub[], note: Note) {
  let ok = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(note), { TTL: 3 * 3600 });
      ok++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      else console.error('push failed', code, String(err).slice(0, 200));
    }
  }));
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const [cronSecret, priv, pub] = await Promise.all(['cron_secret', 'vapid_private', 'vapid_public'].map(secret));
  webpush.setVapidDetails(SITE, pub!, priv!);
  const body = await req.json().catch(() => ({}));
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  // Próbaértesítés a bejelentkezett felhasználónak.
  if (body.test) {
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
    const { data } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!data.user) return json({ error: 'unauthorized' }, 401);
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', data.user.id);
    const sent = await sendAll(subs ?? [], { title: 'Szia! Így fognak kinézni 👋', body: 'Szólunk a mentett programjaid előtt, ha új program jön a kedvenc helyeiden, és csütörtökön hozzuk a hétvégi tippeket.', url: `${SITE}?v=profil`, tag: 'test' });
    return json({ sent });
  }

  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'forbidden' }, 403);

  if (body.rsvp) {
    const r = body.rsvp;
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', r.owner_id);
    const head = { going: `🙋 ${r.name} jön!`, maybe: `🤔 ${r.name} talán jön`, no: `${r.name} most nem tud jönni` }[r.status as string] ?? r.name;
    const sent = await sendAll(subs ?? [], {
      title: head,
      body: r.title ? `${r.title} – nézd meg, ki jön még` : 'Nézd meg, ki jön még',
      url: `${SITE}e/${encodeURIComponent(r.event_id)}/?p=${encodeURIComponent(r.plan_id)}`,
      tag: `plan-${r.plan_id}`,
    });
    return json({ sent });
  }

  const res = await fetch(`${SITE}data/events.json`, { headers: { 'Cache-Control': 'no-cache' } });
  const events: Ev[] = (await res.json()).events;
  const byId = new Map(events.map((e) => [e.id, e]));
  const now = budapestNow();
  const today = iso(now);
  const hour = now.getUTCHours();

  const [{ data: subs }, { data: profiles }, { data: saved }, { data: follows }] = await Promise.all([
    admin.from('push_subscriptions').select('*'),
    admin.from('profiles').select('id, interests, notify_reminders, notify_follows, notify_weekly, remind_before, digest_hour, tonight_mode'),
    admin.from('saved_events').select('user_id, event_id'),
    admin.from('follows').select('user_id, venue, seeded'),
  ]);
  const subsOf = new Map<string, Sub[]>();
  for (const s of subs ?? []) subsOf.set(s.user_id, [...(subsOf.get(s.user_id) ?? []), s]);
  const prefs = new Map<string, Prefs>((profiles ?? []).map((p) => [p.id, p]));
  const digestDue = (userId: string) => hour >= (prefs.get(userId)?.digest_hour ?? 10);
  const users = [...subsOf.keys()];
  const { data: sentRows } = users.length
    ? await admin.from('notifications_sent').select('user_id, kind, ref').in('user_id', users)
    : { data: [] };
  const sent = new Set((sentRows ?? []).map((r) => `${r.user_id}|${r.kind}|${r.ref}`));
  const mark: { user_id: string; kind: string; ref: string }[] = [];
  const once = (user_id: string, kind: string, ref: string) => {
    const k = `${user_id}|${kind}|${ref}`;
    if (sent.has(k)) return false;
    sent.add(k);
    mark.push({ user_id, kind, ref });
    return true;
  };
  let pushed = 0;

  // 1) Emlékeztetők a mentett programokhoz
  for (const row of saved ?? []) {
    const e = byId.get(row.event_id);
    const userSubs = subsOf.get(row.user_id);
    if (!e || !userSubs || prefs.get(row.user_id)?.notify_reminders === false) continue;
    const multiDay = e.end && e.end !== e.start;
    let note: Note | null = null;
    const before = prefs.get(row.user_id)?.remind_before ?? 120;
    if (!multiDay && e.start === today && e.time && before > 0) {
      const mins = (new Date(`${today}T${e.time}:00Z`).getTime() - now.getTime()) / 60000;
      if (mins > before - 30 && mins <= before + 30 && once(row.user_id, 'remind', e.id)) {
        note = { title: `⏰ ${e.title}`, body: `${before / 60} óra múlva kezdődik · ${e.time}${e.venue ? ` · ${e.venue}` : ''}`, url: eventUrl(e), tag: e.id };
      }
    } else if (!multiDay && e.start === today && hour >= 9 && once(row.user_id, 'remind', e.id)) {
      note = { title: `Ma: ${e.title}`, body: `${e.time ? `${e.time} · ` : ''}${e.venue ? `${e.venue} · ` : ''}Jó szórakozást!`, url: eventUrl(e), tag: e.id };
    } else if (multiDay && e.end === today && hour >= 10 && once(row.user_id, 'lastday', e.id)) {
      note = { title: `Utolsó nap: ${e.title}`, body: `Ma látogatható utoljára${e.venue ? ` · ${e.venue}` : ''}.`, url: eventUrl(e), tag: e.id };
    }
    if (note) pushed += await sendAll(userSubs, note);
  }

  // 2) Követett helyek: az első futáskor csak megjegyezzük a már ismert programokat, utána naponta egyszer szólunk az újakról.
  const horizon = iso(new Date(now.getTime() + 45 * 86400000));
  const upcoming = events.filter((e) => e.venue && (e.end || e.start) >= today && e.start <= horizon);
  const fresh = new Map<string, { venue: string; e: Ev }[]>();
  const seeded: { user_id: string; venue: string }[] = [];
  for (const f of follows ?? []) {
    const atVenue = upcoming.filter((e) => e.venue === f.venue);
    if (!f.seeded) {
      atVenue.forEach((e) => once(f.user_id, 'follow', e.id));
      seeded.push(f);
      continue;
    }
    if (!digestDue(f.user_id) || !subsOf.has(f.user_id) || prefs.get(f.user_id)?.notify_follows === false) continue;
    if (sent.has(`${f.user_id}|digest|${today}`)) continue;
    for (const e of atVenue) if (once(f.user_id, 'follow', e.id)) fresh.set(f.user_id, [...(fresh.get(f.user_id) ?? []), { venue: f.venue, e }]);
  }
  for (const [userId, items] of fresh) {
    once(userId, 'digest', today);
    const venues = [...new Set(items.map((i) => i.venue))];
    const note: Note = items.length === 1
      ? { title: `Új program: ${items[0].venue}`, body: `${items[0].e.title} · ${shortDate(items[0].e.start)}`, url: eventUrl(items[0].e), tag: 'follow' }
      : {
        title: venues.length === 1 ? `${items.length} új program: ${venues[0]}` : `${items.length} új program a kedvenc helyeiden`,
        body: items.slice(0, 3).map((i) => i.e.title).join(' · '),
        url: venues.length === 1 ? `${SITE}?v=kereses&q=${encodeURIComponent(venues[0])}` : `${SITE}?v=profil`,
        tag: 'follow',
      };
    pushed += await sendAll(subsOf.get(userId)!, note);
  }

  // 3) Hétvégi tippek csütörtökön: péntektől vasárnapig, az érdeklődési körökhöz illő, még nem mentett programok.
  if (now.getUTCDay() === 4) {
    const fri = iso(new Date(now.getTime() + 86400000));
    const sun = iso(new Date(now.getTime() + 3 * 86400000));
    const weekend = events.filter((e) => e.start <= sun && (e.end || e.start) >= fri);
    const savedBy = new Map<string, Set<string>>();
    for (const r of saved ?? []) savedBy.set(r.user_id, (savedBy.get(r.user_id) ?? new Set()).add(r.event_id));
    for (const userId of subsOf.keys()) {
      const p = prefs.get(userId);
      if (p?.notify_weekly === false || !digestDue(userId) || sent.has(`${userId}|weekly|${today}`)) continue;
      const keys = p?.interests?.length ? p.interests : [];
      const mine = weekend.filter((e) => !savedBy.get(userId)?.has(e.id) && (!keys.length || keys.some((k) => matches(e, k))));
      const picks = pick3(mine);
      if (!picks.length) continue;
      once(userId, 'weekly', today);
      const kat = keys.length === 1 ? `&kat=${encodeURIComponent(keys[0])}` : '';
      pushed += await sendAll(subsOf.get(userId)!, {
        title: '🎉 Hétvégi tippek neked',
        body: picks.map((e) => e.title).join(' · '),
        url: `${SITE}?v=lista&nap=hetvege${kat}`,
        tag: 'weekly',
      });
    }
  }

  // 4) Esti tippek 16 órakor: ma 17 óra utáni programok az érdeklődés szerint.
  const dow = now.getUTCDay();
  if (hour >= 16) {
    const tonight = events.filter((e) => e.start === today && (!e.end || e.end === e.start) && e.time && e.time >= '17:00');
    const savedIds = new Map<string, Set<string>>();
    for (const r of saved ?? []) savedIds.set(r.user_id, (savedIds.get(r.user_id) ?? new Set()).add(r.event_id));
    for (const userId of subsOf.keys()) {
      const mode = prefs.get(userId)?.tonight_mode ?? 1;
      if (!mode || (mode === 1 && dow !== 5 && dow !== 6) || sent.has(`${userId}|tonight|${today}`)) continue;
      const keys = prefs.get(userId)?.interests ?? [];
      const mine = tonight.filter((e) => !savedIds.get(userId)?.has(e.id) && (!keys.length || keys.some((k) => matches(e, k))));
      const picks = pick3(mine.length >= 2 ? mine : tonight.filter((e) => !savedIds.get(userId)?.has(e.id)));
      if (!picks.length) continue;
      once(userId, 'tonight', today);
      pushed += await sendAll(subsOf.get(userId)!, {
        title: '🌙 Ma esti tippek',
        body: picks.map((e) => `${e.time} ${e.title}`).join(' · '),
        url: `${SITE}?v=lista&nap=ma`,
        tag: 'tonight',
      });
    }
  }

  for (let i = 0; i < mark.length; i += 500) await admin.from('notifications_sent').upsert(mark.slice(i, i + 500), { ignoreDuplicates: true });
  for (const f of seeded) await admin.from('follows').update({ seeded: true }).eq('user_id', f.user_id).eq('venue', f.venue);
  // Régi napló takarítása
  await admin.from('notifications_sent').delete().lt('sent_at', new Date(Date.now() - 90 * 86400000).toISOString());
  await admin.from('analytics').delete().lt('ts', new Date(Date.now() - 400 * 86400000).toISOString());
  return json({ pushed, marked: mark.length, seeded: seeded.length });
});
