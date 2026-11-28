import { useEffect, useState } from 'react';
import type { GameConfig, GameScore, ScoreRow } from '../types/geo';
import { THEMES } from '../types/geo';
import { fetchLeaderboard, scorePayloadFromGame, submitScore } from '../api/scores';
import { LeaderboardModal } from './LeaderboardModal';

interface SummaryPanelProps {
  score: GameScore;
  config: GameConfig;
  isSignedIn: boolean;
  getAuthToken?: () => Promise<string | null>;
  defaultDisplayName: string | null;
  onRestart: () => void;
  onNewConfig: () => void;
}

export function SummaryPanel({
  score,
  config,
  isSignedIn,
  getAuthToken,
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
  const [saveInfo, setSaveInfo] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    setUsername(isSignedIn ? defaultDisplayName || 'Jugador' : 'Anónimo');
  }, [isSignedIn, defaultDisplayName]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveInfo(null);
    const name = isSignedIn
      ? username.trim().slice(0, 40) || defaultDisplayName || 'Jugador'
      : 'Anónimo';

    let authToken: string | undefined;
    if (isSignedIn) {
      try {
        authToken = (await getAuthToken?.()) ?? undefined;
      } catch {
        setSaving(false);
        setSaveError('No se pudo verificar tu sesión. Cierra sesión y vuelve a entrar.');
        return;
      }
      if (!authToken) {
        setSaving(false);
        setSaveError('No se ha podido obtener el token de sesión de Clerk.');
        return;
      }
    }
    const result = await submitScore({
      ...scorePayloadFromGame(config, score, name, authToken ?? undefined),
    });
    setSaving(false);

    if (result.rejected) {
      setSaveInfo(
        `No entra en el top 100 (mínimo actual ≈ ${result.threshold ?? '—'} pts).`
      );
      return;
    }
    if (!result.ok) {
      setSaveError(
        result.message ||
          'No se pudo guardar. Comprueba el binding D1 (variable DB) en Cloudflare.'
      );
      return;
    }
    setSaved(true);
    setRank(result.rank ?? null);
    setSaveInfo(
      result.rank
        ? `¡En el top 100! Posición #${result.rank}`
        : 'Guardado en el top 100'
    );
    // Mostrar ranking automáticamente al entrar en el top 100
    setShowBoard(true);
  };

  const themeLabels = config.themes.map((t) => THEMES[t]?.label ?? t).join(', ');

  return (
    <>
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
        </div>

        <div className="border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium text-slate-700">Guardar en ranking (top 100)</div>
          {score.timedOut ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No puedes guardar el récord: se agotó el tiempo en al menos una pregunta
              (15&nbsp;s). Vuelve a jugar respondiendo a tiempo.
            </p>
          ) : isSignedIn ? (
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
              Juegas como <strong>Anónimo</strong>. Regístrate para elegir un nombre.
            </p>
          )}
          <button
            type="button"
            disabled={saved || saving || score.timedOut}
            onClick={handleSave}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              saved
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saved
              ? rank
                ? `✓ Guardado · #${rank}`
                : '✓ Guardado'
              : saving
                ? 'Guardando…'
                : 'Guardar puntuación'}
          </button>
          {saveInfo && <p className="text-xs text-green-700">{saveInfo}</p>}
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        </div>

        <button
          type="button"
          onClick={() => setShowBoard(true)}
          className="w-full py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          Ver ranking top 100
        </button>

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

      <LeaderboardModal
        open={showBoard}
        onClose={() => setShowBoard(false)}
        highlightScore={saved ? score.points : null}
      />
    </>
  );
}
