# Szerver nélküli, „egyszer lefejlesztem” ötletek

*Készült: 2026-10-24. Feltétel: minden a felhasználó eszközén fut, nincs backend, és a termék nem igényel folyamatos adat- vagy szabályfrissítést. A **[B]** jel becslést, a **[M]** azt jelöli, amit mérni kell.*

## Két őszinte alapigazság
1. **A „teljesen egyszer” nem létezik.** Az iOS és az Android évente változik, az áruházi szabályok is. Számolj **évi 2–5 nap karbantartással [B]**. Ami tényleg kiesik: a szerverköltség, az ügyeleti szolgálat és a rendszeres adatfrissítés.
2. **Ilyen termékeknél nem a fejlesztés a nehéz, hanem a terjesztés.** Csak magyar piacra a felső határ jellemzően **évi néhány millió Ft [B]**. Angolul, globálisan, SEO-val és ASO-val a felső határ egy nagyságrenddel nagyobb. **Ezért mindegyiket angol + magyar nyelvűre tervezném.**

## Kiesett, mert nem „egyszeri”
- **Bróker- és kriptóadó-kalkulátor:** évente változnak a szabályok és a brókerek exportformátumai, ezért évi 1–2 hét frissítés kell. A matek viszont továbbra is a legjobb (7,3), ezért kivételként érdemes fejben tartani.
- Minden, ami árfolyamot, jogszabályi kulcsot, menetrendet vagy külső API-t használ.

## Ötletek

| # | Ötlet | Miért most? | Ár és matek [B] | Verseny | Pont |
|---|---|---|---|---|---|
| 1 | **Költözési dobozleltár QR-címkékkel** (fotó a doboz tartalmáról, nyomtatható címke, „melyik dobozban van a…?” keresés, helyben + saját iCloud) | Magyarországon az Otthon Start óta 33 000+ lakásvásárlás, és mozgalmas az albérletpiac. Globálisan a költözés örök, éles pillanat. A tárgyak és a lakás fotói érzékeny adatok, ezért a „semmi nem hagyja el a telefont” érték | **Egyszeri 9,99 $ / 3990 Ft.** Az Apple 15%-a után kb. 8,5 $ marad. **1000 eladás/év → kb. 3 millió Ft.** SEO: „moving checklist”, „how to label moving boxes”, „what to pack first” (örökzöld tartalom) | Sok kicsi app (Boxy lifetime 49,99 $, Kargo, BoxSmartly), **mind kevés értékeléssel**. Nincs domináns szereplő | **6,0** |
| 2 | **Árajánlat-készítő szakiknak** (burkoló, festő, villanyszerelő: tételsablonok, anyagszükséglet-kalkulátor, PDF-ajánlat aláírással, offline) | Az Otthon Start miatt a Telex szerint egyes szakmákban kiugrik a felújítási kereslet. Magyar nyelvű offline ajánlatkészítőt nem találtam. **Az ajánlat nem számla**, ezért nincs NAV-bekötés, és nem kell szerver | **Egyszeri 14 990 Ft** (nettó kb. 11 800 Ft). **500 eladás → kb. 5,9 millió Ft nettó.** Terjesztés: szakmai Facebook-csoportok, YouTube-bemutató, építőanyag-kereskedők | Angol nyelvű ingyenes appok (OffGrid Quotes, Quotation Suite). A magyar piacon a számlázóprogramok részben lefedik. Kb. 66 000 építőipari cég van, az egyéni vállalkozók száma **[M]** | **6,0** |
| 3 | **Helyesírás-gyakorló gyerekeknek** (j/ly, hosszú-rövid magánhangzók, egybe-külön írás; offline, reklám és követés nélkül) | **A tartalom nem változik** (a helyesírási szabályok stabilak). A szülők tudatosabbak a képernyőidővel kapcsolatban, és az iskolákban 2024 óta korlátozott a telefonhasználat. Az Apple Kids kategóriája jutalmazza a reklámmentességet | **Egyszeri 2990 Ft.** **2000 eladás → kb. 5 millió Ft nettó.** Iskolai csomagban (osztálylicenc) több | Ingyenes feladatlapok és oldalak, oktatási appok. Magyar nyelvű, igényes, reklámmentes app kevés **[M]** | **5,5** |
| 4 | **Helyben futó átíró Windowsra** (Whisper, beszélőfelismerés, Word- és SRT-export, egyszeri licenc) | A Macen már bizonyított a modell (MacWhisper, harmadik fél becslése szerint kb. 100 000 $). Windowson főleg technikai, nyílt forrású eszközök vannak. **A modell statikus**, nem kell frissíteni. GDPR szempontból a helyi feldolgozás érték | **Egyszeri 29 €.** **300 eladás → kb. 8700 €.** Kutatók, újságírók, egyetemisták | Ingyenes nyílt forrású eszközök (Buzz és társai), felhős szolgáltatások (TurboScribe stb.) | **5,5** |
| 5 | **Kisállat-egészségnapló** (oltások, féreghajtás, gyógyszer, súly, helyi emlékeztetők, PDF az állatorvosnak) | Budapesten kb. 500 000 kutya él (2019-es becslés). Évről évre visszatérő, ismétlődő teendők | **Egyszeri 2990 Ft / 4,99 $.** Angolul globálisan **2000 eladás → kb. 3,5 millió Ft** | Sok ingyenes állatos app. Gyenge megkülönböztetés | 5,0 |
| 6 | **Felújítási költségvetés- és ütemezősablon** (Google Sheets és Excel, magyarul és angolul) | Felújítási hullám az Otthon Start körül. Közben a GKI szerint a felújítási szándék **harmadik éve stagnál**, ezért a kép vegyes | **4990 Ft / 12 $** a Gumroadon vagy az Etsyn. **500 eladás → kb. 2 millió Ft** | Az Etsy tele van sablonokkal | 4,5 |

