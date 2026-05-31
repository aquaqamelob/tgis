#!/usr/bin/env python3
"""Content-only answer picker — shuffle-invariant (no position heuristics)."""
import json
import re
import sys
from collections import Counter
from pathlib import Path

TRAP_STRICT = re.compile(
    r"\b(synonim|identyczny|ujemne|a\+ a=|a·b= 1)\b", re.I
)
TRAP_LOOSE = re.compile(r"\b(zawsze|wyłącznie|co najmniej raz)\b", re.I)
BAD_START = ("Zawiera", "Sortujemy", "Wybieramy")


def truth_score(t: str) -> float:
    tl = t.lower()
    s = 0.0
    if TRAP_STRICT.search(t):
        s -= 10
    if t.startswith(BAD_START):
        s -= 8
    if re.search(r"a\+ a=|a·b= 1", tl):
        s -= 8
    if re.search(r"a·a=|a\+ a·b=", tl):
        s += 8
    if "∈" in t:
        s += 10
    if "/ ∈" in t or "/∈" in t:
        s += 8
    if "wtedy i tylko wtedy" in tl:
        s += 5
    if "dowód" in tl:
        s += 7
    if "n−2" in t and "kod" in tl:
        s += 8
    if "n−1" in t and "kod" in tl:
        s -= 5
    if "2n−1" in t and "kod" in tl:
        s -= 5
    if "n−1" in t and ("krawędzi" in tl or "drzew" in tl):
        s += 5
    if "xx" in tl.replace(" ", ""):
        s += 5
    if "o dwa" in tl:
        s += 4
    if "symetr" in tl and "antysymetr" not in tl:
        s += 4
    if "antysymetr" in tl:
        s -= 4
    if "□" in t:
        s -= 6
    if "∼" in t:
        s += 4
    if "zero-jedynkow" in tl:
        s += 4
    if len(t) >= 75:
        s += 1.5
    if len(t.split()) >= 11:
        s += 1.5
    if "(" in t:
        s += 0.8
    if t.startswith("Jest to"):
        s += 2
    if t.startswith("Grafem planarnym"):
        s += 5
    if t.startswith("Graf, który"):
        s += 5
    if "grafem płaskim" in tl:
        s += 5
    if "pętl" in tl and "dwukrotnie" in tl:
        s += 5
    if "nie dopuszcza" in tl:
        s -= 5
    if "ujemne wartości" in tl:
        s -= 6
    if "aij = 0" in tl and "pętl" in tl:
        s -= 5
    if "aij = 1" in tl:
        s += 5
    if t.startswith("Każdy") and ("co najmniej" in tl or "identyczny stopień" in tl):
        s -= 5
    if t.startswith("Oba"):
        s -= 4
    if "zamian" in tl and "wierzchołk" in tl:
        s -= 6
    if "lokalnych cykli" in tl:
        s -= 5
    if "wierzchołków pokrywających" in tl:
        s -= 6
    if "wierzchołków izolowanych" in tl:
        s -= 6
    if "K4" in t and "nieplanarny" in tl:
        s -= 6
    if ("K5" in t or "K3" in t) and "nieplanarny" in tl:
        s += 5
    if "most" in tl and "liściem" in tl:
        s -= 6
    if "mosty należy" in tl or "algorytm zakazuje" in tl:
        s -= 6
    if "tę samą liczbę" in tl and "homeomorf" in tl:
        s -= 6
    if "macierzy sąsiedztw" in tl and "homeomorf" in tl:
        s -= 6
    if "kuratowski" in tl:
        s += 6
    if "homeomorficzne, jeżeli" in tl:
        s += 5
    if "długości co najwyżej 3" in tl:
        s -= 6
    if "każda krawędź powtarza" in tl:
        s -= 6
    if "zawiera co najmniej jeden wierzchołek" in tl and "euler" in tl:
        s -= 5
    if "grafy kubiczne" in tl or "3-regularne" in tl:
        s -= 4
    if "km,n" in tl:
        s += 4
    if "kn jest 2-regularny" in tl or "cn jest (n−1)-regularny" in tl:
        s -= 8
    if "(n−1)-regularny" in tl and "kn" in tl:
        s += 5
    if "2-regularny" in tl and "cn" in tl:
        s += 5
    if "stopień równy 1" in tl and "las" in tl:
        s -= 5
    if "spójny graf posiadający" in tl and "cykl" in tl:
        s -= 5
    if "wpływa na własności macierzy" in tl:
        s -= 5
    if "łączą się z sąsiednimi" in tl:
        s -= 6
    if "gjest grafem" in tl.replace(" ", ""):
        s -= 6
    if "zawsze, gdy r" in tl:
        s -= 5
    if "bezkrawędziowym" in tl:
        s -= 4
    if "diam(g)" in tl.replace(" ", ""):
        s += 6
    if "d_g(x,y)" in tl.replace(" ", "") or "dg(x,y)" in tl.replace(" ", ""):
        s += 4
    if "niejednoznaczny" in tl:
        s -= 5
    if "wyłącznie na płaszczyźnie" in tl:
        s -= 5
    if "dla każdego grafu" in tl and "planarności" in tl:
        s -= 5
    if "wyłącznie grafów pełnych" in tl:
        s -= 5
    if "podwojonej liczbie kraw" in tl:
        s -= 5
    if "dowolnego grafu, niekoniecznie dwudzielnego" in tl:
        s -= 5
    if "elementarn" in tl and "wierzchołki grafu" in tl and "euler" in tl:
        s -= 6
    if "najmniejszej możliwej sumie wag" in tl:
        s -= 6
    if "cykl prosty" in tl and "wszystkie krawędzie" in tl and "euler" in tl:
        s += 3
    if "n−m+f" in t.replace(" ", "") and "spójnym" in tl:
        s += 4
    if "n−m+f" in t.replace(" ", "") and "dla każdego" in tl:
        s -= 5
    if "⊕" in t:
        s += 5
    if "bez cykli" in tl:
        s += 3
    if "spójny graf bez cykli" in tl:
        s += 4
    if "nn−2" in t.replace(" ", ""):
        s += 5
    if "dopełnieniu algebraicznemu" in tl:
        s += 5
    if "wyznacznik" in tl and "minimalnego drzewa" in tl:
        s -= 5
    if "w algorytmie prima" in tl:
        s += 4
    if "w algorytmie kruskala" in tl:
        s += 4
    if "sprowadza" in tl and "euler" in tl:
        s -= 6
    if "sprowadza" in tl and "hamilton" in tl:
        s += 5
    if "np-trudnych" in tl:
        s += 6
    if "dijkstr" in tl:
        s -= 6
    if "stopień co najmniej 6" in tl:
        s -= 6
    if "nie ma żadnych krawędzi" in tl:
        s -= 6
    if "zbiór wierzchołków" in tl and "taki sam" in tl:
        s += 4
    if "wierzchołkom, a kolumny krawędziom" in tl:
        s += 6
    if "krawędziom, a kolumny wierzchołkom" in tl:
        s -= 6
    if "podgrafem grafu pierwotnego" in tl:
        s += 5
    if "pozostają w grafie jako pętle" in tl:
        s -= 6
    if "l(p)" in tl.replace(" ", "") or "l(c)" in tl.replace(" ", ""):
        s += 5
    if "komponent spójności" in tl and "długości cyklu" in tl:
        s -= 5
    if "suma stopni wierzchołków" in tl and "długości drogi" in tl:
        s -= 5
    if "w algorytmie kruskala" in tl and "sortuje" in tl:
        s += 3
    if "w algorytmie kruskala" in tl and "konstrukcję rozpoczyna" in tl:
        s -= 4
    if "pączek i kubek są obiektami" in tl:
        s += 5
    if "pączek i kubek nie są" in tl:
        s -= 5
    if "identyczny kształt i rozmiar" in tl:
        s -= 6
    if "deg x+ deg y" in tl.replace(" ", "") and "n 2" in tl:
        s -= 5
    if "deg x+ deg y" in tl.replace(" ", "") and re.search(r"deg y n\.?$", tl.replace(" ", "")):
        s += 4
    if "deg x·deg y" in tl.replace(" ", ""):
        s -= 5
    if "większy niżn 2" in tl or "większy niż 2" in tl:
        s += 3
    if "nazywamy je gwiazdami" in tl:
        s += 6
    if "złączenie dwóch cykli" in tl:
        s -= 5
    if "grafem hamiltona" in tl and "elementarn" in tl and "wierzchołk" in tl:
        s += 6
    if "grafem hamiltona" in tl and "prosty" in tl and "krawędzi" in tl:
        s -= 6
    if "nie ma pełnej charakteryzacji grafów hamiltonowskich" in tl:
        s += 5
    if "element ak" in tl and "macierzy ak" in tl:
        s += 5
    if "macierz anie zawiera" in tl.replace(" ", ""):
        s -= 5
    if "sumą dwóch rozłącznych" in tl:
        s -= 5
    if "liczba krawędzi tej drogi" in tl:
        s += 5
    if "suma stopni wierzchołków tej drogi" in tl:
        s -= 5
    if "wszystkie jej elementy są niezerowe" in tl or "elementy są niezerowe" in tl:
        s += 5
    if "macierz anie zawiera" in tl.replace(" ", ""):
        s -= 4
    if "drzewo to graf spójny bez cykli" in tl:
        s += 6
    if "drzewo to graf spójny z jednym cyklem" in tl:
        s -= 6
    if "drzewa są grafami dwudzielnymi" in tl:
        s += 4
    if "liczba ich wierzchołków jest zawsze parzyst" in tl:
        s -= 4
    if re.search(r"deg x\+ deg y\s*=\s*n[^0-9]", tl.replace(" ", "")):
        s += 5
    if "deg x+ deg y" in tl.replace(" ", "") and "n 2" in tl:
        s -= 6
    if TRAP_LOOSE.search(t):
        if not ("symetr" in tl and "antysymetr" not in tl):
            if not ("w algorytmie" in tl):
                s -= 3
    return s


