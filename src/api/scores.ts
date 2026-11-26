/**
 * Cliente API de puntuaciones (Cloudflare Pages Function + D1).
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
  clerk_user_id?: string;
}

export interface SubmitScoreResult {
  ok: boolean;
  inTop100?: boolean;
  rejected?: boolean;
  rank?: number;
  message?: string;
  threshold?: number;
  id?: number;
}

export async function submitScore(payload: SubmitScorePayload): Promise<SubmitScoreResult> {
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
        clerk_user_id: payload.clerk_user_id || null,
      }),
    });
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    const data = (await res.json()) as SubmitScoreResult;
    return data;
  } catch {
    return { ok: false, message: 'Network error' };
  }
}

export async function fetchLeaderboard(limit = 100): Promise<ScoreRow[]> {
  const res = await fetch(`/api/scores?limit=${Math.min(limit, 100)}`);
  if (!res.ok) throw new Error(`scores ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.scores ?? [];
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
    hints_used: 0,
  };
}
