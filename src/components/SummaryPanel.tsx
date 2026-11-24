import { useEffect, useState } from 'react';
import type { GameConfig, GameScore, ScoreRow } from '../types/geo';
import { THEMES } from '../types/geo';
import { fetchLeaderboard, scorePayloadFromGame, submitScore } from '../api/scores';

interface SummaryPanelProps {
  score: GameScore;
  config: GameConfig;
  isSignedIn: boolean;
  clerkUserId: string | null;
  defaultDisplayName: string | null;
  onRestart: () => void;
  onNewConfig: () => void;
}

export function SummaryPanel({
  score,
  config,
  isSignedIn,
  clerkUserId,
  defaultDisplayName,
  onRestart,
  onNewConfig,
}: SummaryPanelProps) {
  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const [username, setUsername] = useState(
    isSignedIn ? defaultDisplayName || 'Jugador' : 'Anónimo'
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [board, setBoard] = useState<ScoreRow[]>([]);
  const [boardStatus, setBoardStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');

  useEffect(() => {
    setUsername(isSignedIn ? defaultDisplayName || 'Jugador' : 'Anónimo');
  }, [isSignedIn, defaultDisplayName]);

  const loadBoard = () => {
    setBoardStatus('loading');
    fetchLeaderboard(15)
      .then((rows) => {
        setBoard(rows);
        setBoardStatus(rows.length > 0 ? 'ok' : 'empty');
      })
      .catch(() => setBoardStatus('error'));
  };

  useEffect(() => {
    loadBoard();
  }, [saved]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const name = isSignedIn
      ? username.trim().slice(0, 40) || defaultDisplayName || 'Jugador'
      : 'Anónimo';

    const ok = await submitScore({
      ...scorePayloadFromGame(config, score, name),
      clerk_user_id: isSignedIn ? clerkUserId ?? undefined : undefined,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      loadBoard();
    } else {
      setSaveError(
        'No se pudo guardar. Comprueba el binding D1 (variable DB) y la migración en Cloudflare.'
      );
    }
  };

  const themeLabels = config.themes.map((t) => THEMES[t]?.label ?? t).join(', ');

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto custom-scroll">
      <h2 className="text-2xl font-bold text-slate-800 text-center">¡Ronda terminada!</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-3xl font-bold text-blue-600">{score.points}</div>
          <div className="text-xs text-slate-500 uppercase">Puntos</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
          <div className="text-xs text-slate-500 uppercase">Acierto</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-slate-700">
            {score.correct}/{score.total}
          </div>
          <div className="text-xs text-slate-500 uppercase">Correctas</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{score.maxStreak}</div>
          <div className="text-xs text-slate-500 uppercase">Mejor racha</div>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center space-y-0.5">
        <div>
          Modo: <strong>{config.scoreMode === 'precise' ? 'Preciso' : 'Distancia'}</strong>
          {' · '}Dificultad <strong>{config.difficulty}</strong>
        </div>
        <div>{themeLabels}</div>
        {config.hintsEnabled && <div>Pistas usadas: {score.hintsUsed}</div>}
      </div>

      {/* Guardar ranking */}
      <div className="border border-slate-200 rounded-lg p-3 space-y-2">
        <div className="text-sm font-medium text-slate-700">Guardar en ranking</div>
        {isSignedIn ? (
          <input
            type="text"
            maxLength={40}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={saved}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Tu nombre en el ranking"
          />
        ) : (
          <p className="text-xs text-slate-500">
            Juegas como <strong>Anónimo</strong>. Regístrate para elegir un nombre y partidas
            ilimitadas.
          </p>
        )}
        <button
          type="button"
          disabled={saved || saving}
          onClick={handleSave}
          className={`w-full py-2 rounded-lg text-sm font-medium transition ${
            saved
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar puntuación'}
        </button>
        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      </div>

      {/* Leaderboard + estado D1 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-600">Ranking</h3>
          <button
            type="button"
            onClick={loadBoard}
            className="text-xs text-blue-600 hover:underline"
          >
            Actualizar
          </button>
        </div>
        {boardStatus === 'loading' && (
          <p className="text-xs text-slate-400">Cargando ranking…</p>
        )}
        {boardStatus === 'error' && (
          <p className="text-xs text-red-600">
            Error al contactar /api/scores (D1 o Function).
          </p>
        )}
        {boardStatus === 'empty' && (
          <p className="text-xs text-slate-400">
            Ranking vacío o D1 sin datos. Si acabas de configurar la BD, guarda una
            puntuación de prueba.
          </p>
        )}
        {boardStatus === 'ok' && (
          <div className="text-xs max-h-40 overflow-y-auto custom-scroll border border-slate-100 rounded-lg">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-slate-500">
                  <th className="p-1.5">#</th>
                  <th className="p-1.5">Usuario</th>
                  <th className="p-1.5">Modo</th>
                  <th className="p-1.5">Dif.</th>
                  <th className="p-1.5 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row, i) => (
                  <tr key={row.id ?? i} className="border-t border-slate-50">
                    <td className="p-1.5 text-slate-400">{i + 1}</td>
                    <td className="p-1.5 font-medium">{row.username}</td>
                    <td className="p-1.5">{row.game_mode === 'precise' ? 'P' : 'D'}</td>
                    <td className="p-1.5">{row.difficulty}</td>
                    <td className="p-1.5 text-right font-semibold">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Jugar otra vez (misma config)
        </button>
        <button
          type="button"
          onClick={onNewConfig}
          className="w-full py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          Cambiar configuración
        </button>
      </div>
    </div>
  );
}
