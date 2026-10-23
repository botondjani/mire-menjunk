# Vaultaire-recept, saját kiadásban: terv (2. változat)

*Készült: 2026-10-23, kritikus felülvizsgálat után. A Vaultaire-számok a founder saját, nem auditált adatai. A **[D]** jel saját döntést jelöl, a **[B]** becslést vagy nem ellenőrizhető adatot, a **[M]** azt, amit még mérni kell. Kulcsszóvolument egyik elérhető connector sem adott (a Semrushön nincs API-egység, a Similarweben nincs kredit), ezért a fizetési hajlandóságot proxykból ítélem meg: fizető versenytársak, bevételbecslések, értékelésszámok.*

---

## 1. Összefoglaló és ajánlás

**Az 1. változat ajánlását (ID Copy Guard) elvetem.** A fizetős kereslet mellett nincs bizonyíték:
- a versenytárs appoknak nincs értékelésük;
- az egyik versenytárs lifetime ára 4,99 $;
- a francia és a holland állam ingyenes eszközt ad ugyanerre;
- az iOS Markup ingyen tud szöveget írni a képre;
- a szükség pillanatában senki nem tölt le és fizet ki egy appot, hanem egyszerűen elküldi a fotót.

Újraszámolva **5,2/10**.

**Új ajánlás: „Room Check”** (munkanév **[D]**). Egy 5 perces szobaellenőrzés rejtett kamerákra Airbnb-ben, hotelben, bérelt lakásban. Három dolgot csinál:
1. megkeresi a Wi-Fi-hálózaton a kamerára utaló eszközöket;
2. a telefon kamerájával segít megtalálni a lencsecsillanást és az infra-LED-et;
3. végigvezet egy szobánkénti ellenőrzőlistán.

Helyben fut, nincs fiók, nincs szerver, és **nincs automatikusan megújuló heti előfizetés.**

- **Pontszám: 6,9/10.** Ez a küszöb alatt van. **Csak akkor lesz 7+, ha az 1. heti technikai teszt sikerül** (3 valódi kamerából legalább 2-t felismer). Ha nem, leállok vagy pivotálok.
- **Miért ez a legjobb a vizsgáltak közül?** Ez hasonlít legjobban a Vaultaire szerkezetére:
  - erős félelem (egy önérdekelt felmérés szerint a vendégek 59%-a aggódik);
  - konkrét pillanat (megérkezés a szállásra);
  - óriási tájékoztató jellegű keresési igény („how to find hidden cameras in airbnb”);
  - **utált, átverős inkumbensek** (heti előfizetéses detektorappok, panaszokkal a lemondásra és a pontatlanságra);
  - az Apple nem ad rá megoldást.

  A fizetési hajlandóságnak van proxyja is: a „Camera Detector App” becsült bevétele kb. 90 000 $/hó (Adapty, kiugró érték), egy Flippa-hirdetés 4494 $/hó profitot állít 2 millió letöltéssel, a Fing pedig fizetős funkcióként árulja a kamerakeresést.
- **B-terv:** helyben futó interjú-átíró kutatóknak és újságíróknak (6,7). Ennek bizonyított a fizetős piaca, de erős az ingyenes, helyben futó verseny.

### A legfontosabb kritikai felismerés
2026-ban **minden „egy funkció, helyben fut, 3 hét alatt kész” rést már 5–10 AI-val épített klón foglal el.** Az ID-másolat, a Schengen-számláló és a böngészős átírás piacán is sok a 2025–26-os, értékelés nélküli app. **Maga a termék nem moat.** A győztest a terjesztés (a SEO végrehajtása) és a bizalom dönti el. Ez a Vaultaire-nél is így volt: zsúfolt kategóriába lépett be, és kb. 120 útmutatóval, összehasonlító oldalakkal és 30 nyelvvel nyert. Ezért a fő szűrőm: **legyen bizonyított fizetős kereslet, és legyenek gyenge vagy utált inkumbensek.**

---

## 2. Vaultaire-tanulságok

