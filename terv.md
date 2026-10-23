# Vaultaire-recept, saját kiadásban: terv

*Készült: 2026-10-23. A Vaultaire-számok a founder saját, nem auditált adatai. A **[D]** jel saját döntést jelöl, a **[B]** becslést vagy nem ellenőrizhető adatot, a **[M]** azt, amit még mérni kell.*

---

## 1. Összefoglaló és ajánlás

**Ajánlás: „ID Copy Guard”** (munkanév **[D]**). Egyetlen funkciója van: egy biztonságos igazolványmásolat 10 másodperc alatt. A felhasználó egyszer beszkenneli a személyijét vagy útlevelét, és amikor valaki (főbérlő, hotel, munkáltató, autókölcsönző) másolatot kér, egy gombbal kap egy példányt. Ezen a példányon rajta van a „Csak [címzett] részére, [cél], [dátum]” vízjel, ki vannak takarva a felesleges mezők (okmányszám, MRZ, aláírás), a metaadatok (EXIF/GPS) törölve vannak, a kép pedig lapított, így a vízjel nem szedhető le egyszerűen. Minden a készüléken fut, nincs fiók és nincs szerver.

- **Pontszám: 7,0/10.** Ez a küszöbön van, nem fölötte, és a fizetési hajlandóság még nincs bizonyítva. Ezért a sorrend: **először egy ingyenes, böngészős eszköz és SEO-oldalak, az iPhone-app csak akkor jön, ha a 4. hét végi kapun átmegy.**
- **B-terv (pivot):** útlevél- és vízumfotó-készítő, helyi feldolgozással, „egyszer fizetsz, a családnak korlátlan” modellel (6,5/10). Erre a 30. és a 90. napi kapunál lehet váltani. Ugyanaz a márka és ugyanaz a közönség („az okmányaim biztonságban”).
- **Elvetve:** számlakészítő (Magyarországon NAV-adatszolgáltatás kell, globálisan telített), statikus QR (ingyenes és telített), fájlkonverter (sok ingyenes, helyben futó versenytárs), Vaultaire-klón (az Apple és a Vaultaire maga is lefedi).

---

## 2. Vaultaire-tanulságok

### 2.1 A forrásellentmondás feloldása
Ugyanannak az oldalnak (stork.ai) a két cikke ellentmond egymásnak: az egyik Google-organikus forgalmat és Keyword Plannert ír, a másik App Store-keresést (ASO). **A vaultaire.app oldal szerint mindkettő igaz.** Van rajta kb. 120 útmutató (/guides/), külön /compare/ oldalak (kb. 10 versenytárs-összehasonlítás, például Keepsafe vagy kalkulátor-appok), /scenarios/ és /tools/ szekció, és kb. 30 nyelven érhető el. Az App Store-linkek követett paraméterekkel mennek (`/go/app-store?ct=…&src=…`), vagyis a webes forgalmat mérik. **Következtetés [B]:** a Google-tartalom adja a keresletet, az ASO a store-on belüli konverziót. A kettő arányát nem tudjuk.

### 2.2 Mitől működött, és mi ismételhető?

