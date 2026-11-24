/**
 * Motor de juego: generación de preguntas, estado de partida y puntuación.
 */

import type {
  GeoEntity,
  GameConfig,
  Question,
  AnswerResult,
  GameScore,
  ThemeId,
} from '../types/geo';
import { THEMES } from '../types/geo';
import { evaluateClick } from './geometry';

// Re-export del cargador async (datos reales + fallback mock)
export { loadEntitiesForThemes } from '../data/loader';

export function createInitialScore(): GameScore {
  return { correct: 0, total: 0, streak: 0, maxStreak: 0, points: 0 };
}

/** Baraja array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Genera la lista de preguntas para una ronda (sin repetir entidades) */
export function generateQuestions(
  entities: GeoEntity[],
  count: number
): Question[] {
  const pool = shuffle(entities);
  const selected = count > 0 ? pool.slice(0, Math.min(count, pool.length)) : pool;
  return selected.map((entity, i) => ({
    id: `q-${i}-${entity.id}`,
    entity,
    prompt: buildPrompt(entity),
  }));
}

function buildPrompt(entity: GeoEntity): string {
  const themeLabel = THEMES[entity.theme]?.label ?? entity.theme;
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

/** Evalúa un clic y actualiza la puntuación */
export function processAnswer(
  question: Question,
  lng: number,
  lat: number,
  config: GameConfig,
  currentScore: GameScore
): { result: AnswerResult; newScore: GameScore } {
  const themeCfg = THEMES[question.entity.theme];
  const baseTol = themeCfg?.defaultToleranceKm ?? 30;

  const { correct, distanceKm } = evaluateClick(
    question.entity,
    lng,
    lat,
    config.difficulty,
    baseTol
  );

  const result: AnswerResult = {
    correct,
    distanceKm: distanceKm === Infinity ? undefined : distanceKm,
    clickedLngLat: [lng, lat],
    entity: question.entity,
  };

  const newScore: GameScore = { ...currentScore };
  newScore.total += 1;
  if (correct) {
    newScore.correct += 1;
    newScore.streak += 1;
    newScore.maxStreak = Math.max(newScore.maxStreak, newScore.streak);
    // Puntos: base 100 + bonus por racha y por dificultad
    const diffBonus = config.difficulty * 10;
    const streakBonus = Math.min(newScore.streak * 5, 50);
    newScore.points += 100 + diffBonus + streakBonus;
  } else {
    newScore.streak = 0;
  }

  return { result, newScore };
}