### 2.1 A forrásellentmondás
A stork.ai két cikke ellentmond egymásnak: az egyik Google-organikus forgalmat és Keyword Plannert ír, a másik ASO-t. **A vaultaire.app szerint mindkettő igaz.** Van rajta kb. 120 útmutató, /compare/ oldalak (kb. 10, többek közt a Keepsafe és a kalkulátor-appok ellen), /scenarios/ és /tools/ szekció, kb. 30 nyelv, és az App Store-linkek követett paraméterrel mennek. A két csatorna arányát nem tudjuk **[B]**.

### 2.2 Mi ismételhető?

| Tényező | Vaultaire | Ismételhető? | Room Check |
|---|---|---|---|
| Éles, érzelmi igény | Félelem a kényes fotók kiszivárgásától | Igen | Félelem a rejtett kamerától, konkrét pillanatban |
| Utált inkumbensek | Régi vault-appok, hirdetések, gyanús felhő | Részben | **Igen.** Heti előfizetéses „detektorok”, 99,9%-os ígéretek, nehéz lemondás |
| Helyi működés mint bizalom | Nincs szerver, a kulcs nincs a cégnél | Igen | Nincs fiók, a szkennelés eredménye nem hagyja el a telefont |
| Lifetime-horgony | 1,99 / 19,99 / 39,99 $, a bevétel 80%+-a lifetime | Igen | Nem megújuló utazási bérlet és lifetime |
| Bizalmi csúcs a 60. napon | Napi használat | **Nem.** Ritka használatnál nem jön el | A fizetés a megérkezéskor történik, vagy elmarad |
| Lock-in | Bent vannak a fájlok | Részben | Gyenge (szállásnapló). Ez kockázat |
| Napi célzott útmutató | Search Console-vezérelt | Igen | Igen, hírvezérelt témákkal együtt |
| Apple saját funkciói | Rejtett album, zárható appok | Ellenérv | Az Apple nem ad ilyet. Az iOS nem mutat MAC-címet, ez technikai korlát |

---

## 3. Ötletek értékelése (újraszámolva)

Súlyok **[D]**: éles pillanat 20%, fizetési hajlandóság 25%, verseny 15%, moat 10%, gyakoriság 10%, SEO 20%.

| Ötlet | Pillanat | Fiz. hajl. | Verseny | Moat | Gyak. | SEO | **Össz.** | Bizonyíték |
|---|---|---|---|---|---|---|---|---|
| **Room Check** (rejtett kamera) | 9 | 7 | 5 | 5 | 5 | 8 | **6,9** | Camera Detector App kb. 90 000 $/hó **[B]**; Flippa: 4494 $/hó profit, 2 millió letöltés (saját bevallás); a Fing kamerakeresése fizetős; felmérés: 47% talált már kamerát, 64% nem tudja, hogyan keresse |
| Helyi interjú-átíró (B-terv) | 8 | 8 | 4 | 5 | 6 | 7 | **6,7** | TurboScribe havi 10–20 $; MacWhisper kb. 100 000 $ (harmadik fél becslése); „Transcribe” app 450 értékelés, heti 3,99 $. **De:** az Aiko ingyenes és helyben fut, ott van még a Whisper Web, a BibiGPT, a yaps.ai, és a TurboScribe már magyarul is programozott SEO-t csinál |
| Schengen / adórezidencia napszámláló | 7 | 7 | 4 | 6 | 6 | 7 | **6,4** | TaxDay havi 9,99 $ (66 értékelés, 3,8); Borderwise lifetime 69,99 $; az EES 2026. április óta automatikusan számolja a napokat. **De:** a legrégebbi Schengen-app 10 év alatt is csak 189 értékelést gyűjtött, és 2025–26-ban sok új klón jelent meg |
| Útlevélfotó | 9 | 6 | 4 | 4 | 2 | 7 | **5,9** | PhotoAiD 13,95 $, Passport Photo Online 22,95 $. **De:** a PhotoGov digitális fotója ingyenes, más 2 $-ért old fel háttérmentést, és a legjobb app is csak 495 értékelésnél tart |
| ID Copy Guard (az 1. változat ajánlása) | 8 | 3 | 6 | 4 | 3 | 6 | **5,2** | Állami ingyenes eszközök, az appoknak 0 értékelésük, lifetime 4,99 $ |
| Vaultaire-klón | 6 | 6 | 2 | 6 | 7 | 4 | **5,0** | A Vaultaire maga és az Apple |
| Fájlkonverter / számlázó / QR | — | 2–4 | 2 | 1–2 | — | — | **3–4** | Ingyenes, telített. A számlázót Magyarországon a NAV-bekötés kizárja |