| Tényező | Mi történt | Ismételhető? |
|---|---|---|
| Éles, érzelmi igény | Félelem, hogy kényes fotók vagy fájlok rossz kézbe kerülnek | **Igen.** Kell egy félelemvezérelt, konkrét pillanat |
| Bizalom mint termék | AES-256-GCM, PBKDF2, nincs fiók, nincs szerver, a kulcs nincs a cégnél, a korlátokat nyíltan leírják | **Igen.** A helyi működés az ígéret lényege, nem extra |
| Gyűlölt inkumbensek | Régi vault-appok (Keepsafe: havi 9,99 $, éves 23,99 $), hirdetések, gyanús felhő | **Részben.** Csak ott, ahol a piacvezető drága vagy gyanús |
| Lifetime-horgony | Heti 1,99 / éves 19,99 / lifetime 39,99 $, a bevétel 80%+-a lifetime | **Igen.** A heti ár „drágává” teszi a havi gondolkodást, a lifetime kedvezőnek tűnik |
| Bizalmi csúcs a 60. napon | Napi használat mellett a fizetés később jön | **Nem automatikus.** Csak napi használatú appnál működik. Ritka használatnál a fizetés a szükség pillanatában történik, vagy elmarad |
| Lock-in | A fájlok bent vannak, a váltás fáj | **Részben.** Gyengébb lock-in is kell (tárolt okmány, megosztási napló) |
| Napi célzott útmutató | Search Console és Keyword Planner alapján ott, ahol van megjelenés, de kevés a kattintás, belső linkekkel | **Igen.** Ez a fő motor, és fegyelem kérdése |
| Időzítés és AI | Kb. 3 hetes MVP AI-ügynökökkel, első iOS-app | **Igen.** Ma ez még könnyebb |
| Apple saját funkciói | Az iOS 18-ban Face ID-val zárható a Rejtett album és az appok | **Ellenérv.** A klónnak az Apple a legnagyobb versenytársa |
| 10% web→app konverzió | Founder-adat | **[B] Felső határként** kezelem, nem tervezési alapként |

**A lényeg:** a recept nem a „vault”, hanem ez a sorrend: *félelemvezérelt, gyakori keresés → hasznos válaszoldal → helyi, fiók nélküli app → egyszeri fizetés.*

---

## 3. Ötletek értékelése

Skála: 1–10. A súlyok **[D]**: éles pillanat 20%, fizetési hajlandóság 25%, verseny 15%, moat 10%, gyakoriság 10%, SEO 20%.

| Ötlet | Éles pillanat | Fizetési hajl. | Verseny és árak (forrás) | Moat | Gyakoriság | SEO | **Össz.** |
|---|---|---|---|---|---|---|---|
| **ID Copy Guard** (vízjel, kitakarás, EXIF-törlés, tárolt okmány) | 9: „küldd át az útleveled” | 5: nem bizonyított; állami ingyenes eszközök (FR, NL), az appoknak nincs értékelése | 7: Safe2Share ID (19, egyszeri), ID-Shield (lifetime 199 IAP), WatermarkYourID (heti 0,99 / éves 1,99 / lifetime 4,99), webes ingyenesek; nincs domináns szereplő | 5: tárolt okmány és napló, preset-adatbázis | 4: évi néhány alkalom | 8: hosszú farok (címzett × okmány × ország), jogi háttéranyag | **7,0** |
| Útlevél- és vízumfotó (B-terv) | 9: határidő | 8: bizonyított, 5–23 $/fotó | 4: PhotoAiD 13,95; Passport Photo Online 22,95; Visafoto 5,20; IDPhoto4You ingyenes; SEO-ban erős szereplők | 5: specifikáció-adatbázis | 2: évekig nem kell | 7: ország × okmány, de erős a verseny | **6,5** |
| Vaultaire-klón, szűkítve (iratszéf) | 6 | 6 | 2: Keepsafe, Private Photo Vault (39,99), Vaultaire maga, Apple Rejtett album | 6 | 7 | 4: a Vaultaire már lefedi (kb. 120 útmutató) | **5,0** |
| Helyi fájlkonverter (HEIC→JPG stb.) | 7 | 2: mindenhol ingyenes | 2: sok ingyenes, helyben futó eszköz (PixHeic, OpenReplay, besthomepageever stb.) | 1 | 5 | 6: volumen van, a verseny brutális | **3,9** |
| Számlakészítő | 6 | 4 | 2: ingyenes generátorok, Billingo, Számlázz.hu | 2 | 7 | 4 | **3,9**. Magyarországon a NAV Online Számla miatt a helyi, backend nélküli működés nem jogszerű |
| Statikus QR-generátor | 5 | 2 | 2: a „lejárt dinamikus QR” fájdalom valós, de az ingyenes statikus generátor alapáru | 1 | 3 | 5 | **3,0** |

**A 7 alatti ötletek kiesnek.** Az útlevélfotó a jobb fizetési hajlandóság ellenére is alatta marad. Ez nem rossz ötlet, csak SEO-ban vörös óceán, és a ritka használat miatt rosszul illik a lifetime modellhez. Ezért B-terv lett.

