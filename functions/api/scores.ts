/**
 * Cloudflare Pages Function: ranking en D1 (máx. 100 mejores)
 * Binding: env.DB
 *
 * GET  /api/scores?limit=100
 * POST /api/scores  → inserta solo si entra en top 100; poda el resto
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
  clerk_user_id?: string | null;
};

const TOP_N = 100;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return json({ error: 'D1 binding DB missing' }, 500);
  }

  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), TOP_N);

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, created_at, username, game_mode, difficulty, themes, score, correct, total, hints_used, clerk_user_id
       FROM scores
       ORDER BY score DESC, created_at ASC
       LIMIT ?`
    )
      .bind(limit)
      .all();

    return json(results ?? []);
  } catch {
    try {
      const { results } = await context.env.DB.prepare(
        `SELECT id, created_at, username, game_mode, difficulty, themes, score, correct, total, hints_used
         FROM scores
         ORDER BY score DESC, created_at ASC
         LIMIT ?`
      )
        .bind(limit)
        .all();
      return json(results ?? []);
    } catch (err2) {
      console.error(err2);
      return json({ error: 'DB error', detail: String(err2) }, 500);
    }
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return json({ error: 'D1 binding DB missing' }, 500);
  }

  let body: ScoreBody;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.game_mode || !['precise', 'distance'].includes(body.game_mode)) {
    return json({ error: 'Invalid game_mode' }, 400);
  }
  if (typeof body.score !== 'number' || body.score < 0 || body.score > 1_000_000) {
    return json({ error: 'Invalid score' }, 400);
  }
  const difficulty = Number(body.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    return json({ error: 'Invalid difficulty' }, 400);
  }

  const username = (body.username || 'Anónimo').toString().slice(0, 40);
  const themes =
    typeof body.themes === 'string' ? body.themes : JSON.stringify(body.themes ?? []);
  const correct = Number(body.correct) || 0;
  const total = Number(body.total) || 0;
  const hints_used = Number(body.hints_used) || 0;
  const clerk_user_id = body.clerk_user_id ? String(body.clerk_user_id).slice(0, 64) : null;
  const score = Math.round(body.score);

  try {
    // ¿Entra en top 100?
    const countRow = await context.env.DB.prepare(`SELECT COUNT(*) AS c FROM scores`).first<{
      c: number;
    }>();
    const count = Number(countRow?.c ?? 0);

    if (count >= TOP_N) {
      const worst = await context.env.DB.prepare(
        `SELECT score FROM scores ORDER BY score ASC, created_at DESC LIMIT 1`
      ).first<{ score: number }>();
      if (worst && score < worst.score) {
        return json(
          {
            ok: false,
            rejected: true,
            inTop100: false,
            message: 'Puntuación fuera del top 100',
            threshold: worst.score,
          },
          200
        );
      }
    }

    let inserted: Record<string, unknown> | null = null;
    try {
      inserted = await context.env.DB.prepare(
        `INSERT INTO scores (username, game_mode, difficulty, themes, score, correct, total, hints_used, clerk_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id, created_at, username, score`
      )
        .bind(
          username,
          body.game_mode,
          difficulty,
          themes,
          score,
          correct,
          total,
          hints_used,
          clerk_user_id
        )
        .first();
    } catch {
      inserted = await context.env.DB.prepare(
        `INSERT INTO scores (username, game_mode, difficulty, themes, score, correct, total, hints_used)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id, created_at, username, score`
      )
        .bind(username, body.game_mode, difficulty, themes, score, correct, total, hints_used)
        .first();
    }

    // Podar para dejar solo top 100
    await context.env.DB.prepare(
      `DELETE FROM scores WHERE id NOT IN (
         SELECT id FROM scores ORDER BY score DESC, created_at ASC LIMIT ?
       )`
    )
      .bind(TOP_N)
      .run();

    // Rank de esta puntuación
    const rankRow = await context.env.DB.prepare(
      `SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ? OR (score = ? AND created_at < ?)`
    )
      .bind(score, score, (inserted as { created_at?: string })?.created_at ?? '')
      .first<{ rank: number }>();

    const rank = Number(rankRow?.rank ?? 1);

    return json(
      {
        ok: true,
        inTop100: true,
        rank,
        ...inserted,
      },
      201
    );
  } catch (err) {
    console.error(err);
    return json({ error: 'DB error', detail: String(err) }, 500);
  }
};