**Őszinte összegzés:** adat nélkül egyik ötlet sem éri el biztosan a 7-et. A Room Check a legközelebb van hozzá, és ennél a legolcsóbb a döntő teszt: két-három olcsó kamera, és egy hét alatt kiderül, működik-e a felismerés.

---

## 4. A választott ötlet: Room Check

**Ígéret:** „Check your Airbnb for hidden cameras in 5 minutes. No subscription trap. Nothing leaves your phone.”

**Mit csinál (egyetlen folyamat, három lépéssel):**
1. **Wi-Fi-szkennelés.** Bonjour/mDNS, SSDP/UPnP és ONVIF WS-Discovery felderítést futtat a szállás hálózatán, és megjelöli a kamerára utaló eszközneveket és gyártói szövegeket (RTSP-szolgáltatás, ONVIF-válasz, ismert kameragyártók).
2. **Lencse- és infravizsgálat.** Sötét szobában az előlapi kamera látja az infra-LED-et, zseblámpával pedig a lencse csillanása keresendő. Az app kiemeli a fényes pontokat a képen.
3. **Szobánkénti ellenőrzőlista.** Füstérzékelő, töltő, óra, légfrissítő, tükör. A végén egy helyben tárolt jelentés készül, amit fel lehet használni egy Airbnb-panaszhoz.

**Amit őszintén kimondunk:** a Wi-Fi-re nem csatlakozó vagy kikapcsolt kamerát a szkennelés nem találja meg. Nincs „99,9%” ígéret. A versenytársakkal szembeni pozíció pont ez az őszinteség.

**Ami kimarad [D]:**
- mágneses „detektor” (megbízhatatlan);
- MAC-cím-alapú gyártófelismerés (az iOS nem adja ki);
- portszkennelés az MVP-ben (jogi és etikai szürke zóna);
- Android, felhő, fiók.

**Fő ellenérvek:**
- A **Fing ingyenes alapszkennelése** sokaknak elég.
- Ritka a használat, gyenge a lock-in.
- Ha az 1. heti tesztben kevés kamerát talál meg, a termék nem ad valódi értéket. Ekkor leállok, és nem épitek „placebo-appot”.

---

## 5. Cselekvési terv

### 5.1 Az első 4 hét

| Hét | Feladatok | Kimenet |
|---|---|---|
| **1.** | **Kulcsszó-kapu:** Keyword Planner (ingyenes Ads-fiókkal) a 20 kulcsszóra, a B-terv 10 kulcsszavára is. **Technikai kapu:** 3 kamera (Tapo vagy Wyze, egy V380-as „spy” kamera, egy USB-töltőbe rejtett kamera, összesen kb. 60–80 €) egy otthoni hálózaton. Egy Swift-prototípus (mDNS + SSDP + WS-Discovery), és egy böngészős IR- és csillanásteszt (`getUserMedia`) | Volumenlista, felismerési arány |
| **2.** | Web v0: böngészős „Room Check” (lépésenkénti útmutató, kamerás IR- és csillanásteszt, ellenőrzőlista), 10 pillér-oldal, Search Console és Bing, sütimentes analitika, várólista és fake-door („Wi-Fi scan in the iPhone app”) | Élő oldal |
| **3.** | Napi 1 új oldal, emberi átnézéssel. 5 interjú: Budapesten Airbnb-vendégek és hostelutazók, plusz r/travel- és r/solotravel-szálak (hasznos válaszok, spam nélkül) | 15–20 oldal, 5 interjú |
| **4.** | **1. kapu.** Ha átmegy: az app MVP indul | Döntés |

