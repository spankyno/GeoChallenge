import { useEffect, useState } from 'react';
import type { ScoreRow } from '../types/geo';
import { fetchLeaderboard } from '../api/scores';

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
  /** Resaltar esta puntuación recién guardada */
  highlightScore?: number | null;
  title?: string;
}

export function LeaderboardModal({
  open,
  onClose,
  highlightScore,
  title = 'Top 100 puntuaciones',
}: LeaderboardModalProps) {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');

  useEffect(() => {
    if (!open) return;
    setStatus('loading');
    fetchLeaderboard(100)
      .then((data) => {
        setRows(data);
        setStatus(data.length ? 'ok' : 'empty');
      })
      .catch(() => setStatus('error'));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {status === 'loading' && (
            <p className="text-sm text-slate-400 p-4 text-center">Cargando…</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600 p-4 text-center">
              No se pudo cargar el ranking (D1 / API).
            </p>
          )}
          {status === 'empty' && (
            <p className="text-sm text-slate-400 p-4 text-center">Aún no hay puntuaciones.</p>
          )}
          {status === 'ok' && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-2 w-10">#</th>
                  <th className="p-2">Usuario</th>
                  <th className="p-2">Modo</th>
                  <th className="p-2">Dif.</th>
                  <th className="p-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isHi =
                    highlightScore != null && row.score === highlightScore && i < 3
                      ? true
                      : highlightScore != null && row.score === highlightScore;
                  return (
                    <tr
                      key={row.id ?? i}
                      className={`border-t border-slate-50 ${
                        isHi ? 'bg-amber-50 font-semibold' : ''
                      }`}
                    >
                      <td className="p-2 text-slate-400">{i + 1}</td>
                      <td className="p-2">{row.username}</td>
                      <td className="p-2">{row.game_mode === 'precise' ? 'P' : 'D'}</td>
                      <td className="p-2">{row.difficulty}</td>
                      <td className="p-2 text-right">{row.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-slate-800 text-white text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