---

## 4. A választott ötlet

**ID Copy Guard: „Share a copy of your ID without handing over your identity.”**

**Miért ez?**
1. **A helyi működés itt a termék lényege.** Aki az igazolványát védi, nem akarja feltölteni egy ismeretlen szerverre. A Vaultaire bizalmi pozíciója így tisztán átvihető.
2. **Jogi és hatósági szél a hátunkban.** A holland kormány saját appot ad ki erre (KopieID), a francia állam webes eszközt (Filigrane Facile). A magyar NAIH szerint a személyi másolása általában nem indokolt (adattakarékosság, a másolatnak nincs bizonyító ereje). Az Egyesült Királyságban a Right to Rent miatt a főbérlők kötelezően másolatot tartanak. Az igény tehát valós, az angol nyelvű piacon pedig nincs állami eszköz.
3. **Nincs domináns szereplő.** A 2025–26-ban indult appoknak egyelőre nincs látható értékelésük. Ez lehetőség, de figyelmeztető jel is: lehet, hogy kicsi a kereslet **[M]**.
4. **A SEO-hoz jól illik.** Minden „küldjek-e másolatot X-nek?” típusú kérdésre egy előre beállított eszközoldal válaszol, így nem vékony szöveg jön létre.

**Ami kimarad [D]:** általános fotó- és fájlszéf, felhőszinkron, csapatfunkciók, Android (a 90 napon belül), automatikus „smart redact” minden országra (az MVP-ben csak az MRZ és a kézi kitakarás van).

**Fő ellenérv, amit nyíltan vállalok:** az iOS Markup is tud szöveget írni a képre. Az érték ehhez képest négy dolog: (a) csempézett, el nem távolítható vízjel, (b) célzott sablon („hotel check-in”, „rental application”), (c) EXIF/GPS-törlés és lapítás, (d) az okmány egyszeri beszkennelése, utána bármikor újra megosztható. Ha a 4. hét végén a felhasználók nem értik ezt a különbséget, az **leállító jel**.

---

## 5. Cselekvési terv

### 5.1 Az első 4 hét (validáció, app nélkül)

| Hét | Feladatok | Kimenet |
|---|---|---|
| **1.** | Kulcsszókutatás: Keyword Planner (ingyenes Ads-fiókkal), Google autocomplete és „People also ask”, Reddit- és Quora-szálak (r/HousingUK, r/travel, r/IdentityTheft), AnswerThePublic ingyenes keret. Versenytárs-bontás (3 app, 5 webeszköz). Domain és névellenőrzés (védjegy is). **Webes eszköz v0:** vízjel + kézi kitakarás + EXIF-törlés + lapított JPG/PDF, 100%-ban kliensoldalon | 60–100 kulcsszavas lista volumensávokkal, működő eszköz |
| **2.** | Indítás: 1 eszközoldal + 10 pillér-/eszközoldal (lásd SEO-terv), Search Console, Bing Webmaster, sütimentes analitika. Várólista („Get the iPhone app”, e-mail) és fake-door CTA („Save my ID on iPhone, $X lifetime”). 3–5 magyar oldal (NAIH-téma) a helyi tanuláshoz | Élő oldal, indexelési kérelem |
| **3.** | Napi 1 új oldal, emberi átnézéssel. Organikus jelenlét: 10 hasznos, nem spammelő válasz releváns szálakban, az eszköz linkjével, ahol a szabályok engedik. Usability-teszt 5 emberrel (Budapest: albérlők, külföldi diákok, expatok) | 15–20 indexelt oldal, 5 interjú |
| **4.** | Adatgyűjtés és **1. kapu**. Ha átmegy: app-specifikáció, App Store Connect, előrendelés (pre-order) | Döntés |

**1. kapu (28. nap):**