**0. kapu (7. nap, kötelező):**
- A Wi-Fi-szkennelés **3 kamerából legalább 2-t** felismer, és nincs több 1 hamis riasztásnál egy átlagos otthoni hálózaton. Ha nem: **leállok, és a B-terv kapuja jön.**
- A Keyword Planner szerint a top 5 kulcsszó együttes sávja érdemi (a küszöb **[D]**: legalább „10K–100K”/hó globálisan). Ha nem: B-terv.

**1. kapu (28. nap):**

| Mutató | Tovább | Javítás (+2 hét) | Leállás/pivot |
|---|---|---|---|
| A böngészős ellenőrzést végigcsinálók aránya | ≥ 35% | 15–35% | < 15% |
| CTA-kattintás („Get the app”) | ≥ 6% | 2–6% | < 2% |
| Várólista | ≥ 150 | 50–150 | < 50 |
| Interjú: „fizetnék 5–15 $-t” (5-ből) | ≥ 2 | 1 | 0 |

### 5.2 90 napos terv

| Időszak | Fókusz | Mérföldkő |
|---|---|---|
| 5–7. hét | App MVP AI-ügynökökkel. Multicast-entitlement kérése az Apple-től már az **5. hét elején**, mert ez átfutási idő | TestFlight 20 tesztelővel |
| 8. hét | App Store-beadás, ASO („Hidden Camera Finder: Room Check”), értesítés a várólistának | Élő app (kb. az 50. nap) |
| 9. hét | **2. kapu** | lásd alább |
| 9–11. hét | Ártesztek, Search Console-vezérelt oldalak, 3 compare-oldal (Fing, „detector” appok, kézi módszer) | |
| 12. hét | Lokalizáció: ES, DE, FR, IT, PT. A turistaforgalom miatt a magyar csak kis tétel | |
| 13. hét | **3. kapu** | lásd alább |

**2. kapu (60. nap, Search Console, utolsó 28 nap):**
- Tovább: ≥ 15 000 megjelenés **és** ≥ 400 kattintás **és** ≥ 40 indexelt oldal.
- Javítás: 3000–15 000 megjelenés.
- Pivot-jel: < 3000 megjelenés 50+ oldal mellett.

**3. kapu (90. nap, utolsó 30 nap):**

| Mutató | Tovább | Iteráció (+60 nap) | Leállás/pivot |
|---|---|---|---|
| Nettó bevétel/hó | ≥ 500 $ | 100–500 $ | < 100 $ |
| Telepítés → fizetés | ≥ 5% | 2–5% | < 2% |
| Refund-arány | < 5% | 5–10% | > 10% (a termék nem váltja be az ígéretét) |
| Értékelés átlaga | ≥ 4,3 | 3,8–4,3 | < 3,8 |

---

## 6. SEO-terv

### 6.1 Oldaltípusok
1. **Eszközoldal (mag):** `/room-check/`, egy böngészőben futó, lépésenkénti ellenőrzés kamerás IR- és csillanásteszttel.
2. **Helyszín × szállástípus:** `/hidden-cameras/airbnb/`, `/hotel/`, `/hostel/`, `/vrbo/`, `/changing-room/`, `/office/`. Mindegyikhez saját ellenőrzőlista-preset tartozik.
3. **Eszköz, ahova kamerát rejtenek:** füstérzékelő, USB-töltő, óra, légfrissítő, tükör, TV, router. Mindegyikhez fotó a tipikus jelekről, saját teszttel (a saját vásárolt kameráinkról készült képekkel, ez egyedi tartalom).
4. **Kameratípus vagy márka a hálózaton:** például „Tapo / V380 / Wyze camera on Wi-Fi: how it shows up”. Saját szkennelési képernyőképpel, a saját laborból.
5. **Jog és teendő:** „found a hidden camera in Airbnb: what to do”, az Airbnb szabálya (2024 óta tilos a beltéri kamera), országonkénti jogi alap (csak ellenőrzött forrással).
6. **Compare / alternatives:** Fing, „detector” appok, kézi módszer.

