/**
 * Motor de juego: preguntas, evaluación (preciso / distancia), pistas y puntuación.
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
import { buildHints } from './hints';

export { loadEntitiesForThemes } from '../data/loader';

export function createInitialScore(): GameScore {
  return { correct: 0, total: 0, streak: 0, maxStreak: 0, points: 0, hintsUsed: 0 };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuestions(entities: GeoEntity[], count: number): Question[] {
  const pool = shuffle(entities);
  const selected = count > 0 ? pool.slice(0, Math.min(count, pool.length)) : pool;
  return selected.map((entity, i) => ({
    id: `q-${i}-${entity.id}`,
    entity,
    prompt: buildPrompt(entity),
    hints: buildHints(entity),
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

/** Tolerancia base según modo: preciso reduce mucho el radio */
function effectiveTolerance(
  baseKm: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
  scoreMode: GameConfig['scoreMode']
): number {
  const factors = [0, 2.5, 1.8, 1.2, 0.8, 0.4];
  let tol = baseKm * factors[difficulty];
  if (scoreMode === 'precise') {
    // Más estricto: ~35% de la tolerancia normal
    tol *= 0.35;
  }
  return tol;
}

/**
 * Puntos en modo distancia: más cerca = más puntos.
 * Escala con dificultad (en difícil la curva cae antes).
 */
function distancePoints(distanceKm: number, difficulty: number, hintsUsedOnQuestion: number): number {
  const base = 100 + difficulty * 20;
  // Distancia a la que los puntos caen ~ a 0
  const scaleKm = 2500 / difficulty;
  const raw = base * Math.exp(-distanceKm / scaleKm);
  // Penalización leve por pistas usadas en esta pregunta
  const hintPenalty = 1 - Math.min(hintsUsedOnQuestion, 3) * 0.12;
  return Math.max(0, Math.round(raw * hintPenalty));
}

/** Puntos en modo preciso (acierto binario) */
function precisePoints(
  difficulty: number,
  streak: number,
  hintsUsedOnQuestion: number
): number {
  const diffBonus = difficulty * 15;
  const streakBonus = Math.min(streak * 5, 50);
  const base = 100 + diffBonus + streakBonus;
  const hintPenalty = 1 - Math.min(hintsUsedOnQuestion, 3) * 0.15;
  return Math.max(10, Math.round(base * hintPenalty));
}

export function processAnswer(
  question: Question,
  lng: number,
  lat: number,
  config: GameConfig,
  currentScore: GameScore,
  hintsUsedOnQuestion: number
): { result: AnswerResult; newScore: GameScore } {
  const themeCfg = THEMES[question.entity.theme];
  const baseTol = themeCfg?.defaultToleranceKm ?? 30;
  const tol = effectiveTolerance(baseTol, config.difficulty, config.scoreMode);

  const { correct: withinTol, distanceKm: dist } = evaluateClick(
    question.entity,
    lng,
    lat,
    config.difficulty,
    // evaluateClick applies its own difficulty factor; pass adjusted base so precise is tighter
    config.scoreMode === 'precise' ? baseTol * 0.35 : baseTol
  );

  const distanceKm = dist === Infinity ? undefined : dist;
  const newScore: GameScore = { ...currentScore };
  newScore.total += 1;

  let pointsEarned = 0;
  let correct = false;

  if (config.scoreMode === 'distance') {
    // Siempre hay puntuación por distancia; "correcto" si está dentro de un umbral generoso
    const d = distanceKm ?? 99999;
    pointsEarned = distancePoints(d, config.difficulty, hintsUsedOnQuestion);
    correct = d <= Math.max(tol * 3, 150); // umbral generoso solo para contador de aciertos
    newScore.points += pointsEarned;
    if (correct) {
      newScore.correct += 1;
      newScore.streak += 1;
      newScore.maxStreak = Math.max(newScore.maxStreak, newScore.streak);
    } else {
      newScore.streak = 0;
    }
  } else {
    // Modo preciso: acierto / fallo estricto
    correct = withinTol;
    if (correct) {
      newScore.correct += 1;
      newScore.streak += 1;
      newScore.maxStreak = Math.max(newScore.maxStreak, newScore.streak);
      pointsEarned = precisePoints(config.difficulty, newScore.streak, hintsUsedOnQuestion);
      newScore.points += pointsEarned;
    } else {
      newScore.streak = 0;
      pointsEarned = 0;
    }
  }

  const result: AnswerResult = {
    correct,
    distanceKm,
    pointsEarned,
    clickedLngLat: [lng, lat],
    entity: question.entity,
    scoreMode: config.scoreMode,
  };

  return { result, newScore };
}