| Mutató | Tovább | Javítás (+2 hét) | Leállás/pivot |
|---|---|---|---|
| Eszközhasználat: kész export / eszközoldal-látogató | ≥ 40% | 20–40% | < 20% |
| CTA-kattintás az exportoknál („Get the app”) | ≥ 5% | 2–5% | < 2% |
| Várólista (összesen) | ≥ 100 | 30–100 | < 30 |
| Interjú: „fizetnék érte” (5-ből) | ≥ 2 | 1 | 0 |

A 4. héten a Search Console-adatok még gyengék lesznek, mert egy új domain lassan indul. Ezért itt a viselkedési mutatók döntenek, a SEO majd a 60. napi kapunál.

### 5.2 90 napos terv

| Időszak | Fókusz | Mérföldkő |
|---|---|---|
| **5–7. hét** | App MVP AI-ügynökökkel (kb. 3 hét, mint a Vaultaire). Közben napi oldal megy tovább | TestFlight 15–20 tesztelővel a várólistáról |
| **8. hét** | App Store-beadás, ASO (cím: „ID Copy: Watermark & Redact”, a felirat kulcsszavas), előrendelők értesítése | Élő app (kb. a 50. nap) |
| **9. hét (2. kapu, 60. nap)** | SEO-mérés | lásd alább |
| **9–11. hét** | Ártesztek (lásd 7. fejezet), Search Console-vezérelt tartalom („van megjelenés, kevés a kattintás” → új cím, új oldal), 3 compare-oldal | |
| **12. hét** | Lokalizáció a legerősebb tudatosságú piacokra: NL, FR, DE, ES (a fordítást ember nézi át) | |
| **13. hét (3. kapu, 90. nap)** | Döntés | lásd alább |

**2. kapu (60. nap, Search Console, utolsó 28 nap):**
- Tovább: ≥ 10 000 megjelenés **és** ≥ 300 kattintás **és** ≥ 40 indexelt oldal.
- Javítás: 2000–10 000 megjelenés. Ekkor a címeket és a belső linkelést kell átnézni, és a top 10 oldalt mélyíteni.
- Pivot-jel: < 2000 megjelenés 50+ oldal mellett. Ekkor indul a B-terv (útlevélfotó) próbája két eszközoldallal, a meglévő domainen.

**3. kapu (90. nap, utolsó 30 nap):**

| Mutató | Tovább és skálázás | Iteráció (még 60 nap) | Leállás/pivot |
|---|---|---|---|
| Nettó bevétel/hó | ≥ 500 $ | 100–500 $ | < 100 $ |
| Telepítés → fizetés | ≥ 4% | 1,5–4% | < 1,5% |
| Web → telepítés | ≥ 3% | 1–3% | < 1% |
| Organikus kattintás/hó | növekvő, ≥ 2000 | stagnál | csökken |

---

## 6. SEO-terv

### 6.1 Oldaltípusok
1. **Eszközoldalak (mag, 5–8 db):** `/watermark-id/`, `/redact-passport/`, `/remove-exif-from-photo/`, `/id-copy-pdf/`. A böngészőben működő eszköz van középen, alatta a magyarázat.
2. **Címzett × okmány (programozott, preset-tel):** `/send-passport-copy-to/landlord/`, `/hotel/`, `/employer/`, `/car-rental/`, `/crypto-exchange/`, `/airbnb-host/`. Mindegyik **előre kitöltött vízjellel** nyitja meg az eszközt, és saját listát ad arról, mit takarj ki és miért.
3. **Ország × okmány útmutatók (csak ellenőrzött adattal):** például „UK passport copy: what to redact”. Mezőtérkép, jogi hivatkozás (ICO, NAIH, AP), forrásdátum.
4. **Kérdésoldalak (napi, Search Console-vezérelt):** például „what can someone do with a copy of my passport”.
5. **Összehasonlítás és alternatívák:** a KopieID-vel, a Filigrane Facile-lal, az iOS Markuppal és a Safe2Share ID-vel, korrektül.

### 6.2 20 példa kulcsszó vagy oldalcím
Az összes volumen **[M]**, egyiket sem ellenőriztem. A Semrush-hozzáférésen nem volt API-egység. Mérés: Keyword Planner tartományok, majd a Search Console valós megjelenései a 3–6. héttől.

