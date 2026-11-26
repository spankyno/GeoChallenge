/**
 * Motor de juego: preguntas, evaluación (preciso / distancia) y puntuación.
 */

import type {
  GeoEntity,
  GameConfig,
  Question,
  AnswerResult,
  GameScore,
} from '../types/geo';
import { THEMES } from '../types/geo';
import { evaluateClick } from './geometry';

export { loadEntitiesForThemes } from '../data/loader';

export function createInitialScore(): GameScore {
  return { correct: 0, total: 0, streak: 0, maxStreak: 0, points: 0, timedOut: false };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuestions(
  entities: GeoEntity[],
  count: number,
  excludeIds: Set<string> = new Set()
): Question[] {
  const fresh = entities.filter((e) => !excludeIds.has(e.id));
  const pool = shuffle(fresh.length > 0 ? fresh : entities);
  const selected = count > 0 ? pool.slice(0, Math.min(count, pool.length)) : pool;
  return selected.map((entity, i) => ({
    id: `q-${i}-${entity.id}-${Math.random().toString(36).slice(2, 7)}`,
    entity,
    prompt: buildPrompt(entity),
  }));
}

function buildPrompt(entity: GeoEntity): string {
  switch (entity.theme) {
    case 'capitals':
      return `Señala la capital: ${entity.name}`;
    case 'rivers':
      return `Señala el río: ${entity.name}`;
    case 'provinces':
      return `Señala la provincia/estado: ${entity.name}`;
    case 'geo_features':
      return `Señala: ${entity.name}${entity.subtype ? ` (${entity.subtype})` : ''}`;
    default:
      return `Señala en el mapa: ${entity.name}`;
  }
}

function distancePoints(distanceKm: number, difficulty: number): number {
  const base = 100 + difficulty * 20;
  const scaleKm = 2500 / difficulty;
  const raw = base * Math.exp(-distanceKm / scaleKm);
  return Math.max(0, Math.round(raw));
}

function precisePoints(difficulty: number, streak: number): number {
  const diffBonus = difficulty * 15;
  const streakBonus = Math.min(streak * 5, 50);
  return Math.max(10, 100 + diffBonus + streakBonus);
}

export function processAnswer(
  question: Question,
  lng: number,
  lat: number,
  config: GameConfig,
  currentScore: GameScore
): { result: AnswerResult; newScore: GameScore } {
  const themeCfg = THEMES[question.entity.theme];
  const baseTol = themeCfg?.defaultToleranceKm ?? 30;

  const { correct: withinTol, distanceKm: dist } = evaluateClick(
    question.entity,
    lng,
    lat,
    config.difficulty,
    config.scoreMode === 'precise' ? baseTol * 0.35 : baseTol
  );

  const distanceKm = dist === Infinity ? undefined : dist;
  const newScore: GameScore = { ...currentScore };
  newScore.total += 1;

  let pointsEarned = 0;
  let correct = false;

  if (config.scoreMode === 'distance') {
    const d = distanceKm ?? 99999;
    pointsEarned = distancePoints(d, config.difficulty);
    const factors = [0, 2.5, 1.8, 1.2, 0.8, 0.4];
    const tol = baseTol * factors[config.difficulty];
    correct = d <= Math.max(tol * 3, 150);
    newScore.points += pointsEarned;
    if (correct) {
      newScore.correct += 1;
      newScore.streak += 1;
      newScore.maxStreak = Math.max(newScore.maxStreak, newScore.streak);
    } else {
      newScore.streak = 0;
    }
  } else {
    correct = withinTol;
    if (correct) {
      newScore.correct += 1;
      newScore.streak += 1;
      newScore.maxStreak = Math.max(newScore.maxStreak, newScore.streak);
      pointsEarned = precisePoints(config.difficulty, newScore.streak);
      newScore.points += pointsEarned;
    } else {
      newScore.streak = 0;
      pointsEarned = 0;
    }
  }

  return {
    result: {
      correct,
      distanceKm,
      pointsEarned,
      clickedLngLat: [lng, lat],
      entity: question.entity,
      scoreMode: config.scoreMode,
    },
    newScore,
  };
}
