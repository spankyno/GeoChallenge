import type { Question, AnswerResult, GameScore } from '../types/geo';
import { THEMES } from '../types/geo';

interface QuestionPanelProps {
  question: Question | null;
  result: AnswerResult | null;
  score: GameScore;
  questionIndex: number;
  totalQuestions: number; // 0 = infinito
  onNext: () => void;
  onQuit: () => void;
}

export function QuestionPanel({
  question,
  result,
  score,
  questionIndex,
  totalQuestions,
  onNext,
  onQuit,
}: QuestionPanelProps) {
  if (!question) return null;

  const theme = THEMES[question.entity.theme];

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 max-w-sm w-full space-y-3">
      {/* Marcador */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-3">
          <span className="font-semibold text-green-600">
            ✓ {score.correct}
          </span>
          <span className="text-slate-500">
            {score.total > 0
              ? `${Math.round((score.correct / score.total) * 100)}%`
              : '—'}
          </span>
          <span className="text-amber-600 font-medium">
            🔥 {score.streak}
          </span>
        </div>
        <div className="text-slate-600 font-medium">{score.points} pts</div>
      </div>

      {/* Progreso */}
      <div className="text-xs text-slate-400">
        {totalQuestions > 0
          ? `Pregunta ${questionIndex + 1} / ${totalQuestions}`
          : `Pregunta ${questionIndex + 1}`}
      </div>

      {/* Pregunta */}
      {!result && (
        <div className="py-2">
          <p className="text-lg font-semibold text-slate-800 leading-snug">
            {question.prompt}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {theme?.label} · Haz clic en el mapa
          </p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div
          className={`rounded-lg p-3 ${
            result.correct
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="font-semibold text-lg">
            {result.correct ? '¡Correcto!' : 'Incorrecto'}
          </div>
          <div className="text-sm mt-1 text-slate-700">
            <strong>{result.entity.name}</strong>
            {result.entity.subtype && (
              <span className="text-slate-500"> · {result.entity.subtype}</span>
            )}
          </div>
          {result.distanceKm != null && result.distanceKm > 0 && (
            <div className="text-xs text-slate-500 mt-1">
              Distancia: {result.distanceKm.toFixed(1)} km
            </div>
          )}
          <button
            type="button"
            onClick={onNext}
            className="mt-3 w-full py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
          >
            Siguiente →
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onQuit}
        className="text-xs text-slate-400 hover:text-slate-600 underline"
      >
        Terminar partida
      </button>
    </div>
  );
}