### 6.2 20 példa kulcsszó vagy oldalcím
Az összes volumen **[M]** (Keyword Planner az 1. héten, utána Search Console).

1. How to find hidden cameras in an Airbnb
2. How to detect hidden cameras with your phone
3. Hidden camera in smoke detector: how to tell
4. How to find hidden cameras with iPhone (no app needed)
5. Do hidden camera detector apps work? (tested)
6. How to find hidden cameras on Wi-Fi network
7. Found a hidden camera in Airbnb: what to do
8. Airbnb camera policy 2026: what hosts can and can't do
9. How to spot a hidden camera in a hotel room
10. USB charger hidden camera: signs to look for
11. Infrared camera test with your phone in the dark
12. Two-way mirror test: does the fingernail trick work?
13. Hidden camera in bathroom: where to check
14. Fing vs hidden camera detector apps
15. How a V380 spy camera shows up on Wi-Fi
16. Are hidden cameras legal in rentals in [country]?
17. Hidden camera checklist for solo female travelers
18. How to check a hostel dorm for cameras
19. Rejtett kamera Airbnb-ben: hogyan ellenőrizd? (HU)
20. Hidden camera detector without subscription

### 6.3 Oldalsablon
- H1 a kérdés, alatta 2–3 mondatos válasz.
- **Interaktív lépés** (eszköz vagy preset-lista).
- Saját fotók vagy képernyőképek a laborból.
- „Mit nem talál meg ez a módszer?” (őszinte blokk).
- GYIK, utána CTA: „Scan the Wi-Fi with Room Check”.
- 3–5 kapcsolódó link, végül az utolsó teszt dátuma és ki tesztelte.

### 6.4 Belső linkelés
Hub-spoke szerkezet, két hubbal: `/hidden-cameras/` és `/room-check/`. Minden új oldal 3 régebbire mutat, és 2 régebbi oldal kap linket az újra. Az eszközoldalra minden oldalról mutat link. A CTA követett paraméterrel megy (`/go/app?src=slug`).

### 6.5 „Scaled content abuse”
A Google szerint a visszaélés az, amikor sok oldal készül főként a rangsor manipulálására, „no matter how it's created”. Szabályaim **[D]**:
- **Minden oldalon van saját, első kézből származó elem:** fotó, szkennelési képernyőkép, teszt. Ami ilyen nélkül készülne, az nem készül el.
- Az AI csak vázlatot ír. **Minden oldalt ember néz át** 5 pontos listával: tény, forrás, saját elem, érthetőség, duplikáció.
- Napi 1–2 oldal, nincs tömeges kiöntés. Csak egy domain, gépi fordítás átnézés nélkül nem megy ki.
- A jogi oldalak csak hivatkozott forrással és dátummal jelennek meg.
- Negyedévente takarítás: ami 90 nap után sem kap megjelenést, azt összevonom vagy `noindex`-et kap.

---

## 7. Termék és üzleti modell

### 7.1 MVP (iPhone)
- **Szkennelés:** Network.framework (NWBrowser a Bonjourhoz), UDP multicast az SSDP-hez és a WS-Discoveryhez (`com.apple.developer.networking.multicast` entitlement szükséges), Local Network permission. HTTP- vagy ONVIF-banner lekérése csak a már felderített eszközöktől.
- **Kamera:** AVFoundation és Core Image, fényes pontok kiemelése (IR és csillanás), útmutatóval.
- **Ellenőrzőlista és jelentés:** SwiftData, helyben. PDF-export a panaszhoz.
- **Fizetés:** StoreKit 2, nincs RevenueCat és nincs analitika-SDK **[D]**.

### 7.2 Web
Astro statikus oldal, Cloudflare Pages, `getUserMedia`-alapú kamerás teszt kliensoldalon, sütimentes analitika, várólista Tally-űrlappal. A meglévő „mire-menjünk” repó egy másik termék, **új repót javaslok [D].**

### 7.3 Kockázatok

