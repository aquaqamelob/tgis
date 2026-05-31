const STORAGE_KEY = "tgis-quiz-mastery";
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;

export type QuestionMastery = {
  level: number;
  attempts: number;
  correct: number;
  lastAnswered: number;
};

export type MasteryStore = Record<string, QuestionMastery>;

export const LEVEL_LABELS: Record<number, string> = {
  1: "Nowe",
  2: "Słabe",
  3: "Uczę się",
  4: "Dobrze",
  5: "Opanowane",
};

function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
}

export function loadMastery(): MasteryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MasteryStore;
  } catch {
    return {};
  }
}

export function saveMastery(store: MasteryStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getQuestionLevel(id: string, store?: MasteryStore): number {
  const entry = (store ?? loadMastery())[id];
  return entry ? clampLevel(entry.level) : MIN_LEVEL;
}

export function recordAnswer(
  id: string,
  correct: boolean,
  store?: MasteryStore
): { level: number; delta: number; store: MasteryStore } {
  const current = { ...(store ?? loadMastery()) };
  const prev = current[id];
  const prevLevel = prev ? prev.level : MIN_LEVEL;
  const nextLevel = clampLevel(prevLevel + (correct ? 1 : -1));

  current[id] = {
    level: nextLevel,
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    lastAnswered: Date.now(),
  };

  saveMastery(current);
  return { level: nextLevel, delta: nextLevel - prevLevel, store: current };
}

export type LevelStats = {
  level: number;
  label: string;
  count: number;
};

export function getLevelStats(
  questionIds: string[],
  store?: MasteryStore
): LevelStats[] {
  const data = store ?? loadMastery();
  const counts = new Map<number, number>();
  for (let l = MIN_LEVEL; l <= MAX_LEVEL; l++) counts.set(l, 0);

  for (const id of questionIds) {
    const level = getQuestionLevel(id, data);
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([level, count]) => ({
    level,
    label: LEVEL_LABELS[level] ?? String(level),
    count,
  }));
}

export function filterQuestionsByLevel(
  questionIds: string[],
  minLevel: number,
  maxLevel: number,
  store?: MasteryStore
): string[] {
  const data = store ?? loadMastery();
  return questionIds.filter((id) => {
    const level = getQuestionLevel(id, data);
    return level >= minLevel && level <= maxLevel;
  });
}

export function resetMastery(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
