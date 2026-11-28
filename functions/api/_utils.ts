export interface Env {
  DB: D1Database;
  CLERK_JWT_PUBLIC_KEY?: string;
}

export function json(data: unknown, status = 200, extra: HeadersInit = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    ...Object.fromEntries(new Headers(extra)),
  });
  return new Response(JSON.stringify(data), { status, headers });
}

export async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export async function consumeRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = `${key}:${bucket}`;
  const row = await db.prepare(
    `INSERT INTO api_rate_limits (id, hits, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET hits = hits + 1
     RETURNING hits`,
  ).bind(id, (bucket + 2) * windowSeconds).first<{ hits: number }>();
  return Number(row?.hits ?? limit + 1) <= limit;
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function verifyClerkToken(request: Request, publicKey?: string): Promise<string | null> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  if (!publicKey) throw new Error('AUTH_NOT_CONFIGURED');

  const token = authorization.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('INVALID_TOKEN');
  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))) as { alg?: string };
  const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as {
    sub?: string; exp?: number; nbf?: number;
  };
  if (header.alg !== 'RS256' || !payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('INVALID_TOKEN');
  }
  if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) throw new Error('INVALID_TOKEN');

  const pem = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey(
    'spki', decodeBase64Url(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
  );
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64Url(parts[2]), signed);
  if (!valid) throw new Error('INVALID_TOKEN');
  return payload.sub;
}