| Kockázat | Kezelés |
|---|---|
| Alacsony felismerési arány | A 0. kapu. Ha nem éri el a küszöböt, nincs app |
| Hamis riasztás (pánik, rossz értékelés) | Óvatos szóhasználat („possible camera”), a gyártó és az indok kiírva |
| Apple review, 2.3 (pontatlan állítások) | Nincs „99,9%” vagy „detects all”. Képernyőképek csak valós eredményből |
| Multicast-entitlement elutasítása | Fallback: csak Bonjour, ez gyengébb. Ezért korán kell kérni |
| Jogi kérdés: egy idegen hálózat szkennelése | Csak passzív felderítés (multicast), nincs portszkennelés. Az ÁSZF-ben szerepel, hogy csak olyan hálózaton használd, amire jogosan csatlakoztál |
| Adatvesztés | Alacsony tét (a jelentés exportálható PDF) |
| Magyar és EU-s adminisztráció | Az EU DSA miatt kereskedői adatok kellenek az App Store-ban. A vállalkozási forma és az Apple-bevétel adózása könyvelővel |

### 7.4 Árazás
- **Az inkumbensek ellen [D]:** nincs automatikusan megújuló heti előfizetés.
- **Ingyenes:** a teljes kézi útmutató, az IR- és csillanásteszt és **1 teljes Wi-Fi-szkennelés részletes eredménnyel.** Nem rejtek el egy már megtalált „gyanús eszközt” fizetőfal mögé, mert az manipuláció.
- **Fizetős:** korlátlan szkennelés, szállásnapló, PDF-jelentés.
- **Ártesztek (2–2 hetes ablakok, a telepítésenkénti bevétel alapján):**
  - **A (Vaultaire-horgony):** heti 1,99 / éves 19,99 / lifetime 39,99 $.
  - **B:** 7 napos, nem megújuló Trip Pass 4,99 $ + lifetime 19,99 $.
  - **C:** csak lifetime 14,99 $.

  Előzetes várakozásom **[B]**: a B nyer, mert illeszkedik a „megérkeztem, most kell” pillanathoz.

### 7.5 Forgatókönyvek (90. nap, havi)
Ezek a feltételezések következményei, nem előrejelzések. Apple-jutalék: 15%.

| | Organikus látogató/hó | Web→telepítés | Telepítés→fizetés | Átlagos fizetés | Nettó/hó |
|---|---|---|---|---|---|
| Gyenge | 3000 | 3% | 3% | 8 $ | **kb. 18 $** |
| Közepes | 25 000 | 6% | 5% | 12 $ | **kb. 765 $** |
| Jó | 100 000 | 10% (Vaultaire-plafon) | 7% | 14 $ | **kb. 8300 $** |

Az ASO-ból jövő, store-on belüli forgalom nincs benne. Ez felfelé torzíthat, mert a detektorappok nagy része valószínűleg App Store-keresésből él **[B]**.

---

## 8. Kockázatok és ellenérvek

| Miért bukhat el? | Korai mérés | Mikor derül ki? |
|---|---|---|
| A technika nem találja meg a kamerákat | Labor: 3 kamera | 7. nap |
| Kicsi a keresési volumen, vagy elviszik a nagy médiaoldalak | Keyword Planner, majd Search Console | 7. nap, 60. nap |
| Az AI Overviews elviszi a kattintásokat | CTR a top 20 lekérdezésen | 60. naptól |
| A Fing ingyenes szkennelése „elég jó” | Interjúk, compare-oldal konverziója | 28. nap |
| Ritka használat, gyenge lock-in | Ismételt használat/fizető 90 nap alatt | 90. nap |
| A heti előfizetéses versenytársak felülírják az ASO-t | Helyezés 10 store-kulcsszóra | 60–90. nap |
| Reputációs kockázat (hamis biztonságérzet) | Refund-arány, egycsillagos értékelések | 60. naptól |

---

## 9. Nyitott kérdések

