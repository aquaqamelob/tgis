# Algorytm TGiS — 2 poprawne odpowiedzi po **pełnym shuffle**

Zaznaczasz **2 z 4 zdań**. Kolejność na ekranie **nie ma znaczenia** — liczy się wyłącznie **treść** zdania.

---

## Co NIE działa po shuffle

| Metoda | Po losowym shuffle |
|--------|-------------------|
| Zaznacz zawsze **1 i 3** | **~17%** (losowo powinno być ~8% — lekko lepsze przez układ PDF, ale bezużyteczne) |
| Patrz na numer / pozycję | **0% sensu** |

Quiz miesza odpowiedzi przy każdym pytaniu (`shuffleChoices` w `QuizRunner`) — ocena idzie po `choice.correct`, nie po miejscu.

---

## Co DZIAŁA — algorytm treści (5 kroków)

```
1. Typ pytania     → prawdziwe vs fałszywe (w3z9)
2. Struktura       → 3+1 / 4× ten sam starter / lustra
3. Pułapki         → odrzuć oczywiste bzdury
4. Sygnały         → ∈, wtw, Dowód, n−2…
5. Scoring reszty  → tie-break po długości tekstu, nie po numerze
```

**Backtest:** `python3 scripts/content-algorithm.py` → **70/70** na tym zbiorze, **0 błędów** przy 1000× losowym shuffle każdego pytania.

Skrypt: [`scripts/content-algorithm.py`](scripts/content-algorithm.py) — zero odwołań do pozycji 1/3.

---

## KROK 0 — typ pytania

| Nagłówek | Co zaznaczasz |
|----------|----------------|
| **Wskaż prawdziwe** | 2 zdania **PRAWDZIWE** |
| **Wskaż fałszywe** | 2 zdania **FAŁSZYWNE** (tylko w3z9!) |

Dla **fałszywych**: szukaj zdań br br brzmiących „mądrze”, ale z błędem w definicji (Euler: wierzchołki zamiast krawędzi, „najmniejsza suma wag” itp.).

---

## KROK 1 — struktura 4 odpowiedzi

### A) **3+1** (3 zdania zaczynają się tak samo, 1 inaczej)

17 pytań. **Odmienny** (ten 1) jest **często poprawny** — wybierz go + **najlepsze** z trójki.

**Wyjątki — odmienny to pułapka, bierz 2 z wi większości:**
- zaczyna się od: **Oba**, **Powstaje**, **Algorytm**, **Pomiędzy**, **Dwie**

**Specjalne przypadki 3+1:**
- **Oba** + Kn/Cn → `(n−1)`-regularny dla **Kn** + **2-regularny** dla **Cn**
- **Algorytm** + Prima/Kruskal → oba zdania **„W algorytmie…”** (nie „Algorytm dopuszcza…”)

### B) **4× ten sam starter** (4 zdania, ten sam pierwszy wyraz)

4 pytania: pętla, Kn/Cn, drogi, K3/K5.

| Temat | Poprawne wzorce |
|-------|-----------------|
| **Pętla** | „o **dwa**” + krawędź **xx** |
| **Graf Kn/Cn** | Kn `(n−1)`-regularny + Cn **2-regularny** |
| **Drogą…** | elementarna (bez powtórzeń **wierzchołka**) + prosta (bez powtórzeń **krawędzi**) |
| **Graf K… planarność** | **K3,3** i **K5** nieplanarne (nie K4!) |

### C) **Lustra** (2 pary: prawie identyczne zdania, 1 słowo zmienione)

~47 pytań ma takie pary. Zawsze wybierz **jedno z każdej pary**:

| Para | Bierz | Odrzuć |
|------|-------|--------|
| parzysta / **nie**parzysta | parzysta (w kontekście lematu) | nieparzysta |
| **symetr**yczna / antysymetr | symetryczna | antysymetryczna |
| o **dwa** / o **jeden** | o dwa (pętla!) | o jeden |
| **n−2** / n−1 (kod Prüfera) | **n−2** | n−1, 2n−1 |
| **elementarn**a / **prost**a (droga) | elementarna | „długości co najwyżej 3” |
| **∼** / □ (izomorfizm) | **G∼=H** | G□H |
| homeomorficzne **jeżeli**… / **tę samą liczbę** | definicja przez subdivizję | „tę samą liczbę wierzchołków” |
| Hamilton / **Euler** (TSP) | **Hamilton** | Euler |
| Kn **(n−1)** / Kn **2-regularny** (zamiana z Cn) | prawdziwe wzory | zamienione Kn↔Cn |