1. How to watermark a copy of your passport
2. Is it safe to send a copy of my passport to a landlord?
3. What to redact on a passport copy (and what not to)
4. Watermark ID online without uploading
5. What can someone do with a photo of my ID?
6. Safely send ID to a hotel before check-in
7. Driver's license photo for car rental: how to protect it
8. Remove location data (EXIF) from a photo of your ID
9. Should I send my ID to an employer before the first day?
10. Passport copy for Airbnb host: what's actually required
11. UK Right to Rent: how to share your passport copy safely
12. ID copy for crypto exchange: watermark or not?
13. How to black out the MRZ on a passport
14. KopieID alternative for non-Dutch documents
15. Filigrane Facile in English: watermark your documents
16. How to make an ID copy PDF on iPhone
17. Somebody asked for a photo of my ID on WhatsApp: scam?
18. ID copy watermark text examples
19. Személyi igazolvány másolat: kérheti-e a főbérlő? (HU)
20. Hogyan küldjek biztonságosan személyi-másolatot? (HU)

### 6.3 Oldalsablon (címzett-oldal)
- H1 a kérdés. Alatta 2–3 mondatos válasz (featured snippet-re).
- **Eszköz preset-tel** (a vízjel kitöltve, a kitakarási javaslat bejelölve).
- „Mit kér jogosan a [címzett], és mit nem?” Táblázat, hivatkozott forrással.
- Lépések képernyőképpel. Kockázatok: mit nem véd a vízjel (őszintén).
- GYIK (3–5 kérdés), utána CTA: „Keep your ID ready on iPhone”.
- Kapcsolódó oldalak (lásd 6.4), utolsó ellenőrzés dátuma és ki ellenőrizte.

### 6.4 Belső linkelés
Hub-spoke szerkezet: a hub a `/send-id-copy/` és a `/guides/`, ezekre a címzett-, ország- és kérdésoldalak linkelnek. Minden új oldal 3 régebbire mutat, és 2 régebbi oldal kap linket az újra. Az eszközoldalra minden oldalról mutat link. A breadcrumb-ban és a láblécben a hubok szerepelnek. A Vaultaire mintájára az App Store-link követett paraméterrel megy (`/go/app?src=slug`), így látszik, melyik oldal konvertál.

### 6.5 A „scaled content abuse” szabály betartása
A Google szerint a visszaélés lényege az, hogy sok oldal készül, amely főként a rangsor manipulálására szolgál és nem segít, „no matter how it's created”. Szabályaim **[D]**:
- **Nincs oldal egyedi érték nélkül.** Minden programozott oldalnak saját preset-je, saját mezőlistája és saját forrása van. Ha ez hiányzik, nem jön létre, vagy `noindex` kap.
- **Emberi átnézés minden oldalnál** (5 pontos ellenőrzőlista: tény, forrás, preset, érthetőség, duplikáció). Az AI csak vázlatot ír.
- **Tempókorlát:** naponta 1–2 oldal, nincs tömeges kiöntés. Nincs több domain, nincs gépi fordítás átnézés nélkül.
- **Ország-oldal csak ellenőrzött jogi vagy hatósági forrással**, dátummal.
- Negyedévente takarítás: ami 90 nap után sem kap megjelenést, azt összevonom vagy `noindex`-et kap.

---

## 7. Termék és üzleti modell

### 7.1 MVP (iPhone)
1. Okmány beolvasása (VisionKit dokumentumkamera vagy import), több oldalra is.
2. Egyszeri tárolás titkosítva: CryptoKit AES-GCM, kulcs a Keychainben, Face ID (LocalAuthentication), Data Protection: Complete.
3. **Megosztás egy gombbal:** címzett- és célsablon, csempézett vízjel, MRZ-kitakarás (Vision szövegfelismerés) és kézi kitakarás, EXIF-törlés, lapított JPG vagy PDF, megosztás a share sheeten.
4. Megosztási napló (helyben): kinek, mikor, milyen célra.