1. Valós keresési volumenek **[M]**: Keyword Planner az 1. héten. Ha a Semrush-on vagy a Similarweben lesz egység vagy kredit, ott is lefuttatom.
2. Megadja-e az Apple a multicast-entitlementet egy ilyen appnak? (Gyakran megadja, de ez nem garantált **[B]**.)
3. Mekkora a valós felismerési arány átlagos Airbnb-hálózaton (vendég-VLAN, külön hálózatok)?
4. Név és védjegy, domain.
5. Magyar vállalkozási forma, DSA-kereskedői adatok: könyvelő.
6. A B-terv (helyi átíró) volumene és a böngészős Whisper sebessége átlagos laptopon **[M]**.

---

## 10. Források

**Vaultaire**
- „$2,000 a day”: https://www.stork.ai/blog/the-2000-a-day-app-built-in-three-weeks
- „41k from a boring app”: https://www.stork.ai/blog/41k-from-a-boring-appwithout-ads
- Főoldal és útmutatók: https://vaultaire.app/ , https://vaultaire.app/guides/

**Google**
- Spam policies: https://developers.google.com/search/docs/essentials/spam-policies

**Room Check**
- Camera Detector App becslés (Adapty): https://adapty.io/paywall-library/camera-detector-app/
- Flippa-hirdetések: https://flippa.com/13004235-hidden-camera-detector , https://flippa.com/11964010-find-hidden-detect-cameras
- AppGoblin-becslés: https://www.appgoblin.info/apps/6470619397
- Fing és a fizetős kamerakeresés: https://fing.com/?p=737
- Felmérés (IPX1031, önérdekelt forrás): https://ipx1031.com/surveillance-rental-study
- Detektorapp-panaszok: https://mwm.ai/apps/cam-detector-app-home-security/6450695466
- Szkennelési módszer és korlátai: https://www.slashgear.com/1309305/how-to-scan-for-hidden-cameras-airbnb

**B-terv: átíró**
- TurboScribe: https://turboscribe.ai/learn/turboscribe-review-features-pricing-user-reviews
- MacWhisper becslés: https://startupsemail.substack.com/p/100000-revenue-with-a-simple-mac
- Aiko: https://sindresorhus.com/aiko
- Transcribe app: https://apps.apple.com/us/app/-/id1673039222
- yaps.ai: https://www.yaps.ai/zh-hans/blog/offline-transcription-qualitative-research
- Böngészős Whisper (BibiGPT): https://api2.bibigpt.co/features/free-speech-to-text-online
- WebGPU-támogatás: https://web.dev/blog/webgpu-supported-major-browsers
- Roehampton AI-átírási útmutató: https://www.roehampton.ac.uk/globalassets/documents/research/ethics/guidance-on-ai-transcription-tools-for-research-projects.docx

**Napszámláló**
- Schengen Calculator: https://apps.apple.com/us/app/id1054807221
- TaxDay: https://apps.apple.com/us/app/id1045026503
- Borderwise: https://apps.apple.com/us/app/borderwise/id6757322787
- DigitalKind: https://apps.apple.com/us/app/id6754875316
- EES: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/smart-borders/entry-exit-system_en

**Útlevélfotó**
- Árak: https://photogov.net/knowledge/guides/us-passport-photo-cost/
- Ingyenes alternatívák: https://www.tech-critter.com/the-best-free-passport-photo-app-for-iphone-in-2026-what-actually-works/
- US-követelmények: https://travel.state.gov/en/passports/renew-replace/online/upload-digital-photo.html

**ID-másolat (elvetve)**
- Safe2Share ID: https://apps.apple.com/mx/app/safe2share-id/id6760613834
- ID-Shield: https://apps.apple.com/mx/app/id-shield/id6760896003
- WatermarkYourID: https://apps.apple.com/cd/app/watermarkyourid/id6751237772
- KopieID: https://www.government.nl/faq/how-do-i-make-a-secure-copy-of-my-id-with-the-kopieid-app
- Filigrane Facile: https://www.blogdumoderateur.com/filigranefacile-outil-officiel-securiser-documents/
- NAIH: https://www.naih.hu/files/Adatved_allasfoglalas_2018-3654-2-V-okmanymasolas.pdf