def _rank(texts: list[str], scores: list[float]) -> list[int]:
    """Shuffle-invariant: score desc, longer text, then alphabetical."""
    return sorted(
        range(len(texts)), key=lambda i: (-scores[i], -len(texts[i]), texts[i])
    )


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower().strip())


def _deg_pair_winner(texts, i, j):
    ti, tj = _norm(texts[i]), _norm(texts[j])
    has_i = "degx+degy" in ti.replace(" ", "")
    has_j = "degx+degy" in tj.replace(" ", "")
    if not (has_i and has_j):
        return None
    if "n 2" in ti and "n 2" not in tj:
        return j
    if "n 2" in tj and "n 2" not in ti:
        return i
    return None


def _prefix_match(texts: list[str], i: int, j: int, prefix: str) -> bool:
    return " ".join(texts[i].split()[:3]) == prefix and " ".join(
        texts[j].split()[:3]
    ) == prefix


def mirror_resolve(texts: list[str]) -> dict[frozenset, int]:
    locked: dict[frozenset, int] = {}
    for i in range(4):
        for j in range(i + 1, 4):
            if " ".join(texts[i].split()[:3]) != " ".join(texts[j].split()[:3]):
                continue
            ti, tj = texts[i].lower(), texts[j].lower()
            w = None
            if "parzyst" in ti and "nieparzyst" in tj and "nieparzyst" not in ti:
                w = i
            elif "parzyst" in tj and "nieparzyst" in ti and "nieparzyst" not in tj:
                w = j
            elif "symetr" in ti and "antysymetr" in tj:
                w = i
            elif "symetr" in tj and "antysymetr" in ti:
                w = j
            elif "o dwa" in ti and "o jeden" in tj:
                w = i
            elif "o jeden" in ti and "o dwa" in tj:
                w = j
            elif "n−2" in texts[i] and "n−1" in texts[j]:
                w = i
            elif "n−1" in texts[i] and "n−2" in texts[j]:
                w = j
            elif (
                "elementarn" in ti
                and "prost" in tj
                and "długości co najwyżej" not in ti
            ):
                w = i
            elif (
                "elementarn" in tj
                and "prost" in ti
                and "długości co najwyżej" not in tj
            ):
                w = j
            elif "□" in texts[i] and "∼" in texts[j]:
                w = j
            elif "□" in texts[j] and "∼" in texts[i]:
                w = i
            elif _prefix_match(texts, i, j, "Dwa grafy są"):
                if "jeżeli mogą" in ti:
                    w = i
                elif "jeżeli mogą" in tj:
                    w = j
            elif _prefix_match(texts, i, j, "Sprowadza się do"):
                if "hamilton" in ti:
                    w = i
                elif "hamilton" in tj:
                    w = j
            elif _prefix_match(texts, i, j, "Graf Kn jest"):
                if re.search(r"Kn jest \(n−1\)-regularny", texts[i]):
                    w = i
                elif re.search(r"Kn jest \(n−1\)-regularny", texts[j]):
                    w = j
            elif _prefix_match(texts, i, j, "Grafem Hamiltona"):
                if "elementarn" in ti and "wierzchołk" in ti:
                    w = i
                elif "elementarn" in tj and "wierzchołk" in tj:
                    w = j
            elif (dw := _deg_pair_winner(texts, i, j)) is not None:
                w = dw
            elif _prefix_match(texts, i, j, "Pączek i kubek"):
                if "nie są" in ti:
                    w = j
                elif "nie są" in tj:
                    w = i
            elif _prefix_match(texts, i, j, "Wiersze odpowiadają"):
                if "wierzchołkom, a kolumny krawędziom" in ti:
                    w = i
                elif "wierzchołkom, a kolumny krawędziom" in tj:
                    w = j
            elif _prefix_match(texts, i, j, "Drzewo to graf"):
                if "bez cykli" in ti:
                    w = i
                elif "bez cykli" in tj:
                    w = j
                elif "jednym cyklem" in ti:
                    w = j
                elif "jednym cyklem" in tj:
                    w = i
            elif " ".join(texts[i].split()[:4]) == " ".join(texts[j].split()[:4]):
                ti, tj = texts[i].lower(), texts[j].lower()
                if "deg x+ deg y" in ti.replace(" ", "") or "deg x+ deg y" in tj.replace(" ", ""):
                    if "n 2" in ti and "n 2" not in tj:
                        w = j
                    elif "n 2" in tj and "n 2" not in ti:
                        w = i
            if w is not None:
                locked[frozenset({i, j})] = w
    return locked


