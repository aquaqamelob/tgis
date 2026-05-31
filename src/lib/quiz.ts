import questionsData from "@/data/questions.json";
import { filterQuestionsByLevel, type MasteryStore } from "./mastery";
import type { Choice, Question, QuizSettings } from "./types";

export const ALL_QUESTIONS = questionsData as Question[];

export const WEEKS = Array.from(
  new Map(ALL_QUESTIONS.map((q) => [q.week, q.weekLabel])).entries()
).map(([id, label]) => ({ id, label }));

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickQuestions(
  settings: QuizSettings,
  mastery?: MasteryStore
): Question[] {
  let pool = ALL_QUESTIONS;

  if (settings.mode === "week" && settings.week) {
    pool = pool.filter((q) => q.week === settings.week);
  }

  if (settings.mode === "review") {
    const min = settings.minLevel ?? 1;
    const max = settings.maxLevel ?? 2;
    const ids = filterQuestionsByLevel(
      pool.map((q) => q.id),
      min,
      max,
      mastery
    );
    const idSet = new Set(ids);
    pool = pool.filter((q) => idSet.has(q.id));
  }

  const list = settings.shuffle ? shuffle(pool) : [...pool];
  return list.slice(0, Math.min(settings.count, list.length));
}

export function shuffleChoices(choices: Choice[]): Choice[] {
  return shuffle(choices);
}

export function expectedIndices(q: Question): number[] {
  return q.choices.flatMap((c, i) => (c.correct ? [i] : []));
}

export function gradeAnswer(q: Question, selected: number[]): boolean {
  const expected = new Set(expectedIndices(q));
  const picked = new Set(selected);
  if (expected.size !== picked.size) return false;
  for (const i of expected) {
    if (!picked.has(i)) return false;
  }
  return true;
}

export function selectionHint(q: Question): string {
  return q.pickFalse
    ? "Zaznacz dokładnie 2 zdania fałszywe."
    : "Zaznacz dokładnie 2 zdania prawdziwe.";
}
