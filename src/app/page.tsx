"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_QUESTIONS, WEEKS, pickQuestions } from "@/lib/quiz";
import {
  MAX_LEVEL,
  MIN_LEVEL,
  getLevelStats,
  loadMastery,
  resetMastery,
  type MasteryStore,
} from "@/lib/mastery";
import type { Question, QuizMode, QuizSettings } from "@/lib/types";
import { QuizRunner } from "@/components/QuizRunner";

function countInLevelRange(
  stats: ReturnType<typeof getLevelStats>,
  min: number,
  max: number
): number {
  return stats
    .filter((s) => s.level >= min && s.level <= max)
    .reduce((sum, s) => sum + s.count, 0);
}

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState(0);
  const [mastery, setMastery] = useState<MasteryStore>({});
  const [settings, setSettings] = useState<QuizSettings>({
    mode: "all",
    count: 10,
    shuffle: true,
    minLevel: 1,
    maxLevel: 2,
  });

  useEffect(() => {
    setMastery(loadMastery());
  }, []);

  const beginQuiz = (nextSettings: QuizSettings) => {
    setSettings(nextSettings);
    setSessionQuestions(pickQuestions(nextSettings, mastery));
    setSessionId((id) => id + 1);
    setStarted(true);
  };

  const allIds = useMemo(() => ALL_QUESTIONS.map((q) => q.id), []);
  const levelStats = useMemo(
    () => getLevelStats(allIds, mastery),
    [allIds, mastery]
  );

  const reviewPoolSize = useMemo(() => {
    const min = settings.minLevel ?? MIN_LEVEL;
    const max = settings.maxLevel ?? 2;
    return countInLevelRange(levelStats, min, max);
  }, [levelStats, settings.minLevel, settings.maxLevel]);

  if (started) {
    return (
      <QuizRunner
        key={sessionId}
        questions={sessionQuestions}
        onMasteryChange={() => setMastery(loadMastery())}
        onExit={() => setStarted(false)}
        onRestart={() => beginQuiz(settings)}
      />
    );
  }

  const mastered = countInLevelRange(levelStats, 5, 5);
  const weak = countInLevelRange(levelStats, 1, 2);

  return (
    <main className="app">
      <header className="header">
        <h1>TGiS Quiz</h1>
        <p>
          {ALL_QUESTIONS.length} pytań · odpowiedzi w losowej kolejności
        </p>
      </header>

      <div className="card">
        <h2>Twoje opanowanie</h2>
        <p className="hint" style={{ marginBottom: "0.75rem" }}>
          5 poziomów w localStorage — dobrze = +1, źle = −1. Powtarzaj słabe
          poziomy, aż dojdziesz do 5.
        </p>
        <div className="mastery-grid">
          {levelStats.map((s) => (
            <div
              key={s.level}
              className={`mastery-cell level-${s.level}`}
              title={s.label}
            >
              <strong>{s.count}</strong>
              <span>L{s.level}</span>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
        <div className="mastery-summary">
          <span>
            Opanowane: <strong>{mastered}</strong>/{ALL_QUESTIONS.length}
          </span>
          <span>
            Do nauki (1–2): <strong>{weak}</strong>
          </span>
        </div>
        <div className="mastery-quick">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              beginQuiz({
                mode: "review",
                count: Math.min(20, weak || 10),
                shuffle: true,
                minLevel: 1,
                maxLevel: 2,
              });
            }}
            disabled={weak === 0}
          >
            Ucz się słabych ({weak})
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              beginQuiz({
                mode: "review",
                count: Math.min(15, countInLevelRange(levelStats, 3, 3)),
                shuffle: true,
                minLevel: 3,
                maxLevel: 3,
              });
            }}
            disabled={countInLevelRange(levelStats, 3, 3) === 0}
          >
            Powtórz poz. 3
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (
                confirm(
                  "Usunąć cały postęp opanowania? Tej operacji nie można cofnąć."
                )
              ) {
                resetMastery();
                setMastery({});
              }
            }}
          >
            Reset postępu
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Ustawienia</h2>

        <div className="field">
          <label htmlFor="mode">Tryb</label>
          <select
            id="mode"
            value={settings.mode}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                mode: e.target.value as QuizMode,
              }))
            }
          >
            <option value="all">Wszystkie wykłady</option>
            <option value="week">Jeden wykład</option>
            <option value="exam">Symulacja kolokwium (20 pytań)</option>
            <option value="review">Powtórka wg poziomu</option>
          </select>
        </div>

        {settings.mode === "week" && (
          <div className="field">
            <label htmlFor="week">Wykład</label>
            <select
              id="week"
              value={settings.week ?? WEEKS[0]?.id}
              onChange={(e) =>
                setSettings((s) => ({ ...s, week: e.target.value }))
              }
            >
              {WEEKS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} (
                  {ALL_QUESTIONS.filter((q) => q.week === w.id).length})
                </option>
              ))}
            </select>
          </div>
        )}

        {settings.mode === "review" && (
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="minLevel">Od poziomu</label>
              <select
                id="minLevel"
                value={settings.minLevel ?? MIN_LEVEL}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    minLevel: Number(e.target.value),
                  }))
                }
              >
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(
                  (l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="maxLevel">Do poziomu</label>
              <select
                id="maxLevel"
                value={settings.maxLevel ?? 2}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    maxLevel: Number(e.target.value),
                  }))
                }
              >
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(
                  (l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        )}

        {settings.mode === "review" && (
          <p className="hint">
            W puli: <strong>{reviewPoolSize}</strong> pytań na poziomach{" "}
            {settings.minLevel}–{settings.maxLevel}
          </p>
        )}

        {settings.mode !== "exam" && (
          <div className="field">
            <label htmlFor="count">Liczba pytań</label>
            <input
              id="count"
              type="number"
              min={1}
              max={
                settings.mode === "review"
                  ? Math.max(1, reviewPoolSize)
                  : ALL_QUESTIONS.length
              }
              value={settings.count}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  count: Number(e.target.value) || 1,
                }))
              }
            />
          </div>
        )}

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.shuffle}
            onChange={(e) =>
              setSettings((s) => ({ ...s, shuffle: e.target.checked }))
            }
          />
          Losowa kolejność pytań
        </label>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={settings.mode === "review" && reviewPoolSize === 0}
        onClick={() => {
          const next =
            settings.mode === "exam"
              ? { ...settings, mode: "all" as QuizMode, count: 20 }
              : settings.mode === "week" && !settings.week
                ? { ...settings, week: WEEKS[0]?.id }
                : settings.mode === "review"
                  ? {
                      ...settings,
                      count: Math.min(
                        settings.count,
                        reviewPoolSize || settings.count
                      ),
                      minLevel: Math.min(
                        settings.minLevel ?? MIN_LEVEL,
                        settings.maxLevel ?? MAX_LEVEL
                      ),
                      maxLevel: Math.max(
                        settings.minLevel ?? MIN_LEVEL,
                        settings.maxLevel ?? MAX_LEVEL
                      ),
                    }
                  : settings;
          beginQuiz(next);
        }}
      >
        {settings.mode === "review" && reviewPoolSize === 0
          ? "Brak pytań w tym zakresie"
          : "Start"}
      </button>
    </main>
  );
}
