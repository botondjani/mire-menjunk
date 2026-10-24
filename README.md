# Hova menjünk? – Budapest programjai (PWA)

Budapest programjai egy helyen: koncertek, bulik, kiállítások, színház. Naponta többször frissül, minden programnak saját, megosztható linkje van.

## Hogyan működik
- **Scraper** (`scraper/`): Node + cheerio. Minden forrás egy adapter (`sources/*.js`), ami `{urls, parse(html)}`-t ad. A `run.js` lehúzza a listákat, egységes kategóriákba sorolja, összevonja a duplikátumokat, és legenerálja:
  - `public/data/events.json` – az app adatai
  - `public/e/<id>/index.html` – megosztó oldalak rövid, olvasható linkkel (pl. `e/dj-krush-akvarium-okt24/`), Open Graph előnézettel és schema.org Event adatokkal (Google)
  - `public/og/<id>.jpg` – márkázott 1200×630-as előnézeti kép programonként (`scraper/og.js`: fotó vagy kategóriaszínes poszter, dátum, cím, helyszín, logó)
  - `public/sitemap.xml`
- **App** (`public/`): build nélküli, vanilla JS PWA, saját kiszolgálású betűtípusokkal (`public/fonts`, latin + magyar részhalmaz). Szűrés napra/kategóriára, keresés, mentés (♥), megosztás (Web Share API + WhatsApp/FB/Viber/link), útvonal, offline mód.
- A szűrők az URL-ben vannak (pl. `?nap=hetvege&kat=Koncert`), így ezek is megoszthatók.

## Források
| Forrás | Mit ad |
|---|---|
| We Love Budapest (`/programok`, kategóriák, és a következő 60 nap napról napra) | válogatott programok, kiállítások, fesztiválok |
| Akvárium Klub | koncertek, bulik |
| Funzine (a friss heti/havi programajánló cikkek) | szerkesztett válogatás: fesztiválok, kiállítások, koncertek, séták |
| Time Out Budapest (havi válogatás) | a hónap kiemelt programjai |
| A38 Hajó (iCal feed) | koncertek, bulik |
| Trafó | kortárs tánc, színház, koncert |
| Dürer Kert (a saját oldal `__NEXT_DATA__` JSON-ja) | koncertek, bulik, vásárok, kvízek |
| Budapest Jazz Club | jazzkoncertek, jam sessionök |
| Dumaszínház (budapesti előadások) | stand-up |
| Magyar Zene Háza (a naptár szerveroldali adatai) | koncertek, családi programok |
| Tixa (főoldal + budapesti helyszínoldalak JSON-LD-je) | klubkoncertek: Dürer, Turbina, Budapest Park, Instant/Fogas, Gödör, Muzikum, Toldi, Robot, KAZI, Három Holló |
| Katona József Színház (műsoroldal) | előadások: Katona, Kamra, Sufni; angol feliratos előadások |
| Vígszínház (műsoroldal) | előadások: Vígszínház, Pesti Színház, Házi Színpad, Víg Szalon (kb. egy hét előre) |
| Ludwig Múzeum | aktuális kiállítások és tárlatvezetések |
| Artmozi (artmozi.hu heti műsor-JSON) | művészfilmek: Művész, Puskin, Toldi, Tabán, Kino Café – filmenként egy program, vetítő mozikkal |
| Cinema City (nyilvános quickbook API) | a műsoron lévő és a jövő héten induló mozifilmek |

A kártyákon látható **műfajt** (Jazz, Rock, Stand-up, Tánc, Opera…) a scraper adja (`detectGenre` a `lib/util.js`-ben), a csoportosítás a kategória szerint marad.

A **Fiataloknak** címkét a scraper adja (`isYouth` a `run.js`-ben): bulik, egyetemisták kedvelt klubjainak koncertjei, és kulcsszavak (egyetem, diák, slam, stand-up, kvíz, techno…).

A Müpa naptára kattintásra, szerverhívással tölti a heteket, ezért közvetlenül nem húzzuk le – a fontosabb Müpa-programok a WLB-n és a Funzine-on keresztül bejönnek.

A cél a válogatott, érdekes programok – a nagy jegyértékesítők teljes kínálatát (pl. jegy.hu) szándékosan nem húzzuk le.

Új forrás: másold le az egyik adaptert, írd meg a szelektorokat, add hozzá a `SOURCES` listához a `run.js`-ben, és tegyél mellé egy fixture-tesztet.

## Profil (opcionális Google-belépés)
- `public/auth.js`: Supabase (projekt `utybdwjrfnclyasbyuos`, EU-Frankfurt). A könyvtár csak belépéskor, vagy ha már volt belépve az eszközön, töltődik be (jsdelivr ESM).
- Táblák: `profiles` (név, kép, érdeklődési körök) és `saved_events`, RLS-sel: mindenki csak a sajátját látja. Fióktörlés: `delete-account` Edge Function.
- Belépés nélkül minden működik (a mentések a localStorage-ban vannak), belépéskor a helyi és a fiókban lévő mentések összefésülődnek.
- Belépés: a Google saját gombja (Google Identity Services → `signInWithIdToken`), így a Google-ablak a mi címünket mutatja; ha nem tölt be, átirányításos tartalék gomb.
- **Értesítések** (Web Push), a profilban személyre szabhatóan: emlékeztető a mentett program előtt (1/2/3 órával vagy aznap reggel; kiállításnál az utolsó napon), csütörtöki „Hétvégi tippek” az érdeklődési körök alapján, és napi összesítő a követett helyek új programjairól (délelőtt vagy délután). A `supabase/functions/notify` Edge Functiont óránként a `pg_cron` hívja (`notify-hourly`); a VAPID privát kulcs és az időzítő kulcsa a Supabase Vaultban van. Táblák: `follows`, `push_subscriptions`, `notifications_sent`. iPhone-on csak a kezdőképernyőre telepített appban működik.
- Beállítás: Google Cloud OAuth-kliens → Supabase Authentication → Providers → Google; URL Configuration: Site URL és Redirect URL a Pages-cím (`…/mire-menjunk/**`).

## Közösségi funkciók és mérés
- **„Ki jön?” meghívók:** minden megosztott link egy meghívó (`e/<id>/?p=<azonosító>`). A barát belépés nélkül, egy névvel jelezhet (Jövök / Talán / Most nem), a szervező látja a válaszokat, és – ha be van lépve és kér értesítést – push-t kap. Táblák: `plans`, `plan_responses`; csak `security definer` függvényeken át érhetők el (`create_plan`, `get_plan`, `respond_plan`, `my_plans`).
- **Térkép:** a listában a térkép gombbal; a helyszínek koordinátái a `scraper/lib/venues-geo.json`-ban (OpenStreetMap Nominatim, kézzel ellenőrizve). Új helyszínnél ide kell felvenni. Csempék: OpenStreetMap, Leaflet (cdnjs).
- **Ingyenes / ár:** a scraper `free` és `price` mezője (forrásadat vagy a leírásból felismerve: `detectFree`, `detectPrice`).
- **Mérés:** sütimentes, a `track` Edge Function írja az `analytics` táblába (napi sózott hash, semmi nem kerül az eszközre). Összesítő: `statisztika.html` (csak az `admins` táblában szereplő felhasználónak).
- **Esti tippek:** 16 órakor 3 esti program (profilban: péntek–szombat / minden nap / ki).

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
