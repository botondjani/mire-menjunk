// Generates a 1200×630 share image per event: the event photo (or a category-coloured poster),
// a date pill, the title in big type, the venue and the brand. This is what Messenger, WhatsApp
// and Facebook show when someone pastes a link, so it has to make people want to tap it.
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg, file) => require.resolve(`@expo-google-fonts/${pkg}/${file}`);
const FONTS = [
  font('bricolage-grotesque', '800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'),
  font('figtree', '600SemiBold/Figtree_600SemiBold.ttf'),
  font('figtree', '800ExtraBold/Figtree_800ExtraBold.ttf'),
];

const W = 1200;
const H = 630;
const HUES = { Koncert: 350, Buli: 290, Kiállítás: 205, Színház: 25, Film: 25, Családi: 150 };
const WD = ['VASÁRNAP', 'HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];
const MON = ['JAN', 'FEBR', 'MÁRC', 'ÁPR', 'MÁJ', 'JÚN', 'JÚL', 'AUG', 'SZEPT', 'OKT', 'NOV', 'DEC'];

const x = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const md = (iso) => `${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8)}`;

export function datePill(e) {
  if (e.end) return `${md(e.start)} – ${md(e.end)}`;
  const wd = WD[new Date(`${e.start}T12:00:00Z`).getUTCDay()];
  return [wd, md(e.start), e.time].filter(Boolean).join(' · ');
}

/** Greedy word wrap by an average glyph width; long titles get a smaller size and an ellipsis. */
function wrap(text, maxLines = 3) {
  for (const size of [76, 66, 58]) {
    const perLine = Math.floor(1060 / (size * 0.52));
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (next.length <= perLine) line = next;
      else { if (line) lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    if (lines.length <= maxLines) return { size, lines };
    if (size === 58) {
      const cut = lines.slice(0, maxLines);
      cut[maxLines - 1] = `${cut[maxLines - 1].replace(/[\s,.;:–-]+\S*$/, '')}…`;
      return { size, lines: cut };
    }
  }
  return { size: 58, lines: [text] };
}

async function photo(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'HovaMenjunkBot/0.3' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const jpg = await sharp(buf).resize(W, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function renderOg(e) {
  const hue = HUES[e.category] ?? 55;
  const img = e.image ? await photo(e.image) : null;
  const { size, lines } = wrap(e.title);
  const lineH = Math.round(size * 1.06);
  const venueY = H - 64;
  const titleBottom = e.venue ? venueY - 52 : H - 64;
  const titleTop = titleBottom - lineH * (lines.length - 1);
  const pill = datePill(e);
  const pillW = Math.round(pill.length * 16.6 + 46);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="poster" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 62% 52%)"/><stop offset="1" stop-color="hsl(${hue + 40} 55% 20%)"/>
    </linearGradient>
    <pattern id="stripes" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="4" height="28" fill="#fff" fill-opacity="0.06"/>
    </pattern>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.35" stop-color="#000" stop-opacity="0.05"/>
      <stop offset="0.55" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  ${img ? `<image href="${img}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${W}" height="${H}" fill="url(#poster)"/><rect width="${W}" height="${H}" fill="url(#stripes)"/>`}
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect x="56" y="52" width="${pillW}" height="56" rx="14" fill="#ffd100"/>
  <text x="80" y="90" font-family="Figtree" font-weight="800" font-size="28" fill="#141414" letter-spacing="1">${x(pill)}</text>
  <g transform="translate(${W - 56} 52)">
    <rect x="-292" y="0" width="292" height="56" rx="28" fill="#000" fill-opacity="0.45"/>
    <rect x="-284" y="8" width="40" height="40" rx="10" fill="#ffd100"/>
    <text x="-264" y="36" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="18" fill="#141414">BP</text>
    <text x="-232" y="38" font-family="Bricolage Grotesque" font-weight="800" font-size="27" fill="#fff">Hova menjünk?</text>
  </g>
  ${lines.map((l, i) => `<text x="64" y="${titleTop + i * lineH}" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" fill="#fff" letter-spacing="-1.5">${x(l)}</text>`).join('\n  ')}
  ${e.venue ? `<text x="66" y="${venueY}" font-family="Figtree" font-weight="600" font-size="34" fill="#e8e8e8">${x(e.venue)}</text>` : ''}
</svg>`;

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' },
  }).render().asPng();
  return sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}