Jeśli lustro rozstrzyga **1** odpowiedź → drugą dobierz z pozostałych (najwyższy score, patrz KROK 3).

---

## KROK 2 — pułapki (odrzuć od razu)

Zdanie **prawie na pewno fałszywe**, jeśli zawiera:

| Pułapka | Przykład |
|---------|----------|
| **synonim** | „pseudograf jest synonimem grafu prostego” |
| **zawsze** / **wyłącznie** | absolutyzmy (wyjątek: „zawsze symetryczna” przy macierzy sąsiedztwa) |
| **Zawiera…** / **Sortujemy…** / **Wybieramy…** | startery fałszywek |
| **identyczny** stopień = sąsiedni | |
| **ujemne** wartości w macierzy sąsiedztwa | |
| **a+ a= 2a**, **a·b= 1** | bool — złe wzory |
| **K4 nieplanarny** | K4 jest planarny! |
| **most = liść** / **synonim krawędzi lekkiej** | |
| **Dijkstra** rozwiąże TSP | |
| **Euler** zamiast **Hamilton** (i odwrotnie) | |

**Reguła 2 pułapek:** jeśli **dokładnie 2** odpowiedzi to pułapki → zaznacz **pozostałe 2**.

**Reguła boolowska (w2z3):** poprawne to **a·a= a** i **a+ a·b= a**.

---

## KROK 3 — sygnały „prawdziwości” (punkty)

Im więcej sygnałów, tym bardziej prawdziwe (+):

| + | − |
|---|---|
| **∈**, **/ ∈** | synonim, identyczny |
| **wtedy i tylko wtedy** | zawsze (bez kontekstu) |
| **Dowód** / **dowód opiera się** | Zawiera, Sprowadza (jako starter) |
| **n−2** (kod Prüfera) | n−1, 2n−1 dla kodu |
| **zero-jedynkowa** | ujemne wartości |
| **⊕** (skojarzenia) | |
| **nn−2** (Cayley) | |
| **Kuratowski** | |
| **NP-trudnych** | |
| długie zdanie (≥75 znaków, ≥11 słów) | krótkie absolutyzmy |

Dla **„Wskaż fałszywe”**: wybierz 2 z **najniższym** score (najbardziej fałszywe).

---

## KROK 4 — szybka checklista na kolokwium

1. Przeczytaj **nagłówek** (prawdziwe / fałszywe)
2. Czy widać **3+1** lub **4×**?
3. Czy są **pary lustrzane**? → rozstrzygnij obie
4. Wykreśl **pułapki** (zawsze, synonim, Zawiera…)
5. Zostały 2? → zaznacz. Zostały 3+? → weź z **∈**, **wtw**, **Dowód**
6. Nie wiesz? → `SAFE-ODPOWIEDZI.md` + powtarzaj w quizie

---

## Skuteczność — uczciwie

| Metoda | Trafienia (ten PDF, 70 pytań) |
|--------|------------------------------|
| Pozycja 1+3 **po shuffle** | **~17%** — nie używaj |
| Pozycja 1+3 przed shuffle | 70/70 — ale na egzaminie i tak pomieszane |
| Algorytm treści (ten dokument + skrypt) | **70/70**, shuffle-invariant |
| Samo „zapamiętaj pułapki” bez lustra | ~50/70 |
| Sam scoring bez struktury | ~48/70 |

**Na kolokwium:** ten PDF to zamknięty zbiór — algorytm + `SAFE-ODPOWIEDZI.md` dają pełne pokrycie. Gdyby pojawiły się **nowe** sformułowania spoza PDF, nadal potrzebujesz definicji z wykładu.

---

## 10 pytań „na pamięć” (mało struktury)

Te mają słabe wzorce — naucz się treści z `SAFE-ODPOWIEDZI.md`:

`w2z7` `w4z7` `w5z1` `w5z10` `w6z1` `w6z6` `w6z9` `w32z6` `w32z9` + jedno losowe z twojej słabej serii

---

## Powiązane pliki

- `SAFE-ODPOWIEDZI.md` — pełna ściąga z treścią ✅ (szukaj po słowach, nie numerach)
- `scripts/content-algorithm.py` — weryfikacja algorytmu + shuffle test
- `src/data/questions.json` — baza quizu
- Quiz: `cd quiz && bun dev`
