import { clientIp, consumeRateLimit, digest, json, verifyClerkToken, type Env } from './_utils';

const TOP_N = 100;
const MAX_BODY_BYTES = 8 * 1024;
const ALLOWED_THEMES = new Set(['countries', 'capitals', 'rivers', 'provinces', 'geo_features', 'cities', 'mountains', 'lakes']);

function parseThemes(value: unknown): string[] | null {
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { return null; }
  }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 8) return null;
  if (!parsed.every((item) => typeof item === 'string' && ALLOWED_THEMES.has(item))) return null;
  return [...new Set(parsed)];
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: 'Servicio temporalmente no disponible' }, 503);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origen no permitido' }, 403);
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Origen no permitido' }, 403);
  const url = new URL(request.url);
  const rawLimit = url.searchParams.get('limit') ?? '100';
  if (!/^\d{1,3}$/.test(rawLimit)) return json({ error: 'Parámetro limit inválido' }, 400);
  const limit = Math.max(1, Math.min(Number(rawLimit), TOP_N));
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, created_at, username, game_mode, difficulty, themes, score, correct, total, hints_used
       FROM scores ORDER BY score DESC, created_at ASC LIMIT ?`,
    ).bind(limit).all();
    return json(results ?? []);
  } catch (error) {
    console.error('Leaderboard query failed', error);
    return json({ error: 'No se pudo consultar el ranking' }, 503);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: 'Servicio temporalmente no disponible' }, 503);
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405, { Allow: 'POST' });
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json({ error: 'Content-Type debe ser application/json' }, 415);
  }
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) return json({ error: 'Petición demasiado grande' }, 413);

  const ipHash = await digest(clientIp(request));
  try {
    if (!(await consumeRateLimit(env.DB, `score:${ipHash}`, 8, 60))) {
      return json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, 429, { 'Retry-After': '60' });
    }
  } catch (error) {
    console.error('Rate-limit storage failed', error);
    return json({ error: 'Servicio temporalmente no disponible' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: 'Petición demasiado grande' }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid');
  } catch { return json({ error: 'JSON inválido' }, 400); }

  let clerkUserId: string | null = null;
  try { clerkUserId = await verifyClerkToken(request, env.CLERK_JWT_PUBLIC_KEY); }
  catch (error) {
    if (String(error).includes('AUTH_NOT_CONFIGURED')) return json({ error: 'Autenticación no configurada en el servidor' }, 503);
    return json({ error: 'Sesión no válida. Vuelve a iniciar sesión.' }, 401);
  }
  // El identificador de usuario nunca se acepta desde el cuerpo: solo procede del JWT verificado.

  const mode = body.game_mode;
  const score = body.score;
  const difficulty = body.difficulty;
  const correct = body.correct;
  const total = body.total;
  const hints = body.hints_used ?? 0;
  const themes = parseThemes(body.themes);
  if (mode !== 'precise' && mode !== 'distance') return json({ error: 'Modo de juego inválido' }, 400);
  if (!Number.isSafeInteger(score) || Number(score) < 0 || Number(score) > 1_000_000) return json({ error: 'Puntuación inválida' }, 400);
  if (!Number.isInteger(difficulty) || Number(difficulty) < 1 || Number(difficulty) > 5) return json({ error: 'Dificultad inválida' }, 400);
  if (!Number.isInteger(total) || Number(total) < 1 || Number(total) > 5000) return json({ error: 'Número de preguntas inválido' }, 400);
  if (!Number.isInteger(correct) || Number(correct) < 0 || Number(correct) > Number(total)) return json({ error: 'Número de aciertos inválido' }, 400);
  if (!Number.isInteger(hints) || Number(hints) < 0 || Number(hints) > Number(total)) return json({ error: 'Número de ayudas inválido' }, 400);
  if (!themes) return json({ error: 'Temáticas inválidas' }, 400);

  // Límites matemáticos del motor actual: evita puntuaciones imposibles por encima del máximo por pregunta.
  const maxPerQuestion = mode === 'precise' ? 225 : 200;
  const maxScore = Number(total) * maxPerQuestion;
  if (Number(score) > maxScore || (mode === 'precise' && Number(score) > Number(correct) * maxPerQuestion)) {
    return json({ error: 'La puntuación no es coherente con los resultados declarados' }, 400);
  }

  const username = clerkUserId
    ? (typeof body.username === 'string' ? body.username.trim().slice(0, 40) : 'Jugador') || 'Jugador'
    : 'Anónimo';
  const normalizedScore = Math.round(Number(score));
  try {
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM scores').first<{ c: number }>();
    const count = Number(countRow?.c ?? 0);
    if (count >= TOP_N) {
      const worst = await env.DB.prepare('SELECT score FROM scores ORDER BY score ASC, created_at DESC LIMIT 1').first<{ score: number }>();
      if (worst && normalizedScore < worst.score) {
        return json({ ok: false, rejected: true, inTop100: false, message: 'Puntuación fuera del top 100', threshold: worst.score });
      }
    }

    // D1 batch ejecuta inserción y poda dentro de una transacción.
    const batch = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO scores (username, game_mode, difficulty, themes, score, correct, total, hints_used, clerk_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at, username, score`,
      ).bind(username, mode, difficulty, JSON.stringify(themes), normalizedScore, correct, total, hints, clerkUserId),
      env.DB.prepare(
        `DELETE FROM scores WHERE id NOT IN (SELECT id FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ?)`,
      ).bind(TOP_N),
    ]);
    const result = (batch[0]?.results?.[0] ?? null) as Record<string, unknown> | null;
    await env.DB.prepare('DELETE FROM api_rate_limits WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)).run();

    const createdAt = String(result?.created_at ?? '');
    const rankRow = await env.DB.prepare(
      `SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ? OR (score = ? AND created_at < ?)`,
    ).bind(normalizedScore, normalizedScore, createdAt).first<{ rank: number }>();
    return json({ ok: true, inTop100: true, rank: Number(rankRow?.rank ?? 1), ...result }, 201);
  } catch (error) {
    console.error('Score insert failed', error);
    return json({ error: 'No se pudo guardar la puntuación' }, 503);
  }
};
