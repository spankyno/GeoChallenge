import { useEffect, useRef, useState } from 'react';

export const QUESTION_TIME_SEC = 15;

interface QuestionTimerProps {
  /** Cambia al empezar cada pregunta → reinicia */
  active: boolean;
  /** Pausa (feedback) */
  paused: boolean;
  seconds?: number;
  onTimeout: () => void;
}

/**
 * Cuenta atrás circular 15s.
 * Verde → ámbar → rojo según el tiempo restante.
 */
export function QuestionTimer({
  active,
  paused,
  seconds = QUESTION_TIME_SEC,
  onTimeout,
}: QuestionTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const deadlineRef = useRef<number | null>(null);
  const pausedLeftRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  // Reinicio al activar / nueva pregunta
  useEffect(() => {
    if (!active) {
      deadlineRef.current = null;
      pausedLeftRef.current = null;
      firedRef.current = false;
      setRemaining(seconds);
      return;
    }
    firedRef.current = false;
    pausedLeftRef.current = null;
    deadlineRef.current = performance.now() + seconds * 1000;
    setRemaining(seconds);
  }, [active, seconds]);

  // Pausa / reanuda
  useEffect(() => {
    if (!active) return;
    if (paused) {
      if (deadlineRef.current != null) {
        pausedLeftRef.current = Math.max(0, deadlineRef.current - performance.now());
        deadlineRef.current = null;
      }
    } else if (pausedLeftRef.current != null) {
      deadlineRef.current = performance.now() + pausedLeftRef.current;
      pausedLeftRef.current = null;
    }
  }, [paused, active]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      if (deadlineRef.current != null) {
        const left = Math.max(0, deadlineRef.current - performance.now());
        setRemaining(left / 1000);
        if (left <= 0 && !firedRef.current) {
          firedRef.current = true;
          onTimeoutRef.current();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const ratio = Math.max(0, Math.min(1, remaining / seconds));
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;

  let color = '#22c55e'; // green
  if (ratio < 0.35) color = '#ef4444';
  else if (ratio < 0.6) color = '#f59e0b';

  const display = Math.ceil(remaining);

  return (
    <div
      className="flex items-center gap-2"
      title="Tiempo por pregunta (si se agota, no podrás guardar el récord)"
    >
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 52 52" className="w-12 h-12 -rotate-90">
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="5"
          />
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className="transition-[stroke] duration-200"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {display}
        </div>
      </div>
      {ratio < 0.35 && remaining > 0 && (
        <span className="text-xs font-medium text-red-600 animate-pulse">¡Rápido!</span>
      )}
    </div>
  );
}
