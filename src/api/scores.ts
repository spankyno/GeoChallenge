/**
 * Cliente API de puntuaciones (Cloudflare Pages Function + D1).
 * Si la API no está disponible, falla en silencio (juego sigue funcionando).
 */

import type { GameConfig, GameScore, ScoreRow } from '../types/geo';

export interface SubmitScorePayload {
  username?: string;
  game_mode: GameConfig['scoreMode'];
  difficulty: number;
  themes: string[];
  score: number;
  correct: number;
  total: number;
  hints_used: number;
}

export async function submitScore(payload: SubmitScorePayload): Promise<boolean> {
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: payload.username?.trim() || 'Anónimo',
        game_mode: payload.game_mode,
        difficulty: payload.difficulty,
        themes: JSON.stringify(payload.themes),
        score: payload.score,
        correct: payload.correct,
        total: payload.total,
        hints_used: payload.hints_used,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchLeaderboard(limit = 20): Promise<ScoreRow[]> {
  try {
    const res = await fetch(`/api/scores?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.scores ?? [];
  } catch {
    return [];
  }
}

export function scorePayloadFromGame(
  config: GameConfig,
  score: GameScore,
  username = 'Anónimo'
): SubmitScorePayload {
  return {
    username,
    game_mode: config.scoreMode,
    difficulty: config.difficulty,
    themes: config.themes,
    score: score.points,
    correct: score.correct,
    total: score.total,
    hints_used: score.hintsUsed,
  };
}