**Kimarad [D]:** iCloud-szinkron, Android, Mac, automatikus mezőfelismerés minden országra, felhős bármi, analitika-SDK (helyette csak az App Store Connect adatai).

### 7.2 Stack
- **Web:** Astro statikus oldal, kliensoldali Canvas és pdf-lib, heic2any vagy WASM-dekóder, Cloudflare Pages, sütimentes analitika (Cloudflare Web Analytics), várólista Tally-űrlappal.
- **App:** Swift/SwiftUI, StoreKit 2 (nincs RevenueCat, így nincs külső adatkezelő **[D]**).
- **Ehhez a repóhoz:** a meglévő „mire-menjünk” egy eseményalkalmazás Supabase-zel. **Új, külön repót javaslok [D].**

### 7.3 Termékkockázatok

| Kockázat | Kezelés |
|---|---|
| Adatvesztés (telefoncsere) | Alacsonyabb tét, mint a Vaultaire-nél, mert az eredeti okmány megvan. Titkosított export- és import-fájl a v1.1-ben |
| Apple review, 4.2 (minimum functionality) | A tárolás, a napló és a sablonok miatt „app”, nem egy vízjel-szűrő. Tiszta adatvédelmi címke: „Data Not Collected” |
| Apple review, 3.1.2 (előfizetés) | A heti előfizetés ritka használatnál review- és refund-kockázat. Lásd az árazást |
| Jogi | Nincs jogi tanács (disclaimer). Nincs olyan állítás, hogy „védett a személyazonosság-lopás ellen”. Az EU DSA miatt kereskedői adatok kellenek az App Store-ban. Magyar vállalkozási forma és a NAV-teendők az Apple-bevétel után: könyvelővel |
| Egyes címzettek (KYC, bank) elutasítják a vízjeles másolatot | Az oldalakon őszintén leírom, hol nem használható |
| Hamis biztonságérzet | A „mit nem véd” blokk minden oldalon ott van |

### 7.4 Árazás
- **Késleltetett paywall [D]:** az első 3 megosztás ingyenes, teljes értékű, márkajel nélkül. A paywall a 4. megosztásnál és a második okmány tárolásánál jön. Ritka használatnál a „szükség pillanata” a fizetési pont, a 60. napos bizalmi görbe itt nem várható.
- **Ártesztek, időben szétválasztva**, 2–2 hetes ablakokban (StoreKit 2-vel nincs natív A/B):
  - **A (Vaultaire-horgony):** heti 1,99 / éves 19,99 / lifetime 39,99 $.
  - **B (alkalmi használatra szabva):** lifetime 9,99 $ egyedül.
  - **C:** éves 7,99 / lifetime 14,99 $.

  Döntés a telepítésenkénti bevétel alapján, nem a konverzió alapján. Előzetes várakozásom **[B]**: C vagy B nyer, mert a versenytársak 4,99–19 $ között vannak.

### 7.5 Forgatókönyvek (90. nap, havi)
Ezek a feltételezések következményei, nem előrejelzések. Apple-jutalék: 15% (Small Business Program).

| | Organikus látogató/hó | Web→telepítés | Telepítés→fizetés | Átlagos fizetés | Nettó/hó |
|---|---|---|---|---|---|
| Gyenge | 3000 | 3% | 2% | 10 $ | **kb. 15 $** |
| Közepes | 20 000 | 6% | 4% | 14 $ | **kb. 570 $** |
| Jó | 80 000 | 10% (Vaultaire-plafon) | 6% | 16 $ | **kb. 6500 $** |

Egy Vaultaire-szintű 41 000 $/hó ehhez a kategóriához **nem reális várakozás**. Ehhez napi használat vagy jóval nagyobb kereslet kellene.

---

## 8. Kockázatok és ellenérvek

