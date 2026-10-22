# Mire menjünk? – Budapest programjai (PWA)

Budapest programjai egy helyen: koncertek, bulik, kiállítások, színház. Naponta többször frissül, minden programnak saját, megosztható linkje van.

## Hogyan működik
- **Scraper** (`scraper/`): Node + cheerio. Minden forrás egy adapter (`sources/*.js`), ami `{urls, parse(html)}`-t ad. A `run.js` lehúzza a listákat, egységes kategóriákba sorolja, összevonja a duplikátumokat, és legenerálja:
  - `public/data/events.json` – az app adatai
  - `public/e/<id>/index.html` – megosztó oldalak Open Graph előnézettel (kép + cím Messengerben, FB-n, WhatsAppon) és schema.org Event adatokkal (Google)
  - `public/sitemap.xml`
- **App** (`public/`): build nélküli, vanilla JS PWA. Szűrés napra/kategóriára, keresés, mentés (♥), megosztás (Web Share API + WhatsApp/FB/Viber/link), naptárba (.ics), útvonal, offline mód.
- A szűrők az URL-ben vannak (pl. `?nap=hetvege&kat=Koncert`), így ezek is megoszthatók.

## Források
| Forrás | Mit ad |
|---|---|
| We Love Budapest (`/programok`, kategóriák, és a következő 45 nap napról napra) | válogatott programok, kiállítások, fesztiválok |
| Akvárium Klub | koncertek, bulik |
| Tixa (főoldal + budapesti helyszínoldalak JSON-LD-je) | klubkoncertek: Dürer, Turbina, Budapest Park, Instant/Fogas, Gödör, Muzikum |

A cél a válogatott, érdekes programok – a nagy jegyértékesítők teljes kínálatát (pl. jegy.hu) szándékosan nem húzzuk le.

Új forrás: másold le az egyik adaptert, írd meg a szelektorokat, add hozzá a `SOURCES` listához a `run.js`-ben, és tegyél mellé egy fixture-tesztet.

## Parancsok
```bash
npm ci
npm test          # parser tesztek mentett HTML-en
npm run scrape    # éles gyűjtés
npm run seed      # gyűjtés a mentett fixture-ökből (offline) – a public/data és public/e ebből jön létre helyben
npm run dev       # helyi szerver: http://localhost:5173
```

## Deploy (GitHub Pages)
A `.github/workflows/update.yml` push-ra és naponta 3x lefut: teszt → scrape → Pages deploy. Teendő: repo → Settings → Pages → Source: **GitHub Actions**.

## Megjegyzés
Csak címet, dátumot, rövid leírást és képlinket veszünk át, és mindig a forrásra linkelünk (jegyek, részletek ott). Éles indulás előtt érdemes engedélyt kérni a forrásoktól, vagy partnerséget ajánlani – nekik is forgalmat hoz.
