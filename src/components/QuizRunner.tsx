"use client";

import { useMemo, useRef, useState } from "react";
import {
  LEVEL_LABELS,
  loadMastery,
  recordAnswer,
} from "@/lib/mastery";
import type { Choice, Question } from "@/lib/types";
import {
  expectedIndices,
  gradeAnswer,
  selectionHint,
  shuffleChoices,
} from "@/lib/quiz";

type Props = {
  questions: Question[];
  onExit: () => void;
  onRestart: () => void;
  onMasteryChange?: () => void;
};

export function QuizRunner({
  questions,
  onExit,
  onRestart,
  onMasteryChange,
}: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [levelDelta, setLevelDelta] = useState<number | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const shuffledChoices = useRef(new Map<string, Choice[]>());

  const q = useMemo(() => {
    const source = questions[index];
    if (!source) return null;

    let choices = shuffledChoices.current.get(source.id);
    if (!choices) {
      choices = shuffleChoices(source.choices);
      shuffledChoices.current.set(source.id, choices);
    }

    return { ...source, choices };
  }, [questions, index]);

  const progress = ((index + (revealed ? 1 : 0)) / questions.length) * 100;

  const expected = useMemo(
    () => (q ? expectedIndices(q) : []),
    [q]
  );

  const toggle = (i: number) => {
    if (revealed || !q) return;
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const check = () => {
    if (!q || revealed) return;
    const ok = gradeAnswer(q, selected);
    if (ok) setScore((s) => s + 1);
    setLastCorrect(ok);

    const result = recordAnswer(q.id, ok, loadMastery());
    setCurrentLevel(result.level);
    setLevelDelta(result.delta);
    onMasteryChange?.();

    setRevealed(true);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected([]);
    setRevealed(false);
    setLevelDelta(null);
    setCurrentLevel(null);
    setLastCorrect(null);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <main className="app">
        <header className="header">
          <h1>Koniec</h1>
        </header>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="score-big">
            {score}/{questions.length}
          </div>
          <p className="score-detail">{pct}% poprawnych odpowiedzi</p>
          <div className="stat-grid">
            <div className="stat">
              <strong>{score}</strong>
              <span>Dobrze</span>
            </div>
            <div className="stat">
              <strong>{questions.length - score}</strong>
              <span>Źle</span>
            </div>
          </div>
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={onRestart}>
              Jeszcze raz
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              Menu
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!q) {
    return (
      <main className="app">
        <p>Brak pytań.</p>
        <button className="btn btn-ghost" onClick={onExit}>
          Wróć
        </button>
      </main>
    );
  }

  const choiceClass = (i: number) => {
    const classes = ["choice"];
    if (selected.includes(i)) classes.push("selected");
    if (!revealed) return classes.join(" ");

    const shouldPick = expected.includes(i);
    const wasPicked = selected.includes(i);

    if (shouldPick && wasPicked) classes.push("correct");
    else if (!shouldPick && wasPicked) classes.push("wrong");
    else if (shouldPick && !wasPicked) classes.push("missed");
    return classes.join(" ");
  };

  const isCorrect = revealed && lastCorrect === true;

  return (
    <main className="app">
      <div className="progress">
        <span>
          {index + 1}/{questions.length}
        </span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{score} pkt</span>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: "0.75rem", gap: "0.5rem" }}>
          <span className="badge">{q.week}</span>
          <span className="badge">{q.id}</span>
          {q.pickFalse && (
            <span className="badge badge-warn">fałszywe</span>
          )}
        </div>

        <p className="hint">{selectionHint(q)}</p>
        <p className="question-prompt">{q.prompt}</p>

        <div className="choices">
          {q.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              className={choiceClass(i)}
              onClick={() => toggle(i)}
              disabled={revealed}
            >
              <span className="choice-num">{i + 1}</span>
              <span>{c.text}</span>
            </button>
          ))}
        </div>

        {revealed && (
          <div className={`feedback ${isCorrect ? "ok" : "bad"}`}>
            <div>
              {isCorrect
                ? "✓ Dobrze!"
                : `✗ Poprawne: ${expected.map((i) => i + 1).join(" i ")}`}
            </div>
            {currentLevel !== null && (
              <div className="mastery-feedback">
                Poziom: {currentLevel}/5 ({LEVEL_LABELS[currentLevel]})
                {levelDelta !== null && levelDelta !== 0 && (
                  <span
                    className={
                      levelDelta > 0 ? "mastery-delta up" : "mastery-delta down"
                    }
                  >
                    {levelDelta > 0 ? ` +${levelDelta}` : ` ${levelDelta}`}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="actions">
          {!revealed ? (
            <>
              <button
                className="btn btn-primary"
                onClick={check}
                disabled={selected.length === 0}
              >
                Sprawdź
              </button>
              <button className="btn btn-ghost" onClick={onExit}>
                Wyjdź
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={next}>
              {index + 1 >= questions.length ? "Wynik" : "Następne →"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
