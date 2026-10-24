# Mélyelemzés: Költözési dobozleltár és Helyesírás-gyakorló gyerekeknek

*Készült: 2026-10-24. A **[B]** jel becslést, a **[M]** azt jelöli, amit mérni kell. A kulcsszóvolument egyik connector sem adta meg, ezért a Keyword Planner az első lépés mindkettőnél.*

## Ítélet egy mondatban
- **Helyesírás-gyakorló: 6,0/10, a kettő közül ez a jobb.** Valódi magyar rés, időtálló tartalom, erős keresési szándék („j vagy ly feladatok”). **Web-first, böngészőben futó változatként** érdemes csinálni, nem csak iOS-appként.
- **Költözési dobozleltár: 5,5/10 (a korábbi 6,0-ról lefelé).** A mélyelemzés két dolgot hozott elő: **a Sortly-nak van ingyenes, kifejezetten költözéshez szánt verziója**, és a költözés ritka, így alacsony a vásárlónkénti bevétel. A plafon szerény.

---

## A) Helyesírás-gyakorló gyerekeknek

### Mi a termék?
Böngészőben futó (PWA) és telefonon is működő gyakorló, 2–6. osztályosoknak:
- **szabálycsomagok:** j/ly, hosszú-rövid magánhangzók és mássalhangzók, egybe-külön írás, tulajdonnevek, -val/-vel hasonulás;
- **tollbamondás:** előre felvett hanganyag + gépelés, azonnali javítással;
- „hibanapló”: a gyerek visszatérő hibáira épülő ismétlés, helyben tárolva.

Nincs fiók, nincs reklám, nincs követés. A szülő a gyereke eszközén lát egy összesítőt.

### Miért most?
- **A tartalom időtálló:** a jelenlegi szabályzat az AkH. 12 (2015), és 13. kiadásnak nincs nyoma. Ez az „egyszer lefejlesztem” feltételnek tökéletesen megfelel.
- **A szülők tudatosabbak a képernyőidővel**, és az iskolákban 2024 óta korlátozott a telefonhasználat. Ezért a „hasznos, reklámmentes” app pozíció erős.
- **Kevés a versenytárs:** a kereséseim alapján magyar nyelvű, gyerekeknek szóló, igényes helyesírás-app alig van. Az „A Helyes!” inkább felnőtteknek szól. A tanárok Wordwall- és LearningApps-feladatokat készítenek, ezek szétszórtak. **[M]:** az App Store és a Google Play magyar oktatási kategóriáját, valamint az állami ingyenes tartalmakat kézzel át kell nézni.

### Piac
- **712 ezer** általános iskolás van (KSH, 2025/26), évfolyamonként kb. 90–95 ezer. **A célcsoport (2–6. osztály) kb. 450 ezer gyerek [B].**
- Iskolakezdéskor a szülők többsége 50–100 ezer Ft-ot költ gyerekenként (CIB-felmérés, 2025). Egy 2990 Ft-os eszköz ehhez képest kis tétel. A magyar szülők oktatási appokra vonatkozó fizetési hajlandóságáról **nincs adat [M]**.

### Terjesztés (a kulcs)
- **SEO szabályonként, interaktív ingyenes feladattal:** „j vagy ly szavak listája”, „egybe vagy külön írás feladatok”, „helyesírás feladatok 3. osztály”. Minden oldalon van egy ingyenes mini-gyakorló, a teljes csomag fizetős.
- Ez **eszköz-alapú tartalom**, ezért összefér a Google scaled-content szabályaival, ha minden oldalon egyedi feladat és tanári átnézés van.
- **Tanárok mint terjesztők:** egy ingyenes tanári osztálykód (egy linkkel az osztálynak kiadható feladatsor) szóbeszédet indíthat.

### Technika (szerver nélkül)
- Statikus webapp (PWA), offline működéssel, IndexedDB-ben tárolt haladással.
- Hanganyag: **előre felvett és beágyazott** felolvasás, így nem kell a gépi hang minőségével bajlódni.
- Fizetés: Paddle vagy Lemon Squeezy (kezelik az ÁFA-t), offline ellenőrizhető licenckulccsal.
- Később iOS-csomagolás az Apple Kids szabályai szerint (nincs harmadik féltől származó analitika és reklám, szülői kapu a vásárlás előtt).
- Fejlesztés kb. 4–6 hét, a tartalom (szólisták, mondatok, felvételek) **egy tanítóval közösen** kb. 3–4 hét **[B]**.

