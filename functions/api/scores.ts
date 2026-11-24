/**
 * Cloudflare Pages Function: ranking en D1
 * Binding esperado: env.DB (D1Database)
 *
 * GET  /api/scores?limit=20  → top puntuaciones
 * POST /api/scores           → guardar partida
 */

interface Env {
  DB: D1Database;
}

type ScoreBody = {
  username?: string;
  game_mode: 'precise' | 'distance';
  difficulty: number;
  themes: string;
  score: number;
  correct?: number;
  total?: number;
  hints_used?: number;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, created_at, username, game_mode, difficulty, themes, score, correct, total, hints_used
       FROM scores
       ORDER BY score DESC, created_at DESC
       LIMIT ?`
    )
      .bind(limit)
      .all();

    return Response.json(results ?? [], {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ScoreBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.game_mode || !['precise', 'distance'].includes(body.game_mode)) {
    return Response.json({ error: 'Invalid game_mode' }, { status: 400 });
  }
  if (typeof body.score !== 'number' || body.score < 0) {
    return Response.json({ error: 'Invalid score' }, { status: 400 });
  }
  const difficulty = Number(body.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    return Response.json({ error: 'Invalid difficulty' }, { status: 400 });
  }

  const username = (body.username || 'Anónimo').toString().slice(0, 40);
  const themes = typeof body.themes === 'string' ? body.themes : JSON.stringify(body.themes ?? []);
  const correct = Number(body.correct) || 0;
  const total = Number(body.total) || 0;
  const hints_used = Number(body.hints_used) || 0;

  try {
    const result = await context.env.DB.prepare(
      `INSERT INTO scores (username, game_mode, difficulty, themes, score, correct, total, hints_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, created_at`
    )
      .bind(username, body.game_mode, difficulty, themes, Math.round(body.score), correct, total, hints_used)
      .first();

    return Response.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
};
