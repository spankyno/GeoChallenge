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
  authToken?: string;
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
      headers: {
          'Content-Type': 'application/json',
          ...(payload.authToken ? { Authorization: `Bearer ${payload.authToken}` } : {}),
        },
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
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    const data = (await res.json()) as SubmitScoreResult;
    return data;
  } catch {
    return { ok: false, message: 'Network error' };
  }
}

export async function fetchLeaderboard(limit = 100): Promise<ScoreRow[]> {
  const res = await fetch(`/api/scores?limit=${Math.max(1, Math.min(Number.isFinite(limit) ? Math.floor(limit) : 100, 100))}`);
  if (!res.ok) throw new Error(`scores ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.scores ?? [];
}

export function scorePayloadFromGame(
  config: GameConfig,
  score: GameScore,
  username = 'Anónimo',
  authToken?: string,
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
    authToken,
  };
}

/** Reserva en servidor una partida anónima (límite real por IP y día UTC). */
export async function reserveAnonymousPlay(): Promise<{ allowed: boolean; remaining?: number; message?: string }> {
  try {
    const response = await fetch('/api/plays', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) return { allowed: false, message: data.error || 'No se pudo validar el límite diario.' };
    return { allowed: Boolean(data.allowed), remaining: data.remaining };
  } catch {
    return { allowed: false, message: 'No se pudo conectar con el control de partidas. Inténtalo de nuevo.' };
  }
}