### Matek [B]
- Ár: **2990 Ft egyszeri (egy gyerek), 4990 Ft családi.** ÁFA és a fizetési szolgáltató díja után kb. **2240 Ft / 3730 Ft nettó**.
- **Tölcsér (iskolaidőben):**

  | | Organikus látogató/hó | Vásárlás aránya | Átlag nettó | Nettó/hó |
  |---|---|---|---|---|
  | Gyenge | 5000 | 1% | 2700 Ft | **kb. 135 ezer Ft** |
  | Közepes | 30 000 | 1,5% | 2700 Ft | **kb. 1,2 millió Ft** |
  | Jó | 80 000 | 2% | 2700 Ft | **kb. 4,3 millió Ft** |
- Szezonalitás: szeptember–június erős, nyáron gyenge. Az éves összeg kb. a havi × 9.
- **Fedezeti pont:** a fix költség (tanítói tartalom- és hangfelvétel-díj, domain, eszközök) **kb. 500–800 ezer Ft egyszeri [B]**, ez **kb. 250 eladásnál** megtérül.

### Kockázatok
1. **Ingyenes alternatívák:** tanári Wordwall-feladatok, munkafüzetek, esetleges állami digitális tartalmak **[M]**.
2. **Felső korlát:** csak magyar nyelv, ezért az éves bevétel jó esetben is kb. 10–30 millió Ft.
3. **Pedagógiai minőség:** tanítói átnézés kell, különben rossz értékelések jönnek.
4. **Szezonalitás.**

### 2 hetes validáció
1. Keyword Planner a 15 legfontosabb kifejezésre („j ly feladatok”, „helyesírás gyakorló 3. osztály”, „egybe vagy külön feladatok”). **Tovább, ha a top 15 együtt ≥ 20 000 keresés/hó [D].**
2. 10 szülő- és 5 tanítóinterjú egy kattintható prototípussal.
3. Egy ingyenes „j vagy ly” mini-gyakorló élesben, „teljes csomag: 2990 Ft, értesíts” gombbal. **Tovább, ha 30 nap alatt ≥ 3% kattint a gombra.**

---

## B) Költözési dobozleltár QR-címkékkel

### Mi a termék?
Fotó a doboz tartalmáról, automatikus tárgycímkék (eszközön futó képfelismerés), nyomtatható QR-címkeív (PDF), „melyik dobozban van a…?” keresés, megosztás a családdal a saját iCloud-on keresztül. Később folyamatos **otthoni tároló-leltárként** is használható (padlás, garázs, raktár).

### Piac
- **USA:** évente 25,6–39,6 millió költöző ember (a két Census-felmérés eltér). Háztartásra vetítve kb. 10–16 millió költözés **[B]**.
- **Magyarország:** az Otthon Start óta 33 000+ lakásvásárlás, plusz élénk albérletpiac. Kis piac.

### Verseny (itt romlott a kép)
- **A Sortly-nak van ingyenes, kifejezetten költözéshez szánt verziója** (a 2026-os útmutatók szerint a legtöbbet ajánlott app, QR-címkékkel). A fizetős csomagjai üzleti célúak (49–299 $/hó).
- Ingyenes tervezők (MoveAdvisor), általános jegyzetappok, sok kis app (Boxy lifetime 49,99 $, Kargo, BoxSmartly, Sorell 2026-tól). **Egyiknek sincs látható nagy értékelésszáma.** Ez utalhat gyenge fizetési hajlandóságra.

### Fizetési hajlandóság és élettartam-érték
- Egy ember **átlagosan csak néhány évente költözik**, ezért az egyszeri ár az egész élettartam-érték.
- Sokan filccel írnak a dobozra. Fizetni a „mindent tudni akarok, hol van” típus fog.
- **Kiterjesztés:** az otthoni tárolás-leltár és a biztosítási tárgyleltár (fotók káresetre) folyamatos használatot adhat. Ez ugyanakkor már más pozíció.

### Technika (szerver nélkül)
- iOS: VisionKit és Core ML (tárgycímkék), Core Image QR-kód, PDF-címkeív, CloudKit-megosztás (Apple-szerver, nem saját). Fejlesztés kb. 3–5 hét **[B]**.
- Webes ingyenes eszköz SEO-hoz: **QR-címkegenerátor a böngészőben**, ami az appot hozza.

