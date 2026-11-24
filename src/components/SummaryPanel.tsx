import type { GameScore } from '../types/geo';

interface SummaryPanelProps {
  score: GameScore;
  onRestart: () => void;
  onNewConfig: () => void;
}

export function SummaryPanel({ score, onRestart, onNewConfig }: SummaryPanelProps) {
  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 max-w-md w-full space-y-5 text-center">
      <h2 className="text-2xl font-bold text-slate-800">¡Ronda terminada!</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{score.points}</div>
          <div className="text-xs text-slate-500 uppercase">Puntos</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
          <div className="text-xs text-slate-500 uppercase">Acierto</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-700">
            {score.correct}/{score.total}
          </div>
          <div className="text-xs text-slate-500 uppercase">Correctas</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{score.maxStreak}</div>
          <div className="text-xs text-slate-500 uppercase">Mejor racha</div>
        </div>
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
          Cambiar temáticas / dificultad
        </button>
      </div>
    </div>
  );
}