## Ajánlás [D]
**Az 1-es (költözési dobozleltár) a legjobb „egyszer lefejlesztem” ötlet.** Örökzöld, éles pillanatra épül, a tartalom nem változik, és globálisan skálázható. Nincs domináns versenytárs, és a SEO-tartalma is időtálló. **A 2-es** a legjobb, ha a magyar piacra koncentrálsz, mert magasabb az ár és világos az ügyfélkör.

## 2 hetes validáció (mindkettőre)
1. **1-es:** landingoldal angolul és magyarul, várólista, és a Keyword Plannerben a „moving box inventory”, „label moving boxes” és „moving checklist” volumene. Tovább, ha **≥ 200 feliratkozó** jön 3 hét organikus és közösségi forgalomból.
2. **2-es:** 10 szaki-interjú (burkoló, festő, villanyszerelő) és egy PDF-ajánlat-demó. Tovább, ha **legalább 3-an előre fizetnének** 14 990 Ft-ot.

## Források
- Otthon Start szerződések: https://www.mnb.hu/letoltes/hitelezesi-folyamatok-flyer-2026q1.pdf
- Szakemberkereslet és Otthon Start: https://telex.hu/g7/2025/09/09/aremeles-szakember-otthon-start-ingatlan-felujitas
- Felújítási szándék stagnálása (GKI): https://adozona.hu/altalanos/A_lakossag_lakasfelujitasi_szandekai_harom__VSZOHX
- Építőipari cégek száma: https://www.penzcentrum.hu/cimke/opten
- Költözési dobozleltár-appok: https://apps.apple.com/us/app/-/id6639614595 , https://mwm.ai/apps/moving-boxes-kargo/6775550215 , https://iphoneaddict.fr/apps/productivite/boxsmartly-moving-boxes-843.html
- Offline ajánlatkészítők: https://apps.apple.com/us/app/offgridquotes/id6761445343 , https://apps.apple.com/mg/app/quotation-suite/id6759728830
- MacWhisper-becslés: https://startupsemail.substack.com/p/100000-revenue-with-a-simple-mac
- Iskolai mobilrendelet: https://telex.hu/belfold/2024/08/28/iskolak-mobilhasznalat-okoseszkoz-korlatozas-jogszabaly-rendelet-iskolakezdes-pedagogusok
- Kutyák Budapesten: https://telex.hu/belfold/2022/06/25/kutya-varos-kutyatartas-urulek-vizelet-koztisztasag-neveles
