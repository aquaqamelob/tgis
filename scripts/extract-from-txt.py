#!/usr/bin/env python3
"""pytania.txt → questions.json. W txt: prawdziwe w op. 1 i 3, fałszywe w op. 2 i 4."""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "pytania.txt"
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "questions.json"

WEEK_LABELS = {
    "W1": "Wykład 1 – podstawy grafu",
    "W2": "Wykład 2 – podgrafy i operacje",
    "W3": "Wykład 3 – drogi, spójność, Euler",
    "W32": "Wykład 3b – Dijkstra, Hamilton, TSP",
    "W4": "Wykład 4 – drzewa i MST",
    "W5": "Wykład 5 – niezależność i skojarzenia",
    "W6": "Wykład 6 – planarność",
}


def week(qid: str) -> str:
    return "W32" if qid.startswith("w32") else f"W{qid[1]}"


def merge_hyphens(lines: list[str]) -> list[str]:
    out = []
    for line in lines:
        if out and out[-1].endswith("-") and line[:1].islower():
            out[-1] = out[-1][:-1] + line
            continue
        if out and out[-1].endswith("-"):
            out[-1] = out[-1][:-1]
        out.append(line)
    return out


def finish(line: str) -> str:
    line = re.sub(r"\s+", " ", line.strip())
    return line if line.endswith(".") else line + "."


def take_choices(body: list[str], start: int) -> list[str]:
    choices, buf = [], []
    for line in body[start:]:
        buf.append(line)
        if line.rstrip().endswith("."):
            choices.append(finish(" ".join(buf)))
            buf = []
            if len(choices) == 4:
                break
    return choices


def parse_block(chunk: str) -> tuple[str, list[str]]:
    lines = [l.strip() for l in chunk.strip().split("\n") if l.strip()]
    header = lines[0].split("].", 1)[-1].strip().lstrip("♣").strip()
    body = merge_hyphens(
        [l for l in lines[1:] if l != "Katalog" and not l.startswith("Pytanie [")]
    )

    prompt = header
    i = 0
    while not prompt.rstrip().endswith(".") and i < len(body):
        prompt = f"{prompt.rstrip()} {body[i]}"
        i += 1

    return finish(prompt), take_choices(body, i)


def main():
    text = SRC.read_text(encoding="utf-8")
    text = text[text.index("Pytanie [") :]

    questions = []
    for chunk in re.split(r"(?=Pytanie \[)", text):
        if not chunk.strip().startswith("Pytanie ["):
            continue
        qid = chunk.split("[", 1)[1].split("]", 1)[0]
        prompt, choices = parse_block(chunk)
        w = week(qid)
        pick_false = "fałszywe" in prompt.lower()
        questions.append(
            {
                "id": qid,
                "week": w,
                "weekLabel": WEEK_LABELS[w],
                "prompt": prompt,
                "pickFalse": pick_false,
                "choices": [
                    {
                        "text": t,
                        "correct": i in ((1, 3) if pick_false else (0, 2)),
                    }
                    for i, t in enumerate(choices)
                ],
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    bad = [q["id"] for q in questions if len(q["choices"]) != 4]
    print(f"{len(questions)} pytań → {OUT}")
    print("problemy:", bad or "brak")


if __name__ == "__main__":
    main()