| Miért bukhat el? | Korai mérés | Mikor derül ki? |
|---|---|---|
| **Kicsi a keresési volumen** (a versenytársaknak nincs értékelésük) | Keyword Planner-sávok és Search Console-megjelenések | 1. hét, 60. nap |
| **Az emberek nem fizetnek, mert ingyen is megoldható** (Markup, állami eszközök) | Fake-door CTA, interjúk, előrendelés | 28. nap |
| Ritka használat, nincs lock-in, így alacsony a teljes élettartam-érték | Ismételt megosztás/felhasználó 30 nap alatt | 75. nap |
| Új domain, lassú indexelés | Indexelt oldalak és megjelenések trendje | 30–60. nap |
| Google core update, AI Overviews elviszi a kattintásokat | CTR a top 20 lekérdezésen | folyamatosan |
| A Vaultaire vagy az Apple beépíti a funkciót | Versenytárs-figyelés havonta | — |
| Fókuszvesztés (sok kis funkció) | Szabály: 90 napig csak az 1 fő funkció | — |

---

## 9. Nyitott kérdések

1. Valós keresési volumen a 20 kulcsszóra **[M]**, Keyword Planner az 1. héten.
2. Melyik ország a legerősebb? (NL és FR tudatos, de ott van ingyenes állami eszköz; az UK-ban a Right to Rent hajt; az USA ismeretlen.)
3. Név és védjegy szabad-e (ID Copy Guard munkanév)? GoDaddy- és EUIPO/USPTO-ellenőrzés.
4. Magyar vállalkozási forma, az Apple-bevétel adózása, az EU DSA-kereskedői adatok: könyvelő.
5. Megéri-e Android 90 nap után? (A webes eszköz addig lefedi az Androidot.)
6. A Vaultaire webes vagy ASO-forgalmi aránya ismeretlen. A videó átiratát nem láttam.

---

## 10. Források

- Vaultaire, „$2,000 a day” (Google/Keyword Planner változat): https://www.stork.ai/blog/the-2000-a-day-app-built-in-three-weeks
- Vaultaire, „41k from a boring app” (ASO-változat): https://www.stork.ai/blog/41k-from-a-boring-appwithout-ads
- Vaultaire főoldal és útmutatók: https://vaultaire.app/ , https://vaultaire.app/guides/
- AlternativeTo, Vaultaire (29 $ egyszeri ár szerepel, ellentmondásos): https://alternativeto.net/software/vaultaire/about
- Google spam policies (scaled content abuse): https://developers.google.com/search/docs/essentials/spam-policies
- KopieID (holland kormány): https://www.government.nl/faq/how-do-i-make-a-secure-copy-of-my-id-with-the-kopieid-app
- Filigrane Facile (francia állam): https://www.blogdumoderateur.com/filigranefacile-outil-officiel-securiser-documents/
- NAIH állásfoglalás, okmánymásolás: https://www.naih.hu/files/Adatved_allasfoglalas_2018-3654-2-V-okmanymasolas.pdf
- UK Right to Rent: https://www.hmrc.gov.uk/check-tenant-right-to-rent-documents/print
- Safe2Share ID: https://apps.apple.com/mx/app/safe2share-id/id6760613834
- ID-Shield: https://apps.apple.com/mx/app/id-shield/id6760896003
- WatermarkYourID: https://apps.apple.com/cd/app/watermarkyourid/id6751237772
- Webes vízjel-eszköz (sinologic): https://www.sinologic.net/en/2025-02/how-to-quickly-add-a-watermark-to-your-id-or-identification-document.html
- Útlevélfotó-árak (2026. szept.): https://photogov.net/knowledge/guides/us-passport-photo-cost/
- Keepsafe App Store: https://apps.apple.com/US/app/id510873505
- Private Photo Vault: https://apps.apple.com/app/id417571834
- iOS 18 app-zárás és rejtés: https://appleinsider.com/inside/ios-18/tips/how-to-lock-apps-hide-apps-and-find-them-again-in-ios-18
- HEIC-konverterek (helyben futó, ingyenes): https://www.producthunt.com/products/pixheic , https://openreplay.com/tools/heic-to-jpg/
- Lejárt dinamikus QR-kódok: https://www.qrstuff.com/feeds/blog/dynamic-qr-codes-no-longer-scannable
- NAV Online Számla háttér: https://adozona.hu/afa/Online_adatszolgaltatas_januartol_ismet_bov_45LJI7
