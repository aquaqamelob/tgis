"use client";

import { useState } from "react";
import { ALL_QUESTIONS, WEEKS, pickQuestions } from "@/lib/quiz";
import type { QuizMode, QuizSettings } from "@/lib/types";
import { QuizRunner } from "@/components/QuizRunner";

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    mode: "all",
    count: 10,
    shuffle: true,
  });

  if (started) {
    const questions = pickQuestions(settings);
    return (
      <QuizRunner
        questions={questions}
        onExit={() => setStarted(false)}
        onRestart={() => setStarted(true)}
      />
    );
  }

  return (
    <main className="app">
      <header className="header">
        <h1>TGiS Quiz</h1>
        <p>
          {ALL_QUESTIONS.length} pytań · odpowiedzi w losowej kolejności
        </p>
      </header>

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

        {settings.mode !== "exam" && (
          <div className="field">
            <label htmlFor="count">Liczba pytań</label>
            <input
              id="count"
              type="number"
              min={1}
              max={ALL_QUESTIONS.length}
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
        onClick={() => {
          const next =
            settings.mode === "exam"
              ? { ...settings, mode: "all" as QuizMode, count: 20 }
              : settings.mode === "week" && !settings.week
                ? { ...settings, week: WEEKS[0]?.id }
                : settings;
          setSettings(next);
          setStarted(true);
        }}
      >
        Start
      </button>
    </main>
  );
}
