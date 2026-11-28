import { clientIp, consumeRateLimit, digest, json, type Env } from './_utils';

const DAILY_LIMIT = 5;
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: 'Servicio temporalmente no disponible' }, 503);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origen no permitido' }, 403);
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Origen no permitido' }, 403);
  const ip = clientIp(request);
  if (ip === 'unknown') return json({ error: 'No se pudo identificar la conexión' }, 400);
  const key = await digest(ip);
  try {
    if (!(await consumeRateLimit(env.DB, `plays:${key}`, 10, 60))) {
      return json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, 429, { 'Retry-After': '60' });
    }
  } catch (error) {
    console.error('Play rate-limit failed', error);
    return json({ error: 'Servicio temporalmente no disponible' }, 503);
  }
  const day = new Date().toISOString().slice(0, 10);
  try {
    const reservation = await env.DB.prepare(
      `INSERT INTO anonymous_daily_plays (ip_hash, play_day, plays) VALUES (?, ?, 1)
       ON CONFLICT(ip_hash, play_day) DO UPDATE SET plays = plays + 1
       WHERE plays < ?`,
    ).bind(key, day, DAILY_LIMIT).run();
    const row = await env.DB.prepare(
      'SELECT plays FROM anonymous_daily_plays WHERE ip_hash = ? AND play_day = ?',
    ).bind(key, day).first<{ plays: number }>();
    const plays = Number(row?.plays ?? 0);
    if (Number(reservation.meta?.changes ?? 0) === 0 || plays === 0) return json({ allowed: false, remaining: 0, error: 'Límite diario de partidas como invitado alcanzado' }, 429);
    await env.DB.prepare('DELETE FROM anonymous_daily_plays WHERE play_day < ?').bind(new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)).run();
    return json({ allowed: true, remaining: Math.max(0, DAILY_LIMIT - plays) });
  } catch (error) {
    console.error('Anonymous play limit failed', error);
    return json({ error: 'No se pudo comprobar el límite diario' }, 503);
  }
};
