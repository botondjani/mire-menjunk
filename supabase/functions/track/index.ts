// Sütimentes mérés: a kliens sendBeacon-nel küldi az eseményt ({ n, v, e, r, s }).
// Az eszközön semmit nem tárolunk; a napi egyedi látogatót az IP + böngésző + nap titkos sóval képzett
// hash-éből számoljuk, ami másnap már nem köthető össze az előzővel.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const NAMES = new Set(['view', 'open', 'save', 'unsave', 'share', 'rsvp', 'push_on', 'follow', 'signin', 'install', 'map', 'near']);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' };
let salt: string | null = null;

const sha = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
const cut = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors });
  let b: Record<string, unknown>;
  try { b = JSON.parse((await req.text()).slice(0, 2000)); } catch { return new Response(null, { status: 400, headers: cors }); }
  if (!NAMES.has(b.n as string)) return new Response(null, { status: 204, headers: cors });
  salt ??= (await admin.rpc('app_secret', { secret_name: 'cron_secret' })).data as string;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '';
  const ua = req.headers.get('user-agent') ?? '';
  const day = new Date().toISOString().slice(0, 10);
  await admin.from('analytics').insert({
    name: b.n,
    view: cut(b.v, 20),
    event_id: cut(b.e, 80),
    ref: cut(b.r, 80),
    visitor: await sha(`${salt}|${day}|${ip}|${ua}`),
    mobile: /Mobi|Android|iPhone/i.test(ua),
    standalone: b.s === true,
  });
  return new Response(null, { status: 204, headers: cors });
});