### Matek [B]
- Ár: **9,99 $ egyszeri**, nettó kb. 8,5 $ (kb. 3000 Ft).
- **Tölcsér (angol SEO, 9–12 hónap után):**

  | | Látogató/hó | Telepítés | Fizetés | Nettó/hó |
  |---|---|---|---|---|
  | Gyenge | 10 000 | 2% | 5% | **kb. 30 ezer Ft** |
  | Közepes | 50 000 | 3% | 6% | **kb. 270 ezer Ft** |
  | Jó | 200 000 | 4% | 8% | **kb. 1,9 millió Ft** |
- A „költözés” SEO (checklistek, csomagolási útmutatók) **erősen versenyzett**: nagy költöztetőcégek, ingatlanportálok és médiaoldalak ülnek rajta.
- **Fedezeti pont:** alacsony fix költség mellett hamar megvan, de **a plafon szerény**.

### Kockázatok
1. A Sortly ingyenes költözős verziója.
2. Alacsony élettartam-érték (ritka esemény).
3. Erősen versenyzett SEO.
4. Az Apple vagy a Google Lens beépítheti a „mi van a dobozban” funkciót **[B]**.

### 2 hetes validáció
1. Ingyenes böngészős QR-címkegenerátor + várólista. **Tovább, ha 3 hét alatt ≥ 200 feliratkozó** organikus és közösségi forgalomból (r/moving, költözős csoportok).
2. Keyword Planner: „moving box labels”, „moving inventory app”, „QR code moving boxes”.

---

## Összevetés

| Szempont | Helyesírás-gyakorló | Dobozleltár |
|---|---|---|
| Időtálló tartalom | **Igen** (AkH. 12, 2015 óta) | Igen |
| Verseny | **Gyenge, széttagolt** | Ingyenes Sortly + sok kis app |
| Visszatérő használat | **Heti (iskolaidőben)** | Ritka (költözés) |
| Piac felső korlátja | Csak magyar: évi kb. 10–30 millió Ft | Globális, de alacsony fizetési hajlandóság |
| Terjesztés | **SEO szabályonként + tanárok** | Versenyzett SEO |
| Szerver nélkül | **Igen** (statikus PWA) | Igen (CloudKit) |
| **Pont** | **6,0** | **5,5** |

**Ajánlás [D]:** a **Helyesírás-gyakorlóval** indulj, web-first. Ha a 2 hetes validáció átmegy, a motor (szabálycsomag, gyakorló, hibanapló) később más tantárgyakra is kiterjeszthető: szorzótábla, nyelvtani elemzés, idegen nyelvi szavak. Ez ugyanaz a „szerver nélkül, egyszer lefejlesztve” modell.

## Források
- Általános iskolások száma: https://eduline.hu/kozoktatas/20260114_KSH-pedagogusok-szama-20252026os-tanev , https://www.ksh.hu/infografika/2025/iskolakezdes_hu.pdf
- Iskolakezdési költések: https://www.economx.hu/magyar-gazdasag/2025/09/11/cib-bank-szulok-iskolakezdes-takarekoskodas-100-ezer-forint-gyermek-815915/
- Helyesírási szabályzat (AkH. 12): https://publikacio.uni-eszterhazy.hu/8334/1/07_D%C5%91ryn%C3%A9%20Z%C3%A1br%C3%A1di%20Orsolya.pdf , https://real.mtak.hu/211576/1/06_Laczk%C3%B3%20Krisztina.pdf
- „A Helyes!” app: https://eduline.hu/kozoktatas/helyesirasi_app_EY0VMK
- Ingyenes appok kisiskolásoknak: https://eduline.hu/cimke/kisiskolas
- Iskolai mobilrendelet: https://telex.hu/belfold/2024/08/28/iskolak-mobilhasznalat-okoseszkoz-korlatozas-jogszabaly-rendelet-iskolakezdes-pedagogusok
- Költözési statisztika (USA): https://www.homesnacks.com/moving-statistics/
- Sortly árak és ingyenes költözős verzió: https://costbench.com/software/inventory-management/sortly/ , https://www.movingplace.com/moving-advice/the-best-moving-apps , https://junehomes.com/blog/2024/01/02/best-moving-apps/
- Dobozleltár-appok: https://apps.apple.com/us/app/-/id6639614595 , https://mwm.ai/apps/moving-boxes-kargo/6775550215 , https://mwm.ai/apps/sorell/6781130460