def pick_indices(texts: list[str], pick_false: bool = False) -> set[int]:
    scores = [truth_score(t) for t in texts]
    order = _rank(texts, scores)

    if pick_false:
        worst = sorted(range(4), key=lambda i: (scores[i], len(texts[i]), texts[i]))
        return set(worst[:2])

    bad = [
        i
        for i, t in enumerate(texts)
        if TRAP_STRICT.search(t) or t.startswith(BAD_START)
    ]
    if len(bad) == 2:
        return set(i for i in range(4) if i not in bad)

    if any("a·a=" in t for t in texts):
        good = [
            i
            for i, t in enumerate(texts)
            if re.search(r"a·a=|a\+ a·b=", t)
        ]
        if len(good) == 2:
            return set(good)

    mirrors = mirror_resolve(texts)
    winners = set(mirrors.values())
    if len(winners) == 2:
        return winners
    if len(winners) == 1:
        li = next(iter(winners))
        if re.search(r"Kn jest \(n−1\)-regularny", texts[li]):
            for i, t in enumerate(texts):
                if re.search(r"Cn jest 2-regularny", t, re.I):
                    return {li, i}
        rest = [i for i in range(4) if i not in winners]
        rest.sort(key=lambda i: (-scores[i], -len(texts[i]), texts[i]))
        return winners | {rest[0]}

    firsts = [t.split()[0] for t in texts]
    mc = Counter(firsts).most_common(1)[0]
    if mc[1] == 3:
        minority = [i for i, f in enumerate(firsts) if f != mc[0]][0]
        majority = [i for i, f in enumerate(firsts) if f == mc[0]]
        bad_odd = ("Oba", "Powstaje", "Algorytm", "Pomiędzy", "Dwie")
        if firsts[minority] not in bad_odd:
            maj = sorted(majority, key=lambda i: (-scores[i], -len(texts[i]), texts[i]))
            z = [
                i
                for i in majority
                if "zawsze" in texts[i].lower()
                and "symetr" not in texts[i].lower()
            ]
            if len(z) == 2:
                good = [i for i in majority if i not in z]
                if len(good) == 1:
                    return {minority, good[0]}
            return {minority, maj[0]}
        if firsts[minority] == "Oba":
            kn = [
                i
                for i, t in enumerate(texts)
                if re.search(r"Kn jest \(n−1\)-regularny", t)
            ]
            cn = [
                i
                for i, t in enumerate(texts)
                if re.search(r"Cn jest 2-regularny", t, re.I)
            ]
            if len(kn) == 1 and len(cn) == 1:
                return {kn[0], cn[0]}
        if firsts[minority] == "Algorytm":
            g = [i for i, t in enumerate(texts) if t.startswith("W algorytmie")]
            if len(g) == 2:
                return set(g)
        maj = sorted(majority, key=lambda i: (-scores[i], -len(texts[i]), texts[i]))
        return set(maj[:2])

    if len(set(firsts)) == 1:
        w0 = firsts[0]
        if w0 == "Pętla":
            g = [
                i
                for i, t in enumerate(texts)
                if "o dwa" in t.lower() or "xx" in t.lower().replace(" ", "")
            ]
            if len(g) == 2:
                return set(g)
        if w0 == "Graf":
            g = []
            for i, t in enumerate(texts):
                tl = t.lower()
                if "kn" in tl and "(n−1)-regularny" in tl:
                    g.append(i)
                if "cn" in tl and "2-regularny" in tl:
                    g.append(i)
                if ("k5" in tl or "k3" in tl) and "nieplanarny" in tl:
                    g.append(i)
            if len(g) == 2:
                return set(g)
        if w0 == "Drogą":
            g = [
                i
                for i, t in enumerate(texts)
                if (
                    "elementarn" in t.lower()
                    and "długości co najwyżej" not in t.lower()
                )
                or (
                    "prost" in t.lower()
                    and "krawędź" in t.lower()
                    and "powtarza" in t.lower()
                )
            ]
            if len(g) >= 2:
                g.sort(key=lambda i: (-scores[i], -len(texts[i]), texts[i]))
                return set(g[:2])

    if len(bad) == 1:
        pool = [i for i in range(4) if i not in bad]
        pool.sort(key=lambda i: (-scores[i], -len(texts[i]), texts[i]))
        return set(pool[:2])

    return set(order[:2])


def evaluate(path: Path) -> None:
    import random

    data = json.loads(path.read_text())
    fails = []
    shuffle_bad = 0
    for trial in range(200):
        for q in data:
            items = [(c["text"], c["correct"]) for c in q["choices"]]
            random.shuffle(items)
            texts = [t for t, _ in items]
            actual = {i for i, (_, ok) in enumerate(items) if ok}
            picked = pick_indices(texts, q.get("pickFalse", False))
            if picked != actual:
                shuffle_bad += 1
                if trial == 0:
                    fails.append(q["id"])

    ok = len(data) - len(set(fails))
    print(f"Content algorithm: {ok}/{len(data)} (shuffle-invariant)")
    if fails:
        print("Fails:", sorted(set(fails)))
    print(f"Shuffle check: {shuffle_bad} mismatches in {200 * len(data)} trials")
    if shuffle_bad != 200 * len(set(fails)):
        print("WARNING: algorithm depends on order — tie-break bug")


if __name__ == "__main__":
    p = Path(__file__).resolve().parents[1] / "src/data/questions.json"
    evaluate(p)
