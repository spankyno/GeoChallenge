/**
 * Límite de partidas diarias para usuarios no registrados.
 * Contador en localStorage (por día UTC).
 */

const KEY = 'geochallenge_anon_plays';
export const ANON_DAILY_LIMIT = 5;

type Store = { day: string; count: number };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { day: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as Store;
    if (parsed.day !== todayKey()) return { day: todayKey(), count: 0 };
    return { day: parsed.day, count: Number(parsed.count) || 0 };
  } catch {
    return { day: todayKey(), count: 0 };
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode */
  }
}

/** Partidas anónimas usadas hoy */
export function getAnonymousPlaysToday(): number {
  return read().count;
}

/** Partidas anónimas restantes hoy */
export function getAnonymousPlaysRemaining(): number {
  return Math.max(0, ANON_DAILY_LIMIT - getAnonymousPlaysToday());
}

export function canPlayAsAnonymous(): boolean {
  return getAnonymousPlaysToday() < ANON_DAILY_LIMIT;
}

/** Registrar una partida anónima consumida */
export function recordAnonymousPlay(): void {
  const s = read();
  write({ day: todayKey(), count: s.count + 1 });
}
