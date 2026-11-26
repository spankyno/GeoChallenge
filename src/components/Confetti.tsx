import { useEffect, useRef } from 'react';

/** Confeti simple en canvas (sin dependencias) al acertar */
export function Confetti({ active, durationMs = 2200 }: { active: boolean; durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 80,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      vx: -3 + Math.random() * 6,
      vy: 2 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / durationMs);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (elapsed < durationMs) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [active, durationMs]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden
    />
  );
}
